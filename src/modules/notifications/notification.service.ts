import { render } from '@react-email/components';
import { ResendEmailProvider } from './email/resend.provider';
import OrderConfirmationEmail from './templates/order-confirmation';
import prisma from '@/utils/db';
import { COMPANY_EMAIL } from '@/utils/brand';
import { adminMessaging } from '@/lib/firebase/firebase-admin.config';

const emailProvider = new ResendEmailProvider();

export async function sendOrderConfirmation(orderId: string) {
  // Fetch full order snapshot
  const order = await prisma.customer_order.findUnique({
    where: { id: orderId },
    include: {
      products: {
        include: {
          variant: {
            include: { product: true }
          },
          product: true
        }
      }
    }
  });

  if (!order) throw new Error('Order not found for notification');

  // Prepare template data
  const items = order.products.map(op => ({
    title: op.variant?.product.title || op.product?.title || 'Fine Jewellery Piece',
    quantity: op.quantity,
    price: op.priceAtPurchase || op.product?.price || 0,
    image: op.variant?.product.mainImage || op.product?.mainImage || ''
  }));

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const orderDate = (order.dateTime || new Date()).toLocaleDateString();

  // 1. Render Customer Email HTML
  const customerHtml = await render(
    OrderConfirmationEmail({
      customerName: `${order.name} ${order.lastname}`.trim(),
      orderNumber,
      orderDate,
      total: order.total,
      items,
      shippingAddress: {
        line1: order.adress,
        city: order.city,
        state: order.country || 'India',
        postalCode: order.postalCode
      }
    })
  );

  // 2. Render Admin Alert Email HTML
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; border: 1px solid #e7e5e4; padding: 24px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin: 0; text-transform: uppercase; letter-spacing: 2px;">VAMIKA JEWELS</h2>
        <p style="color: #78716c; font-size: 14px; margin-top: 4px;">New Order Placed Notification (Admin Alert)</p>
      </div>
      <div style="background-color: #f5f5f4; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 4px 0;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${order.name} ${order.lastname}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${order.email}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.phone}</p>
        <p style="margin: 4px 0;"><strong>Order Total:</strong> ₹ ${order.total.toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        <p style="margin: 4px 0;"><strong>Shipping Destination:</strong> ${order.adress}, ${order.apartment ? order.apartment + ', ' : ''}${order.city}, ${order.country} - ${order.postalCode}</p>
      </div>
      <h3 style="border-bottom: 1px solid #e7e5e4; padding-bottom: 8px;">Order Items (${items.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${items.map(i => `
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0;">${i.title}</td>
            <td style="padding: 8px 0; text-align: center;">Qty: ${i.quantity}</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹ ${(i.price * i.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </table>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://vamiexports.com/admin/orders/${order.id}" style="background-color: #1c1917; color: #d97706; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">View Order in Admin Dashboard</a>
      </div>
    </div>
  `;

  // 3. Send Customer Email
  try {
    const customerRes = await emailProvider.send({
      to: order.email,
      subject: `Your Vamika Jewels Order Confirmation #${orderNumber}`,
      html: customerHtml
    });

    await prisma.notification.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        type: 'ORDER_CONFIRMATION',
        channel: 'EMAIL',
        status: 'SENT',
        recipient: order.email,
        subject: `Your Vamika Jewels Order Confirmation #${orderNumber}`,
        payload: { items, total: order.total },
        providerMessageId: customerRes.providerMessageId,
        sentAt: new Date(),
        attemptCount: 1,
      }
    });
  } catch (err: any) {
    console.error('Customer email notification error:', err.message);
  }

  // 4. Send Admin Alert Email to COMPANY_EMAIL (vamiexports@gmail.com)
  try {
    const adminRes = await emailProvider.send({
      to: COMPANY_EMAIL,
      subject: `🛍️ [NEW ORDER] #${orderNumber} from ${order.name} (₹ ${order.total.toLocaleString('en-IN')})`,
      html: adminHtml
    });

    await prisma.notification.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        type: 'ORDER_CONFIRMATION',
        channel: 'EMAIL',
        status: 'SENT',
        recipient: COMPANY_EMAIL,
        subject: `[ADMIN ALERT] New Order #${orderNumber}`,
        payload: { orderId: order.id, total: order.total, customer: order.name },
        providerMessageId: adminRes.providerMessageId,
        sentAt: new Date(),
        attemptCount: 1,
      }
    });
  } catch (err: any) {
    console.error('Admin email alert error:', err.message);
  }

  // 5. Trigger Firebase Cloud Messaging (FCM) push notification to Admin topic
  try {
    const messaging = adminMessaging();
    if (messaging) {
      await messaging.send({
        topic: 'admin-orders',
        notification: {
          title: `New Order Placed: #${orderNumber}`,
          body: `${order.name} placed an order for ₹ ${order.total.toLocaleString('en-IN')}`,
        },
        data: {
          orderId: order.id,
          url: `/admin/orders/${order.id}`,
        }
      });
    }
  } catch (fcmErr: any) {
    console.warn('Firebase Cloud Messaging dispatch note:', fcmErr.message);
  }

  return { success: true };
}

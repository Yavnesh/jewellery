import { render } from '@react-email/components';
import { ResendEmailProvider } from './email/resend.provider';
import OrderConfirmationEmail from './templates/order-confirmation';
import prisma from '@/utils/db';

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
          }
        }
      }
    }
  });

  if (!order) throw new Error('Order not found for notification');

  // Prepare template data
  const items = order.products.map(op => ({
    title: op.variant?.product.title || 'Unknown Product',
    quantity: op.quantity,
    price: op.priceAtPurchase / 100, // Assuming price is in cents for UI rendering
    image: op.variant?.product.mainImage || ''
  }));

  const html = await render(
    OrderConfirmationEmail({
      customerName: order.name,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      orderDate: (order.dateTime || new Date()).toLocaleDateString(),
      total: order.total / 100,
      items,
      shippingAddress: {
        line1: order.adress,
        city: order.city,
        state: 'N/A', // Assuming state might not be captured in this legacy model
        postalCode: order.postalCode
      }
    })
  );

  // Send Email
  const { providerMessageId } = await emailProvider.send({
    to: order.email,
    subject: `Your Vamika Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
    html
  });

  // Log in Notifications table
  await prisma.notification.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      type: 'ORDER_CONFIRMATION',
      channel: 'EMAIL',
      status: 'SENT',
      recipient: order.email,
      subject: `Your Vamika Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
      payload: { items, total: order.total },
      providerMessageId,
      sentAt: new Date(),
      attemptCount: 1,
    }
  });

  return { success: true };
}

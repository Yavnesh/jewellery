import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const currentUserId = (session.user as any).id;
    const currentUserEmail = session.user.email;
    const currentUserRole = ((session.user as any).role || "").toLowerCase();
    const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin";

    // 1. Fetch order details with products and address snapshot
    const order = await prisma.customer_order.findUnique({
      where: { id: orderId },
      include: {
        products: {
          include: {
            variant: true,
            product: true,
          },
        },
        addressSnapshot: true,
        coupons: {
          include: { coupon: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership if not store admin
    if (!isAdmin && order.userId !== currentUserId && order.email !== currentUserEmail) {
      return NextResponse.json({ error: "Forbidden: Order does not belong to your account" }, { status: 403 });
    }

    // 2. GST Calculation Breakdown (Jewellery standard: 3% Total GST)
    // For intra-state sales (Maharashtra): 1.5% CGST + 1.5% SGST
    // For inter-state sales: 3% IGST
    const isMaharashtra = (order.country || "").toUpperCase() === "MAHARASHTRA" || (order.city || "").toLowerCase() === "mumbai";
    const totalAmount = order.total;
    // Base amount before 3% GST: Base = Total / 1.03
    const baseTaxableAmount = Math.round((totalAmount / 1.03) * 100) / 100;
    const totalGstAmount = Math.round((totalAmount - baseTaxableAmount) * 100) / 100;

    const cgstAmount = isMaharashtra ? Math.round((totalGstAmount / 2) * 100) / 100 : 0;
    const sgstAmount = isMaharashtra ? Math.round((totalGstAmount / 2) * 100) / 100 : 0;
    const igstAmount = !isMaharashtra ? totalGstAmount : 0;

    const invoiceDate = order.dateTime ? new Date(order.dateTime) : new Date();
    const invoiceNumber = `INV-${invoiceDate.getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;

    const invoiceData = {
      invoiceNumber,
      invoiceDate: invoiceDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      orderId: order.id,
      seller: {
        legalName: "Vami Exports Haute Joaillerie Private Limited",
        tradeName: "Vamika Jewels",
        gstin: "27AABCV1234F1Z8",
        stateCode: "27 (Maharashtra)",
        address: "Bandra West, Mumbai, MH, 400050, India",
        cin: "U36911MH2024PTC123456",
        contactEmail: "concierge@vamikajewels.com",
      },
      buyer: {
        name: `${order.name} ${order.lastname}`.trim(),
        email: order.email,
        phone: order.phone,
        billingAddress: `${order.adress}, ${order.apartment ? order.apartment + ", " : ""}${order.city}, ${order.country} - ${order.postalCode}`,
        shippingAddress: `${order.adress}, ${order.apartment ? order.apartment + ", " : ""}${order.city}, ${order.country} - ${order.postalCode}`,
        placeOfSupply: order.country || "India",
      },
      items: order.products.map((item, idx) => ({
        srNo: idx + 1,
        description: item.product?.title || item.variant?.title || "Fine Precious Jewellery",
        hsnCode: "7113", // Harmonized System Nomenclature for Articles of jewellery and parts thereof, of precious metal
        metalType: item.product?.metalType || "18K Gold",
        purity: item.product?.purity || "750 Purity Hallmark",
        grossWeight: item.product?.weight ? `${item.product.weight}g` : "N/A",
        quantity: item.quantity,
        rate: item.priceAtPurchase || item.product?.price || 0,
        amount: (item.priceAtPurchase || item.product?.price || 0) * item.quantity,
      })),
      taxSummary: {
        taxableAmount: baseTaxableAmount,
        cgst: isMaharashtra ? { rate: "1.5%", amount: cgstAmount } : null,
        sgst: isMaharashtra ? { rate: "1.5%", amount: sgstAmount } : null,
        igst: !isMaharashtra ? { rate: "3.0%", amount: igstAmount } : null,
        totalGst: totalGstAmount,
        netPayable: totalAmount,
        currency: "INR (₹)",
      },
      complianceDeclarations: [
        "Gold purity and hallmark verified in accordance with Bureau of Indian Standards (BIS) Hallmarking Scheme.",
        "Certified natural diamonds and gemstones authenticated by certified gemological laboratories.",
        "This is a computer-generated Tax Invoice and requires no physical signature under Indian IT Act, 2000.",
      ],
    };

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const acceptHeader = request.headers.get("accept") || "";

    // If client requested JSON via format=json or explicitly without HTML accept
    if (format === "json") {
      return NextResponse.json({ success: true, invoice: invoiceData });
    }

    // Render an elegant, official printable Indian GST Tax Invoice (A4 compliant)
    const itemsHtml = invoiceData.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px 8px; text-align: center; color: #64748b;">${it.srNo}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: 600; color: #1e293b; font-size: 12px;">${it.description}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Metal: <b>${it.metalType}</b> &bull; Purity: <b>${it.purity}</b> &bull; Gross Wt: <b>${it.grossWeight}</b>
            </div>
          </td>
          <td style="padding: 10px 8px; text-align: center; font-family: monospace; color: #334155;">${it.hsnCode}</td>
          <td style="padding: 10px 8px; text-align: center; color: #1e293b; font-weight: 600;">${it.quantity}</td>
          <td style="padding: 10px 8px; text-align: right; color: #1e293b;">₹${it.rate.toLocaleString("en-IN")}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0f172a;">₹${it.amount.toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice - ${invoiceData.invoiceNumber} | Vamika Jewels</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      padding: 36px 40px;
    }
    .print-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1e293b;
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .print-btn:hover {
      background: #d4af37;
      color: #1e293b;
    }
    .json-link {
      color: #64748b;
      font-size: 12px;
      text-decoration: underline;
    }
    .gold-accent {
      color: #b48c36;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .invoice-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <a href="/admin/orders/${invoiceData.orderId}" style="color: #64748b; text-decoration: none; font-size: 13px; font-weight: 500;">
      &larr; Back to Order
    </a>
    <div style="display: flex; gap: 12px; align-items: center;">
      <a href="?format=json" class="json-link">View Raw JSON</a>
      <button onclick="window.print()" class="print-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="invoice-container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b48c36; padding-bottom: 20px;">
      <div>
        <h1 style="font-family: 'Cinzel', serif; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #0f172a; margin-bottom: 4px;">
          VAMIKA JEWELS
        </h1>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
          HAUTE JOAILLERIE &bull; MUMBAI
        </div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.5; margin-top: 6px;">
          <b>${invoiceData.seller.legalName}</b><br/>
          ${invoiceData.seller.address}<br/>
          GSTIN: <b style="color: #0f172a; font-family: monospace;">${invoiceData.seller.gstin}</b> | CIN: ${invoiceData.seller.cin}<br/>
          State: ${invoiceData.seller.stateCode} | Email: ${invoiceData.seller.contactEmail}
        </div>
      </div>

      <div style="text-align: right;">
        <div style="display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
          TAX INVOICE (RULE 46)
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">
          ${invoiceData.invoiceNumber}
        </div>
        <div style="font-size: 11.5px; color: #475569; margin-top: 4px;">
          Invoice Date: <b>${invoiceData.invoiceDate}</b>
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-family: monospace;">
          Order Ref: #${invoiceData.orderId.slice(0, 13)}...
        </div>
      </div>
    </div>

    <!-- Billed To & Shipped To Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; padding: 14px 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
      <div>
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #b48c36; font-weight: 700; margin-bottom: 4px;">
          BILLED TO (BUYER)
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${invoiceData.buyer.name}</div>
        <div style="color: #475569; line-height: 1.5; margin-top: 2px;">
          ${invoiceData.buyer.billingAddress}<br/>
          Phone: ${invoiceData.buyer.phone} &bull; Email: ${invoiceData.buyer.email}
        </div>
      </div>
      <div>
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #b48c36; font-weight: 700; margin-bottom: 4px;">
          PLACE OF SUPPLY & DELIVERY
        </div>
        <div style="color: #475569; line-height: 1.5;">
          Place of Supply: <b style="color: #0f172a;">${invoiceData.buyer.placeOfSupply}</b><br/>
          Shipping Address: ${invoiceData.buyer.shippingAddress}<br/>
          Reverse Charge Applicable: <b>No</b>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 8px; width: 40px; text-align: center;">#</th>
          <th style="padding: 8px; text-align: left;">Item Description & Specifications</th>
          <th style="padding: 8px; text-align: center; width: 70px;">HSN</th>
          <th style="padding: 8px; text-align: center; width: 50px;">Qty</th>
          <th style="padding: 8px; text-align: right; width: 90px;">Rate (₹)</th>
          <th style="padding: 8px; text-align: right; width: 100px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Tax Summary & Net Calculation -->
    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-top: 20px; align-items: start;">
      <!-- Declarations & Hallmark Guarantee -->
      <div style="padding: 14px; background: #fafaf9; border-radius: 6px; border: 1px dashed #d6d3d1; font-size: 10px; color: #57534e; line-height: 1.6;">
        <div style="font-weight: 700; color: #78350f; font-size: 11px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>⚖️ BIS HALLMARK & AUTHENTICITY CERTIFICATION</span>
        </div>
        <ul style="padding-left: 16px; margin: 0;">
          ${invoiceData.complianceDeclarations.map((d) => `<li>${d}</li>`).join("")}
        </ul>
      </div>

      <!-- Financial Calculation -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; font-size: 11.5px;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>Taxable Subtotal:</span>
          <span style="font-weight: 600; color: #0f172a;">₹${invoiceData.taxSummary.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        ${
          invoiceData.taxSummary.cgst
            ? `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>CGST (${invoiceData.taxSummary.cgst.rate}):</span>
          <span style="font-weight: 600; color: #0f172a;">₹${invoiceData.taxSummary.cgst.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>SGST (${invoiceData.taxSummary.sgst?.rate}):</span>
          <span style="font-weight: 600; color: #0f172a;">₹${invoiceData.taxSummary.sgst?.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>`
            : `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>IGST (${invoiceData.taxSummary.igst?.rate}):</span>
          <span style="font-weight: 600; color: #0f172a;">₹${invoiceData.taxSummary.igst?.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>`
        }

        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b; font-size: 11px; border-bottom: 1px solid #e2e8f0;">
          <span>Total GST (3%):</span>
          <span>₹${invoiceData.taxSummary.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div style="display: flex; justify-content: space-between; padding-top: 10px; margin-top: 6px; font-size: 15px; font-weight: 700; color: #0f172a; border-top: 2px solid #0f172a;">
          <span>Total Net Payable:</span>
          <span style="color: #b48c36;">₹${invoiceData.taxSummary.netPayable.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <!-- Signoff Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
      <div>
        Thank you for entrusting Vamika Jewels with your celebration.<br/>
        For verification or certification queries: <b>support@vamikajewels.com</b>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: #0f172a; font-size: 11px;">For Vami Exports Haute Joaillerie Pvt Ltd</div>
        <div style="margin-top: 20px; font-style: italic; color: #94a3b8;">Authorised Signatory (Computer Generated)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("[GST Invoice API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invoice" }, { status: 500 });
  }
}

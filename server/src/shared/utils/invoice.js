import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

/**
 * Generate a PDF invoice and return it as a Buffer.
 */
export async function generateInvoicePDF(invoice, order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ── Header ──────────────────────────────────────────────────
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#1a1a1a").text("POLLEN", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#888").text("LUXURY FRAGRANCES", 50, 78);
    doc.fillColor("#c9a96e").text("pollenstore.in", 50, 91);

    doc.fillColor("#1a1a1a");
    doc.moveTo(50, 115).lineTo(545, 115).strokeColor("#e0d8cc").stroke();

    // ── Invoice Details ──────────────────────────────────────────
    doc.moveDown(1);
    doc.fontSize(18).font("Helvetica-Bold").text("INVOICE", 50, 125);

    const rightX = 350;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Invoice #:`, rightX, 125).text(invoice.invoiceNumber, rightX + 80, 125);
    doc.text(`Issue Date:`, rightX, 140).text(new Date(invoice.issueDate).toLocaleDateString("en-IN"), rightX + 80, 140);
    doc.text(`Order #:`, rightX, 155).text(order.orderId || order._id.toString(), rightX + 80, 155);
    doc.text(`Payment:`, rightX, 170).text(order.paymentMethod?.toUpperCase() || "N/A", rightX + 80, 170);

    // ── Customer Details ─────────────────────────────────────────
    doc.fontSize(11).font("Helvetica-Bold").text("Bill To:", 50, 175);
    doc.fontSize(10).font("Helvetica");
    const addr = order.deliveryAddress || {};
    doc.text(addr.name || order.customerName || "Customer", 50, 190);
    doc.text(addr.phone || "", 50, 204);
    doc.text(`${addr.line1 || ""}`, 50, 218);
    doc.text(`${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}`, 50, 232);

    doc.moveTo(50, 255).lineTo(545, 255).strokeColor("#e0d8cc").stroke();

    // ── Items Table ──────────────────────────────────────────────
    const tableTop = 268;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a");
    doc.text("Product", 50, tableTop);
    doc.text("Qty", 310, tableTop, { width: 60, align: "center" });
    doc.text("Unit Price", 380, tableTop, { width: 80, align: "right" });
    doc.text("Total", 465, tableTop, { width: 80, align: "right" });

    doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor("#e0d8cc").stroke();

    let y = tableTop + 24;
    doc.font("Helvetica").fillColor("#333");

    const items = invoice.items || order.items || [];
    for (const item of items) {
      const name = item.name || item.productName || "Product";
      const variant = item.variant || item.volume || "";
      const qty = item.qty || item.quantity || 1;
      const price = item.price || item.unitPrice || 0;
      const total = qty * price;

      doc.text(`${name}${variant ? ` (${variant})` : ""}`, 50, y, { width: 250 });
      doc.text(String(qty), 310, y, { width: 60, align: "center" });
      doc.text(`₹${price.toFixed(2)}`, 380, y, { width: 80, align: "right" });
      doc.text(`₹${total.toFixed(2)}`, 465, y, { width: 80, align: "right" });

      y += 22;
    }

    doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor("#e0d8cc").stroke();
    y += 14;

    // ── Totals ───────────────────────────────────────────────────
    const totals = [
      ["Subtotal", invoice.subtotal ?? order.subtotal ?? 0],
      ["Discount", -(invoice.discount ?? order.discount ?? 0)],
      ["Shipping", invoice.shipping ?? order.shippingCharge ?? 0],
      ["GST (18%)", invoice.tax ?? order.tax ?? 0],
    ];

    for (const [label, value] of totals) {
      doc.text(label, 380, y, { width: 80 });
      doc.text(`₹${Math.abs(value).toFixed(2)}`, 465, y, { width: 80, align: "right" });
      if (label === "Discount") doc.fillColor("#c00").text(`-₹${Math.abs(value).toFixed(2)}`, 465, y, { width: 80, align: "right" });
      doc.fillColor("#333");
      y += 18;
    }

    doc.moveTo(380, y).lineTo(545, y).strokeColor("#c9a96e").lineWidth(1.5).stroke();
    doc.lineWidth(1);
    y += 8;

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a");
    doc.text("TOTAL", 380, y, { width: 80 });
    doc.text(`₹${(invoice.total ?? order.total ?? 0).toFixed(2)}`, 465, y, { width: 80, align: "right" });

    // ── Footer ───────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica").fillColor("#aaa");
    doc.text("Thank you for choosing Pollen Store.", 50, 720, { align: "center", width: 495 });
    doc.text("For queries: support@pollenstore.in · pollenstore.in", 50, 734, { align: "center", width: 495 });

    doc.end();
  });
}

import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    name: String,
    variant: String,
    HSN: String,
    qty: Number,
    unitPrice: Number,
    GSTRate: Number,
    GSTAmount: Number,
    total: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    orderRef: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, unique: true },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },

    items: [invoiceItemSchema],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    pdfUrl: { type: String, default: "" }, // Cloudinary URL or local path
    pdfGeneratedAt: { type: Date, default: null },

    billingAddress: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: "" },

    // GST details
    GSTIN: { type: String, default: "" },
    placeOfSupply: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const seq = await Invoice.countDocuments() + 1;
    this.invoiceNumber = `PLN/INV/${year}/${String(seq).padStart(5, "0")}`;
  }
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;

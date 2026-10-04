import React, { useState, useEffect } from "react";
import { Check, ExternalLink, RefreshCw, Sparkles, Truck, X } from "lucide-react";
import { motion } from "motion/react";
import { updateAdminOrderStatus } from "@/app/api";

interface TrackingModalProps {
  order: any | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function TrackingModal({ order, onClose, onUpdated }: TrackingModalProps) {
  const [carrier, setCarrier] = useState("India Post Speed Post");
  const [consignmentNumber, setConsignmentNumber] = useState("");
  const [status, setStatus] = useState<"shipped" | "out_for_delivery" | "delivered">("shipped");
  const [bookingOffice, setBookingOffice] = useState("New Delhi GPO (Booking NSH)");
  const [courierDesc, setCourierDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order) return;

    // Check if order already has an existing speed post consignment number
    const existingConsignment =
      order.consignmentNumber ||
      (/^E[A-Z]\d{9}IN$/i.test(order.trackingId || "") ? order.trackingId : "");

    if (existingConsignment) {
      setConsignmentNumber(existingConsignment);
    } else {
      generateConsignment();
    }

    setCarrier(order.carrier || "India Post Speed Post");
    setCourierDesc(`Dispatched via India Post Speed Post EMS Air/Surface from New Delhi GPO.`);
  }, [order]);

  const generateConsignment = () => {
    const randomNine = Math.floor(100000000 + Math.random() * 900000000);
    const newId = `ED${randomNine}IN`;
    setConsignmentNumber(newId);
  };

  if (!order) return null;

  const trackingPortalUrl = `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consignmentNumber.trim()) return;

    try {
      setLoading(true);
      const cleanConsignment = consignmentNumber.trim().toUpperCase();

      await updateAdminOrderStatus(order._id || order.orderId, {
        status,
        carrier,
        consignmentNumber: cleanConsignment,
        trackingId: cleanConsignment,
        trackingUrl: `${trackingPortalUrl}?consNo=${cleanConsignment}`,
        location: bookingOffice,
        description:
          courierDesc.trim() ||
          `Handed over to ${carrier} at ${bookingOffice}. Article #${cleanConsignment}.`,
      });

      onUpdated();
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update tracking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8 text-neutral-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">India Post Fulfillment & Tracking</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md">
                  Speed Post
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Order {(order.orderId || order.order_id || order.displayId || order._id || "").startsWith("PN")
                  ? (order.orderId || order.order_id)
                  : `#${order.orderId || order.order_id || order.displayId || order._id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Carrier Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Logistics Provider / Courier Partner
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-600 text-white font-black text-[9px]">
                IP
              </div>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-white outline-none"
              />
              <span className="shrink-0 text-[10px] font-semibold text-neutral-500 font-sans">
                (भारतीय डाक)
              </span>
            </div>
          </div>

          {/* Consignment Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Speed Post Consignment Number (AWB) *
              </label>
              <button
                type="button"
                onClick={generateConsignment}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-Generate Valid ID</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={consignmentNumber}
                onChange={(e) => setConsignmentNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ED109842145IN"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white font-mono tracking-wider outline-none focus:border-amber-400 uppercase"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono text-neutral-500">
                UPU S10 Standard
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "shipped", label: "In Transit / Shipped", desc: "NSH Hub" },
              { id: "out_for_delivery", label: "Out for Delivery", desc: "Postman Beat" },
              { id: "delivered", label: "Delivered", desc: "Addressee signed" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id as any)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  status === st.id
                    ? "border-amber-400 bg-amber-400/10 text-white shadow-sm"
                    : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span className="text-[11px] font-bold">{st.label}</span>
                <span className="text-[9px] text-neutral-500 mt-0.5">{st.desc}</span>
              </button>
            ))}
          </div>

          {/* Booking Post Office */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Origin Booking Post Office
            </label>
            <input
              type="text"
              value={bookingOffice}
              onChange={(e) => setBookingOffice(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Dispatch Note (Sent in Notification)
            </label>
            <textarea
              rows={2}
              value={courierDesc}
              onChange={(e) => setCourierDesc(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Live Official Tracking Link Preview */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-neutral-300">India Post Official Tracking Portal</span>
            </div>
            <a
              href={`${trackingPortalUrl}?consNo=${consignmentNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:underline"
            >
              <span>Test Live Portal</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-[0_4px_16px_rgba(212,175,55,0.25)] cursor-pointer"
            >
              {loading ? "Updating..." : "Confirm Shipment & Notify Customer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

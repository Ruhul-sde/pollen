import React from "react";
import { Check, CheckCircle2, Clock, Truck, X } from "lucide-react";

interface StatusBadgeProps {
  status?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status = "pending", size = "sm", className = "" }: StatusBadgeProps) {
  const s = status.toLowerCase();

  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  if (s === "delivered" || s === "completed" || s === "active" || s === "instock") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider ${sizeClass} ${className}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </span>
    );
  }

  if (s === "shipped" || s === "out_for_delivery") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider ${sizeClass} ${className}`}
      >
        <Truck className="h-3 w-3" />
        {s.replace("_", " ")}
      </span>
    );
  }

  if (s === "confirmed" || s === "paid" || s === "processing") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider ${sizeClass} ${className}`}
      >
        <Check className="h-3 w-3" />
        {s}
      </span>
    );
  }

  if (s === "cancelled" || s === "rejected" || s === "suspended" || s === "outofstock") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase tracking-wider ${sizeClass} ${className}`}
      >
        <X className="h-3 w-3" />
        {s.replace("_", " ")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider ${sizeClass} ${className}`}
    >
      <Clock className="h-3 w-3" />
      {s.replace("_", " ")}
    </span>
  );
}

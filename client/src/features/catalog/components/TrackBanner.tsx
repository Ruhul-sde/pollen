import React, { useState } from "react";
import { getOrderByTrackingId } from "@/app/supabase";

interface TrackBannerProps {
  userId?: string;
  onRequireLogin: () => void;
}

export function TrackBanner({ userId, onRequireLogin }: TrackBannerProps) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrackWithId = async (trackingId: string) => {
    if (!userId) return onRequireLogin();
    if (!trackingId) return setMessage("Enter your tracking ID.");
    setLoading(true);
    setMessage("");
    try {
      const order = await getOrderByTrackingId(userId, trackingId);
      setMessage(order ? `Status: ${order.status}` : "No order found for this tracking ID.");
    } catch {
      setMessage("Unable to load your order right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    handleTrackWithId(value.trim());
  };

  React.useEffect(() => {
    const onLookup = (e: any) => {
      const id = e?.detail;
      if (id) {
        setValue(id);
        handleTrackWithId(String(id).trim());
      }
    };
    window.addEventListener("lookup-track-id", onLookup);
    return () => window.removeEventListener("lookup-track-id", onLookup);
  }, [userId]);

  return (
    <section
      id="track"
      className="border-y border-[#e8e8e8] dark:border-neutral-800 bg-[#f5f5f5] dark:bg-neutral-900 px-6 py-14 md:px-16 text-black dark:text-white transition-colors duration-200 scroll-mt-20 sm:scroll-mt-24"
    >
      <div className="mx-auto flex max-w-screen-xl flex-col gap-6 md:flex-row md:items-center md:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-black dark:text-white">Track Your Order</p>
          <p className="mt-1 text-sm text-black/45 dark:text-neutral-400">Enter your order number below</p>
        </div>
        <div className="flex max-w-md flex-1">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Order #KP-00000"
            className="flex-1 border border-r-0 border-black/20 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-5 py-3.5 text-sm outline-none"
          />
          <button
            onClick={handleTrack}
            disabled={loading}
            className="bg-black dark:bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white dark:text-black disabled:opacity-60 transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer"
          >
            {loading ? "Checking" : "Track"}
          </button>
        </div>
        {message && (
          <p className="text-sm text-black/60 dark:text-neutral-300" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

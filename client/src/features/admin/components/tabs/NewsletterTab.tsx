import React from "react";
import { Download, Mail } from "lucide-react";
import { formatDate } from "../../../../shared/utils/formatters";

interface NewsletterTabProps {
  subscribers: any[];
}

export function NewsletterTab({ subscribers }: NewsletterTabProps) {
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Email,Date Subscribed"]
        .concat(subscribers.map((s) => `${s.email},${s.createdAt || ""}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pollen_newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Newsletter Subscribers</h2>
          <p className="text-xs text-neutral-400">Manage VIP email list and perfume drop announcements</p>
        </div>

        {subscribers.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Subscribers (CSV)</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Subscriber Email</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-neutral-400">
                    No newsletter subscribers registered yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-amber-400" />
                        <span>{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-400">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                        Subscribed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

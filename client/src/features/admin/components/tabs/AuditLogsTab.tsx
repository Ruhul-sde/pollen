import React from "react";
import { Clock, Shield } from "lucide-react";
import { formatDateTime } from "../../../../shared/utils/formatters";

interface AuditLogsTabProps {
  auditLogs: any[];
}

export function AuditLogsTab({ auditLogs }: AuditLogsTabProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Security & Audit Trails</h2>
        <p className="text-xs text-neutral-400">Chronological history of admin actions, status overrides, and system changes</p>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-neutral-400 font-sans">
                    No recent audit events logged.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{formatDateTime(log.createdAt || log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-300 font-sans">
                      {log.action || "STATUS_CHANGE"}
                    </td>
                    <td className="px-6 py-4 text-white font-sans">
                      {log.adminUser?.name || log.userName || "System / Admin"}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-[11px] font-sans">
                      {log.details || log.description || "Database update executed"}
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

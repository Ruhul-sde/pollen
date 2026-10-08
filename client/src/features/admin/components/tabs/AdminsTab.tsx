import React, { useState } from "react";
import {
  ShieldCheck,
  Shield,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Copy,
  Check,
  Mail,
  Phone,
  Clock,
  KeyRound,
  Filter,
} from "lucide-react";
import { AdminAccount } from "../../../../app/api";
import { formatDate } from "../../../../shared/utils/formatters";

interface AdminsTabProps {
  admins: AdminAccount[];
  currentAdminEmail?: string;
  onAddAdmin: () => void;
  onEditAdmin: (admin: AdminAccount) => void;
  onDeleteAdmin: (adminId: string) => void;
  onToggleStatus: (admin: AdminAccount) => void;
}

export function AdminsTab({
  admins,
  currentAdminEmail,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
  onToggleStatus,
}: AdminsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "superadmin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const cleanCurrentEmail = (currentAdminEmail || "").toLowerCase().trim();

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredAdmins = admins.filter((admin) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      admin.name?.toLowerCase().includes(q) ||
      admin.email?.toLowerCase().includes(q) ||
      admin.phone?.toLowerCase().includes(q);

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "superadmin" ? admin.role === "superadmin" : admin.role !== "superadmin");

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? admin.isActive !== false : admin.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdmins = admins.length;
  const superAdmins = admins.filter((a) => a.role === "superadmin").length;
  const standardAdmins = admins.filter((a) => a.role !== "superadmin").length;
  const activeAdmins = admins.filter((a) => a.isActive !== false).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Accounts & Team Access</h2>
            <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
              {admins.length} Total
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Create new administrators, configure individual module permissions, and monitor active staff credentials
          </p>
        </div>

        <button
          onClick={onAddAdmin}
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Administrators</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{totalAdmins}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Authorized store personnel</p>
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Super Administrators</span>
            <Shield className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-300">{superAdmins}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Full root system access</p>
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Store Managers</span>
            <KeyRound className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-300">{standardAdmins}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Operational roles</p>
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Status</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{activeAdmins}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Ready to authenticate</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-3 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin name, email, or phone..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950/80 p-1 text-[11px]">
            <button
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                roleFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter("superadmin")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                roleFilter === "superadmin" ? "bg-purple-500/20 text-purple-300" : "text-neutral-400 hover:text-white"
              }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                roleFilter === "admin" ? "bg-amber-400/20 text-amber-300" : "text-neutral-400 hover:text-white"
              }`}
            >
              Store Admin
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950/80 p-1 text-[11px]">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === "active" ? "bg-emerald-500/20 text-emerald-300" : "text-neutral-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === "inactive" ? "bg-red-500/20 text-red-300" : "text-neutral-400 hover:text-white"
              }`}
            >
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Role & Access</th>
                <th className="px-6 py-4">Module Permissions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No administrators found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const id = admin._id || (admin as any).id;
                  const isSuper = admin.role === "superadmin";
                  const isSelf = cleanCurrentEmail && admin.email.toLowerCase() === cleanCurrentEmail;
                  const isSystemRoot =
                    admin.email.toLowerCase() === "admin@pollen.com" ||
                    admin.email.toLowerCase() === "hammambinasraful@gmail.com";
                  const canDelete = !isSelf && !isSystemRoot;
                  const perms = admin.permissions || ["all"];
                  const isAllPerms = perms.includes("all");

                  // Generate initials
                  const initials = (admin.name || "A")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              isSuper
                                ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{admin.name}</span>
                              {isSelf && (
                                <span className="rounded-full bg-neutral-800 border border-neutral-700 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-neutral-400 text-[11px]">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="h-3 w-3 text-neutral-500" />
                                <span>{admin.email}</span>
                              </span>
                              <button
                                onClick={() => handleCopyEmail(admin.email)}
                                className="text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedEmail === admin.email ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              {admin.phone && (
                                <span className="flex items-center gap-1 text-neutral-500 ml-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{admin.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-[10px] font-bold text-purple-300">
                            <Shield className="h-3 w-3 text-purple-400" />
                            <span>Super Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                            <ShieldCheck className="h-3 w-3 text-amber-400" />
                            <span>Store Manager</span>
                          </span>
                        )}
                      </td>

                      {/* Permissions */}
                      <td className="px-6 py-4">
                        {isAllPerms ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            <span>Full Store Access</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {perms.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-medium text-neutral-300 border border-neutral-700/60"
                              >
                                {p}
                              </span>
                            ))}
                            {perms.length > 3 && (
                              <span className="text-[10px] text-neutral-500 font-medium">
                                +{perms.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onToggleStatus(admin)}
                          disabled={isSelf || isSystemRoot}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                            admin.isActive !== false
                              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20"
                          } ${isSelf || isSystemRoot ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
                          title={isSelf ? "Cannot deactivate yourself" : "Click to toggle account status"}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              admin.isActive !== false ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <span>{admin.isActive !== false ? "Active" : "Suspended"}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-neutral-400 font-mono text-[11px]">
                        {admin.createdAt ? formatDate(admin.createdAt) : "System Default"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditAdmin(admin)}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                            title="Edit Admin Account"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (canDelete) {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete administrator "${admin.name}" (${admin.email})? This action cannot be undone.`
                                  )
                                ) {
                                  onDeleteAdmin(id);
                                }
                              }
                            }}
                            disabled={!canDelete}
                            className={`rounded-lg p-1.5 transition-colors ${
                              canDelete
                                ? "text-neutral-400 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                                : "text-neutral-700 cursor-not-allowed"
                            }`}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : isSystemRoot
                                ? "Protected root system administrator"
                                : "Delete Admin Account"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

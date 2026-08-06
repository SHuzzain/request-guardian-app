"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInboxRequests } from "@/feature/requests/queries/requests.queries";
import { StatusBadge, PriorityBadge } from "@/feature/requests/components/status-badge";
import { formatMoney, formatDate, initialsOf } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/permission";
import { Search, Eye, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export function InboxView() {
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["inbox-requests"],
    queryFn: () => getInboxRequests(),
  });

  if (permissionsLoading) return null;
  if (!can("approval_inbox:view")) return <AccessDenied />;

  const departments = ["Engineering", "Operations", "Finance", "HR", "Marketing", "Legal"];
  const priorities = ["Low", "Medium", "High", "Urgent"];

  const rows = (requests ?? []).filter((r) => {
    // Search filter
    if (search) {
      const name = r.requester?.fullName ?? "";
      const matchesSearch = `${r.code} ${name} ${r.requestType?.name}`
        .toLowerCase()
        .includes(search.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      const statusKey = r.status?.toLowerCase();
      if (statusFilter === "pending" && statusKey !== "pending" && statusKey !== "submitted")
        return false;
      if (statusFilter === "approved" && statusKey !== "approved") return false;
      if (
        statusFilter === "needs_changes" &&
        statusKey !== "changes_requested" &&
        statusKey !== "in_review"
      )
        return false;
      if (statusFilter === "rejected" && statusKey !== "rejected") return false;
    }

    // Department filter
    if (deptFilter !== "all") {
      if (r.department?.name?.toLowerCase() !== deptFilter.toLowerCase()) return false;
    }

    // Priority filter
    if (priorityFilter !== "all") {
      if (r.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Approval Inbox</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review and take action on pending requests requiring your approval.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="needs_changes">Need Changes</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            <option value="all">All Priority</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {rows.length} results
          </span>
        </div>
      </div>

      {/* Inbox Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 shadow-xs">
          No matching requests found in approval inbox
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Type / Dept</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-blue-600">
                    <Link href={`/requests/${r.id}`}>{r.code}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initialsOf(r.requester?.fullName)}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.requester?.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.requestType?.name || "General"}</div>
                    <div className="text-[10px] text-slate-400">{r.department?.name || "Operations"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(Number(r.amount))}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/requests/${r.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                      title="View Request"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

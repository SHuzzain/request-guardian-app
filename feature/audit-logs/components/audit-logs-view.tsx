"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsData } from "@/feature/audit-logs/queries/audit-logs.queries";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/permission";
import { formatDateTime } from "@/lib/utils";
import { Loader2, Search, Filter, FileText, Info } from "lucide-react";
import Link from "next/link";

export function AuditLogsView() {
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs-data"],
    queryFn: () => getAuditLogsData(),
  });

  if (permissionsLoading) return null;
  if (!can("audit_log:view")) return <AccessDenied />;

  const actionOptions = [
    "ALL",
    "CREATED",
    "SUBMITTED",
    "RESUBMITTED",
    "APPROVED",
    "REJECTED",
    "CHANGES_REQUESTED",
    "COMMENTED",
    "DOCUMENT_UPLOADED",
    "SIGNATURE_APPLIED",
  ];

  const filtered = (logs ?? []).filter((log) => {
    // Search
    if (search) {
      const actorName = log.actor?.fullName ?? "";
      const code = log.request?.code ?? "";
      const desc = log.description ?? "";
      const matches = `${actorName} ${code} ${desc}`.toLowerCase().includes(search.toLowerCase());
      if (!matches) return false;
    }

    // Action filter
    if (actionFilter !== "ALL" && log.action !== actionFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Audit Logs</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete system activity and security audit trail.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by actor, request code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            {actionOptions.map((act) => (
              <option key={act} value={act}>
                {act === "ALL" ? "All Actions" : act}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {filtered.length} entries
          </span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 shadow-xs">
          No audit log entries match your search criteria.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {log.actor?.fullName || "System"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {log.request?.id ? (
                      <Link href={`/requests/${log.request.id}`}>{log.request.code}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {log.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {log.metadata ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                        title="View metadata"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit Log Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.actor?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-600">{formatDateTime(selectedLog.createdAt)}</span>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Metadata JSON</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

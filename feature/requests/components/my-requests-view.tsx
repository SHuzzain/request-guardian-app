"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getMyRequests } from "@/feature/requests/queries/requests.queries";
import { StatusBadge, PriorityBadge } from "./status-badge";
import { formatMoney, formatDate } from "@/lib/utils";
import { PlusCircle, Search, Filter, FileText, Loader2, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export function MyRequestsView() {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => (user?.id ? getMyRequests(user.id) : []),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const filtered = (requests || []).filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Requests</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all requests submitted by you
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Request
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, type, department..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHANGES_REQUESTED">Needs Changes</option>
          </select>
        </div>
      </div>

      {/* Content Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No requests found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You haven't created any requests yet. Click below to submit your first request.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Request
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-blue-600">
                    <Link href={`/requests/${item.id}`}>{item.code}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.requestType?.name || "General"}</td>
                  <td className="px-4 py-3 text-slate-500">{item.department?.name || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(Number(item.amount))}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/requests/${item.id}`} className="p-1 text-slate-400 hover:text-blue-600 inline-block">
                      <ChevronRight className="w-4 h-4" />
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

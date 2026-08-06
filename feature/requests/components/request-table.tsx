"use client";

import React from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "./status-badge";
import { formatMoney, formatDate, initialsOf } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface RequestItemView {
  id: string;
  code: string;
  status: string;
  priority: string;
  amount: number | string;
  requestDate: Date | string | null;
  createdAt: Date | string | null;
  requestType?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  requester?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

export function RequestTable({ items }: { items: RequestItemView[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">No requests found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                  <Link href={`/requests/${item.id}`}>{item.code}</Link>
                </td>
                <td className="px-4 py-3">
                  {item.requester ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                        {initialsOf(item.requester.fullName)}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.requester.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  <div>{item.requestType?.name || "General"}</div>
                  <div className="text-[10px] text-slate-400">{item.department?.name}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                  {formatMoney(Number(item.amount))}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/requests/${item.id}`}
                    className="inline-flex items-center p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

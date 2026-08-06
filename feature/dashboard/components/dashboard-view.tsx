"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/feature/dashboard/queries/dashboard.queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePermissions } from "@/hooks/use-permissions";
import { StatusBadge, PriorityBadge } from "@/feature/requests/components/status-badge";
import { formatMoney, initialsOf } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Inbox,
  BarChart2,
  Settings,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export function DashboardView() {
  const { data: user } = useCurrentUser();
  const { can } = usePermissions();
  const [selectedYear, setSelectedYear] = useState("2026");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardData(),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const isSelectedYear = (value: string | Date | null | undefined) => {
    if (!value) return false;
    const date = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(date.getTime()) && String(date.getFullYear()) === selectedYear;
  };

  const filteredAll = (data.all ?? []).filter((r) => isSelectedYear(r.requestDate ?? r.createdAt));
  const filteredRecent = (data.recent ?? [])
    .filter((r) => isSelectedYear(r.requestDate ?? r.createdAt))
    .slice(0, 5);

  const pendingCount = filteredAll.filter((r) =>
    ["SUBMITTED", "PENDING", "IN_REVIEW"].includes(r.status?.toUpperCase() ?? ""),
  ).length;

  const approvedCount = filteredAll.filter((r) => r.status?.toUpperCase() === "APPROVED").length;
  const approvedByUser = filteredAll.filter(
    (r) => r.status?.toUpperCase() === "APPROVED" && r.approvedBy === user?.id,
  ).length;
  const approvedByOthers = Math.max(0, approvedCount - approvedByUser);

  const needsCount = filteredAll.filter(
    (r) => r.status?.toUpperCase() === "CHANGES_REQUESTED",
  ).length;

  const rejectedCount = filteredAll.filter(
    (r) => r.status?.toUpperCase() === "REJECTED",
  ).length;

  const statCards = [
    {
      label: "Pending Approval",
      value: pendingCount,
      subtext: "Awaiting your review",
      icon: Clock,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
      href: can("approval_inbox:view") ? "/inbox" : "/my-requests",
    },
    {
      label: "Approved Today",
      value: approvedCount,
      subtext: `${approvedByUser} by you · ${approvedByOthers} by others`,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
      href: can("approval_inbox:view") ? "/inbox" : "/my-requests",
    },
    {
      label: "Need Changes",
      value: needsCount,
      subtext: "Requires resubmission",
      icon: AlertCircle,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
      href: "/my-requests",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      subtext: "This month total",
      icon: XCircle,
      color: "text-red-500 bg-red-50 dark:bg-red-950/40",
      href: "/my-requests",
    },
  ];

  const quickActions = [
    { label: "Create New Request", href: "/create", icon: Plus, permission: "my_requests:create" },
    { label: `View Pending (${pendingCount})`, href: "/inbox", icon: Clock, permission: "approval_inbox:view" },
    { label: "Approval Inbox", href: "/inbox", icon: Inbox, permission: "approval_inbox:view" },
    { label: "View Reports", href: "/audit-logs", icon: BarChart2, permission: "audit_log:view" },
    { label: "Settings", href: "/settings", icon: Settings, permission: "settings:view" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header with Year Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="h-9 w-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-full ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{card.value}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{card.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Requests (2/3) + Quick Actions (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Recent Requests */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Requests</h3>
            <Link
              href={can("approval_inbox:view") ? "/inbox" : "/my-requests"}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all →
            </Link>
          </div>

          {filteredRecent.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent requests for {selectedYear}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecent.map((req) => (
                <div
                  key={req.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {initialsOf(req.requester?.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {req.requester?.fullName || "User"}
                        </span>
                        <PriorityBadge priority={req.priority} />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {req.code} · {req.requestType?.name ?? "Travel Expense"} · {formatMoney(Number(req.amount))}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <StatusBadge status={req.status} />
                    <Link
                      href={`/requests/${req.id}`}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>

          <div className="space-y-2">
            {quickActions.map((act) => {
              if (act.permission && !can(act.permission as any)) return null;
              const Icon = act.icon;
              return (
                <Link
                  key={act.label}
                  href={act.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {act.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

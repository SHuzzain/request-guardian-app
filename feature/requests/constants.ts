import type { RequestPriority, RequestStatus } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS_CONFIG — single source of truth for badges, labels, colors
// Old project had this duplicated in: dashboard.tsx, inbox.tsx, requests.$id.tsx, etc.
// ─────────────────────────────────────────────────────────────────────────────

export type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  description: string;
};

export const STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
    description: "Request is saved as a draft and not yet submitted",
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "default",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
    description: "Request has been submitted and is awaiting review",
  },
  PENDING: {
    label: "Pending",
    variant: "default",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
    description: "Request is pending approval",
  },
  IN_REVIEW: {
    label: "In Review",
    variant: "default",
    className: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200",
    description: "Request is being reviewed",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    variant: "outline",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200",
    description: "Reviewer has requested changes before approval",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    variant: "default",
    className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200",
    description: "Request has been resubmitted after changes",
  },
  APPROVED: {
    label: "Approved",
    variant: "default",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
    description: "Request has been approved",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200",
    description: "Request has been rejected",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    className: "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200",
    description: "Request has been cancelled",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY_CONFIG — single source of truth for priority badges
// ─────────────────────────────────────────────────────────────────────────────

export type PriorityConfig = {
  label: string;
  className: string;
  order: number;
};

export const PRIORITY_CONFIG: Record<RequestPriority, PriorityConfig> = {
  LOW: {
    label: "Low",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    order: 1,
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    order: 2,
  },
  HIGH: {
    label: "High",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    order: 3,
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    order: 4,
  },
};

// Statuses that an approver can act on
export const ACTIONABLE_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "PENDING",
  "IN_REVIEW",
  "RESUBMITTED",
];

// Statuses shown in the inbox
export const INBOX_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "PENDING",
  "IN_REVIEW",
  "RESUBMITTED",
  "CHANGES_REQUESTED",
];

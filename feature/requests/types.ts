// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for request status & priority
// Import from here — never redefine in components or pages!
// ─────────────────────────────────────────────────────────────────────────────

export const REQUEST_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  RESUBMITTED: "RESUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const REQUEST_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type RequestPriority = (typeof REQUEST_PRIORITY)[keyof typeof REQUEST_PRIORITY];

/**
 * Normalize any raw status string from the DB to a canonical RequestStatus.
 * Replaces the scattered if-else chains that existed in the old project.
 */
export function normalizeStatus(raw: string | null | undefined): RequestStatus {
  if (!raw) return REQUEST_STATUS.DRAFT;
  const upper = raw.toUpperCase().trim();
  if (upper in REQUEST_STATUS) return upper as RequestStatus;

  // Legacy mappings from the old project's scattered helpers
  const legacyMap: Record<string, RequestStatus> = {
    INREVIEW: REQUEST_STATUS.IN_REVIEW,
    "IN-REVIEW": REQUEST_STATUS.IN_REVIEW,
    CHANGESREQUESTED: REQUEST_STATUS.CHANGES_REQUESTED,
    "CHANGES-REQUESTED": REQUEST_STATUS.CHANGES_REQUESTED,
    OPEN: REQUEST_STATUS.PENDING,
    CLOSED: REQUEST_STATUS.APPROVED,
  };

  return legacyMap[upper] ?? REQUEST_STATUS.DRAFT;
}

/**
 * Returns true if this status means the request is in an active approval flow.
 */
export function isActiveStatus(status: RequestStatus): boolean {
  const activeStatuses: RequestStatus[] = [
    REQUEST_STATUS.SUBMITTED,
    REQUEST_STATUS.PENDING,
    REQUEST_STATUS.IN_REVIEW,
    REQUEST_STATUS.RESUBMITTED,
  ];
  return activeStatuses.includes(status);
}

/**
 * Returns true if the request can still be edited by its requester.
 */
export function isEditableByRequester(status: RequestStatus): boolean {
  const editableStatuses: RequestStatus[] = [REQUEST_STATUS.DRAFT, REQUEST_STATUS.CHANGES_REQUESTED];
  return editableStatuses.includes(status);
}


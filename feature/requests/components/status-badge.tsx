"use client";

import React from "react";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/feature/requests/constants";
import { normalizeStatus } from "@/feature/requests/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const config = STATUS_CONFIG[normalized];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        className,
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: string | null | undefined;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const upper = (priority?.toUpperCase() ?? "MEDIUM") as keyof typeof PRIORITY_CONFIG;
  const config = PRIORITY_CONFIG[upper] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

"use client";

import React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/lib/permissions";

interface PermissionGateProps {
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) return null;

  let allowed = false;
  if (permission) {
    allowed = can(permission);
  } else if (permissions?.length) {
    allowed = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    allowed = true;
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 font-semibold text-xl">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        You do not have permission to view or manage this section. Please contact your system administrator if you believe this is an error.
      </p>
    </div>
  );
}

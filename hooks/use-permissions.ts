"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission, hasAnyPermission, hasAllPermissions, type PermissionKey } from "@/lib/permissions";

export function usePermissions() {
  const { data: user, isLoading } = useCurrentUser();

  return {
    user,
    isLoading,
    can: (permission: PermissionKey) => hasPermission(user, permission),
    canAny: (permissions: PermissionKey[]) => hasAnyPermission(user, permissions),
    canAll: (permissions: PermissionKey[]) => hasAllPermissions(user, permissions),
  };
}

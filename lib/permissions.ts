export type RolePermissions = Record<string, string[]>;
export type PermissionKey = `${string}:${string}`;

export type PermissionAction = { key: string; label: string };
export type PermissionSection = { key: string; label: string; actions: PermissionAction[] };
export type PermissionGroup = { key: string; label: string; sections: PermissionSection[] };
export type PermissionUser = {
  email?: string | null;
  isAdmin?: boolean;
  permissions?: RolePermissions | null;
};

export const SUPER_ADMIN_EMAILS = new Set(["sahinppmdon7@gmail.com"]);

export const ROLE_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    sections: [{ key: "dashboard", label: "Dashboard", actions: [{ key: "view", label: "View" }] }],
  },
  {
    key: "requests",
    label: "Requests",
    sections: [
      {
        key: "approval_inbox",
        label: "Approval Inbox",
        actions: [
          { key: "view", label: "View" },
          { key: "approve", label: "Approve" },
          { key: "reject", label: "Reject" },
          { key: "comment", label: "Comment" },
          { key: "download", label: "Download" },
        ],
      },
      {
        key: "my_requests",
        label: "My Requests",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Add" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "resubmit", label: "Resubmit" },
        ],
      },
    ],
  },
  {
    key: "masters",
    label: "Masters",
    sections: [
      {
        key: "departments",
        label: "Departments",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Add" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
      {
        key: "users",
        label: "Users",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Add" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "reset_password", label: "Reset password" },
        ],
      },
      {
        key: "roles",
        label: "Roles",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Add" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
          { key: "manage_permissions", label: "Manage permissions" },
        ],
      },
      {
        key: "request_types",
        label: "Request Types",
        actions: [
          { key: "view", label: "View" },
          { key: "create", label: "Add" },
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    key: "audit_log",
    label: "Audit Log",
    sections: [
      {
        key: "audit_log",
        label: "Audit Log",
        actions: [
          { key: "view", label: "View" },
          { key: "export", label: "Export" },
        ],
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    sections: [
      {
        key: "settings",
        label: "Settings",
        actions: [
          { key: "view", label: "View" },
          { key: "update_profile", label: "Update profile" },
          { key: "manage_signature", label: "Manage signature" },
        ],
      },
    ],
  },
];

const DEFAULT_USER_PERMISSIONS: RolePermissions = {
  dashboard: ["view"],
  my_requests: ["view", "create", "edit", "delete", "resubmit"],
};

function parsePermission(permission: PermissionKey) {
  const [section, action] = permission.split(":");
  return { section, action };
}

function hasConfiguredPermissions(permissions?: RolePermissions | null) {
  return !!permissions && Object.values(permissions).some((actions) => actions.length > 0);
}

function permissionExists(permission: PermissionKey) {
  const { section, action } = parsePermission(permission);
  return ROLE_PERMISSION_GROUPS.some((group) =>
    group.sections.some(
      (s) => s.key === section && s.actions.some((a) => a.key === action),
    ),
  );
}

export function isSuperAdmin(user?: PermissionUser | null) {
  return !!user?.email && SUPER_ADMIN_EMAILS.has(user.email.toLowerCase());
}

export function hasPermission(user: PermissionUser | null | undefined, permission: PermissionKey) {
  if (!user) return false;
  if (!permissionExists(permission)) return false;
  if (isSuperAdmin(user)) return true;

  const permissions =
    user.isAdmin && !hasConfiguredPermissions(user.permissions)
      ? buildFullPermissions()
      : user.permissions ?? DEFAULT_USER_PERMISSIONS;

  const { section, action } = parsePermission(permission);
  return permissions[section]?.includes(action) ?? false;
}

export function hasAnyPermission(user: PermissionUser | null | undefined, permissions: PermissionKey[]) {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: PermissionUser | null | undefined, permissions: PermissionKey[]) {
  return permissions.every((p) => hasPermission(user, p));
}

export function buildFullPermissions(): RolePermissions {
  const permissions: RolePermissions = {};
  for (const group of ROLE_PERMISSION_GROUPS) {
    for (const section of group.sections) {
      permissions[section.key] = section.actions.map((a) => a.key);
    }
  }
  return permissions;
}

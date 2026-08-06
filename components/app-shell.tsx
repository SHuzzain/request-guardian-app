"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  FileText,
  Layers,
  Clock,
  Settings,
  LogOut,
  Bell,
  Plus,
  Menu,
  Search,
} from "lucide-react";
import { cn, initialsOf } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePermissions } from "@/hooks/use-permissions";
import { signOut } from "@/lib/auth-client";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: import("@/lib/permissions").PermissionKey;
  anyOf?: import("@/lib/permissions").PermissionKey[];
  hasBadge: boolean;
}

const NAV_ALL: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, permission: "dashboard:view", hasBadge: false },
  { to: "/inbox", label: "Approval Inbox", icon: Inbox, permission: "approval_inbox:view", hasBadge: true },
  { to: "/my-requests", label: "My Requests", icon: FileText, permission: "my_requests:view", hasBadge: false },
  { to: "/masters", label: "Masters", icon: Layers, anyOf: ["departments:view", "users:view", "roles:view", "request_types:view"], hasBadge: false },
  { to: "/audit-logs", label: "Audit log", icon: Clock, permission: "audit_log:view", hasBadge: false },
  { to: "/settings", label: "Settings", icon: Settings, permission: "settings:view", hasBadge: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { can, canAny } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ALL.filter((item) =>
    item.anyOf ? canAny(item.anyOf) : item.permission ? can(item.permission) : true,
  );

  const mobileNavItems = navItems.slice(0, 4);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            SA
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-slate-900 dark:text-slate-100">
              Smart Approval
            </h1>
            <span className="text-[10px] font-semibold text-slate-400">System</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            MAIN MENU
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    href={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer User Info */}
        {user && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initialsOf(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.isAdmin ? "Admin" : "User"} · {user.department?.name ?? "Operations"}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 md:px-6 shrink-0 sticky top-0 z-30 shadow-xs">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar on desktop */}
          <div className="hidden md:flex relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {can("my_requests:create") && (
              <button
                onClick={() => router.push("/create")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading page...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

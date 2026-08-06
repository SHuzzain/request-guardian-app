"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FileSpreadsheet,
  PlusCircle,
  Database,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { initialsOf } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: import("@/lib/permissions").PermissionKey;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { label: "Approval Inbox", href: "/inbox", icon: Inbox, permission: "approval_inbox:view" },
  { label: "My Requests", href: "/my-requests", icon: FileSpreadsheet, permission: "my_requests:view" },
  { label: "Create Request", href: "/create", icon: PlusCircle, permission: "my_requests:create" },
  { label: "Masters", href: "/masters", icon: Database, permission: "departments:view" },
  { label: "Audit Logs", href: "/audit-logs", icon: ShieldAlert, permission: "audit_log:view" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "settings:view" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, can } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800"
      >
        <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-black">
                SA
              </span>
              Smart Approval
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            if (item.permission && !can(item.permission)) return null;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="p-3 border-t border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
              {initialsOf(user.fullName)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Inbox, FilePlus2, LogOut, Search, Bell, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/inbox", label: "Approval Inbox", icon: Inbox },
  { to: "/create", label: "Create Request", icon: FilePlus2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.fullName || user?.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <h1 className="font-bold text-lg tracking-tight">Smart Approval System</h1>
        </div>
        <nav className="flex-1 px-3 py-5">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Main Menu</p>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-sidebar-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.isAdmin ? "Admin" : "User"} · {user?.department}
            </p>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-6 shrink-0">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search requests..." className="pl-9 bg-muted/50 border-transparent" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Button onClick={() => navigate({ to: "/create" })} className="gap-2">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

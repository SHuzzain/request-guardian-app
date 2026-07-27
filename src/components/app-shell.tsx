import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Inbox, FilePlus2, LogOut, Bell, Plus, Settings, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ALL = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, adminOnly: false },
  { to: "/inbox", label: "Inbox", icon: Inbox, adminOnly: true },
  { to: "/create", label: "Create", icon: FilePlus2, adminOnly: false },
  { to: "/settings", label: "Settings", icon: Settings, adminOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const NAV = NAV_ALL.filter((n) => !n.adminOnly || user?.isAdmin);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.fullName || user?.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClick}
              className={
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors " +
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
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <h1 className="font-bold text-lg tracking-tight">Smart Approval</h1>
        </div>
        <nav className="flex-1 px-3 py-5">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Menu</p>
          <NavList />
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
        {/* Header */}
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center gap-2 px-3 md:px-6 shrink-0 sticky top-0 z-30">
          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 -ml-2 text-foreground" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar">
              <div className="px-5 py-5 border-b border-sidebar-border">
                <h1 className="font-bold text-lg tracking-tight">Smart Approval</h1>
              </div>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.fullName || user?.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.isAdmin ? "Admin" : "User"} · {user?.department}</p>
                </div>
              </div>
              <nav className="p-3">
                <NavList onClick={() => setOpen(false)} />
                <button onClick={() => { setOpen(false); signOut(); }} className="mt-4 w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <h2 className="md:hidden font-semibold text-base truncate flex-1">Smart Approval</h2>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Button onClick={() => navigate({ to: "/create" })} size="sm" className="gap-1.5 hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 overflow-auto pb-24 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border flex">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium " +
                  (active ? "text-primary" : "text-muted-foreground")
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

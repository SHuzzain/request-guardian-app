import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { STATUS_STYLES, STATUS_LABEL, PRIORITY_STYLES, initialsOf, formatMoney } from "@/lib/request-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart Approval System" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("requests")
        .select("id, code, requester_id, request_type, department, amount, priority, status, created_at, profiles:requester_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      const counts = await supabase.from("requests").select("status");
      return { recent: reqs ?? [], all: counts.data ?? [] };
    },
  });

  const stats = {
    pending: data?.all.filter((r) => r.status === "pending").length ?? 0,
    approved: data?.all.filter((r) => r.status === "approved").length ?? 0,
    needs: data?.all.filter((r) => r.status === "needs_changes").length ?? 0,
    rejected: data?.all.filter((r) => r.status === "rejected").length ?? 0,
  };

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Approval" value={stats.pending} note="Awaiting review" icon={Clock} tone="warning" />
          <StatCard label="Approved" value={stats.approved} note="Total approved" icon={CheckCircle2} tone="success" />
          <StatCard label="Need Changes" value={stats.needs} note="Requires resubmission" icon={AlertCircle} tone="info" />
          <StatCard label="Rejected" value={stats.rejected} note="This month total" icon={XCircle} tone="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent Requests</h2>
              <Link to="/inbox" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {(data?.recent ?? []).map((r) => {
                const name = (r.profiles as { full_name?: string } | null)?.full_name ?? "Unknown";
                return (
                  <li key={r.id} className="py-3">
                    <Link to="/requests/$id" params={{ id: r.id }} className="flex items-center gap-3 hover:bg-muted/40 -mx-2 px-2 py-2 rounded-md transition-colors">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {initialsOf(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{name}</span>
                          <span className={"text-[10px] px-2 py-0.5 rounded-full font-medium capitalize " + (PRIORITY_STYLES[r.priority] ?? "")}>{r.priority}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{r.code} · {r.request_type} · {formatMoney(Number(r.amount))}</p>
                      </div>
                      <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + (STATUS_STYLES[r.status] ?? "")}>
                        · {STATUS_LABEL[r.status]}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {data?.recent.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">No requests yet</li>
              )}
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <ul className="space-y-2">
              <QuickAction to="/create" label="Create New Request" />
              <QuickAction to="/inbox" label={`View Pending (${stats.pending})`} />
              <QuickAction to="/inbox" label="Approval Inbox" />
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, note, icon: Icon, tone }: {
  label: string; value: number; note: string; icon: React.ComponentType<{ className?: string }>; tone: "warning" | "success" | "info" | "destructive";
}) {
  const toneClasses = {
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={"h-8 w-8 rounded-full flex items-center justify-center " + toneClasses}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{note}</p>
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted transition-colors group">
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </Link>
    </li>
  );
}

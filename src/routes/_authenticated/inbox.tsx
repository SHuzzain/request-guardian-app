import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { STATUS_STYLES, STATUS_LABEL, PRIORITY_STYLES, initialsOf, formatMoney } from "@/lib/request-utils";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({ meta: [{ title: "Approval Inbox — Smart Approval System" }] }),
  component: InboxPage,
});

function InboxPage() {
  const [search, setSearch] = useState("");
  const { data } = useQuery({
    queryKey: ["requests-inbox"],
    queryFn: async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, code, request_type, department, amount, priority, status, request_date, profiles:requester_id(full_name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const rows = (data ?? []).filter((r) => {
    if (!search) return true;
    const name = (r.profiles as { full_name?: string } | null)?.full_name ?? "";
    return `${r.code} ${name} ${r.request_type}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <Input placeholder="Search by name, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-muted/50 border-transparent" />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <Th>Request ID</Th>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Priority</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const name = (r.profiles as { full_name?: string } | null)?.full_name ?? "Unknown";
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      <Td><span className="text-xs bg-muted rounded px-2 py-1 font-mono">{r.code}</span></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">{initialsOf(name)}</div>
                          <span className="font-medium">{name}</span>
                        </div>
                      </Td>
                      <Td>{r.department}</Td>
                      <Td>{r.request_type}</Td>
                      <Td className="font-medium">{formatMoney(Number(r.amount))}</Td>
                      <Td className="text-muted-foreground">{r.request_date}</Td>
                      <Td><span className={"text-xs px-2 py-1 rounded-full font-medium " + (STATUS_STYLES[r.status] ?? "")}>· {STATUS_LABEL[r.status]}</span></Td>
                      <Td><span className={"text-xs px-2 py-1 rounded-full font-medium capitalize " + (PRIORITY_STYLES[r.priority] ?? "")}>{r.priority}</span></Td>
                      <Td className="text-right">
                        <Link to="/requests/$id" params={{ id: r.id }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium text-xs uppercase tracking-wider px-4 py-3 " + className}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-3 " + className}>{children}</td>;
}

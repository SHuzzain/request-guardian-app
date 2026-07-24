import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { STATUS_STYLES, STATUS_LABEL, initialsOf, formatMoney } from "@/lib/request-utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/requests/$id")({
  head: () => ({ meta: [{ title: "Request — Smart Approval System" }] }),
  component: RequestDetail,
});

type Action = "approved" | "rejected" | "needs_changes" | "comment" | null;

function RequestDetail() {
  const { id } = Route.useParams();
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const [{ data: req }, { data: comments }, { data: attachments }] = await Promise.all([
        supabase.from("requests").select("*, profiles:requester_id(full_name, department)").eq("id", id).single(),
        supabase.from("request_comments").select("*, profiles:author_id(full_name, department)").eq("request_id", id).order("created_at"),
        supabase.from("request_attachments").select("*").eq("request_id", id).order("created_at"),
      ]);
      return { req, comments: comments ?? [], attachments: attachments ?? [] };
    },
  });

  const req = data?.req;
  const requester = (req?.profiles as { full_name?: string; department?: string } | null) ?? {};

  async function submitAction() {
    if (!action || !user || !req) return;
    setSubmitting(true);
    try {
      if (comment.trim()) {
        await supabase.from("request_comments").insert({ request_id: req.id, author_id: user.id, body: comment.trim() });
      }
      if (action !== "comment") {
        const { error } = await supabase.from("requests").update({ status: action }).eq("id", req.id);
        if (error) throw error;
      }
      toast.success(action === "comment" ? "Comment added" : `Request ${action.replace("_", " ")}`);
      setAction(null); setComment("");
      qc.invalidateQueries({ queryKey: ["request", id] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadAttachment(path: string, name: string) {
    const { data } = await supabase.storage.from("attachments").createSignedUrl(path, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl; a.download = name; a.click();
    }
  }

  if (!req) {
    return <AppShell><div className="p-8 text-muted-foreground">Loading…</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{req.code} · View</h1>
          <Button variant="outline" onClick={() => navigate({ to: "/inbox" })}>Back</Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{req.request_type} Claim</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <InfoRow label="Employee Name" value={requester.full_name ?? "—"} />
              <InfoRow label="Employee ID" value={req.requester_id.slice(0, 8).toUpperCase()} />
              <InfoRow label="Department" value={req.department} />
              <InfoRow label="Request Date" value={req.request_date} />
              <InfoRow label="Claim Reference" value={req.claim_reference ?? "—"} />
              <InfoRow label="Claim Date" value={req.claim_date ?? "—"} />
              <InfoRow label="Amount" value={formatMoney(Number(req.amount))} />
              <InfoRow label="Payment Method" value={req.payment_method ?? "—"} />
            </div>

            {req.description && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Purpose / Description</p>
                <p className="text-sm">{req.description}</p>
              </div>
            )}

            {data && data.attachments.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Attachments</p>
                <ul className="space-y-2">
                  {data.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                      <div className="h-8 w-8 rounded bg-destructive/15 text-destructive flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.file_name}</p>
                        <p className="text-xs text-muted-foreground">{((a.size_bytes ?? 0) / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => downloadAttachment(a.storage_path, a.file_name)} className="text-muted-foreground hover:text-primary">
                        <Download className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {user?.isAdmin && req.status === "pending" && (
              <div className="bg-card rounded-xl border border-border p-4 flex gap-2">
                <Button variant="outline" className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setAction("rejected")}>Reject</Button>
                <Button variant="outline" className="flex-1 border-primary/40 text-primary hover:bg-primary/10" onClick={() => setAction("needs_changes")}>Review</Button>
                <Button className="flex-1" onClick={() => setAction("approved")}>Approve</Button>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">Request Summary</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {initialsOf(requester.full_name ?? "?")}
                </div>
                <div>
                  <p className="font-medium text-sm">{requester.full_name}</p>
                  <p className="text-xs text-muted-foreground">{requester.department}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Request ID" value={req.code} />
                <Row label="Type" value={req.request_type} />
                <Row label="Amount" value={formatMoney(Number(req.amount))} />
                <Row label="Date" value={req.request_date} />
                <Row label="Priority" value={<span className="capitalize">{req.priority}</span>} />
              </dl>
              <div className="mt-3">
                <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + (STATUS_STYLES[req.status] ?? "")}>· {STATUS_LABEL[req.status]}</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Comments</h3>
                <button onClick={() => setAction("comment")} className="text-xs text-primary hover:underline">Add</button>
              </div>
              <ul className="space-y-4">
                {data?.comments.map((c) => {
                  const author = (c.profiles as { full_name?: string; department?: string } | null) ?? {};
                  return (
                    <li key={c.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                        {initialsOf(author.full_name ?? "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-medium">{author.full_name}</span>
                          <span className="text-xs text-muted-foreground">· {author.department}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm mt-1">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
                {data?.comments.length === 0 && <li className="text-sm text-muted-foreground">No comments yet</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarks / Comments</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Comments" rows={6} value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submitAction} disabled={submitting || (action === "comment" && !comment.trim())}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

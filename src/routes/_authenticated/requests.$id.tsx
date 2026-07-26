import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FileText, Download, PenLine, ChevronLeft, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { STATUS_STYLES, STATUS_LABEL, initialsOf, formatMoney } from "@/lib/request-utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PdfSigner, type SignaturePlacement } from "@/components/pdf-signer";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";

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
  const [signerOpen, setSignerOpen] = useState(false);

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
  const isOwner = user?.id === req?.requester_id;

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

  const pdfAttachments = data!.attachments.filter((a) => (a.mime_type ?? "").includes("pdf"));

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto pb-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button onClick={() => navigate({ to: "/inbox" })} className="md:hidden inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-lg md:text-2xl font-bold truncate">{req.code}</h1>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/inbox" })} className="hidden md:inline-flex">Back</Button>
        </div>

        {/* Owner: resubmit notice */}
        {isOwner && req.status === "needs_changes" && (
          <div className="mb-4 bg-info/10 border border-info/30 rounded-xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-info">Changes requested</p>
              <p className="text-muted-foreground text-xs">Update the details or attachments below and resubmit for approval.</p>
            </div>
            <Button size="sm" onClick={() => navigate({ to: "/create", search: { edit: req.id } })}>
              <Pencil className="h-4 w-4 mr-1.5" /> Edit & Resubmit
            </Button>
          </div>
        )}

        {/* Approved with signed PDF */}
        {req.signed_pdf_path && (
          <div className="mb-4 bg-success/10 border border-success/30 rounded-xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-success">Signed document ready</p>
              <p className="text-muted-foreground text-xs">Approved with signature applied.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => downloadAttachment(req.signed_pdf_path!, `${req.code}-signed.pdf`)}>
              <Download className="h-4 w-4 mr-1.5" /> Download signed
            </Button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-4 md:gap-6">
          <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{req.request_type} Claim</span>
              </div>
              <span className={"text-xs px-2.5 py-1 rounded-full font-medium shrink-0 " + (STATUS_STYLES[req.status] ?? "")}>{STATUS_LABEL[req.status]}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 text-sm">
              <InfoRow label="Employee" value={requester.full_name ?? "—"} />
              <InfoRow label="Employee ID" value={req.requester_id.slice(0, 8).toUpperCase()} />
              <InfoRow label="Department" value={req.department} />
              <InfoRow label="Request Date" value={req.request_date} />
              <InfoRow label="Claim Ref" value={req.claim_reference ?? "—"} />
              <InfoRow label="Claim Date" value={req.claim_date ?? "—"} />
              <InfoRow label="Amount" value={formatMoney(Number(req.amount))} />
              <InfoRow label="Payment" value={req.payment_method ?? "—"} />
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
                      <div className="h-8 w-8 rounded bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.file_name}</p>
                        <p className="text-xs text-muted-foreground">{((a.size_bytes ?? 0) / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => downloadAttachment(a.storage_path, a.file_name)} className="text-muted-foreground hover:text-primary p-1">
                        <Download className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {user?.isAdmin && (req.status === "pending" || req.status === "needs_changes") && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm">Admin actions</h3>
                {pdfAttachments.length > 0 && (
                  <Button className="w-full gap-2" onClick={() => setSignerOpen(true)}>
                    <PenLine className="h-4 w-4" />
                    {req.signed_pdf_path ? "Re-place signature" : "Place signature & approve"}
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-info/40 text-info hover:bg-info/10" onClick={() => setAction("needs_changes")}>Review</Button>
                  <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setAction("rejected")}>Reject</Button>
                </div>
                {pdfAttachments.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Attach a PDF to enable signature approval.</p>
                )}
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-4 md:p-5">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {initialsOf(requester.full_name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{requester.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{requester.department}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Request ID" value={req.code} />
                <Row label="Type" value={req.request_type} />
                <Row label="Amount" value={formatMoney(Number(req.amount))} />
                <Row label="Priority" value={<span className="capitalize">{req.priority}</span>} />
              </dl>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 md:p-5">
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

      {/* Remarks / status action modal */}
      <Dialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "comment" ? "Add comment" : action === "rejected" ? "Reject request" : action === "needs_changes" ? "Request changes" : "Remarks"}
            </DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Comments" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submitAction} disabled={submitting || (action === "comment" && !comment.trim())}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature placement modal */}
      {signerOpen && pdfAttachments.length > 0 && (
        <SignerDialog
          open={signerOpen}
          onOpenChange={setSignerOpen}
          request={req}
          attachments={pdfAttachments}
          onDone={() => {
            setSignerOpen(false);
            qc.invalidateQueries({ queryKey: ["request", id] });
          }}
        />
      )}
    </AppShell>
  );
}

function SignerDialog({
  open, onOpenChange, request, attachments, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  request: { id: string; requester_id: string; signature_meta: unknown; signed_pdf_path: string | null };
  attachments: { id: string; storage_path: string; file_name: string }[];
  onDone: () => void;
}) {
  const { data: user } = useCurrentUser();
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [selectedAtt, setSelectedAtt] = useState(attachments[0]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [sigMode, setSigMode] = useState<"saved" | "draw">("saved");
  const padRef = useRef<SignaturePadHandle | null>(null);
  const signerApi = useRef<{ signAndGetBytes: () => Promise<Uint8Array>; placement: () => SignaturePlacement } | null>(null);
  const [placement, setPlacement] = useState<SignaturePlacement | undefined>(
    (request.signature_meta as SignaturePlacement | null) ?? undefined
  );
  const [busy, setBusy] = useState(false);

  // Load PDF bytes
  useEffect(() => {
    setPdfBytes(null);
    (async () => {
      const { data } = await supabase.storage.from("attachments").createSignedUrl(selectedAtt.storage_path, 300);
      if (!data?.signedUrl) return;
      const bytes = await (await fetch(data.signedUrl)).arrayBuffer();
      setPdfBytes(bytes);
    })();
  }, [selectedAtt]);

  // Load saved signature
  useEffect(() => {
    (async () => {
      if (!user?.signatureUrl) { setSignatureUrl(null); setSigMode("draw"); return; }
      const { data } = await supabase.storage.from("attachments").createSignedUrl(user.signatureUrl, 300);
      if (data?.signedUrl) {
        // convert to dataURL so pdf-lib can embed even if URL expires
        const blob = await (await fetch(data.signedUrl)).blob();
        const dr = new FileReader();
        dr.onload = () => setSignatureUrl(dr.result as string);
        dr.readAsDataURL(blob);
      }
    })();
  }, [user?.signatureUrl]);

  const [drawnUrl, setDrawnUrl] = useState<string | null>(null);
  const activeSig = sigMode === "draw" ? drawnUrl : signatureUrl;

  async function applyDrawn() {
    const b = await padRef.current?.toPngBlob();
    if (!b) return toast.error("Draw your signature first");
    const dr = new FileReader();
    dr.onload = () => setDrawnUrl(dr.result as string);
    dr.readAsDataURL(b);
  }

  async function approve() {
    if (!signerApi.current) return;
    if (!activeSig) return toast.error("Choose or draw a signature");
    setBusy(true);
    try {
      const bytes = await signerApi.current.signAndGetBytes();
      const outPath = `${request.requester_id}/${request.id}/signed-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(outPath, new Blob([bytes as BlobPart], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw upErr;
      const meta = signerApi.current.placement();
      const { error } = await supabase.from("requests").update({
        status: "approved",
        signed_pdf_path: outPath,
        signature_meta: meta as unknown as never,
      }).eq("id", request.id);
      if (error) throw error;
      toast.success("Request approved with signature");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place signature & approve</DialogTitle>
        </DialogHeader>

        {attachments.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAtt(a)}
                className={"text-xs px-3 py-1.5 rounded-full border " + (selectedAtt.id === a.id ? "bg-primary text-primary-foreground border-primary" : "border-border")}
              >
                {a.file_name}
              </button>
            ))}
          </div>
        )}

        <Tabs value={sigMode} onValueChange={(v) => setSigMode(v as "saved" | "draw")}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="saved" disabled={!signatureUrl}>Saved signature</TabsTrigger>
            <TabsTrigger value="draw">Draw new</TabsTrigger>
          </TabsList>
          <TabsContent value="saved">
            {signatureUrl ? (
              <div className="border border-border rounded-lg bg-white p-3 flex items-center justify-center h-24">
                <img src={signatureUrl} alt="Signature" className="max-h-full object-contain" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No saved signature. Go to Settings to save one.</p>
            )}
          </TabsContent>
          <TabsContent value="draw" className="space-y-2">
            <SignaturePad onReady={(h) => (padRef.current = h)} height={140} />
            <Button type="button" variant="outline" size="sm" onClick={applyDrawn}>Use this signature</Button>
            {drawnUrl && (
              <div className="border border-border rounded-lg bg-white p-2 flex items-center justify-center h-16">
                <img src={drawnUrl} alt="Drawn" className="max-h-full object-contain" />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {pdfBytes ? (
          <PdfSigner
            pdfBytes={pdfBytes}
            signatureDataUrl={activeSig}
            initialPlacement={placement}
            onPlacementChange={setPlacement}
            onReady={(api) => (signerApi.current = api)}
          />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading PDF…</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={approve} disabled={busy || !activeSig || !pdfBytes}>
            {busy ? "Signing…" : "Sign & Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium text-sm truncate">{value}</p>
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

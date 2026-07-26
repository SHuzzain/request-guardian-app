import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadCloud, FileText, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({ meta: [{ title: "Create Request — Smart Approval System" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
  component: CreatePage,
});

const TYPES = ["Travel Expense", "Equipment", "Training", "Office Supplies", "Maintenance", "Medical Reimbursement"];
const DEPTS = ["Engineering", "Operations", "Finance", "HR", "Marketing", "Legal"];
const PRIOS = ["low", "medium", "high", "urgent"] as const;

function CreatePage() {
  const navigate = useNavigate();
  const { edit: editId } = useSearch({ from: "/_authenticated/create" });
  const { data: user } = useCurrentUser();
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<{ id: string; file_name: string; storage_path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editId;

  const [form, setForm] = useState({
    request_type: TYPES[0],
    department: "",
    priority: "medium" as (typeof PRIOS)[number],
    request_date: new Date().toISOString().slice(0, 10),
    claim_reference: "",
    claim_date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    payment_method: "",
  });

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const [{ data: r }, { data: att }] = await Promise.all([
        supabase.from("requests").select("*").eq("id", editId).single(),
        supabase.from("request_attachments").select("id, file_name, storage_path").eq("request_id", editId),
      ]);
      if (r) {
        setForm({
          request_type: r.request_type,
          department: r.department,
          priority: r.priority,
          request_date: r.request_date,
          claim_reference: r.claim_reference ?? "",
          claim_date: r.claim_date ?? "",
          description: r.description ?? "",
          amount: String(r.amount ?? ""),
          payment_method: r.payment_method ?? "",
        });
      }
      setExistingAttachments(att ?? []);
    })();
  }, [editId]);

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));

  function pickFiles(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list);
    const nonPdf = chosen.filter((f) => f.type !== "application/pdf");
    if (nonPdf.length) toast.error("Only PDF files are accepted — please convert first.");
    setFiles((prev) => [...prev, ...chosen.filter((f) => f.type === "application/pdf")]);
  }

  async function removeExisting(a: { id: string; storage_path: string }) {
    await supabase.storage.from("attachments").remove([a.storage_path]);
    await supabase.from("request_attachments").delete().eq("id", a.id);
    setExistingAttachments((xs) => xs.filter((x) => x.id !== a.id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        request_type: form.request_type,
        department: form.department || user.department,
        priority: form.priority,
        request_date: form.request_date,
        claim_reference: form.claim_reference || null,
        claim_date: form.claim_date || null,
        description: form.description || null,
        amount: Number(form.amount || 0),
        payment_method: form.payment_method || null,
      };

      let requestId = editId;
      if (isEdit && editId) {
        const { error } = await supabase.from("requests").update({ ...payload, status: "pending" }).eq("id", editId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("requests").insert({
          ...payload,
          requester_id: user.id,
        }).select("id").single();
        if (error) throw error;
        requestId = inserted.id;
      }

      for (const file of files) {
        const path = `${user.id}/${requestId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
        if (upErr) throw upErr;
        await supabase.from("request_attachments").insert({
          request_id: requestId!,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        });
      }
      toast.success(isEdit ? "Resubmitted for approval" : "Request submitted");
      navigate({ to: "/requests/$id", params: { id: requestId! } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{isEdit ? "Edit & Resubmit" : "Create Request"}</h1>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>Back</Button>
        </div>

        <form onSubmit={onSubmit} className="bg-card rounded-xl border border-border p-4 md:p-8 space-y-6 md:space-y-8">
          <Section title="General Details">
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <Field label="Request Type">
                <SelectBox value={form.request_type} onChange={(v) => setF("request_type", v)} options={TYPES} />
              </Field>
              <Field label="Department">
                <SelectBox value={form.department || user?.department || ""} onChange={(v) => setF("department", v)} options={DEPTS} />
              </Field>
              <Field label="Employee Name">
                <Input value={user?.fullName ?? ""} disabled />
              </Field>
              <Field label="Employee ID">
                <Input value={user?.id.slice(0, 8).toUpperCase() ?? ""} disabled />
              </Field>
              <Field label="Request Date">
                <Input type="date" value={form.request_date} onChange={(e) => setF("request_date", e.target.value)} />
              </Field>
              <Field label="Priority">
                <SelectBox value={form.priority} onChange={(v) => setF("priority", v as (typeof PRIOS)[number])} options={[...PRIOS]} />
              </Field>
            </div>
          </Section>

          <Section title="Claim Details">
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <Field label="Claim Reference No.">
                <Input value={form.claim_reference} onChange={(e) => setF("claim_reference", e.target.value)} placeholder="CLM-…" />
              </Field>
              <Field label="Claim Date">
                <Input type="date" value={form.claim_date} onChange={(e) => setF("claim_date", e.target.value)} />
              </Field>
            </div>
            <Field label="Purpose / Description">
              <Textarea rows={4} value={form.description} onChange={(e) => setF("description", e.target.value)} />
            </Field>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <Field label="Amount">
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setF("amount", e.target.value)} required />
              </Field>
              <Field label="Payment Method">
                <Input value={form.payment_method} onChange={(e) => setF("payment_method", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Attachments (PDF only)">
            <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
              <p className="text-xs text-muted-foreground">Only PDF is accepted so admin can add signature.</p>
              <a
                href="https://www.ilovepdf.com/word_to_pdf"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Convert to PDF <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {existingAttachments.length > 0 && (
              <ul className="space-y-2">
                {existingAttachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="h-8 w-8 rounded bg-destructive/15 text-destructive flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.file_name}</p>
                      <p className="text-xs text-muted-foreground">Uploaded earlier</p>
                    </div>
                    <button type="button" onClick={() => removeExisting(a)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="block border-2 border-dashed border-border rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm">Tap to select PDF files</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only · Max 20 MB per file</p>
              <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => pickFiles(e.target.files)} />
            </label>

            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="h-8 w-8 rounded bg-destructive/15 text-destructive flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">Ready to upload · {(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : isEdit ? "Resubmit for approval" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-bold text-primary border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 md:h-10 rounded-md border border-input bg-background px-3 text-sm capitalize">
      {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
    </select>
  );
}

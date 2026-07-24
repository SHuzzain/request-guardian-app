import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
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
  component: CreatePage,
});

const TYPES = ["Travel Expense", "Equipment", "Training", "Office Supplies", "Maintenance", "Medical Reimbursement"];
const DEPTS = ["Engineering", "Operations", "Finance", "HR", "Marketing", "Legal"];
const PRIOS = ["low", "medium", "high", "urgent"] as const;

function CreatePage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
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

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data: inserted, error } = await supabase.from("requests").insert({
        requester_id: user.id,
        request_type: form.request_type,
        department: form.department || user.department,
        priority: form.priority,
        request_date: form.request_date,
        claim_reference: form.claim_reference || null,
        claim_date: form.claim_date || null,
        description: form.description || null,
        amount: Number(form.amount || 0),
        payment_method: form.payment_method || null,
      }).select("id").single();
      if (error) throw error;

      for (const file of files) {
        const path = `${user.id}/${inserted.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
        if (upErr) throw upErr;
        await supabase.from("request_attachments").insert({
          request_id: inserted.id,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        });
      }
      toast.success("Request submitted");
      navigate({ to: "/requests/$id", params: { id: inserted.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Request</h1>
          <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Back</Button>
        </div>

        <form onSubmit={onSubmit} className="bg-card rounded-xl border border-border p-8 space-y-8">
          <Section title="General Details">
            <div className="grid md:grid-cols-2 gap-5">
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
            <div className="grid md:grid-cols-2 gap-5">
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
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Amount">
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setF("amount", e.target.value)} required />
              </Field>
              <Field label="Payment Method">
                <Input value={form.payment_method} onChange={(e) => setF("payment_method", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Attachments">
            <p className="text-sm text-muted-foreground -mt-2">Upload receipts, invoices and supporting documents</p>
            <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm">Drop files here or <span className="text-primary font-medium">browse</span></p>
              <p className="text-xs text-muted-foreground mt-1">PDF · Word · Excel · Images · Max 20 MB per file</p>
              <input type="file" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit"}</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-bold text-[oklch(0.55_0.12_65)] border-b border-border pb-2">{title}</h2>
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm capitalize">
      {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
    </select>
  );
}

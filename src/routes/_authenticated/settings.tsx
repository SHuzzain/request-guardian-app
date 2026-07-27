import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Smart Approval System" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const padRef = useRef<SignaturePadHandle | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!user?.signatureUrl) return setPreview(null);
      const { data } = await supabase.storage.from("attachments").createSignedUrl(user.signatureUrl, 600);
      setPreview(data?.signedUrl ?? null);
    })();
  }, [user?.signatureUrl]);

  async function saveBlob(blob: Blob) {
    if (!user) return;
    setSaving(true);
    try {
      const path = `${user.id}/signature/sig-${Date.now()}.png`;
      const { error } = await supabase.storage.from("attachments").upload(path, blob, { contentType: "image/png", upsert: true });
      if (error) throw error;
      const { error: pErr } = await supabase.from("profiles").update({ signature_url: path }).eq("id", user.id);
      if (pErr) throw pErr;
      toast.success("Signature saved");
      qc.invalidateQueries({ queryKey: ["current-user"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(f: File) {
    if (!f.type.startsWith("image/")) return toast.error("Please upload a PNG or JPG");
    await saveBlob(f);
  }

  async function onSaveDrawn() {
    const b = await padRef.current?.toPngBlob();
    if (!b) return toast.error("Draw your signature first");
    await saveBlob(b);
  }

  async function onClear() {
    if (!user?.signatureUrl) return;
    setSaving(true);
    try {
      await supabase.storage.from("attachments").remove([user.signatureUrl]);
      await supabase.from("profiles").update({ signature_url: null }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["current-user"] });
      setPreview(null);
      toast.success("Signature removed");
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your digital signature used for approvals.</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Digital Signature</h2>
            {preview && (
              <span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success border border-success/30">Active</span>
            )}
          </div>

          {preview ? (
            <div className="border border-border rounded-lg p-4 bg-white flex items-center justify-center min-h-[140px]">
              <img src={preview} alt="Your signature" className="max-h-32 object-contain" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4 text-center">
              No signature saved yet. Draw or upload one below.
            </p>
          )}

          <div className="flex gap-2">
            {preview && (
              <Button variant="outline" onClick={onClear} disabled={saving} className="text-destructive border-destructive/40 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1.5" /> Remove
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h2 className="font-semibold">{preview ? "Update signature" : "Add signature"}</h2>
          <Tabs defaultValue="draw">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="draw"><PenLine className="h-4 w-4 mr-1.5" /> Draw</TabsTrigger>
              <TabsTrigger value="upload"><UploadCloud className="h-4 w-4 mr-1.5" /> Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="draw" className="space-y-3">
              <SignaturePad onReady={(h) => (padRef.current = h)} />
              <Button onClick={onSaveDrawn} disabled={saving} className="w-full">
                {saving ? "Saving…" : "Save signature"}
              </Button>
            </TabsContent>
            <TabsContent value="upload" className="space-y-3">
              <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5">
                <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm">Tap to select a PNG / JPG signature</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
                />
              </label>
              <p className="text-xs text-muted-foreground">Transparent PNG works best.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

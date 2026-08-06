"use client";

import React, { useState, useRef } from "react";
import { saveSignedPdf } from "@/feature/requests/actions/requests.actions";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { Loader2, CheckCircle2, PenTool } from "lucide-react";
import { toast } from "sonner";

interface SignerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  pdfUrl?: string | null;
  onSuccess?: () => void;
}

export function SignerDialog({
  isOpen,
  onClose,
  requestId,
  onSuccess,
}: SignerDialogProps) {
  const [loading, setLoading] = useState(false);
  const padHandle = useRef<SignaturePadHandle | null>(null);

  if (!isOpen) return null;

  const handleSaveSignature = async () => {
    if (!padHandle.current || padHandle.current.isEmpty()) {
      toast.error("Please draw a signature before saving");
      return;
    }

    const dataUrl = padHandle.current.toPngDataUrl();
    if (!dataUrl) return;

    setLoading(true);
    try {
      await saveSignedPdf({
        requestId,
        pdfBase64: dataUrl,
        signatureMeta: {
          signedAt: new Date().toISOString(),
          type: "DRAWN",
        },
      });
      toast.success("Signature saved and document updated!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sign Document</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Draw your signature below to approve this request</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <SignaturePad onReady={(h) => (padHandle.current = h)} height={180} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}

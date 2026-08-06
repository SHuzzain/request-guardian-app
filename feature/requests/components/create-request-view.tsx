"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMasterOptions,
  createNewRequest,
  updateExistingRequest,
  deleteAttachmentAction,
} from "@/feature/requests/actions/create-request.actions";
import { getRequestDetail, getRequestAttachments } from "@/feature/requests/queries/requests.queries";
import { uploadAttachment } from "@/feature/requests/actions/requests.actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, FileText, X, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function CreateRequestView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = !!editId;

  const { data: user } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ["master-options"],
    queryFn: () => getMasterOptions(),
  });

  const { data: editReq } = useQuery({
    queryKey: ["edit-request", editId],
    queryFn: () => (editId ? getRequestDetail(editId) : null),
    enabled: !!editId,
  });

  const { data: existingAtts, refetch: refetchAtts } = useQuery({
    queryKey: ["request-attachments", editId],
    queryFn: () => (editId ? getRequestAttachments(editId) : []),
    enabled: !!editId,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    departmentId: "",
    requestTypeId: "",
    amount: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    description: "",
    claimReference: "",
    paymentMethod: "",
    requestDate: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      requestDate: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    if (editReq) {
      setFormData({
        departmentId: editReq.department?.id || "",
        requestTypeId: editReq.requestType?.id || "",
        amount: String(editReq.amount ?? ""),
        priority: (editReq.priority?.toUpperCase() as any) || "MEDIUM",
        description: editReq.description || "",
        claimReference: editReq.claimReference || "",
        paymentMethod: editReq.paymentMethod || "",
        requestDate: editReq.requestDate
          ? new Date(editReq.requestDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      });
    }
  }, [editReq]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const nonPdf = selected.filter((f) => f.type !== "application/pdf");
    if (nonPdf.length > 0) {
      toast.error("Only PDF files are accepted. Please convert non-PDF files first.");
    }
    const pdfs = selected.filter((f) => f.type === "application/pdf");
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const removeSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachmentAction(attachmentId);
      toast.success("Attachment removed");
      refetchAtts();
    } catch (err) {
      toast.error("Failed to remove attachment");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.requestTypeId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      let targetId = editId;

      if (isEdit && editId) {
        await updateExistingRequest({
          id: editId,
          departmentId: formData.departmentId,
          requestTypeId: formData.requestTypeId,
          amount: Number(formData.amount),
          priority: formData.priority,
          description: formData.description,
          claimReference: formData.claimReference,
          paymentMethod: formData.paymentMethod,
        });
        toast.success("Request updated and resubmitted!");
      } else {
        const res = await createNewRequest({
          departmentId: formData.departmentId,
          requestTypeId: formData.requestTypeId,
          amount: Number(formData.amount),
          priority: formData.priority,
          description: formData.description,
          claimReference: formData.claimReference,
          paymentMethod: formData.paymentMethod,
        });
        targetId = res.id;
        toast.success("Request created successfully!");
      }

      // Upload selected PDF files
      if (targetId && files.length > 0) {
        for (const file of files) {
          const base64 = await fileToBase64(file);
          await uploadAttachment({
            requestId: targetId,
            fileName: file.name,
            fileBase64: base64,
            mimeType: "application/pdf",
          });
        }
      }

      router.push(`/requests/${targetId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {isEdit ? `Edit & Resubmit Request (${editReq?.code ?? ""})` : "Create Request"}
        </h1>
        <Link
          href={isEdit ? `/requests/${editId}` : "/my-requests"}
          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-8">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
            GENERAL DETAILS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Request Type *
              </label>
              <select
                value={formData.requestTypeId}
                onChange={(e) => setFormData({ ...formData, requestTypeId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select Request Type...</option>
                {options?.requestTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select Department...</option>
                {options?.departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee Name
              </label>
              <input
                type="text"
                disabled
                value={user?.fullName || "Employee"}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                disabled
                value={`EMP-${user?.id?.slice(0, 6) ?? "001"}`}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Request Date
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Claim Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
            CLAIM DETAILS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Claim Reference No.
              </label>
              <input
                type="text"
                value={formData.claimReference}
                onChange={(e) => setFormData({ ...formData, claimReference: e.target.value })}
                placeholder="CLM-..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Claim Date
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Explain why this request is needed..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <input
                type="text"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                placeholder="Bank Transfer / Cash"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Attachments (PDF ONLY) */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                ATTACHMENTS (PDF ONLY)
              </span>
              <span className="text-[10px] text-slate-400">Only PDF is accepted so admin can add signature.</span>
            </div>
            <a
              href="https://www.ilovepdf.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Convert to PDF <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Existing Attachments in Edit Mode */}
          {existingAtts && existingAtts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Existing Attachments</span>
              <div className="space-y-1.5">
                {existingAtts.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{att.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New File Picker */}
          <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2 hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 block">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop your PDF file here, or click to browse
            </p>
            <p className="text-[10px] text-slate-400">Supports PDF up to 10MB</p>
          </label>

          {/* Selected New Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Files to upload ({files.length})</span>
              <div className="space-y-1.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Update & Resubmit Request" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

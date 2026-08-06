"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRequestDetail,
  getRequestComments,
  getRequestAttachments,
} from "@/feature/requests/queries/requests.queries";
import { addComment, submitRequest } from "@/feature/requests/actions/requests.actions";
import { StatusBadge, PriorityBadge } from "./status-badge";
import { ActionModal } from "./action-modal";
import { SignerDialog } from "./signer-dialog";
import { formatMoney, formatDate, formatDateTime, initialsOf } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePermissions } from "@/hooks/use-permissions";
import type { RequestStatus } from "@/feature/requests/types";
import { normalizeStatus, isEditableByRequester } from "@/feature/requests/types";
import {
  Loader2,
  Send,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ArrowLeft,
  Pencil,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RequestDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { can } = usePermissions();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [signerOpen, setSignerOpen] = useState(false);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [modalStatus, setModalStatus] = useState<{ open: boolean; status: RequestStatus; title: string }>({
    open: false,
    status: "APPROVED",
    title: "",
  });

  const { data: req, isLoading: reqLoading, refetch } = useQuery({
    queryKey: ["request-detail", id],
    queryFn: () => getRequestDetail(id),
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["request-comments", id],
    queryFn: () => getRequestComments(id),
  });

  const { data: attachments } = useQuery({
    queryKey: ["request-attachments", id],
    queryFn: () => getRequestAttachments(id),
  });

  if (reqLoading || !req) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const normalized = normalizeStatus(req.status);
  const isOwner = user?.id === req.requester?.id;
  const canApprove = can("approval_inbox:approve");
  const isEditable = isOwner && isEditableByRequester(normalized);

  const pdfAttachments = (attachments ?? []).filter((a) => a.fileName.toLowerCase().endsWith(".pdf"));

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addComment(id, commentText);
      setCommentText("");
      toast.success("Comment added");
      refetchComments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {req.code}
        </h1>
        <button
          onClick={() => router.back()}
          className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
      </div>

      {/* Owner Resubmit Banner */}
      {isOwner && ["CHANGES_REQUESTED", "REJECTED"].includes(normalized) && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-xs text-blue-700 dark:text-blue-300">
              {normalized === "REJECTED" ? "Request rejected" : "Changes requested"}
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
              Update the details or attachments and resubmit the same request for approval.
            </p>
          </div>
          <button
            onClick={() => router.push(`/create?edit=${req.id}`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit & Resubmit
          </button>
        </div>
      )}

      {/* Signed PDF Banner */}
      {req.signedPdfPath && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-xs text-emerald-700 dark:text-emerald-300">Signed document ready</p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              Approved with digital signature applied.
            </p>
          </div>
          <a
            href={`/api/image?key=${encodeURIComponent(req.signedPdfPath)}`}
            download={`${req.code}-signed.pdf`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Download Signed PDF
          </a>
        </div>
      )}

      {/* Main Grid: Left PDF Preview + Details (2/3) | Right Actions + Summary + Comments (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Document Preview + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* PDF Viewer Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs min-h-[500px] flex flex-col">
            {pdfAttachments.length > 1 && (
              <div className="flex gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto mb-3">
                {pdfAttachments.map((pdf, idx) => (
                  <button
                    key={pdf.id}
                    onClick={() => setActivePdfIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activePdfIndex === idx
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pdf.fileName}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                {pdfAttachments[activePdfIndex]?.fileName ?? `${req.code}-document.pdf`}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PDF Attachment Preview</p>
            </div>
          </div>

          {/* Claim Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {req.requestType?.name || "Travel Expense"} Claim Details
                </h3>
              </div>
              <StatusBadge status={req.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs pt-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Employee</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{req.requester?.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Employee ID</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">EMP-{req.requester?.id?.slice(0, 6)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{req.department?.name || "Operations"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Request Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(req.createdAt)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Claim Ref</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{req.claimReference || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatMoney(Number(req.amount))}</span>
              </div>
            </div>

            {req.description && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{req.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions (Top) + Request Summary + Comments */}
        <div className="space-y-6">
          {/* Actions Card */}
          {canApprove && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Actions</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setModalStatus({ open: true, status: "REJECTED", title: "Reject Request" })}
                  className="py-2 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors text-center"
                >
                  Reject
                </button>
                <button
                  onClick={() => setModalStatus({ open: true, status: "CHANGES_REQUESTED", title: "Request Changes" })}
                  className="py-2 px-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-colors text-center"
                >
                  Review
                </button>
                <button
                  onClick={() => setSignerOpen(true)}
                  className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors text-center"
                >
                  Approve
                </button>
              </div>
            </div>
          )}

          {/* Request Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Request Summary</span>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                {initialsOf(req.requester?.fullName)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{req.requester?.fullName}</p>
                <p className="text-[10px] text-slate-400">Employee</p>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Request ID</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{req.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Type</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{req.requestType?.name || "Travel Expense"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatMoney(Number(req.amount))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Priority</span>
                <PriorityBadge priority={req.priority} />
              </div>
            </div>
          </div>

          {/* Comments Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Comments</span>
              <button
                onClick={() => setCommentText("")}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Add Comment
              </button>
            </div>

            {comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.author?.fullName}</span>
                      <span className="text-slate-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No comments yet</div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Action modal */}
      <ActionModal
        isOpen={modalStatus.open}
        onClose={() => setModalStatus({ ...modalStatus, open: false })}
        requestId={id}
        targetStatus={modalStatus.status}
        title={modalStatus.title}
      />

      {/* Signer dialog */}
      <SignerDialog
        isOpen={signerOpen}
        onClose={() => setSignerOpen(false)}
        requestId={id}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { updateRequestStatus } from "@/feature/requests/actions/requests.actions";
import type { RequestStatus } from "@/feature/requests/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  targetStatus: RequestStatus;
  title: string;
}

export function ActionModal({
  isOpen,
  onClose,
  requestId,
  targetStatus,
  title,
}: ActionModalProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isRejectOrChanges = targetStatus === "REJECTED" || targetStatus === "CHANGES_REQUESTED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRejectOrChanges && !comment.trim()) {
      toast.error("Comment is required for this action");
      return;
    }

    setLoading(true);
    try {
      await updateRequestStatus(requestId, targetStatus, comment);
      toast.success(`Request ${targetStatus.toLowerCase().replace("_", " ")} successfully!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Please provide a comment for this status change.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isRejectOrChanges ? "Reason is required..." : "Optional comment..."}
              rows={4}
              className="w-full p-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
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
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

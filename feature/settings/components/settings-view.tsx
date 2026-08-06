"use client";

import React, { useState, useRef } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateProfile, saveUserSignature } from "@/feature/settings/actions/settings.actions";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { Loader2, User, Lock, PenTool, CheckCircle, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

export function SettingsView() {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const padHandle = useRef<SignaturePadHandle | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName || user?.fullName || "",
        avatarUrl,
      });
      toast.success("Profile updated successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!padHandle.current || padHandle.current.isEmpty()) {
      toast.error("Please draw a signature before saving");
      return;
    }

    const dataUrl = padHandle.current.toPngDataUrl();
    if (!dataUrl) return;

    setSavingSignature(true);
    try {
      await saveUserSignature(dataUrl);
      toast.success("Active signature updated successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save signature");
    } finally {
      setSavingSignature(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">User Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, active digital signature, and security.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
          {user?.fullName?.[0] ?? "U"}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{user?.fullName}</h3>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {user?.isAdmin ? "Admin Role" : "Standard User"}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Department: {user?.department?.name ?? "Operations"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Profile Form Left | Signature Panel Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Personal Info Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName || user?.fullName || ""}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Read-only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </form>

        {/* Right Column: Digital Signature Management */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Digital Signature</h3>
            </div>
            {user?.signatureUrl && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Active</span>
            )}
          </div>

          {/* Current Active Signature Preview */}
          {user?.signatureUrl ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Signature</span>
              <img src={user.signatureUrl} alt="Active Signature" className="h-16 object-contain mx-auto" />
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active signature saved. Draw a signature below.</p>
          )}

          {/* Signature Canvas Pad */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Draw New Signature</span>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <SignaturePad onReady={(h) => (padHandle.current = h)} height={150} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSignature}
            disabled={savingSignature}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {savingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}

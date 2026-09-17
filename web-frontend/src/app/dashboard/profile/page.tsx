"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { authApi, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/types";
import { initialField } from "@/lib/utils";
import { Alert, Field, GhostButton, Input, PrimaryButton, Spinner } from "@/components/ui";

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [businessName, setBusinessName] = useState(user?.businessName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  if (!token || !user) return <Spinner label="Loading…" />;

  const activeToken = token;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await authApi.updateProfile(activeToken, {
        fullName: fullName.trim(),
        businessName: businessName.trim() || undefined,
        phone: phone.trim(),
      });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file || !activeToken) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      await authApi.uploadAvatar(activeToken, file);
      await refreshUser();
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div>
      <Link href="/dashboard" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
        ← Back to dashboard
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your contact details and avatar.</p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Avatar</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-2xl font-bold text-amber-700">
            {user.avatarUrl ? (
              <img src={imageUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              initialField(user.fullName)
            )}
          </div>
          <div>
            <GhostButton
              disabled={avatarUploading}
              onClick={() => avatarRef.current?.click()}
            >
              {avatarUploading ? "Uploading…" : user.avatarUrl ? "Change photo" : "Upload photo"}
            </GhostButton>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadAvatar(e.target.files?.[0])}
            />
            <p className="mt-1 text-xs text-slate-500">JPG/PNG/WebP up to 5 MB.</p>
          </div>
        </div>
        {avatarError ? (
          <div className="mt-3">
            <Alert kind="error">{avatarError}</Alert>
          </div>
        ) : null}
      </div>

      <form onSubmit={saveProfile} className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Business name" hint={user.accountType === "LOCAL" ? "Optional" : "Optional"}>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </Field>
        </div>
        {saved ? (
          <div className="mt-3">
            <Alert kind="success">Profile updated.</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mt-3">
            <Alert kind="error">{error}</Alert>
          </div>
        ) : null}
        <PrimaryButton className="mt-4" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </form>
    </div>
  );
}
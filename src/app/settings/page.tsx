"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { updateUser } from "@/lib/firestore/users";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  LogOut,
  Sparkles,
  UserRound,
  AtSign,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import ThemePicker from "@/components/molecules/theme-picker/ThemePicker";
import Link from "next/link";

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUid(u.uid);

      const snap = await getDoc(doc(db, "users", u.uid));

      if (snap.exists()) {
        const data = snap.data();

        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
      }
    });

    return () => unsub();
  }, [router]);

  async function save() {
    if (!uid || saving) return;

    try {
      setSaving(true);

      const data: {
        username?: string;
        bio?: string;
      } = {};

      const cleanUsername = username.trim().toLowerCase();

      if (cleanUsername) {
        data.username = cleanUsername;
      }

      data.bio = bio.trim();

      await updateUser(uid, data);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  const initial = username.trim()
    ? username.trim()[0].toUpperCase()
    : "?";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07060d] px-4 py-4 text-white sm:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#5b3df0]/20 blur-[130px]" />

        <div className="absolute -bottom-48 -right-32 h-[480px] w-[480px] rounded-full bg-[#2b1f78]/20 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.035] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-white/[0.035] to-transparent" />
      </div>

      {/* Main */}
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[470px] flex-col justify-center">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="group mb-3 flex w-fit cursor-pointer items-center gap-2 text-[11px] text-white/30 transition-colors hover:text-white/75"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] transition-all group-hover:border-white/[0.14] group-hover:bg-white/[0.05]">
            <ArrowLeft size={13} />
          </span>

          <span>Back</span>
        </button>

        {/* Main glass card */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/[0.075] bg-white/[0.025] shadow-[0_30px_100px_-35px_rgba(91,61,240,0.45)] backdrop-blur-3xl">
          {/* Top shine */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* Header */}
          <div className="relative border-b border-white/[0.065] px-5 py-4">
            <div className="flex items-center gap-3.5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-[15px] bg-gradient-to-br from-[#8b72ff] via-[#5b3df0] to-[#35208e] opacity-40 blur-md" />

                <div className="relative h-14 w-14 overflow-hidden rounded-[15px] border border-white/[0.12] bg-[#171326] shadow-[0_8px_25px_-10px_rgba(124,92,255,0.7)]">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#3923a0] text-xl font-semibold">
                      {initial}
                    </div>
                  )}
                </div>

                {/* Online */}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0c0a12] bg-emerald-500">
                  <span className="h-1 w-1 rounded-full bg-white" />
                </span>
              </div>

              {/* User info */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-300/70" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-300/60">
                    Account
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">
                    {username || "Unnamed user"}
                  </span>

                  <ShieldCheck
                    size={13}
                    className="shrink-0 text-violet-300/60"
                  />
                </div>

                <p className="mt-0.5 truncate text-[10px] text-white/25">
                  {bio || "No bio yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Profile fields */}
          <div className="space-y-2.5 px-5 py-4">
            <GlassField
              icon={<AtSign size={13} />}
              label="Username"
              hint="Unique handle"
            >
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="w-full bg-transparent text-[13px] font-medium text-white outline-none placeholder:text-white/15"
              />
            </GlassField>

            <GlassField
              icon={<FileText size={13} />}
              label="Bio"
              hint={`${bio.length}/160`}
            >
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself..."
                maxLength={160}
                rows={2}
                className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-white outline-none placeholder:text-white/15"
              />
            </GlassField>
          </div>

          {/* Save */}
          <div className="px-5 pb-4">
            <button
              onClick={save}
              disabled={saving}
              className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-r from-[#6847e8] via-[#7958f5] to-[#6847e8] px-4 py-2.5 text-[11px] font-semibold shadow-[0_12px_30px_-14px_rgba(124,92,255,0.8)] transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-y-0 -left-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[120%]" />

              <span className="relative flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check size={13} />
                    Changes saved
                  </>
                ) : (
                  "Save changes"
                )}
              </span>
            </button>

            {saved && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] text-emerald-400/70">
                <Check size={10} />
                Profile updated successfully
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="border-t border-white/[0.065] px-5 py-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-violet-400/10 bg-violet-500/[0.07]">
                <Sparkles size={11} className="text-violet-300/70" />
              </div>

              <div>
                <div className="text-[10px] font-semibold">
                  Appearance
                </div>

                <div className="text-[8px] text-white/20">
                  Personalize your workspace
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.065] bg-black/15 p-1.5">
              <ThemePicker />
            </div>
          </div>

          {/* Bottom actions */}
          <div className="border-t border-white/[0.065] p-4">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Desktop */}
              <Link
                href="/download"
                className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-violet-400/[0.12] bg-violet-500/[0.045] px-3 py-2.5 transition-all duration-200 hover:border-violet-400/25 hover:bg-violet-500/[0.08]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-300/10 bg-violet-500/[0.08]">
                  <Download
                    size={13}
                    className="text-violet-300/60 transition-colors group-hover:text-violet-200"
                  />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[10px] font-semibold text-white/75">
                    Desktop app
                  </div>

                  <div className="truncate text-[8px] text-violet-200/25">
                    Native Nexo experience
                  </div>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-red-400/[0.08] bg-red-500/[0.025] px-3 py-2.5 text-left transition-all duration-200 hover:border-red-400/20 hover:bg-red-500/[0.055]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-400/10 bg-red-500/[0.05]">
                  <LogOut
                    size={13}
                    className="text-red-400/50 transition-colors group-hover:text-red-400"
                  />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[10px] font-semibold text-red-300/65">
                    Log out
                  </div>

                  <div className="truncate text-[8px] text-red-200/20">
                    Sign out from device
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-5 py-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-[0.18em] text-white/[0.12]">
              <UserRound size={8} />
              Nexo account settings
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GlassField({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/15 px-3.5 py-2.5 transition-all duration-200 focus-within:border-violet-400/25 focus-within:bg-white/[0.035] focus-within:shadow-[0_0_25px_-15px_rgba(124,92,255,0.6)]">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-violet-300/55 transition-colors group-focus-within:text-violet-300">
            {icon}
          </span>

          <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">
            {label}
          </span>
        </div>

        <span className="text-[8px] text-white/15">{hint}</span>
      </div>

      {children}
    </div>
  );
}
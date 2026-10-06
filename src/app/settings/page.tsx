"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { updateUser } from "@/lib/firestore/users";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, Loader2, LogOut } from "lucide-react";
import ThemePicker from "@/components/molecules/theme-picker/ThemePicker";
import Link from "next/link";

const BIO_MAX = 160;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [initialValues, setInitialValues] = useState({ username: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
        setInitialValues({ username: data.username || "", bio: data.bio || "" });
      }
    });

    return () => unsub();
  }, [router]);

  const cleanUsername = username.trim().toLowerCase();
  const usernameChanged = cleanUsername !== initialValues.username;
  const usernameValid = USERNAME_RE.test(cleanUsername);
  // Only block on username format when the user actually changed it
  const usernameInvalid = usernameChanged && !usernameValid;

  const isDirty = usernameChanged || bio.trim() !== initialValues.bio;
  const canSave = isDirty && !usernameInvalid && !saving;

  async function save() {
    if (!uid || !canSave) return;

    try {
      setSaving(true);
      setError("");

      const data: { username?: string; bio?: string } = {};

      if (cleanUsername) {
        data.username = cleanUsername;
      }

      data.bio = bio.trim();

      await updateUser(uid, data);

      setUsername(cleanUsername);
      setInitialValues({ username: cleanUsername, bio: bio.trim() });
      setSaved(true);

      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setUsername(initialValues.username);
    setBio(initialValues.bio);
    setError("");
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  const initial = cleanUsername ? cleanUsername[0].toUpperCase() : "?";

  let status: { text: string; tone: "muted" | "error" | "ok" } = {
    text: "",
    tone: "muted",
  };

  if (error) status = { text: error, tone: "error" };
  else if (usernameInvalid) status = { text: "Fix the username to save", tone: "error" };
  else if (isDirty) status = { text: "Unsaved changes", tone: "muted" };
  else if (saved) status = { text: "Changes saved", tone: "ok" };

  return (
    <main className="relative h-dvh overflow-y-auto bg-[#09080f] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-[#5b3df0]/[0.10] to-transparent" />

      {/* Centered vertically; scrolls only if the screen is really tiny */}
      <div className="relative flex min-h-full items-center justify-center px-5 py-4">
        <div className="w-full max-w-[460px]">
          {/* Identity */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#171326] ring-1 ring-white/15">
              {avatar ? (
                <img
                  src={avatar}
                  alt={username || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7c5cff] to-[#3923a0] text-lg font-semibold">
                  {initial}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.02em]">
                {cleanUsername || "Unnamed user"}
              </h1>
              <p className="text-[13px] text-white/40">Settings</p>
            </div>
          </div>

          {/* Profile */}
          <section className="mt-5 border-t border-white/[0.07] pt-4">
            <h2 className="mb-3 text-[13px] font-semibold text-white/70">Profile</h2>

            <div className="space-y-3">
              <Field
                label="Username"
                hint="3–20 chars: a–z, 0–9, _"
                invalid={usernameInvalid}
              >
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={30}
                  className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/25"
                />
              </Field>

              <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell something about yourself"
                  maxLength={BIO_MAX}
                  rows={2}
                  className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-white outline-none placeholder:text-white/25"
                />
              </Field>
            </div>

            {/* Save row: always visible */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`flex-1 truncate text-[12px] ${status.tone === "error"
                    ? "text-red-300/90"
                    : status.tone === "ok"
                      ? "text-violet-300"
                      : "text-white/45"
                  }`}
              >
                {status.tone === "ok" && <Check size={13} className="mr-1 inline -mt-0.5" />}
                {status.text}
              </span>

              <button
                onClick={discard}
                disabled={!isDirty || saving}
                className="cursor-pointer rounded-lg px-3 py-2 text-[13px] text-white/55 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-0"
              >
                Discard
              </button>

              <button
                onClick={save}
                disabled={!canSave}
                className="flex min-w-[124px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6847e8] px-4 py-2.5 text-[13px] font-semibold shadow-[0_12px_28px_-14px_rgba(124,92,255,0.9)] transition-all duration-200 hover:bg-[#7556f2] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/35 disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </section>

          {/* Appearance */}
          <section className="mt-4 border-t border-white/[0.07] pt-4">
            <h2 className="mb-3 text-[13px] font-semibold text-white/70">Appearance</h2>
            <ThemePicker />
          </section>

          {/* Account */}
          <section className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4">
            <Link
              href="/download"
              className="group flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-[14px] text-white/85 transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-violet-400"
            >
              <Download
                size={15}
                className="text-white/45 transition-colors group-hover:text-violet-300"
              />
              Desktop app
            </Link>

            <button
              onClick={logout}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-[14px] text-red-300/85 transition-colors hover:border-red-400/20 hover:bg-red-500/[0.07] focus-visible:outline-2 focus-visible:outline-red-400"
            >
              <LogOut
                size={15}
                className="text-red-400/60 transition-colors group-hover:text-red-400"
              />
              Log out
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  invalid,
  children,
}: {
  label: string;
  hint?: string;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-white/55">{label}</span>
        {hint && (
          <span className={`tabular-nums ${invalid ? "text-red-300/90" : "text-white/30"}`}>
            {hint}
          </span>
        )}
      </div>
      <div
        className={`rounded-xl border px-3.5 py-2 transition-colors duration-200 ${invalid
            ? "border-red-400/50 bg-red-500/[0.04]"
            : "border-white/[0.08] bg-white/[0.02] focus-within:border-violet-400/50 focus-within:bg-white/[0.04]"
          }`}
      >
        {children}
      </div>
    </label>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth";
import Link from "next/link";
import { Check, Plus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameValid = username.trim().length >= 3;
  const passwordValid = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (password.length < 6) {
      setError("The password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(username, password);
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration error";

      setError(
        message.includes("email-already-in-use")
          ? "This username is already taken"
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07060d] px-6 text-white">
      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes checkIn { from { opacity:0; transform:scale(0.6); } to { opacity:1; transform:scale(1); } }
        .rp-card { animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .rp-check { animation: checkIn 0.2s cubic-bezier(0.34,1.4,0.64,1) both; }
      `}</style>

      {/* Background glow — mirrored bottom-right, unlike login's top-center */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-[-220px] right-[-80px] h-[600px] w-[600px] rounded-full bg-[#7c5cff]/[0.16] blur-[160px]" />
      </div>

      <div className="rp-card relative z-10 w-full max-w-[360px]">
        {/* Mark, with a small "create" badge */}
        <div className="mb-7 flex justify-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#7c5cff]/30 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <img
                src="/logo.png"
                alt="Nexo"
                width={38}
                height={38}
                className="object-contain drop-shadow-[0_2px_8px_rgba(124,92,255,0.35)]"
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#07060d] bg-emerald-400 text-[#07060d]">
              <Plus size={13} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Cut top-right corner distinguishes this card's silhouette from login's uniform rounding */}
        <div className="rounded-2xl rounded-tr-md border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-md">
          <h1 className="text-[24px] font-semibold tracking-tight">
            Create account
          </h1>
          <p className="mt-1.5 text-[13.5px] text-white/40">
            Join Nexo and start chatting
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-white/50">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="for example, Nexo"
                autoComplete="username"
                autoFocus
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#7c5cff]/50 focus:bg-black/35"
              />
              {username.length > 0 && (
                <p
                  className={`mt-1.5 flex items-center gap-1.5 text-[11.5px] transition-colors ${usernameValid ? "text-emerald-400/80" : "text-white/30"
                    }`}
                >
                  {usernameValid ? (
                    <Check size={11} className="rp-check" />
                  ) : (
                    <span className="w-[11px] text-center">·</span>
                  )}
                  At least 3 characters
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-white/50">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimum 6 characters"
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#7c5cff]/50 focus:bg-black/35"
              />
              {password.length > 0 && (
                <p
                  className={`mt-1.5 flex items-center gap-1.5 text-[11.5px] transition-colors ${passwordValid ? "text-emerald-400/80" : "text-white/30"
                    }`}
                >
                  {passwordValid ? (
                    <Check size={11} className="rp-check" />
                  ) : (
                    <span className="w-[11px] text-center">·</span>
                  )}
                  At least 6 characters
                </p>
              )}
            </div>

            {error && <p className="text-[12.5px] text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-l from-[#7c5cff] to-[#5b3df0] text-[13.5px] font-semibold text-white transition-all hover:from-[#8d70ff] hover:to-[#6c4dff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_10px_28px_-10px_rgba(124,92,255,0.55)]"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-white/35">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#a996ff] transition-colors hover:text-white"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
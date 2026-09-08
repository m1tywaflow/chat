"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser(username, password);
      router.push("/");
    } catch {
      setError("Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080D] px-6 text-white">
      <style>{`
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lp-card {
          animation: cardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .nexo-input {
          color-scheme: dark;
        }

        .nexo-input:-webkit-autofill,
        .nexo-input:-webkit-autofill:hover,
        .nexo-input:-webkit-autofill:focus,
        .nexo-input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0 1000px #09090f inset !important;
          box-shadow: 0 0 0 1000px #09090f inset !important;
          background-color: #09090f !important;
          caret-color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.06) !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        .nexo-input:focus:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0b0b13 inset !important;
          box-shadow: 0 0 0 1000px #0b0b13 inset !important;
          border-color: rgba(139, 92, 246, 0.5) !important;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.12] blur-[180px]" />

        <div className="absolute bottom-[-350px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/[0.05] blur-[160px]" />
      </div>

      <div className="lp-card relative z-10 w-full max-w-[390px]">
        <div className="mb-7 flex justify-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-violet-500/20 blur-2xl" />

            <div className="relative rounded-[22px] border border-white/[0.07] bg-[#11111A]/80 p-3 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
              <Image
                src="/logo.png"
                alt="Nexo"
                width={64}
                height={64}
                priority
                className="select-none rounded-[15px]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/[0.07] bg-[#0E0E16]/85 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <h1 className="text-[25px] font-semibold tracking-[-0.02em]">
            Welcome back
          </h1>

          <p className="mt-1.5 text-[13.5px] text-zinc-500">
            Log in to continue to Nexo.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-[12.5px] font-medium text-zinc-400">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="nexo-input h-12 w-full appearance-none rounded-xl border border-white/[0.06] bg-[#09090F] px-4 text-[14px] text-white caret-white outline-none transition-all duration-200 placeholder:text-zinc-700 hover:border-white/[0.1] focus:border-violet-500/50 focus:bg-[#0B0B13] focus:ring-4 focus:ring-violet-500/[0.08]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[12.5px] font-medium text-zinc-400">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="nexo-input h-12 w-full appearance-none rounded-xl border border-white/[0.06] bg-[#09090F] px-4 text-[14px] text-white caret-white outline-none transition-all duration-200 placeholder:text-zinc-700 hover:border-white/[0.1] focus:border-violet-500/50 focus:bg-[#0B0B13] focus:ring-4 focus:ring-violet-500/[0.08]"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/10 bg-red-500/[0.06] px-3.5 py-3 text-[12.5px] text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-violet-600 text-[14px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,92,255,0.7)] transition-all duration-200 hover:bg-violet-500 hover:shadow-[0_14px_35px_-12px_rgba(124,92,255,0.85)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
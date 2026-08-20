// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { loginUser } from "@/lib/auth";
// import Link from "next/link";

// export default function LoginPage() {
//   const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await loginUser(username, password);
//       router.push("/");
//     } catch {
//       setError("Incorrect username or password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090F] px-6 text-white">
//       {/* bg glow */}
//       <div className="absolute inset-0">
//         <div className="absolute left-1/2 top-[-220px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[180px]" />
//       </div>

//       <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/70 p-8 backdrop-blur-md">
//         <h1 className="text-3xl font-bold tracking-tight">Login</h1>

//         <p className="mt-2 text-sm text-zinc-400">Log in to your account</p>

//         <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//           <div>
//             <label className="mb-2 block text-sm text-zinc-300">Username</label>

//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               autoComplete="username"
//               className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 text-white outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           <div>
//             <label className="mb-2 block text-sm text-zinc-300">Password</label>

//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               autoComplete="current-password"
//               className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 text-white outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
//             />
//           </div>

//           {error && <p className="text-sm text-red-400">{error}</p>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-violet-500/30 bg-zinc-900 font-medium transition-all duration-300 hover:border-violet-400 hover:bg-zinc-800 hover:shadow-[0_0_25px_rgba(139,92,246,.2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? "Let's go..." : "Login"}
//           </button>
//         </form>

//         <p className="mt-6 text-center text-sm text-zinc-500">
//           Don't have an account?{" "}
//           <Link
//             href="/register"
//             className="text-violet-400 transition hover:text-violet-300"
//           >
//             Register
//           </Link>
//         </p>
//       </div>
//     </main>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";
import Link from "next/link";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07060d] px-6 text-white">
      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .lp-card { animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#7c5cff]/[0.16] blur-[160px]" />
      </div>

      <div className="lp-card relative z-10 w-full max-w-[360px]">
        {/* Mark — soft glow behind the logo itself, no bright box hiding it */}
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
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-md">
          <h1 className="text-[24px] font-semibold tracking-tight">Log in</h1>
          <p className="mt-1.5 text-[13.5px] text-white/40">
            Welcome back to Nexo
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
                autoComplete="username"
                autoFocus
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#7c5cff]/50 focus:bg-black/35"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-white/50">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#7c5cff]/50 focus:bg-black/35"
              />
            </div>

            {error && (
              <p className="text-[12.5px] text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] text-[13.5px] font-semibold text-white transition-all hover:from-[#8d70ff] hover:to-[#6c4dff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_10px_28px_-10px_rgba(124,92,255,0.55)]"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-white/35">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-[#a996ff] transition-colors hover:text-white"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
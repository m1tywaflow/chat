"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const message =
        err instanceof Error ? err.message : "Registration error";
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h1 className="text-2xl font-semibold text-white mb-1">
          Registration
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          Create an account to start chatting
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-zinc-300 mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="for example, pislk"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 outline-none focus:border-[#8F7EAB] transition"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-300 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimum 6 characters"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 outline-none focus:border-[#8F7EAB] transition"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2 rounded-lg bg-[#8F7EAB] text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Let's create an account..." : "Register"}
          </button>
        </form>

        <p className="text-zinc-400 text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8F7EAB] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
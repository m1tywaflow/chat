"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MainSection from "@/components/organism/main/mainSec";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-zinc-950">
        <img src="/logo.png" alt="loader" width={60} height={60} />
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    );
  }

  return <MainSection />;
}

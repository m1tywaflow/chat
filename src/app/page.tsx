"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MainSection from "@/components/organism/main/mainSec";
import AppLoader from "@/components/UI/AppLoader";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <AppLoader />;
  }

  return <MainSection />;
}

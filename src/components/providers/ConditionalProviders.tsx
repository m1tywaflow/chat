"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";

const STANDALONE_ROUTES = ["/notification"];

export default function ConditionalProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.includes(pathname);

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}

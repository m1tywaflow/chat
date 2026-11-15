import { useUser } from "@/hooks/useUser";

export function useUsername(uid?: string | null): string {
  const user = useUser(uid);
  if (!user) return "";
  return (user.username as string) || "Someone";
}

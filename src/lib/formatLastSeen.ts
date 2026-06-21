export function formatLastSeen(lastSeen: any): string {
  if (!lastSeen) return "Offline";
  const date = lastSeen?.toDate?.() ?? new Date(lastSeen);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `last seen ${Math.floor(diff / 3600)}h ago`;
  return `last seen ${Math.floor(diff / 86400)}d ago`;
}

export function isOnline(user: any): boolean {
  if (!user?.online) return false;
  if (!user?.lastSeen) return false;
  const date = user.lastSeen?.toDate?.() ?? new Date(user.lastSeen);
  return Date.now() - date.getTime() < 2 * 60 * 1000;
}

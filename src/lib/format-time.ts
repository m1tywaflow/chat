export function formatTime(time: any) {
  if (!time) return "";
  const date = time?.toDate ? time.toDate() : null;

  const finalDate = date || (typeof time === "number" ? new Date(time) : null);

  if (!finalDate) return "";

  const now = new Date();
  const diff = now.getTime() - finalDate.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "just now";
  if (minutes < 1) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d`;
  return finalDate.toLocaleDateString();
}

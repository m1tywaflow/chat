import type { ForwardedFrom as ForwardedFromData } from "@/types/forward";

export default function ForwardedFrom({
  source,
}: {
  source: ForwardedFromData;
}) {
  const origin =
    source.senderName ||
    (source.sourceType === "channel" ? "Channel" : "user");

  return (
    <div className="mb-1 text-[10px] font-semibold text-[#a893ff]/80 uppercase tracking-wide px-1">
      Forwarded from {origin}
    </div>
  );
}

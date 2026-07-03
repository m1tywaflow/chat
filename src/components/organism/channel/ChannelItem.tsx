"use client";

import { Channel } from "@/types/channel";
import { Megaphone } from "lucide-react";

export default function ChannelItem({
  channel,
  active,
  onClick,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        active ? "bg-[#A78BFA]/[0.10]" : "hover:bg-white/[0.03]"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#A78BFA]" />
      )}
      <div className="shrink-0 w-11 h-11 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-sm font-semibold relative">
        {channel.avatarUrl ? (
          <img
            src={channel.avatarUrl}
            alt={channel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          channel.name.charAt(0).toUpperCase()
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#151D28] border border-[#0d0b14] flex items-center justify-center">
          <Megaphone size={9} className="text-[#A78BFA]" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {channel.name}
        </div>
        <div className="text-[12px] text-zinc-500 truncate">
          {channel.lastPostPreview || "No posts"}
        </div>
      </div>
    </div>
  );
}

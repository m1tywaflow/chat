"use client";

import { Channel } from "@/types/channel";
import { Megaphone, X, Users, Info, LogOut, Trash2 } from "lucide-react";

export default function ChannelInfoModal({
  channel,
  isOwner,
  isSub,
  onClose,
  onToggleSub,
  onRequestDelete,
}: {
  channel: Channel;
  isOwner: boolean;
  isSub: boolean;
  onClose: () => void;
  onToggleSub: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[380px] max-h-[85vh] rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative shrink-0">
          <div className="h-20" style={{ background: "linear-gradient(135deg, #A78BFA, #7c3aed)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors cursor-pointer">
            <X size={16} />
          </button>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-2xl font-semibold border-4 border-[#151D28]">
            {channel.avatarUrl ? (<img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" />) : (channel.name.charAt(0).toUpperCase())}
          </div>
        </div>

        <div className="flex flex-col items-center pt-12 pb-4 px-6 shrink-0">
          <div className="flex items-center gap-1.5 text-[17px] font-semibold text-white">
            {channel.name}
            <Megaphone size={14} className="text-[#A78BFA] shrink-0" />
          </div>
          <div className="text-[13px] text-zinc-500 mt-0.5">{channel.subscriberCount} subscribers</div>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll">
          {channel.description && (
            <div className="flex items-start gap-3 px-6 py-3 border-t border-white/[0.06]">
              <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{channel.description}</div>
            </div>
          )}

          <div className="flex items-center gap-3 px-6 py-3 border-t border-white/[0.06]">
            <Users size={16} className="text-zinc-500 shrink-0" />
            <div className="text-[13px] text-zinc-300">{channel.subscriberCount} subscribers</div>
          </div>
        </div>

        <div className="flex-none border-t border-white/[0.06]">
          {isOwner ? (
            <button onClick={onRequestDelete} className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium text-red-400 hover:bg-red-500/[0.08] transition-colors cursor-pointer">
              <Trash2 size={15} />
              Delete channel
            </button>
          ) : (
            <button onClick={onToggleSub} className={`w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors cursor-pointer ${isSub ? "text-red-400 hover:bg-red-500/[0.08]" : "text-[#A78BFA] hover:bg-[#A78BFA]/[0.08]"}`}>
              {isSub ? <LogOut size={15} /> : <Megaphone size={15} />}
              {isSub ? "Unsubscribe" : "Subscribe"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
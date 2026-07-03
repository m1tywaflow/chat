"use client";

import { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import { Channel } from "@/types/channel";
import {
  searchChannels,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "@/lib/firestore/channels";

export default function ChannelSearchModal({
  uid,
  myChannelIds,
  onClose,
  onOpenChannel,
}: {
  uid: string;
  myChannelIds: Set<string>;
  onClose: () => void;
  onOpenChannel: (channelId: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState<Set<string>>(myChannelIds);

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const found = await searchChannels(term);
      setResults(found);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [term]);

  async function toggleSub(channelId: string, ownerId: string) {
    if (ownerId === uid) return;
    if (subscribed.has(channelId)) {
      setSubscribed(
        (prev) => new Set([...prev].filter((id) => id !== channelId))
      );
      await unsubscribeFromChannel(channelId, uid);
    } else {
      setSubscribed((prev) => new Set([...prev, channelId]));
      await subscribeToChannel(channelId, uid);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[380px] max-h-[520px] flex flex-col rounded-2xl bg-[#151D28] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[15px] font-semibold text-white">
            Find a channel
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 pb-3 relative">
          <Search
            size={14}
            className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600"
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Channel name"
            autoFocus
            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-[#A78BFA]/30 transition-all"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-5 py-4 text-xs text-zinc-600">Ищем…</div>
          )}
          {!loading && term.trim() && results.length === 0 && (
            <div className="px-5 py-4 text-xs text-zinc-600">Nothing found</div>
          )}
          {results.map((ch) => {
            const isSub = subscribed.has(ch.id);
            const isOwner = ch.ownerId === uid;
            return (
              <div
                key={ch.id}
                className="flex items-center gap-3 px-5 py-2.5 border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => onOpenChannel(ch.id)}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-sm font-semibold">
                  {ch.avatarUrl ? (
                    <img
                      src={ch.avatarUrl}
                      alt={ch.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ch.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {ch.name}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {ch.subscriberCount} subscribers
                  </div>
                </div>
                {isOwner ? (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.05] text-zinc-500 border border-white/[0.08]">
                    Your channel
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSub(ch.id, ch.ownerId);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                      isSub
                        ? "bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20"
                        : "bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 hover:bg-[#A78BFA]/20"
                    }`}
                  >
                    {isSub ? (
                      <span className="flex items-center gap-1">
                        <Check size={12} />
                        You are subscribed.
                      </span>
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

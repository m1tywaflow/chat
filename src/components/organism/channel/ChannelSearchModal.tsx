"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, Radio } from "lucide-react";
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
      setLoading(false);
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

  function handleOpen(channelId: string) {
    onOpenChannel(channelId);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[400px] h-[560px] flex flex-col rounded-md bg-[#0a0913]/95 border border-white/[0.07] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#7c5cff]/20 blur-[80px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-64 h-64 rounded-full bg-[#4f46e5]/15 blur-[80px]" />

        <div className="relative flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#7c5cff]/15 border border-[#7c5cff]/20 flex items-center justify-center text-[#a78bfa]">
              <Radio size={15} />
            </div>
            <h3 className="text-[16px] font-semibold text-white tracking-tight">
              Find a channel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative px-6 pb-4 shrink-0">
          <div className="group relative">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#a78bfa] transition-colors"
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by channel name"
              autoFocus
              className="w-full h-11 pl-11 pr-4 rounded-sm bg-white/[0.04] border border-white/[0.08] text-[13.5px] text-white placeholder:text-zinc-600 outline-none focus:bg-white/[0.06] focus:border-[#7c5cff]/40 focus:shadow-[0_0_0_4px_rgba(124,92,255,0.08)] transition-all"
            />
          </div>
        </div>

        <div className="relative flex-1 min-h-0 overflow-y-auto px-3 pb-3">
          {loading && (
            <div className="space-y-1.5 px-2 py-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm animate-pulse"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/5 rounded-sm bg-white/[0.06]" />
                    <div className="h-2.5 w-1/4 rounded-sm bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && term.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2.5 h-full px-6 text-center">
              <div className="w-11 h-11 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-600">
                <Search size={16} />
              </div>
              <div className="text-[13px] text-zinc-500">
                No channels match &ldquo;{term.trim()}&rdquo;
              </div>
            </div>
          )}

          {!loading && !term.trim() && (
            <div className="flex flex-col items-center justify-center gap-2.5 h-full px-6 text-center">
              <div className="w-11 h-11 rounded-sm bg-[#7c5cff]/10 border border-[#7c5cff]/15 flex items-center justify-center text-[#a78bfa]">
                <Radio size={16} />
              </div>
              <div className="text-[13px] text-zinc-500">
                Start typing to find channels
              </div>
            </div>
          )}

          {!loading &&
            results.map((ch) => {
              const isSub = subscribed.has(ch.id);
              const isOwner = ch.ownerId === uid;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleOpen(ch.id)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden">
                    <div className="absolute inset-0 rounded-full ring-1 ring-white/[0.06] group-hover:ring-[#7c5cff]/40 transition-all" />
                    {ch.avatarUrl ? (
                      <img
                        src={ch.avatarUrl}
                        alt={ch.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#7c5cff]/25 to-[#4f46e5]/15 flex items-center justify-center text-[#c4b5fd] text-sm font-semibold">
                        {ch.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-white truncate">
                      {ch.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {ch.subscriberCount} subscribers
                    </div>
                  </div>
                  {isOwner ? (
                    <span className="shrink-0 px-3 py-1.5 rounded-sm text-[11.5px] font-medium bg-white/[0.04] text-zinc-500 border border-white/[0.07]">
                      Your channel
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSub(ch.id, ch.ownerId);
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-sm text-[11.5px] font-medium transition-all cursor-pointer ${
                        isSub
                          ? "bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/[0.15]"
                          : "bg-[#7c5cff]/15 text-[#a78bfa] border border-[#7c5cff]/25 hover:bg-[#7c5cff]/25"
                      }`}
                    >
                      {isSub ? (
                        <span className="flex items-center gap-1">
                          <Check size={11} />
                          Subscribed
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

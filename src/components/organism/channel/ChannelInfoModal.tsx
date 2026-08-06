"use client";

import { useState, useEffect } from "react";
import { Channel } from "@/types/channel";
import {
  getChannelSubscribers,
  removeSubscriber,
} from "@/lib/firestore/channels";
import MediaGallery from "../media-gallery/MediaGallery";
import {
  Megaphone,
  X,
  Users,
  Info,
  LogOut,
  Trash2,
  ChevronLeft,
  UserMinus,
  Crown,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface SubscriberRow {
  uid: string;
  username: string;
  avatarUrl: string | null;
  subscribedAt: any;
}

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
  const [view, setView] = useState<"info" | "subscribers">("info");
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);

  useEffect(() => {
    if (view !== "subscribers") return;
    setLoadingSubs(true);
    getChannelSubscribers(channel.id).then((list) => {
      setSubscribers(list);
      setLoadingSubs(false);
    });
  }, [view, channel.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showMedia) return; // MediaGallery handles its own Escape
      if (zoomUrl) setZoomUrl(null);
      else if (view === "subscribers") setView("info");
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomUrl, view, onClose, showMedia]);

  async function handleRemove(uid: string) {
    setRemovingUid(uid);
    try {
      await removeSubscriber(channel.id, uid);
      setSubscribers((prev) => prev.filter((s) => s.uid !== uid));
    } catch (err) {
      console.error("Remove subscriber failed:", err);
    } finally {
      setRemovingUid(null);
    }
  }

  return (
    <>
      <style>{`
        .cim-scroll::-webkit-scrollbar { width: 4px; }
        .cim-scroll::-webkit-scrollbar-track { background: transparent; }
        .cim-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
        .cim-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
        .cim-avatar { cursor: zoom-in; transition: opacity 0.15s; }
        .cim-avatar:hover { opacity: 0.85; }
      `}</style>

      <div
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-[380px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/12 blur-[100px]" />
          </div>

          {view === "info" ? (
            <>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              {/* header */}
              <div className="relative z-10 flex flex-col items-center pt-8 pb-5 px-6 border-b border-white/[0.06]">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-[#1e2a3a] flex items-center justify-center mb-3 cim-avatar text-[#a893ff] text-2xl font-semibold"
                  onClick={() =>
                    channel.avatarUrl && setZoomUrl(channel.avatarUrl)
                  }
                >
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    channel.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[16px] font-semibold text-white text-center leading-tight">
                  {channel.name}
                  <Megaphone size={13} className="text-[#a893ff] shrink-0" />
                </div>
                <p className="text-[12.5px] text-zinc-500 mt-1">
                  {channel.subscriberCount} subscriber
                  {channel.subscriberCount === 1 ? "" : "s"}
                </p>
              </div>

              {/* body */}
              <div className="cim-scroll relative z-10 flex-1 overflow-y-auto">
                {channel.description && (
                  <div className="flex items-start gap-3 px-6 py-3.5 border-b border-white/[0.06]">
                    <Info size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                    <div className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {channel.description}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setView("subscribers")}
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer text-left border-b border-white/[0.06]"
                >
                  <Users size={15} className="text-zinc-500 shrink-0" />
                  <span className="text-[13px] text-zinc-300">
                    {channel.subscriberCount} subscriber
                    {channel.subscriberCount === 1 ? "" : "s"}
                  </span>
                </button>

                <button
                  onClick={() => setShowMedia(true)}
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                >
                  <ImageIcon size={15} className="text-zinc-500 shrink-0" />
                  <span className="text-[13px] text-zinc-300">
                    Media gallery
                  </span>
                </button>
              </div>

              {/* footer action */}
              <div className="relative z-10 flex-none border-t border-white/[0.06]">
                {isOwner ? (
                  <button
                    onClick={onRequestDelete}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium text-red-400 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Delete channel
                  </button>
                ) : (
                  <button
                    onClick={onToggleSub}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors cursor-pointer ${
                      isSub
                        ? "text-red-400 hover:bg-red-500/[0.08]"
                        : "text-[#a893ff] hover:bg-[#a893ff]/[0.08]"
                    }`}
                  >
                    {isSub ? <LogOut size={15} /> : <Megaphone size={15} />}
                    {isSub ? "Unsubscribe" : "Subscribe"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* subscribers header */}
              <div className="relative z-10 flex-none flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
                <button
                  onClick={() => setView("info")}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-[15px] font-semibold text-white">
                  Subscribers
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="cim-scroll relative z-10 flex-1 overflow-y-auto px-2 py-2">
                {loadingSubs && (
                  <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">Loading subscribers…</span>
                  </div>
                )}
                {!loadingSubs && subscribers.length === 0 && (
                  <div className="text-center text-zinc-600 text-sm py-10">
                    No subscribers yet
                  </div>
                )}
                {!loadingSubs &&
                  subscribers.map((s) => {
                    const isThisOwner = s.uid === channel.ownerId;
                    return (
                      <div
                        key={s.uid}
                        className="group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] transition-colors"
                      >
                        <div
                          className="shrink-0 cim-avatar"
                          onClick={() => s.avatarUrl && setZoomUrl(s.avatarUrl)}
                        >
                          {s.avatarUrl ? (
                            <img
                              src={s.avatarUrl}
                              alt={s.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
                              {s.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13.5px] font-medium text-white truncate">
                              {s.username}
                            </span>
                            {isThisOwner && (
                              <Crown
                                size={12}
                                className="text-yellow-400 shrink-0"
                              />
                            )}
                          </div>
                          {isThisOwner && (
                            <span className="text-[11.5px] text-[#a893ff]">
                              owner
                            </span>
                          )}
                        </div>

                        {isOwner && !isThisOwner && (
                          <button
                            onClick={() => handleRemove(s.uid)}
                            disabled={removingUid === s.uid}
                            title="Remove subscriber"
                            className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all cursor-pointer disabled:opacity-40"
                          >
                            {removingUid === s.uid ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserMinus size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setZoomUrl(null)}
        >
          <button
            onClick={() => setZoomUrl(null)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
          <img
            src={zoomUrl}
            alt="avatar"
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showMedia && (
        <MediaGallery
          channelId={channel.id}
          onClose={() => setShowMedia(false)}
        />
      )}
    </>
  );
}

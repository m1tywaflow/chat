"use client";

import { useEffect, useState } from "react";
import { Channel } from "@/types/channel";
import {
  getChannelSubscribers,
  removeSubscriber,
  updateChannelInfo,
} from "@/lib/firestore/channels";
import MediaGallery from "../media-gallery/MediaGallery";
import {
  Megaphone,
  X,
  Users,
  Info,
  Heart,
  LogOut,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Crown,
  Loader2,
  Image as ImageIcon,
  Settings,
  Camera,
} from "lucide-react";

interface SubscriberRow {
  uid: string;
  username: string;
  avatarUrl: string | null;
  subscribedAt: any;
}

async function uploadChannelAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_avatars");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Avatar upload failed");
  const json = await res.json();
  return json.secure_url as string;
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
  const [view, setView] = useState<"info" | "subscribers" | "settings">("info");
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);

  // --- settings (name / avatar) state ---
  const [nameDraft, setNameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

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
      else if (view === "settings") closeSettings();
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomUrl, view, onClose, showMedia]);

  useEffect(() => {
    return () => {
      if (avatarDraft) URL.revokeObjectURL(avatarDraft);
    };
  }, [avatarDraft]);

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

  function openSettings() {
    setNameDraft(channel.name);
    setAvatarDraft(null);
    setAvatarFile(null);
    setView("settings");
  }

  function closeSettings() {
    setView("info");
    setNameDraft("");
    if (avatarDraft) URL.revokeObjectURL(avatarDraft);
    setAvatarDraft(null);
    setAvatarFile(null);
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarDraft) URL.revokeObjectURL(avatarDraft);
    setAvatarFile(file);
    setAvatarDraft(URL.createObjectURL(file));
  }

  async function handleSaveSettings() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;

    setSavingSettings(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadChannelAvatar(avatarFile);
      }
      await updateChannelInfo(channel.id, {
        name: trimmed !== channel.name ? trimmed : undefined,
        avatarUrl,
      });
      closeSettings();
    } finally {
      setSavingSettings(false);
    }
  }

  const nameChanged =
    nameDraft.trim() !== channel.name && nameDraft.trim().length > 0;
  const canSaveSettings =
    (nameChanged || !!avatarFile) &&
    nameDraft.trim().length > 0 &&
    !savingSettings;

  return (
    <>
      <style>{`
        .cim-scroll::-webkit-scrollbar { width: 4px; }
        .cim-scroll::-webkit-scrollbar-track { background: transparent; }
        .cim-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
        .cim-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
        .cim-avatar { cursor: zoom-in; transition: opacity 0.15s; }
        .cim-avatar:hover { opacity: 0.85; }
        .cim-modal { animation: cimIn 0.16s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes cimIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .cim-row { transition: background-color 0.15s, transform 0.1s; }
        .cim-row:active { transform: scale(0.99); }
      `}</style>

      <div
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="cim-modal w-[380px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/12 blur-[100px]" />
          </div>

          {view === "settings" && (
            <button
              onClick={closeSettings}
              className="absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {view === "info" && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}

          {view === "info" && (
            <>
              {/* header */}
              <div className="relative z-10 flex flex-col items-center gap-4 pt-8 pb-5 px-6 border-b border-white/[0.06]">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-[#1e2a3a] ring-2 ring-[#7c5cff]/25 flex items-center justify-center shrink-0 cim-avatar text-[#a893ff] text-2xl font-semibold"
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

                <div className="flex flex-col pt-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[17px] font-bold text-white leading-tight truncate">
                    {channel.name}
                    <Megaphone size={13} className="text-[#a893ff] shrink-0" />
                  </div>
                  <p className="text-[12.5px] text-zinc-500 mt-1">
                    {channel.subscriberCount} subscriber
                    {channel.subscriberCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {/* body */}
              <div className="cim-scroll relative z-10 flex-1 overflow-y-auto">
                {channel.description && (
                  <div className="w-full flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.06]">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Info size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium text-white">
                        Description
                      </div>
                      <div className="text-[12px] text-zinc-500 truncate">
                        {channel.description}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setView("subscribers")}
                  className="cim-row w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.04] cursor-pointer text-left border-b border-white/[0.06]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#7c5cff]/10 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-[#a893ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-white">
                      Subscribers
                    </div>
                    <div className="text-[12px] text-zinc-500">
                      {channel.subscriberCount} subscriber
                      {channel.subscriberCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                </button>

                <button
                  onClick={() => setShowMedia(true)}
                  className={`cim-row w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.04] cursor-pointer text-left ${
                    isOwner ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                    <ImageIcon size={16} className="text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-white">
                      Media
                    </div>
                    <div className="text-[12px] text-zinc-500">
                      Media gallery
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                </button>
                {isOwner && (
                  <button
                    onClick={openSettings}
                    className="cim-row w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.04] cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Settings size={16} className="text-zinc-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium text-white">
                        Settings
                      </div>
                      <div className="text-[12px] text-zinc-500">
                        Change name and photo
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-zinc-600 shrink-0"
                    />
                  </button>
                )}
              </div>

              {/* footer action */}
              <div className="relative z-10 flex-none border-t border-white/[0.06] p-3">
                {isOwner ? (
                  <button
                    onClick={onRequestDelete}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/[0.16] text-[13px] font-semibold text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Delete channel
                  </button>
                ) : (
                  <button
                    onClick={onToggleSub}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                      isSub
                        ? "bg-red-500/10 hover:bg-red-500/[0.16] text-red-400"
                        : "bg-[#7c5cff]/10 hover:bg-[#7c5cff]/[0.18] text-[#a893ff]"
                    }`}
                  >
                    {isSub ? <LogOut size={15} /> : <Megaphone size={15} />}
                    {isSub ? "Unsubscribe" : "Subscribe"}
                  </button>
                )}
              </div>
            </>
          )}

          {view === "settings" && (
            <>
              {/* header: settings mode */}
              <div className="relative z-10 flex flex-col items-center pt-8 pb-5 px-6 border-b border-white/[0.06]">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden bg-[#1e2a3a] ring-2 ring-[#7c5cff]/25 flex items-center justify-center mb-4 cursor-pointer group"
                  onClick={() =>
                    document.getElementById("cim-avatar-input")?.click()
                  }
                >
                  {avatarDraft || channel.avatarUrl ? (
                    <img
                      src={avatarDraft ?? channel.avatarUrl!}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#a893ff] text-2xl font-semibold">
                      {channel.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                  <input
                    id="cim-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarPick}
                  />
                </div>

                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Channel name"
                  maxLength={64}
                  className="w-full max-w-[240px] text-center bg-transparent border-b border-white/10 focus:border-[#7c5cff]/50 outline-none text-[15px] font-semibold text-white py-1 transition-colors"
                />
                <p className="text-[11.5px] text-zinc-600 mt-3 text-center leading-relaxed px-2">
                  Only the owner can change channel name and photo
                </p>
              </div>

              <div className="relative z-10 flex-1" />

              <div className="relative z-10 p-3 border-t border-white/[0.06]">
                <button
                  onClick={handleSaveSettings}
                  disabled={!canSaveSettings}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7c5cff] hover:bg-[#8f6bff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
                >
                  {savingSettings ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </>
          )}

          {view === "subscribers" && (
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
                        className="cim-row group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04]"
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
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/90 backdrop-blur-sm"
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

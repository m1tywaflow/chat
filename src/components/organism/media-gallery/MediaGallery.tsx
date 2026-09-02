"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { X, Download, Image as ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { isCustomEmojiUrl } from "@/lib/customEmoji";

type Props =
  | {
    chatId: string;
    groupId?: undefined;
    channelId?: undefined;
    onClose: () => void;
  }
  | {
    groupId: string;
    chatId?: undefined;
    channelId?: undefined;
    onClose: () => void;
  }
  | {
    channelId: string;
    chatId?: undefined;
    groupId?: undefined;
    onClose: () => void;
  };

const GLASS_PANEL =
  "bg-[rgba(13,11,23,0.55)] [backdrop-filter:blur(24px)_saturate(160%)] [-webkit-backdrop-filter:blur(24px)_saturate(160%)] border border-[rgba(168,147,255,0.16)] shadow-[0_10px_40px_0_rgba(8,4,24,0.55),inset_0_0_1px_1px_rgba(255,255,255,0.05)]";

const GLASS_SURFACE =
  "bg-[rgba(124,92,255,0.06)] [backdrop-filter:blur(12px)_saturate(140%)] [-webkit-backdrop-filter:blur(12px)_saturate(140%)] border border-white/[0.08]";

export default function MediaGallery({
  chatId,
  groupId,
  channelId,
  onClose,
}: Props) {
  const [photos, setPhotos] = useState<
    { id: string; url: string; createdAt: any }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const entityId = groupId ?? channelId ?? chatId;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const collectionRef = groupId
        ? collection(db, "groups", groupId, "messages")
        : channelId
          ? collection(db, "channels", channelId, "posts")
          : collection(db, "chats", chatId as string, "messages");
      const q = query(collectionRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const loaded = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter(
          (d) =>
            d.imageUrl &&
            !d.deleted &&
            !(!d.text && isCustomEmojiUrl(d.imageUrl))
        );
      setPhotos(
        loaded.map((d) => ({
          id: d.id,
          url: d.imageUrl,
          createdAt: d.createdAt,
        }))
      );
      setLoading(false);
    }
    load();
  }, [entityId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightbox) {
          setLightbox(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, onClose]);

  const closeBtnClass =
    "w-7 h-7 flex items-center justify-center rounded-lg " +
    GLASS_SURFACE +
    " text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer";

  const lightboxBtnClass =
    "w-9 h-9 flex items-center justify-center rounded-xl " +
    GLASS_SURFACE +
    " text-white hover:bg-white/[0.15] transition-colors";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]"
      onClick={onClose}
    >
      <div
        className={"relative w-full max-w-lg mx-4 rounded-2xl " + GLASS_PANEL + " overflow-hidden"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/15 blur-[100px]" />
          <div className="absolute -bottom-28 -right-16 w-[240px] h-[240px] rounded-full bg-[#7c5cff]/10 blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <ImageIcon size={15} className="text-[#A78BFA]" />
            <span className="text-sm font-semibold text-white/80">Media</span>
            {!loading && (
              <span className="text-xs text-zinc-500">
                {photos.length} photos
              </span>
            )}
          </div>
          <button onClick={onClose} className={closeBtnClass}>
            <X size={15} />
          </button>
        </div>

        <div className="relative z-10 p-4 max-h-[70vh] overflow-y-auto scrollbar-purple">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/20 border-t-[#A78BFA] rounded-full animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-600">
              <ImageIcon size={28} />
              <span className="text-sm">No photos yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setLightbox(p.url)}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-zoom-in group bg-white/[0.04]"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightbox}
              download
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={lightboxBtnClass}
            >
              <Download size={16} />
            </a>
            <button onClick={() => setLightbox(null)} className={lightboxBtnClass}>
              <X size={16} />
            </button>
          </div>
          <img
            src={lightbox}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
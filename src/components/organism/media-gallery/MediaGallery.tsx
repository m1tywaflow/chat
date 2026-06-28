"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { X, Download, Image as ImageIcon } from "lucide-react";

interface Props {
  chatId: string;
  onClose: () => void;
}

export default function MediaGallery({ chatId, onClose }: Props) {
  const [photos, setPhotos] = useState<
    { id: string; url: string; createdAt: any }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const photos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((d) => d.imageUrl && !d.deleted);
      setPhotos(
        photos.map((d) => ({
          id: d.id,
          url: d.imageUrl,
          createdAt: d.createdAt,
        }))
      );
      setLoading(false);
    }
    load();
  }, [chatId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") lightbox ? setLightbox(null) : onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, onClose]);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#0d0b14] border border-white/[0.08] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <ImageIcon size={15} className="text-[#A78BFA]" />
            <span className="text-sm font-semibold text-white/80">Media</span>
            {!loading && (
              <span className="text-xs text-zinc-500">
                {photos.length} photos
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-purple">
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
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightbox}
              download
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => setLightbox(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
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
    </div>
  );
}

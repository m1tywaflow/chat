"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type NotificationData = {
  title?: string;
  body?: string;
  chatId?: string;
  avatar?: string;
};

export default function NotificationPage() {
  const [message, setMessage] = useState<NotificationData | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.background = "transparent";
  }, []);

  useEffect(() => {
    window.electronAPI?.onNotification((data: NotificationData) => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }

      setMessage(data);
      setClosing(false);

      const audio = new Audio("/sound/notification.mp3");
      audio.play().catch(() => {});

      closeTimerRef.current = setTimeout(() => {
        handleClose();
      }, 5000);
    });
  }, []);

  const handleClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setClosing(true);
    setTimeout(() => {
      setMessage(null);
      setClosing(false);
      window.electronAPI?.notifyToastCountChanged(0);
    }, 180);
  };

  const handleOpenChat = () => {
    if (message?.chatId) {
      window.electronAPI?.openChatFromNotification(message.chatId);
    }
    handleClose();
  };

  if (!message) {
    return null;
  }

  return (
    <div className="w-full h-full ">
      <div
        onClick={handleOpenChat}
        className={`group pointer-events-auto relative w-full h-full rounded-[14px] bg-[#1B1D2A] text-white flex items-center gap-3 px-3.5 cursor-pointer select-none border border-white/[0.06] transition-[opacity,transform] duration-200 ease-out ${
          closing
            ? "opacity-0 translate-x-3 scale-[0.97]"
            : "opacity-100 translate-x-0 scale-100 animate-slide-in"
        }`}
        style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}
      >
        <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 overflow-hidden flex items-center justify-center shrink-0 text-[#A78BFA] font-medium text-[15px]">
          {message.avatar ? (
            <img
              src={message.avatar}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <span>{(message.title?.[0] ?? "?").toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-[13.5px] leading-tight truncate pr-4">
            {message.title || "New message"}
          </div>
          <div className="text-[12.5px] text-white/50 mt-0.5 truncate leading-tight">
            {message.body}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close"
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-opacity duration-150"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

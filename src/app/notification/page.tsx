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
    }, 200);
  };

  const handleOpenChat = () => {
    if (message?.chatId) {
      window.electronAPI?.openChatFromNotification(message.chatId);
    }
    handleClose();
  };

  const handleMouseEnter = () => {
    window.electronAPI?.notifyNotificationMouseEnter();
  };

  const handleMouseLeave = () => {
    window.electronAPI?.notifyNotificationMouseLeave();
  };

  if (!message) {
    return null;
  }

  return (
    <div className="w-screen h-screen flex items-end justify-end p-4">
      <div
        onClick={handleOpenChat}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`group relative w-[380px] rounded-lg bg-[#151D28]/95 backdrop-blur-xl text-white shadow-2xl shadow-black/50 border border-white/[0.08] p-3.5 flex items-center gap-3 cursor-pointer select-none transition-all duration-200 ease-out ${
          closing
            ? "opacity-0 translate-x-4 scale-95"
            : "opacity-100 translate-x-0 scale-100 animate-slide-in"
        }`}
      >
        <div className="w-11 h-11 rounded-full bg-[#A78BFA]/15 overflow-hidden flex items-center justify-center shrink-0 text-[#A78BFA] font-semibold text-lg">
          {message.avatar ? (
            <img
              src={message.avatar}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <span>{(message.title?.[0] ?? "💬").toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14px] leading-tight truncate pr-4">
            {message.title || "New message"}
          </div>
          <div className="text-[13px] text-white/60 mt-0.5 line-clamp-1 leading-tight">
            {message.body}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close"
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all duration-150"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

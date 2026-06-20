// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useChatStore } from "@/store/chat-store";
// import {
//   subscribeToMessages,
//   sendMessage,
//   setTyping,
// } from "@/lib/firestore/chats";
// import { getUserById } from "@/lib/firestore/users";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { onSnapshot, doc, updateDoc } from "firebase/firestore";
// import { X, CornerUpLeft, Send, MoreVertical, Trash2 } from "lucide-react";

// export default function ChatWindow() {
//   const chatId = useChatStore((s) => s.activeChatId);
//   const markOpened = useChatStore((s) => s.markOpened);

//   const [messages, setMessages] = useState<any[]>([]);
//   const [text, setText] = useState("");
//   const [myUid, setMyUid] = useState<string | null>(null);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);
//   const [replyMessage, setReplyMessage] = useState<any | null>(null);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [otherUser, setOtherUser] = useState<any>(null);

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const typingTimeout = useRef<NodeJS.Timeout | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const menuRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (menuRef.current && !menuRef.current.contains(e.target as Node))
//         setMenuOpen(false);
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
//   }, []);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     const [uid1, uid2] = chatId.split("_");
//     const otherUid = uid1 === myUid ? uid2 : uid1;
//     getUserById(otherUid).then((u) => setOtherUser(u));
//   }, [chatId, myUid]);

//   useEffect(() => {
//     if (!chatId) return;
//     const unsub = subscribeToMessages(chatId, setMessages);
//     return () => unsub();
//   }, [chatId]);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
//       const data = snap.data();
//       if (!data?.typing) return;
//       const typingList = Object.entries(data.typing)
//         .filter(([uid, val]) => val && uid !== myUid)
//         .map(([uid]) => uid);
//       setTypingUsers(typingList);
//     });
//     return () => unsub();
//   }, [chatId, myUid]);

//   useEffect(() => {
//     if (!chatId || !myUid) return;
//     markOpened(chatId);
//     updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 });
//   }, [chatId, myUid]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
//     setText(e.target.value);
//     if (!chatId || !myUid) return;
//     setTyping(chatId, myUid, true);
//     if (typingTimeout.current) clearTimeout(typingTimeout.current);
//     typingTimeout.current = setTimeout(() => {
//       setTyping(chatId, myUid!, false);
//     }, 1200);
//   }

//   async function send() {
//     if (!text.trim() || !chatId || !myUid) return;
//     await sendMessage(chatId, myUid, text, replyMessage);
//     setText("");
//     setReplyMessage(null);
//     setTyping(chatId, myUid, false);
//   }

//   function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter") send();
//   }

//   function handleReply(m: any) {
//     setReplyMessage(m);
//     inputRef.current?.focus();
//   }

//   function scrollToMessage(id: string) {
//     const el = document.getElementById(`msg-${id}`);
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "center" });
//     el.classList.add("highlight-flash");
//     setTimeout(() => el.classList.remove("highlight-flash"), 1500);
//   }

//   if (!chatId) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
//         <span className="text-sm">Select a conversation</span>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         .chat-scroll::-webkit-scrollbar { width: 4px; }
//         .chat-scroll::-webkit-scrollbar-track { background: transparent; }
//         .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167, 139, 250, 0.25); border-radius: 999px; }
//         .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167, 139, 250, 0.5); }
//         .highlight-flash { animation: flash 1.5s ease-out; }
//         @keyframes flash { 0%, 30% { background-color: rgba(167, 139, 250, 0.15); border-radius: 12px; } 100% { background-color: transparent; } }
//         .reply-btn { opacity: 0; transition: opacity 0.15s; }
//         .msg-row:hover .reply-btn { opacity: 1; }
//         .dot { width: 6px; height: 6px; border-radius: 50%; background: #71717a; animation: dotbounce 1.2s infinite; }
//         .dot:nth-child(2) { animation-delay: 0.15s; }
//         .dot:nth-child(3) { animation-delay: 0.3s; }
//         @keyframes dotbounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
//       `}</style>

//       <div className="flex flex-col w-full h-full min-h-0 bg-[#0B0F14] text-[#E5E7EB]">
//         <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0F1620]">
//           <span className="text-sm font-semibold text-white/80 tracking-wide">
//             {otherUser?.username ?? "..."}
//           </span>
//           <div className="relative" ref={menuRef}>
//             <button
//               onClick={() => setMenuOpen((v) => !v)}
//               className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
//             >
//               <MoreVertical size={16} />
//             </button>
//             {menuOpen && (
//               <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
//                 <button
//                   onClick={async () => {
//                     if (!chatId) return;
//                     await updateDoc(doc(db, "chats", chatId), {
//                       [`deleted.${myUid}`]: true,
//                     });
//                     useChatStore.getState().setActiveChat(null);
//                     setMenuOpen(false);
//                   }}
//                   className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
//                 >
//                   <Trash2 size={14} />
//                   Delete chat
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="chat-scroll flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
//           {messages.map((m) => {
//             const isMine = m.senderId === myUid;
//             return (
//               <div
//                 key={m.id}
//                 id={`msg-${m.id}`}
//                 className={`msg-row flex ${
//                   isMine ? "justify-end" : "justify-start"
//                 }`}
//                 onContextMenu={(e) => {
//                   e.preventDefault();
//                   handleReply(m);
//                 }}
//               >
//                 <div className="relative group max-w-[72%]">
//                   <button
//                     onClick={() => handleReply(m)}
//                     title="Reply"
//                     className={`reply-btn absolute top-1/2 -translate-y-1/2 ${
//                       isMine ? "-left-8" : "-right-8"
//                     } w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/5 transition-colors`}
//                   >
//                     <CornerUpLeft size={13} />
//                   </button>

//                   {m.replyTo && (
//                     <div
//                       onClick={() => scrollToMessage(m.replyTo.id)}
//                       className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#A78BFA] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
//                     >
//                       <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
//                         Reply
//                       </div>
//                       <div className="text-xs text-zinc-400 truncate">
//                         {m.replyTo.text}
//                       </div>
//                     </div>
//                   )}

//                   <div
//                     className={`px-4 py-2 text-sm break-words leading-relaxed ${
//                       isMine
//                         ? "bg-[#A78BFA] text-white rounded-2xl rounded-br-md shadow-md shadow-purple-900/20"
//                         : "bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-2xl rounded-bl-md"
//                     }`}
//                   >
//                     {m.text}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//           <div ref={bottomRef} />
//         </div>

//         {typingUsers.length > 0 && (
//           <div className="px-4 pb-2 flex items-center gap-1.5 text-xs text-zinc-500">
//             <span>typing</span>
//             <span className="flex gap-0.5 items-center">
//               <span className="dot" />
//               <span className="dot" />
//               <span className="dot" />
//             </span>
//           </div>
//         )}

//         {replyMessage && (
//           <div className="mx-3 mb-2 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
//             <div className="w-0.5 h-7 rounded-full bg-[#A78BFA] shrink-0" />
//             <div className="flex-1 min-w-0">
//               <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">
//                 Replying
//               </div>
//               <div className="text-xs text-zinc-400 truncate">
//                 {replyMessage.text}
//               </div>
//             </div>
//             <button
//               onClick={() => setReplyMessage(null)}
//               className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-zinc-600 hover:text-white hover:bg-white/10 transition-colors"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         )}

//         <div className="shrink-0 px-3 pb-3 pt-2 flex items-center gap-2 border-t border-white/[0.06] bg-[#0F1620]">
//           <input
//             ref={inputRef}
//             value={text}
//             onChange={handleTyping}
//             onKeyDown={handleKeyDown}
//             placeholder="Message…"
//             className="flex-1 h-10 px-4 rounded-xl bg-white/[0.06] border border-white/[0.07] text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#A78BFA]/40 focus:bg-white/[0.09] transition-colors"
//           />
//           <button
//             onClick={send}
//             disabled={!text.trim()}
//             className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#A78BFA] hover:bg-[#34D399] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-[#A78BFA] transition-colors"
//           >
//             <Send size={15} className="text-white" />
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }
"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import { subscribeToMessages, sendMessage, setTyping } from "@/lib/firestore/chats";
import { getUserById } from "@/lib/firestore/users";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { X, CornerUpLeft, Send, MoreVertical, Trash2 } from "lucide-react";

export default function ChatWindow() {
  const chatId = useChatStore((s) => s.activeChatId);
  const markOpened = useChatStore((s) => s.markOpened);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setMyUid(u?.uid || null));
  }, []);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const [uid1, uid2] = chatId.split("_");
    const otherUid = uid1 === myUid ? uid2 : uid1;
    getUserById(otherUid).then((u) => setOtherUser(u));
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      const data = snap.data();
      if (!data?.typing) return;
      const typingList = Object.entries(data.typing)
        .filter(([uid, val]) => val && uid !== myUid)
        .map(([uid]) => uid);
      setTypingUsers(typingList);
    });
    return () => unsub();
  }, [chatId, myUid]);

  useEffect(() => {
    if (!chatId || !myUid) return;
    markOpened(chatId);
    updateDoc(doc(db, "chats", chatId), { [`unreadCount.${myUid}`]: 0 });
  }, [chatId, myUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    if (!chatId || !myUid) return;
    setTyping(chatId, myUid, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(chatId, myUid!, false);
    }, 1200);
  }

  async function send() {
    if (!text.trim() || !chatId || !myUid) return;
    await sendMessage(chatId, myUid, text, replyMessage);
    setText("");
    setReplyMessage(null);
    setTyping(chatId, myUid, false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  function handleReply(m: any) {
    setReplyMessage(m);
    inputRef.current?.focus();
  }

  function scrollToMessage(id: string) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-flash");
    setTimeout(() => el.classList.remove("highlight-flash"), 1500);
  }

  if (!chatId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
        <span className="text-sm">Select a conversation</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(167, 139, 250, 0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(167, 139, 250, 0.5); }
        .highlight-flash { animation: flash 1.5s ease-out; }
        @keyframes flash { 0%, 30% { background-color: rgba(167, 139, 250, 0.15); border-radius: 12px; } 100% { background-color: transparent; } }
        .reply-btn { opacity: 0; transition: opacity 0.15s; }
        .msg-row:hover .reply-btn { opacity: 1; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #71717a; animation: dotbounce 1.2s infinite; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dotbounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
      `}</style>

      
      <div className="flex flex-col w-full h-full bg-[#0B0F14] text-[#E5E7EB] overflow-hidden">

        <div className="flex-none h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0F1620]">
          <span className="text-sm font-semibold text-white/80 tracking-wide">{otherUser?.username ?? "..."}</span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#151D28] border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-50">
                <button
                  onClick={async () => {
                    if (!chatId) return;
                    await updateDoc(doc(db, "chats", chatId), { [`deleted.${myUid}`]: true });
                    useChatStore.getState().setActiveChat(null);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                >
                  <Trash2 size={14} />
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 min-h-0">
          {messages.map((m) => {
            const isMine = m.senderId === myUid;
            return (
              <div
                key={m.id}
                id={`msg-${m.id}`}
                className={`msg-row flex ${isMine ? "justify-end" : "justify-start"}`}
                onContextMenu={(e) => { e.preventDefault(); handleReply(m); }}
              >
                <div className="relative group max-w-[72%] min-w-0">
                  <button
                    onClick={() => handleReply(m)}
                    title="Reply"
                    className={`reply-btn absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-8" : "-right-8"} w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-[#A78BFA] hover:bg-white/5 transition-colors`}
                  >
                    <CornerUpLeft size={13} />
                  </button>

                  {m.replyTo && (
                    <div
                      onClick={() => scrollToMessage(m.replyTo.id)}
                      className="mb-1 cursor-pointer px-3 py-1.5 rounded-xl rounded-b-sm border-l-2 border-[#A78BFA] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">Reply</div>
                      <div className="text-xs text-zinc-400 truncate">{m.replyTo.text}</div>
                    </div>
                  )}

                  <div className={`px-4 py-2 text-sm break-words leading-relaxed ${isMine ? "bg-[#A78BFA] text-white rounded-2xl rounded-br-md shadow-md shadow-purple-900/20" : "bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-2xl rounded-bl-md"}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex-none border-t border-white/[0.06] bg-[#0F1620]">
          {typingUsers.length > 0 && (
            <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>typing</span>
              <span className="flex gap-0.5 items-center">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          )}

          {replyMessage && (
            <div className="mx-3 mt-2 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="w-0.5 h-7 rounded-full bg-[#A78BFA] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wide mb-0.5">Replying</div>
                <div className="text-xs text-zinc-400 truncate">{replyMessage.text}</div>
              </div>
              <button onClick={() => setReplyMessage(null)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-zinc-600 hover:text-white hover:bg-white/10 transition-colors">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="px-3 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              className="flex-1 h-10 px-4 rounded-xl bg-white/[0.06] border border-white/[0.07] text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#A78BFA]/40 focus:bg-white/[0.09] transition-colors"
            />
            <button
              onClick={send}
              disabled={!text.trim()}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#A78BFA] hover:bg-[#34D399] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-[#A78BFA] transition-colors"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
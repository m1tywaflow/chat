"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { sendMessage, subscribeToMessages } from "@/lib/firestore/chats";

export default function ChatPage() {
  const { chatId } = useParams();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid || null);
    });

    return () => unsub();
  }, []);

  // MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const unsub = subscribeToMessages(chatId as string, setMessages);
    return () => unsub();
  }, [chatId]);

  // SEND MESSAGE
  async function send() {
    if (!text.trim() || !myUid || !chatId) return;

    await sendMessage(chatId as string, myUid, text);
    setText("");
  }

  return (
    <div style={{ padding: 20 }}>
      {/* MESSAGES */}
      <div style={{ height: 400, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.senderId === myUid ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                background: m.senderId === myUid ? "#DCF8C6" : "#eee",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          style={{ flex: 1, padding: 10 }}
        />

        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchUsers, createOrGetChat } from "@/lib/firestore/chats";

export default function UserSearch({ myUid }: { myUid: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  async function onSearch(value: string) {
    if (!value.trim()) {
      setUsers([]);
      return;
    }

    const res = await searchUsers(value.toLowerCase().trim());
    setUsers(res);
  }

  async function openChat(otherUid: string) {
    const chatId = await createOrGetChat(myUid, otherUid);
    router.push(`/chat/${chatId}`);
  }

  return (
    <div style={{ padding: 10 }}>
      {/* INPUT */}
      <input
        placeholder="Search user..."
        onChange={(e) => onSearch(e.target.value)}
        style={{
          padding: 10,
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      />

      {/* RESULTS */}
      <div style={{ marginTop: 15 }}>
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => openChat(u.id)}
            style={{
              padding: 10,
              border: "1px solid #eee",
              marginBottom: 8,
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            👤 {u.username}
          </div>
        ))}
      </div>
    </div>
  );
}

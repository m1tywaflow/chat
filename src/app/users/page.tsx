"use client";

import { useEffect, useState } from "react";
import { searchUsers, createOrGetChat } from "@/lib/firestore/chats";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Search, User } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid || null);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await searchUsers(query);
        setUsers(res);
      } catch (e) {
        console.log(e);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  async function openChat(otherUid: string) {
    if (!myUid) return;

    const chatId = await createOrGetChat(myUid, otherUid);
    router.push(`/chat/${chatId}`);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 className="flex gap-4">
        <Search /> Search users
      </h2>

      <input
        value={query}
        placeholder="Type username..."
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: 10, width: "100%", marginTop: 10 }}
      />

      {loading && <p>Searching...</p>}

      <div style={{ marginTop: 20 }}>
        {users.length === 0 && query && !loading && <p>No users found</p>}

        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => openChat(u.id)}
            style={{
              padding: 12,
              border: "1px solid #eee",
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            <User /> {u.username}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { Gem, X } from "lucide-react";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [joined, setJoined] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setUsername(snap.data().username);
        setAvatar(snap.data().avatar);
        setBio(snap.data().bio || "");
      }
    });

    const date = new Date(user.metadata.creationTime!);
    setJoined(
      date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    );
  }, []);

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1520] border border-white/[0.08] rounded-2xl p-8 w-[280px] flex flex-col items-center gap-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-white/20 hover:text-white/60 transition-colors text-lg"
        >
          <X size={24} />
        </button>
        <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-gradient-to-br from-[#A78BFA] to-[#60A5FA]">
          {avatar && (
            <img src={avatar} className="w-full h-full rounded-full block" />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-white font-semibold text-lg tracking-[0.03em]">
            {username}
          </span>
          <span className="text-[10px] text-white/22 tracking-widest uppercase">
            joined {joined}
          </span>
          <div className="px-3 items-center flex gap-2 py-1 bg-gradient-to-r from-[#A78BFA]/20 to-[#60A5FA]/20 border border-white/10 text-xs text-white">
            Early Member
            <span>
              <Gem color="yellow" />
            </span>
          </div>
        </div>
        {bio && (
          <p className="text-xs text-white/40 text-center leading-relaxed">
            {bio}
          </p>
        )}
        <div className="w-full h-px bg-white/[0.06]" />
        <button
          onClick={logout}
          className="text-[11px] text-red-400/55 hover:text-red-400/85 tracking-widest transition-colors"
        >
          log out
        </button>
      </div>
    </div>
  );
}

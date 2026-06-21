// "use client";

// import { useEffect, useState } from "react";
// import { signOut } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import { auth, db } from "@/lib/firebase";
// import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
// import { Gem, X } from "lucide-react";

// export default function ProfileModal({ onClose }: { onClose: () => void }) {
//   const router = useRouter();

//   const [username, setUsername] = useState("");
//   const [avatar, setAvatar] = useState("");
//   const [joined, setJoined] = useState("");
//   const [bio, setBio] = useState("");
//   const [gifts, setGifts] = useState<string[]>([]);

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (!user) return;

//     getDoc(doc(db, "users", user.uid)).then((snap) => {
//       if (snap.exists()) {
//         const data = snap.data();

//         setUsername(data.username || "");
//         setAvatar(data.avatar || "");
//         setBio(data.bio || "");
//         setGifts(data.gifts || []);
//       }
//     });

//     const date = new Date(user.metadata.creationTime!);

//     setJoined(
//       date.toLocaleDateString("en-US", {
//         month: "long",
//         year: "numeric",
//       })
//     );
//   }, []);

//   async function logout() {
//     await signOut(auth);
//     router.push("/login");
//   }

//   return (
//     <div
//       className="fixed inset-0 bg-black/55 flex items-center justify-center z-50"
//       onClick={onClose}
//     >
//       <div
//         className="bg-[#0f1520] border border-white/[0.08] rounded-2xl p-8 w-[320px] flex flex-col items-center gap-5 relative"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-4 text-white/20 hover:text-white/60 transition-colors"
//         >
//           <X size={24} />
//         </button>

//         <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-gradient-to-br from-[#A78BFA] to-[#60A5FA]">
//           {avatar && (
//             <img
//               src={avatar}
//               alt="avatar"
//               className="w-full h-full rounded-full object-cover"
//             />
//           )}
//         </div>

//         <div className="flex flex-col items-center gap-1">
//           <span className="text-white font-semibold text-lg tracking-[0.03em]">
//             {username}
//           </span>

//           <span className="text-[10px] text-white/22 tracking-widest uppercase">
//             joined {joined}
//           </span>

//           <div className="px-3 py-1 flex items-center gap-2 bg-gradient-to-r from-[#A78BFA]/20 to-[#60A5FA]/20 border border-white/10 text-xs text-white rounded-lg">
//             Early Member
//             <Gem size={14} color="gold" />
//           </div>
//         </div>

//         {bio && (
//           <p className="text-xs text-white/40 text-center leading-relaxed">
//             {bio}
//           </p>
//         )}

//         {gifts.length > 0 && (
//           <div className="w-full overflow-hidden">
//             <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] text-center mb-3">
//               Gifts
//             </div>

//             <div className="grid grid-cols-2 gap-6 justify-center">
//               {Array(2)
//                 .fill(gifts)
//                 .flat()
//                 .map((giftId, i) => {
//                   const gift = GIFTS[giftId];
//                   if (!gift) return null;

//                   return (
//                     <div
//                       key={giftId + i}
//                       className="flex flex-col items-center gap-1 shrink-0"
//                     >
//                       <div
//                         className="w-42 h-42 rounded-2xl flex items-center justify-center"
//                         style={{
//                           background: `${RARITY_COLORS[gift.rarity]}15`,
//                           border: `1px solid ${RARITY_COLORS[gift.rarity]}40`,
//                         }}
//                       >
//                         <img
//                           src={gift.imageUrl}
//                           alt={gift.name}
//                           className="w-40 h-40 object-contain"
//                         />
//                       </div>

//                       <span
//                         className="text-[10px]"
//                         style={{ color: RARITY_COLORS[gift.rarity] }}
//                       >
//                         {gift.name}
//                       </span>
//                     </div>
//                   );
//                 })}
//             </div>
//           </div>
//         )}

//         <div className="w-full h-px bg-white/[0.06]" />

//         <button
//           onClick={logout}
//           className="text-[11px] text-red-400/55 hover:text-red-400 tracking-widest transition-colors"
//         >
//           LOG OUT
//         </button>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { Gem, X } from "lucide-react";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [joined, setJoined] = useState("");
  const [bio, setBio] = useState("");
  const [gifts, setGifts] = useState<string[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setAvatar(data.avatar || "");
        setBio(data.bio || "");
        setGifts(data.gifts || []);
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
        className="bg-[#0f1520] border border-white/[0.08] rounded-2xl p-8 w-[320px] flex flex-col items-center gap-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-white/20 hover:text-white/60 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-gradient-to-br from-[#A78BFA] to-[#60A5FA]">
          {avatar && (
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-white font-semibold text-lg tracking-[0.03em]">
            {username}
          </span>
          <span className="text-[10px] text-white/22 tracking-widest uppercase">
            joined {joined}
          </span>
          <div className="px-3 py-1 flex items-center gap-2 bg-gradient-to-r from-[#A78BFA]/20 to-[#60A5FA]/20 border border-white/10 text-xs text-white rounded-lg">
            Early Member
            <Gem size={14} color="gold" />
          </div>
        </div>

        {bio && (
          <p className="text-xs text-white/40 text-center leading-relaxed">
            {bio}
          </p>
        )}

        {gifts.length > 0 && (
          <div className="w-full">
            <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] text-center mb-3">
              Gifts
            </div>
            <div className="grid grid-cols-2 gap-3">
              {gifts.map((giftId, i) => {
                const gift = GIFTS[giftId];
                if (!gift) return null;
                return (
                  <div
                    key={giftId + i}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-full aspect-square rounded-2xl flex items-center justify-center"
                      style={{
                        background: `${RARITY_COLORS[gift.rarity]}15`,
                        border: `1px solid ${RARITY_COLORS[gift.rarity]}40`,
                      }}
                    >
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        className="w-4/5 h-4/5 object-contain"
                      />
                    </div>
                    <span
                      className="text-[10px]"
                      style={{ color: RARITY_COLORS[gift.rarity] }}
                    >
                      {gift.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full h-px bg-white/[0.06]" />

        <button
          onClick={logout}
          className="text-[11px] text-red-400/55 hover:text-red-400 tracking-widest transition-colors"
        >
          LOG OUT
        </button>
      </div>
    </div>
  );
}

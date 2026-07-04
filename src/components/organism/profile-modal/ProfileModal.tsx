// "use client";

// import { useEffect, useState, useRef } from "react";
// import { signOut } from "firebase/auth";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import { auth, db } from "@/lib/firebase";
// import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
// import { Gem, X, Pencil, Check, Upload, Pipette } from "lucide-react";
// import ImageCropper from "../image-cropper/ImageCropper";
// import { AVATAR_DECORATIONS } from "@/lib/avatarDecorations";
// import FullProfileView from "./Fullprofileview";

// const BANNER_PRESETS = [
//   { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
//   { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
//   { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
//   { id: "indigo-purple", value: "linear-gradient(135deg, #6366F1, #A78BFA)" },
//   { id: "rose-pink", value: "linear-gradient(135deg, #FB7185, #F472B6)" },
//   { id: "amber-red", value: "linear-gradient(135deg, #FBBF24, #EF4444)" },
//   { id: "sky-indigo", value: "linear-gradient(135deg, #38BDF8, #6366F1)" },
//   { id: "dark", value: "linear-gradient(135deg, #1e2535, #0B0F14)" },
// ];

// const AVATAR_BORDERS = [
//   { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
//   { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
//   { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
//   { id: "gold", value: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
//   { id: "rose", value: "linear-gradient(135deg, #FB7185, #E11D48)" },
//   { id: "white", value: "linear-gradient(135deg, #ffffff, #d1d5db)" },
// ];

// const CARD_COLOR_PRESETS = [
//   "#0f1520",
//   "#1a1025",
//   "#0d1a1a",
//   "#1a1000",
//   "#0d0d1a",
//   "#1a0d0d",
//   "#0d1a10",
//   "#12121a",
// ];

// async function uploadToCloudinary(
//   file: Blob | File,
//   folder: string
// ): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", folder);
//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.secure_url;
// }

// interface ProfileModalProps {
//   onClose: () => void;
//   userId?: string;
// }

// type CropTarget = "banner" | "avatar" | null;

// export default function ProfileModal({ onClose, userId }: ProfileModalProps) {
//   const router = useRouter();
//   const bannerInputRef = useRef<HTMLInputElement>(null);
//   const avatarInputRef = useRef<HTMLInputElement>(null);
//   const colorInputRef = useRef<HTMLInputElement>(null);

//   const [username, setUsername] = useState("");
//   const [avatar, setAvatar] = useState("");
//   const [joined, setJoined] = useState("");
//   const [bio, setBio] = useState("");
//   const [gifts, setGifts] = useState<string[]>([]);
//   const [bannerGradient, setBannerGradient] = useState(BANNER_PRESETS[0].value);
//   const [avatarBorder, setAvatarBorder] = useState(AVATAR_BORDERS[0].value);
//   const [cardColor, setCardColor] = useState("#0f1520");
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [draftBanner, setDraftBanner] = useState(BANNER_PRESETS[0].value);
//   const [draftBorder, setDraftBorder] = useState(AVATAR_BORDERS[0].value);
//   const [draftCardColor, setDraftCardColor] = useState("#0f1520");
//   const [bannerIsImage, setBannerIsImage] = useState(false);
//   const [draftBannerIsImage, setDraftBannerIsImage] = useState(false);
//   const [bannerUploading, setBannerUploading] = useState(false);
//   const [avatarUploading, setAvatarUploading] = useState(false);
//   const [bannerLocalPreview, setBannerLocalPreview] = useState<string | null>(
//     null
//   );
//   const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(
//     null
//   );
//   const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
//   const [cropSrc, setCropSrc] = useState<string | null>(null);
//   const [cropTarget, setCropTarget] = useState<CropTarget>(null);
//   const [giftModal, setGiftModal] = useState<string | null>(null);
//   const [avatarDecoration, setAvatarDecoration] = useState<string | null>(null);
//   const [draftDecoration, setDraftDecoration] = useState<string | null>(null);
//   const [featuredGift, setFeaturedGift] = useState<string | null>(null);
//   const [draftFeaturedGift, setDraftFeaturedGift] = useState<string | null>(
//     null
//   );
//   const [showFullProfile, setShowFullProfile] = useState(false);

//   const currentUser = auth.currentUser;
//   const targetUid = userId ?? currentUser?.uid;
//   const isOwnProfile = !userId || userId === currentUser?.uid;

//   useEffect(() => {
//     if (!targetUid) return;
//     getDoc(doc(db, "users", targetUid)).then((snap) => {
//       if (snap.exists()) {
//         const data = snap.data();
//         setUsername(data.username || "");
//         setAvatar(data.avatar || "");
//         setBio(data.bio || "");
//         setGifts(data.gifts || []);
//         const bg = data.bannerGradient || BANNER_PRESETS[0].value;
//         const isImg = data.bannerIsImage || false;
//         const ab = data.avatarBorder || AVATAR_BORDERS[0].value;
//         const cc = data.cardColor || "#0f1520";
//         setBannerGradient(bg);
//         setBannerIsImage(isImg);
//         setAvatarBorder(ab);
//         setCardColor(cc);
//         setDraftBanner(bg);
//         setDraftBannerIsImage(isImg);
//         setDraftBorder(ab);
//         setDraftCardColor(cc);
//         const dec = data.avatarDecoration || null;
//         setAvatarDecoration(dec);
//         setDraftDecoration(dec);
//         setFeaturedGift(data.featuredGift || null);
//         setDraftFeaturedGift(data.featuredGift || null);
//       }
//     });
//     if (userId) return;
//     const user = auth.currentUser;
//     if (!user) return;
//     const date = new Date(user.metadata.creationTime!);
//     setJoined(
//       date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
//     );
//   }, [targetUid]);

//   function openEdit() {
//     setDraftBanner(bannerGradient);
//     setDraftBannerIsImage(bannerIsImage);
//     setDraftBorder(avatarBorder);
//     setDraftCardColor(cardColor);
//     setDraftAvatar(null);
//     setBannerLocalPreview(null);
//     setAvatarLocalPreview(null);
//     setDraftDecoration(avatarDecoration);
//     setEditing(true);
//     setDraftFeaturedGift(featuredGift);
//   }

//   function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = "";
//     if (file.type === "image/gif") {
//       const preview = URL.createObjectURL(file);
//       setBannerLocalPreview(preview);
//       setBannerUploading(true);
//       uploadToCloudinary(file, "banners")
//         .then((url) => {
//           setDraftBanner(url);
//           setDraftBannerIsImage(true);
//         })
//         .catch((err) => {
//           console.error("Banner upload failed:", err);
//           setBannerLocalPreview(null);
//         })
//         .finally(() => setBannerUploading(false));
//       return;
//     }
//     setCropSrc(URL.createObjectURL(file));
//     setCropTarget("banner");
//   }

//   function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = "";
//     if (file.type === "image/gif") {
//       const preview = URL.createObjectURL(file);
//       setAvatarLocalPreview(preview);
//       setAvatarUploading(true);
//       uploadToCloudinary(file, "avatars")
//         .then((url) => {
//           setDraftAvatar(url);
//         })
//         .catch((err) => {
//           console.error("Avatar upload failed:", err);
//           setAvatarLocalPreview(null);
//         })
//         .finally(() => setAvatarUploading(false));
//       return;
//     }
//     setCropSrc(URL.createObjectURL(file));
//     setCropTarget("avatar");
//   }

//   async function handleCropConfirm(blob: Blob) {
//     setCropSrc(null);
//     if (cropTarget === "banner") {
//       const preview = URL.createObjectURL(blob);
//       setBannerLocalPreview(preview);
//       setBannerUploading(true);
//       try {
//         const url = await uploadToCloudinary(blob, "banners");
//         setDraftBanner(url);
//         setDraftBannerIsImage(true);
//       } catch (err) {
//         console.error("Banner upload failed:", err);
//         setBannerLocalPreview(null);
//       } finally {
//         setBannerUploading(false);
//       }
//     } else if (cropTarget === "avatar") {
//       const preview = URL.createObjectURL(blob);
//       setAvatarLocalPreview(preview);
//       setAvatarUploading(true);
//       try {
//         const url = await uploadToCloudinary(blob, "avatars");
//         setDraftAvatar(url);
//       } catch (err) {
//         console.error("Avatar upload failed:", err);
//         setAvatarLocalPreview(null);
//       } finally {
//         setAvatarUploading(false);
//       }
//     }
//     setCropTarget(null);
//   }

//   function handleCropCancel() {
//     setCropSrc(null);
//     setCropTarget(null);
//   }

//   async function saveEdit() {
//     const user = auth.currentUser;
//     if (!user) return;
//     setSaving(true);
//     try {
//       const updates: Record<string, any> = {
//         bannerGradient: draftBanner,
//         bannerIsImage: draftBannerIsImage,
//         avatarBorder: draftBorder,
//         cardColor: draftCardColor,
//         avatarDecoration: draftDecoration,
//         featuredGift: draftFeaturedGift ?? null,
//       };
//       if (draftAvatar) updates.avatar = draftAvatar;
//       await updateDoc(doc(db, "users", user.uid), updates);
//       setBannerGradient(draftBanner);
//       setBannerIsImage(draftBannerIsImage);
//       setAvatarBorder(draftBorder);
//       setCardColor(draftCardColor);
//       if (draftAvatar) setAvatar(draftAvatar);
//       setEditing(false);
//     } finally {
//       setSaving(false);
//       setBannerLocalPreview(null);
//       setAvatarLocalPreview(null);
//       setDraftAvatar(null);
//       setAvatarDecoration(draftDecoration);
//       setFeaturedGift(draftFeaturedGift);
//     }
//   }

//   async function logout() {
//     await signOut(auth);
//     router.push("/login");
//   }

//   const activeBannerValue = editing
//     ? bannerLocalPreview || draftBanner
//     : bannerGradient;
//   const activeBannerIsImage = editing
//     ? !!bannerLocalPreview || draftBannerIsImage
//     : bannerIsImage;
//   const activeBorder = editing ? draftBorder : avatarBorder;
//   const activeDecoration = editing ? draftDecoration : avatarDecoration;
//   const activeAvatar = editing
//     ? avatarLocalPreview || draftAvatar || avatar
//     : avatar;
//   const activeCardColor = editing ? draftCardColor : cardColor;
//   const bannerStyle = activeBannerIsImage
//     ? {
//         backgroundImage: `url(${activeBannerValue})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }
//     : { background: activeBannerValue };

//   return (
//     <>
//       <style>{`
//         @keyframes shimmer {
//           0% { transform: translateX(-100%); }
//           60%, 100% { transform: translateX(200%); }
//         }
//         @keyframes gemBob {
//           0%, 100% { transform: translateY(0) rotate(0deg); }
//           40% { transform: translateY(-2px) rotate(-8deg); }
//           60% { transform: translateY(-1px) rotate(5deg); }
//         }
//         @keyframes giftModalIn {
//           from { opacity: 0; transform: scale(0.92) translateY(6px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }
//       `}</style>

//       {cropSrc && (
//         <ImageCropper
//           src={cropSrc}
//           aspectRatio={cropTarget === "banner" ? 320 / 88 : 1}
//           onConfirm={handleCropConfirm}
//           onCancel={handleCropCancel}
//           label={cropTarget === "banner" ? "Adjust banner" : "Adjust avatar"}
//         />
//       )}

//       <div
//         className="fixed inset-0 bg-black/55 flex items-center justify-center z-50"
//         onClick={onClose}
//       >
//         <div
//           className="border border-white/[0.08] rounded-2xl w-[320px] flex flex-col items-center relative overflow-hidden transition-colors duration-200"
//           style={{ backgroundColor: activeCardColor }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* gift modal overlay */}
//           {giftModal &&
//             (() => {
//               const gift = GIFTS[giftModal];
//               if (!gift) return null;
//               const color = RARITY_COLORS[gift.rarity];

//               const rarityBg: Record<string, string> = {
//                 common: "linear-gradient(160deg, #3f3f46, #27272a)",
//                 rare: "linear-gradient(160deg, #1e3a5f, #1e2a4a)",
//                 epic: "linear-gradient(160deg, #3b1f6e, #2d1a5a)",
//                 legendary: "linear-gradient(160deg, #D9A827, #9E7510)",
//                 unreal: "linear-gradient(160deg, #D90CED, #520661)",
//                 divine: "linear-gradient(160deg, #FFF8DC)",
//                 unusual: "linear-gradient(160deg, #7d5279, #7d5279)",
//               };

//               return (
//                 <div
//                   className="absolute inset-0 z-20 flex flex-col rounded-2xl overflow-hidden"
//                   style={{
//                     animation:
//                       "giftModalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
//                   }}
//                 >
//                   {/* art */}
//                   <div
//                     className="relative flex items-center justify-center flex-1"
//                     style={{ background: rarityBg[gift.rarity] }}
//                   >
//                     <div
//                       className="absolute inset-0 opacity-[0.07]"
//                       style={{
//                         backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
//                         backgroundSize: "24px 24px",
//                       }}
//                     />
//                     <img
//                       src={gift.imageUrl}
//                       alt={gift.name}
//                       className="w-56 h-56 object-contain drop-shadow-2xl relative z-10"
//                       style={{ filter: `drop-shadow(0 0 32px ${color}60)` }}
//                     />
//                     <button
//                       onClick={() => setGiftModal(null)}
//                       className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
//                     >
//                       <X size={15} />
//                     </button>
//                   </div>
//                   {/* info */}
//                   <div
//                     className="flex flex-col items-center gap-3 px-6 py-5"
//                     style={{ backgroundColor: activeCardColor }}
//                   >
//                     <div className="flex flex-col items-center gap-1.5">
//                       <span className="text-white font-bold text-base tracking-wide">
//                         {gift.name}
//                       </span>
//                       <span
//                         className="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full"
//                         style={{
//                           color,
//                           backgroundColor: `${color}18`,
//                           border: `1px solid ${color}40`,
//                         }}
//                       >
//                         {gift.rarity}
//                       </span>
//                     </div>
//                     <div className="w-full rounded-xl overflow-hidden border border-white/[0.07]">
//                       {[
//                         {
//                           label: "Rarity",
//                           value:
//                             gift.rarity.charAt(0).toUpperCase() +
//                             gift.rarity.slice(1),
//                         },
//                         { label: "Gift ID", value: gift.id },
//                       ].map(({ label, value }, i, arr) => (
//                         <div
//                           key={label}
//                           className={`flex items-center justify-between px-4 py-2.5 text-sm ${
//                             i < arr.length - 1
//                               ? "border-b border-white/[0.05]"
//                               : ""
//                           }`}
//                           style={{ backgroundColor: `${activeCardColor}` }}
//                         >
//                           <span className="text-white/40 text-xs">{label}</span>
//                           <span
//                             className="text-white/80 text-xs font-medium"
//                             style={label === "Rarity" ? { color } : {}}
//                           >
//                             {value}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                     <button
//                       onClick={() => setGiftModal(null)}
//                       className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
//                       style={{
//                         backgroundColor: `${color}22`,
//                         color,
//                         border: `1px solid ${color}40`,
//                       }}
//                     >
//                       OK
//                     </button>
//                   </div>
//                 </div>
//               );
//             })()}

//           {/* banner */}
//           <div
//             className="w-full h-[88px] relative z-0 shrink-0"
//             style={bannerStyle}
//           >
//             {bannerUploading && (
//               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               </div>
//             )}
//             {editing && (
//               <button
//                 onClick={() => bannerInputRef.current?.click()}
//                 className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group"
//               >
//                 <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white text-[11px] tracking-widest transition-colors">
//                   <Upload size={13} />
//                   {bannerUploading ? "UPLOADING..." : "CHANGE BANNER"}
//                 </div>
//               </button>
//             )}
//             <button
//               onClick={onClose}
//               className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors bg-black/20 rounded-full p-0.5"
//             >
//               <X size={18} />
//             </button>
//           </div>

//           <div className="w-full flex flex-col items-center px-8 pb-7 relative">
//             {/* avatar */}
//             <div
//               className="relative z-10 -mt-9 mb-3 shrink-0 flex items-center justify-center"
//               style={{ width: 122, height: 102, overflow: "visible" }}
//             >
//               {activeDecoration &&
//                 (() => {
//                   const dec = AVATAR_DECORATIONS.find(
//                     (d) => d.url === activeDecoration
//                   );
//                   return (
//                     <img
//                       src={activeDecoration}
//                       alt=""
//                       className="absolute pointer-events-none select-none"
//                       style={{
//                         width: 160,
//                         height: 160,
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         objectFit: "contain",
//                         zIndex: 10,
//                         mixBlendMode: (dec?.blendMode as any) || "normal",
//                       }}
//                     />
//                   );
//                 })()}

//               <div
//                 className="rounded-full p-[2.5px] absolute"
//                 style={{
//                   background: activeBorder,
//                   width: 72,
//                   height: 72,
//                   top: "50%",
//                   left: "50%",
//                   transform: "translate(-50%, -50%)",
//                 }}
//               >
//                 <div
//                   className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
//                   style={{ backgroundColor: activeCardColor }}
//                 >
//                   {avatarUploading ? (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                     </div>
//                   ) : activeAvatar ? (
//                     <img
//                       src={activeAvatar}
//                       alt="avatar"
//                       className="w-full h-full rounded-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-white text-lg font-medium">
//                       {username?.[0]?.toUpperCase()}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {editing && (
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   className="absolute rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
//                   style={{
//                     width: 72,
//                     height: 72,
//                     top: "50%",
//                     left: "50%",
//                     transform: "translate(-50%, -50%)",
//                     zIndex: 20,
//                   }}
//                 >
//                   <Upload
//                     size={14}
//                     className="text-white/60 hover:text-white"
//                   />
//                 </button>
//               )}
//             </div>

//             <input
//               ref={bannerInputRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={handleBannerFileChange}
//             />
//             <input
//               ref={avatarInputRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={handleAvatarFileChange}
//             />
//             <input
//               ref={colorInputRef}
//               type="color"
//               className="hidden"
//               value={draftCardColor}
//               onChange={(e) => setDraftCardColor(e.target.value)}
//             />

//             {/* Username / joined / badge */}
//             <div className="flex flex-col items-center gap-1 mb-4">
//               <div className="flex items-center gap-2">
//                 <span className="text-white font-semibold text-lg tracking-[0.03em]">
//                   {username}
//                 </span>
//                 {featuredGift &&
//                   (() => {
//                     const gift = GIFTS[featuredGift];
//                     if (!gift) return null;
//                     return (
//                       <img
//                         src={gift.imageUrl}
//                         alt={gift.name}
//                         title={gift.name}
//                         className="w-6 h-6 object-contain shrink-0"
//                         style={{
//                           filter: `drop-shadow(0 0 4px ${
//                             RARITY_COLORS[gift.rarity]
//                           }90)`,
//                         }}
//                       />
//                     );
//                   })()}
//               </div>
//               <span className="text-[10px] text-white/22 tracking-widest uppercase">
//                 joined {joined}
//               </span>
//               <div className="mt-1 px-3 py-1.5 flex items-center gap-2 rounded-xl relative overflow-hidden border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10">
//                 <span
//                   className="text-xs font-semibold tracking-wide"
//                   style={{
//                     background:
//                       "linear-gradient(90deg, #FBBF24, #A78BFA, #FBBF24)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}
//                 >
//                   Early Member
//                 </span>
//                 <Gem
//                   size={13}
//                   className="shrink-0 text-amber-400"
//                   style={{ animation: "gemBob 2.5s ease-in-out infinite" }}
//                 />
//                 <div
//                   className="absolute inset-0 pointer-events-none"
//                   style={{
//                     background:
//                       "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)",
//                     animation: "shimmer 2.8s ease-in-out infinite",
//                   }}
//                 />
//               </div>
//             </div>

//             {bio && !editing && (
//               <p className="text-xs text-white/40 text-center leading-relaxed mb-4">
//                 {bio}
//               </p>
//             )}

//             {editing ? (
//               <div className="w-full flex flex-col gap-5 mb-5">
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Banner
//                   </p>
//                   <div className="grid grid-cols-4 gap-2">
//                     {BANNER_PRESETS.map((p) => (
//                       <button
//                         key={p.id}
//                         onClick={() => {
//                           setDraftBanner(p.value);
//                           setDraftBannerIsImage(false);
//                           setBannerLocalPreview(null);
//                         }}
//                         className="h-8 rounded-lg transition-all"
//                         style={{
//                           background: p.value,
//                           outline:
//                             !draftBannerIsImage &&
//                             !bannerLocalPreview &&
//                             draftBanner === p.value
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Avatar border
//                   </p>
//                   <div className="grid grid-cols-6 gap-2">
//                     {AVATAR_BORDERS.map((b) => (
//                       <button
//                         key={b.id}
//                         onClick={() => setDraftBorder(b.value)}
//                         className="h-7 rounded-full transition-all"
//                         style={{
//                           background: b.value,
//                           outline:
//                             draftBorder === b.value
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Decoration
//                   </p>
//                   <div className="flex gap-2 flex-wrap">
//                     {AVATAR_DECORATIONS.map((d) => (
//                       <button
//                         key={d.id}
//                         onClick={() => setDraftDecoration(d.url)}
//                         className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
//                         style={{
//                           background: "rgba(255,255,255,0.05)",
//                           outline:
//                             draftDecoration === d.url
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       >
//                         {d.url ? (
//                           <img
//                             src={d.url}
//                             alt={d.label}
//                             className="w-full h-full object-contain"
//                           />
//                         ) : (
//                           <span className="text-white/30 text-[10px]">
//                             None
//                           </span>
//                         )}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 {gifts.length > 0 && (
//                   <div>
//                     <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                       Featured gift
//                     </p>
//                     <div className="flex gap-2 flex-wrap">
//                       <button
//                         onClick={() => setDraftFeaturedGift(null)}
//                         className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] border transition-all"
//                         style={{
//                           background: "rgba(255,255,255,0.04)",
//                           borderColor: "rgba(255,255,255,0.1)",
//                           color: "rgba(255,255,255,0.3)",
//                           outline:
//                             draftFeaturedGift === null
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       >
//                         ✕
//                       </button>
//                       {gifts.map((giftId) => {
//                         const gift = GIFTS[giftId];
//                         if (!gift) return null;
//                         return (
//                           <button
//                             key={giftId}
//                             onClick={() => setDraftFeaturedGift(giftId)}
//                             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
//                             style={{
//                               background: `${RARITY_COLORS[gift.rarity]}15`,
//                               border: `1px solid ${
//                                 RARITY_COLORS[gift.rarity]
//                               }40`,
//                               outline:
//                                 draftFeaturedGift === giftId
//                                   ? "2px solid #A78BFA"
//                                   : "2px solid transparent",
//                               outlineOffset: "2px",
//                             }}
//                           >
//                             <img
//                               src={gift.imageUrl}
//                               alt={gift.name}
//                               className="w-7 h-7 object-contain"
//                             />
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Card color
//                   </p>
//                   <div className="flex items-center gap-2">
//                     <div className="grid grid-cols-8 gap-1.5 flex-1">
//                       {CARD_COLOR_PRESETS.map((c) => (
//                         <button
//                           key={c}
//                           onClick={() => setDraftCardColor(c)}
//                           className="h-6 rounded-md transition-all"
//                           style={{
//                             backgroundColor: c,
//                             border:
//                               draftCardColor === c
//                                 ? "2px solid #A78BFA"
//                                 : "2px solid rgba(255,255,255,0.1)",
//                           }}
//                         />
//                       ))}
//                     </div>
//                     <button
//                       onClick={() => colorInputRef.current?.click()}
//                       title="Custom color"
//                       className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.10] hover:border-[#A78BFA]/50 text-white/40 hover:text-[#A78BFA] transition-colors relative overflow-hidden"
//                       style={{ backgroundColor: draftCardColor }}
//                     >
//                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
//                         <Pipette size={13} className="text-white/70" />
//                       </div>
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                       setEditing(false);
//                       setBannerLocalPreview(null);
//                       setAvatarLocalPreview(null);
//                       setDraftAvatar(null);
//                     }}
//                     className="flex-1 py-2 text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-lg transition-colors tracking-widest"
//                   >
//                     CANCEL
//                   </button>
//                   <button
//                     onClick={saveEdit}
//                     disabled={saving || bannerUploading || avatarUploading}
//                     className="flex-1 py-2 text-[11px] text-[#A78BFA] hover:text-white border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
//                   >
//                     {saving ? (
//                       "SAVING..."
//                     ) : (
//                       <>
//                         <Check size={12} /> SAVE
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 {gifts.length > 0 && (
//                   <div className="w-full mb-4">
//                     <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] text-center mb-3">
//                       Gifts
//                     </div>
//                     <div
//                       className={`grid grid-cols-2 gap-4 ${
//                         gifts.length > 4
//                           ? "max-h-[380px] overflow-y-auto pr-1"
//                           : ""
//                       }`}
//                       style={
//                         gifts.length > 4
//                           ? {
//                               scrollbarWidth: "thin",
//                               scrollbarColor: "#A78BFA40 transparent",
//                             }
//                           : {}
//                       }
//                     >
//                       {gifts.map((giftId, i) => {
//                         const gift = GIFTS[giftId];
//                         if (!gift) return null;
//                         return (
//                           <button
//                             key={giftId + i}
//                             onClick={() => setGiftModal(giftId)}
//                             className="flex flex-col items-center gap-1.5 group cursor-pointer"
//                           >
//                             <div
//                               className="w-full aspect-square rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
//                               style={{
//                                 background: `${RARITY_COLORS[gift.rarity]}15`,
//                                 border: `1px solid ${
//                                   RARITY_COLORS[gift.rarity]
//                                 }40`,
//                               }}
//                             >
//                               <img
//                                 src={gift.imageUrl}
//                                 alt={gift.name}
//                                 className="w-4/5 h-4/5 object-contain"
//                               />
//                             </div>
//                             <span
//                               className="text-[10px]"
//                               style={{ color: RARITY_COLORS[gift.rarity] }}
//                             >
//                               {gift.name}
//                             </span>
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 <div className="w-full h-px bg-white/[0.06] mb-4" />

//                 <div className="flex items-center justify-between w-full">
//                   {isOwnProfile ? (
//                     <button
//                       onClick={logout}
//                       className="text-[11px] text-red-400/55 hover:text-red-400 tracking-widest transition-colors"
//                     >
//                       LOG OUT
//                     </button>
//                   ) : (
//                     <div />
//                   )}
//                   {isOwnProfile && (
//                     <button
//                       onClick={openEdit}
//                       className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 tracking-widest transition-colors"
//                     >
//                       <Pencil size={12} />
//                       EDIT
//                     </button>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { signOut } from "firebase/auth";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import { auth, db } from "@/lib/firebase";
// import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
// import { Gem, X, Pencil, Check, Upload, Pipette } from "lucide-react";
// import ImageCropper from "../image-cropper/ImageCropper";
// import { AVATAR_DECORATIONS } from "@/lib/avatarDecorations";
// import FullProfileView from "./Fullprofileview";
// import { BADGE } from "@/lib/badge";

// const BANNER_PRESETS = [
//   { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
//   { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
//   { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
//   { id: "indigo-purple", value: "linear-gradient(135deg, #6366F1, #A78BFA)" },
//   { id: "rose-pink", value: "linear-gradient(135deg, #FB7185, #F472B6)" },
//   { id: "amber-red", value: "linear-gradient(135deg, #FBBF24, #EF4444)" },
//   { id: "sky-indigo", value: "linear-gradient(135deg, #38BDF8, #6366F1)" },
//   { id: "dark", value: "linear-gradient(135deg, #1e2535, #0B0F14)" },
// ];

// const AVATAR_BORDERS = [
//   { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
//   { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
//   { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
//   { id: "gold", value: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
//   { id: "rose", value: "linear-gradient(135deg, #FB7185, #E11D48)" },
//   { id: "white", value: "linear-gradient(135deg, #ffffff, #d1d5db)" },
// ];

// const CARD_COLOR_PRESETS = [
//   "#0f1520",
//   "#1a1025",
//   "#0d1a1a",
//   "#1a1000",
//   "#0d0d1a",
//   "#1a0d0d",
//   "#0d1a10",
//   "#12121a",
// ];

// async function uploadToCloudinary(
//   file: Blob | File,
//   folder: string
// ): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", folder);
//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.secure_url;
// }

// interface ProfileModalProps {
//   onClose: () => void;
//   userId?: string;
// }

// type CropTarget = "banner" | "avatar" | null;

// export default function ProfileModal({ onClose, userId }: ProfileModalProps) {
//   const router = useRouter();
//   const bannerInputRef = useRef<HTMLInputElement>(null);
//   const avatarInputRef = useRef<HTMLInputElement>(null);
//   const colorInputRef = useRef<HTMLInputElement>(null);

//   const [username, setUsername] = useState("");
//   const [avatar, setAvatar] = useState("");
//   const [joined, setJoined] = useState("");
//   const [bio, setBio] = useState("");
//   const [gifts, setGifts] = useState<string[]>([]);
//   const [badges, setBadges] = useState<string[]>([]);
//   const [bannerGradient, setBannerGradient] = useState(BANNER_PRESETS[0].value);
//   const [avatarBorder, setAvatarBorder] = useState(AVATAR_BORDERS[0].value);
//   const [cardColor, setCardColor] = useState("#0f1520");
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [draftBanner, setDraftBanner] = useState(BANNER_PRESETS[0].value);
//   const [draftBorder, setDraftBorder] = useState(AVATAR_BORDERS[0].value);
//   const [draftCardColor, setDraftCardColor] = useState("#0f1520");
//   const [bannerIsImage, setBannerIsImage] = useState(false);
//   const [draftBannerIsImage, setDraftBannerIsImage] = useState(false);
//   const [bannerUploading, setBannerUploading] = useState(false);
//   const [avatarUploading, setAvatarUploading] = useState(false);
//   const [bannerLocalPreview, setBannerLocalPreview] = useState<string | null>(
//     null
//   );
//   const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(
//     null
//   );
//   const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
//   const [cropSrc, setCropSrc] = useState<string | null>(null);
//   const [cropTarget, setCropTarget] = useState<CropTarget>(null);
//   const [giftModal, setGiftModal] = useState<string | null>(null);
//   const [avatarDecoration, setAvatarDecoration] = useState<string | null>(null);
//   const [draftDecoration, setDraftDecoration] = useState<string | null>(null);
//   const [featuredGift, setFeaturedGift] = useState<string | null>(null);
//   const [draftFeaturedGift, setDraftFeaturedGift] = useState<string | null>(
//     null
//   );
//   const [showFullProfile, setShowFullProfile] = useState(false);

//   const currentUser = auth.currentUser;
//   const targetUid = userId ?? currentUser?.uid;
//   const isOwnProfile = !userId || userId === currentUser?.uid;

//   useEffect(() => {
//     if (!targetUid) return;
//     getDoc(doc(db, "users", targetUid)).then((snap) => {
//       if (snap.exists()) {
//         const data = snap.data();
//         setUsername(data.username || "");
//         setAvatar(data.avatar || "");
//         setBio(data.bio || "");
//         setGifts(data.gifts || []);
//         setBadges(data.badges || []);
//         const bg = data.bannerGradient || BANNER_PRESETS[0].value;
//         const isImg = data.bannerIsImage || false;
//         const ab = data.avatarBorder || AVATAR_BORDERS[0].value;
//         const cc = data.cardColor || "#0f1520";
//         setBannerGradient(bg);
//         setBannerIsImage(isImg);
//         setAvatarBorder(ab);
//         setCardColor(cc);
//         setDraftBanner(bg);
//         setDraftBannerIsImage(isImg);
//         setDraftBorder(ab);
//         setDraftCardColor(cc);
//         const dec = data.avatarDecoration || null;
//         setAvatarDecoration(dec);
//         setDraftDecoration(dec);
//         setFeaturedGift(data.featuredGift || null);
//         setDraftFeaturedGift(data.featuredGift || null);
//       }
//     });
//     if (userId) return;
//     const user = auth.currentUser;
//     if (!user) return;
//     const date = new Date(user.metadata.creationTime!);
//     setJoined(
//       date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
//     );
//   }, [targetUid]);

//   function openEdit() {
//     setDraftBanner(bannerGradient);
//     setDraftBannerIsImage(bannerIsImage);
//     setDraftBorder(avatarBorder);
//     setDraftCardColor(cardColor);
//     setDraftAvatar(null);
//     setBannerLocalPreview(null);
//     setAvatarLocalPreview(null);
//     setDraftDecoration(avatarDecoration);
//     setEditing(true);
//     setDraftFeaturedGift(featuredGift);
//   }

//   function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = "";
//     if (file.type === "image/gif") {
//       const preview = URL.createObjectURL(file);
//       setBannerLocalPreview(preview);
//       setBannerUploading(true);
//       uploadToCloudinary(file, "banners")
//         .then((url) => {
//           setDraftBanner(url);
//           setDraftBannerIsImage(true);
//         })
//         .catch((err) => {
//           console.error("Banner upload failed:", err);
//           setBannerLocalPreview(null);
//         })
//         .finally(() => setBannerUploading(false));
//       return;
//     }
//     setCropSrc(URL.createObjectURL(file));
//     setCropTarget("banner");
//   }

//   function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = "";
//     if (file.type === "image/gif") {
//       const preview = URL.createObjectURL(file);
//       setAvatarLocalPreview(preview);
//       setAvatarUploading(true);
//       uploadToCloudinary(file, "avatars")
//         .then((url) => {
//           setDraftAvatar(url);
//         })
//         .catch((err) => {
//           console.error("Avatar upload failed:", err);
//           setAvatarLocalPreview(null);
//         })
//         .finally(() => setAvatarUploading(false));
//       return;
//     }
//     setCropSrc(URL.createObjectURL(file));
//     setCropTarget("avatar");
//   }

//   async function handleCropConfirm(blob: Blob) {
//     setCropSrc(null);
//     if (cropTarget === "banner") {
//       const preview = URL.createObjectURL(blob);
//       setBannerLocalPreview(preview);
//       setBannerUploading(true);
//       try {
//         const url = await uploadToCloudinary(blob, "banners");
//         setDraftBanner(url);
//         setDraftBannerIsImage(true);
//       } catch (err) {
//         console.error("Banner upload failed:", err);
//         setBannerLocalPreview(null);
//       } finally {
//         setBannerUploading(false);
//       }
//     } else if (cropTarget === "avatar") {
//       const preview = URL.createObjectURL(blob);
//       setAvatarLocalPreview(preview);
//       setAvatarUploading(true);
//       try {
//         const url = await uploadToCloudinary(blob, "avatars");
//         setDraftAvatar(url);
//       } catch (err) {
//         console.error("Avatar upload failed:", err);
//         setAvatarLocalPreview(null);
//       } finally {
//         setAvatarUploading(false);
//       }
//     }
//     setCropTarget(null);
//   }

//   function handleCropCancel() {
//     setCropSrc(null);
//     setCropTarget(null);
//   }

//   async function saveEdit() {
//     const user = auth.currentUser;
//     if (!user) return;
//     setSaving(true);
//     try {
//       const updates: Record<string, any> = {
//         bannerGradient: draftBanner,
//         bannerIsImage: draftBannerIsImage,
//         avatarBorder: draftBorder,
//         cardColor: draftCardColor,
//         avatarDecoration: draftDecoration,
//         featuredGift: draftFeaturedGift ?? null,
//       };
//       if (draftAvatar) updates.avatar = draftAvatar;
//       await updateDoc(doc(db, "users", user.uid), updates);
//       setBannerGradient(draftBanner);
//       setBannerIsImage(draftBannerIsImage);
//       setAvatarBorder(draftBorder);
//       setCardColor(draftCardColor);
//       if (draftAvatar) setAvatar(draftAvatar);
//       setEditing(false);
//     } finally {
//       setSaving(false);
//       setBannerLocalPreview(null);
//       setAvatarLocalPreview(null);
//       setDraftAvatar(null);
//       setAvatarDecoration(draftDecoration);
//       setFeaturedGift(draftFeaturedGift);
//     }
//   }

//   async function logout() {
//     await signOut(auth);
//     router.push("/login");
//   }

//   const activeBannerValue = editing
//     ? bannerLocalPreview || draftBanner
//     : bannerGradient;
//   const activeBannerIsImage = editing
//     ? !!bannerLocalPreview || draftBannerIsImage
//     : bannerIsImage;
//   const activeBorder = editing ? draftBorder : avatarBorder;
//   const activeDecoration = editing ? draftDecoration : avatarDecoration;
//   const activeAvatar = editing
//     ? avatarLocalPreview || draftAvatar || avatar
//     : avatar;
//   const activeCardColor = editing ? draftCardColor : cardColor;
//   const bannerStyle = activeBannerIsImage
//     ? {
//         backgroundImage: `url(${activeBannerValue})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }
//     : { background: activeBannerValue };

//   return (
//     <>
//       <style>{`
//         @keyframes shimmer {
//           0% { transform: translateX(-100%); }
//           60%, 100% { transform: translateX(200%); }
//         }
//         @keyframes gemBob {
//           0%, 100% { transform: translateY(0) rotate(0deg); }
//           40% { transform: translateY(-2px) rotate(-8deg); }
//           60% { transform: translateY(-1px) rotate(5deg); }
//         }
//         @keyframes giftModalIn {
//           from { opacity: 0; transform: scale(0.92) translateY(6px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }
//       `}</style>

//       {cropSrc && (
//         <ImageCropper
//           src={cropSrc}
//           aspectRatio={cropTarget === "banner" ? 320 / 88 : 1}
//           onConfirm={handleCropConfirm}
//           onCancel={handleCropCancel}
//           label={cropTarget === "banner" ? "Adjust banner" : "Adjust avatar"}
//         />
//       )}

//       <div
//         className="fixed inset-0 bg-black/55 flex items-center justify-center z-50"
//         onClick={onClose}
//       >
//         <div
//           className="border border-white/[0.08] rounded-2xl w-[320px] flex flex-col items-center relative overflow-hidden transition-colors duration-200"
//           style={{ backgroundColor: activeCardColor }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* gift modal overlay */}
//           {giftModal &&
//             (() => {
//               const gift = GIFTS[giftModal];
//               if (!gift) return null;
//               const color = RARITY_COLORS[gift.rarity];

//               const rarityBg: Record<string, string> = {
//                 common: "linear-gradient(160deg, #3f3f46, #27272a)",
//                 rare: "linear-gradient(160deg, #1e3a5f, #1e2a4a)",
//                 epic: "linear-gradient(160deg, #3b1f6e, #2d1a5a)",
//                 legendary: "linear-gradient(160deg, #D9A827, #9E7510)",
//                 unreal: "linear-gradient(160deg, #D90CED, #520661)",
//                 divine: "linear-gradient(160deg, #FFF8DC)",
//                 unusual: "linear-gradient(160deg, #7d5279, #7d5279)",
//               };

//               return (
//                 <div
//                   className="absolute inset-0 z-20 flex flex-col rounded-2xl overflow-hidden"
//                   style={{
//                     animation:
//                       "giftModalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
//                   }}
//                 >
//                   {/* art */}
//                   <div
//                     className="relative flex items-center justify-center flex-1"
//                     style={{ background: rarityBg[gift.rarity] }}
//                   >
//                     <div
//                       className="absolute inset-0 opacity-[0.07]"
//                       style={{
//                         backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
//                         backgroundSize: "24px 24px",
//                       }}
//                     />
//                     <img
//                       src={gift.imageUrl}
//                       alt={gift.name}
//                       className="w-56 h-56 object-contain drop-shadow-2xl relative z-10"
//                       style={{ filter: `drop-shadow(0 0 32px ${color}60)` }}
//                     />
//                     <button
//                       onClick={() => setGiftModal(null)}
//                       className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
//                     >
//                       <X size={15} />
//                     </button>
//                   </div>
//                   {/* info */}
//                   <div
//                     className="flex flex-col items-center gap-3 px-6 py-5"
//                     style={{ backgroundColor: activeCardColor }}
//                   >
//                     <div className="flex flex-col items-center gap-1.5">
//                       <span className="text-white font-bold text-base tracking-wide">
//                         {gift.name}
//                       </span>
//                       <span
//                         className="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full"
//                         style={{
//                           color,
//                           backgroundColor: `${color}18`,
//                           border: `1px solid ${color}40`,
//                         }}
//                       >
//                         {gift.rarity}
//                       </span>
//                     </div>
//                     <div className="w-full rounded-xl overflow-hidden border border-white/[0.07]">
//                       {[
//                         {
//                           label: "Rarity",
//                           value:
//                             gift.rarity.charAt(0).toUpperCase() +
//                             gift.rarity.slice(1),
//                         },
//                         { label: "Gift ID", value: gift.id },
//                       ].map(({ label, value }, i, arr) => (
//                         <div
//                           key={label}
//                           className={`flex items-center justify-between px-4 py-2.5 text-sm ${
//                             i < arr.length - 1
//                               ? "border-b border-white/[0.05]"
//                               : ""
//                           }`}
//                           style={{ backgroundColor: `${activeCardColor}` }}
//                         >
//                           <span className="text-white/40 text-xs">{label}</span>
//                           <span
//                             className="text-white/80 text-xs font-medium"
//                             style={label === "Rarity" ? { color } : {}}
//                           >
//                             {value}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                     <button
//                       onClick={() => setGiftModal(null)}
//                       className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
//                       style={{
//                         backgroundColor: `${color}22`,
//                         color,
//                         border: `1px solid ${color}40`,
//                       }}
//                     >
//                       OK
//                     </button>
//                   </div>
//                 </div>
//               );
//             })()}

//           {/* banner */}
//           <div
//             className="w-full h-[88px] relative z-0 shrink-0"
//             style={bannerStyle}
//           >
//             {bannerUploading && (
//               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               </div>
//             )}
//             {editing && (
//               <button
//                 onClick={() => bannerInputRef.current?.click()}
//                 className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group"
//               >
//                 <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white text-[11px] tracking-widest transition-colors">
//                   <Upload size={13} />
//                   {bannerUploading ? "UPLOADING..." : "CHANGE BANNER"}
//                 </div>
//               </button>
//             )}
//             <button
//               onClick={onClose}
//               className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors bg-black/20 rounded-full p-0.5"
//             >
//               <X size={18} />
//             </button>
//           </div>

//           <div className="w-full flex flex-col items-center px-8 pb-7 relative">
//             {/* avatar */}
//             <div
//               className="relative z-10 -mt-9 mb-3 shrink-0 flex items-center justify-center"
//               style={{ width: 122, height: 102, overflow: "visible" }}
//             >
//               {activeDecoration &&
//                 (() => {
//                   const dec = AVATAR_DECORATIONS.find(
//                     (d) => d.url === activeDecoration
//                   );
//                   return (
//                     <img
//                       src={activeDecoration}
//                       alt=""
//                       className="absolute pointer-events-none select-none"
//                       style={{
//                         width: 160,
//                         height: 160,
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         objectFit: "contain",
//                         zIndex: 10,
//                         mixBlendMode: (dec?.blendMode as any) || "normal",
//                       }}
//                     />
//                   );
//                 })()}

//               <div
//                 className="rounded-full p-[2.5px] absolute"
//                 style={{
//                   background: activeBorder,
//                   width: 72,
//                   height: 72,
//                   top: "50%",
//                   left: "50%",
//                   transform: "translate(-50%, -50%)",
//                 }}
//               >
//                 <div
//                   className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
//                   style={{ backgroundColor: activeCardColor }}
//                 >
//                   {avatarUploading ? (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                     </div>
//                   ) : activeAvatar ? (
//                     <img
//                       src={activeAvatar}
//                       alt="avatar"
//                       className="w-full h-full rounded-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-white text-lg font-medium">
//                       {username?.[0]?.toUpperCase()}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {editing && (
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   className="absolute rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
//                   style={{
//                     width: 72,
//                     height: 72,
//                     top: "50%",
//                     left: "50%",
//                     transform: "translate(-50%, -50%)",
//                     zIndex: 20,
//                   }}
//                 >
//                   <Upload
//                     size={14}
//                     className="text-white/60 hover:text-white"
//                   />
//                 </button>
//               )}

//               {!editing && gifts.length > 0 && (
//                 <button
//                   onClick={() => setShowFullProfile(true)}
//                   className="absolute rounded-full"
//                   style={{
//                     width: 72,
//                     height: 72,
//                     top: "50%",
//                     left: "50%",
//                     transform: "translate(-50%, -50%)",
//                     zIndex: 15,
//                   }}
//                   aria-label="View gift cloud"
//                 />
//               )}
//             </div>

//             <input
//               ref={bannerInputRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={handleBannerFileChange}
//             />
//             <input
//               ref={avatarInputRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={handleAvatarFileChange}
//             />
//             <input
//               ref={colorInputRef}
//               type="color"
//               className="hidden"
//               value={draftCardColor}
//               onChange={(e) => setDraftCardColor(e.target.value)}
//             />

//             {/* Username / joined / badge */}
//             <div className="flex flex-col items-center gap-1 mb-4">
//               <div className="flex items-center gap-2">
//                 <span className="text-white font-semibold text-lg tracking-[0.03em]">
//                   {username}
//                 </span>
//                 {featuredGift &&
//                   (() => {
//                     const gift = GIFTS[featuredGift];
//                     if (!gift) return null;
//                     return (
//                       <img
//                         src={gift.imageUrl}
//                         alt={gift.name}
//                         title={gift.name}
//                         className="w-6 h-6 object-contain shrink-0"
//                         style={{
//                           filter: `drop-shadow(0 0 4px ${
//                             RARITY_COLORS[gift.rarity]
//                           }90)`,
//                         }}
//                       />
//                     );
//                   })()}
//               </div>
//               <span className="text-[10px] text-white/22 tracking-widest uppercase">
//                 joined {joined}
//               </span>
//               {badges.map((badgeId) => {
//                 const badgeData = BADGE.find((b) => b.id === badgeId);

//                 if (!badgeData) return null;

//                 return (
//                   <div
//                     key={badgeData.id}
//                     className="mt-1 px-2 py-1.5 flex items-center gap-2 rounded-xl relative overflow-hidden"
//                     style={{
//                       background: `linear-gradient(135deg, ${badgeData.colors?.[0]}, ${badgeData.colors?.[1]})`,
//                     }}
//                   >
//                     <span className="text-xs font-bold tracking-wide text-white">
//                       {badgeData.label}
//                     </span>

//                     {badgeData.url && (
//                       <img
//                         src={badgeData.url}
//                         alt={badgeData.label}
//                         className="w-6 h-6 object-contain"
//                       />
//                     )}

//                     <div
//                       className="absolute inset-0 pointer-events-none"
//                       style={{
//                         background:
//                           "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
//                         animation: "shimmer 3s ease-in-out infinite",
//                       }}
//                     />
//                   </div>
//                 );
//               })}
//             </div>

//             {bio && !editing && (
//               <p className="text-xs text-white/40 text-center leading-relaxed mb-4">
//                 {bio}
//               </p>
//             )}

//             {editing ? (
//               <div className="w-full flex flex-col gap-5 mb-5">
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Banner
//                   </p>
//                   <div className="grid grid-cols-4 gap-2">
//                     {BANNER_PRESETS.map((p) => (
//                       <button
//                         key={p.id}
//                         onClick={() => {
//                           setDraftBanner(p.value);
//                           setDraftBannerIsImage(false);
//                           setBannerLocalPreview(null);
//                         }}
//                         className="h-8 rounded-lg transition-all"
//                         style={{
//                           background: p.value,
//                           outline:
//                             !draftBannerIsImage &&
//                             !bannerLocalPreview &&
//                             draftBanner === p.value
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Avatar border
//                   </p>
//                   <div className="grid grid-cols-6 gap-2">
//                     {AVATAR_BORDERS.map((b) => (
//                       <button
//                         key={b.id}
//                         onClick={() => setDraftBorder(b.value)}
//                         className="h-7 rounded-full transition-all"
//                         style={{
//                           background: b.value,
//                           outline:
//                             draftBorder === b.value
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Decoration
//                   </p>
//                   <div className="flex gap-2 flex-wrap">
//                     {AVATAR_DECORATIONS.map((d) => (
//                       <button
//                         key={d.id}
//                         onClick={() => setDraftDecoration(d.url)}
//                         className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
//                         style={{
//                           background: "rgba(255,255,255,0.05)",
//                           outline:
//                             draftDecoration === d.url
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       >
//                         {d.url ? (
//                           <img
//                             src={d.url}
//                             alt={d.label}
//                             className="w-full h-full object-contain"
//                           />
//                         ) : (
//                           <span className="text-white/30 text-[10px]">
//                             None
//                           </span>
//                         )}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 {gifts.length > 0 && (
//                   <div>
//                     <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                       Featured gift
//                     </p>
//                     <div className="flex gap-2 flex-wrap">
//                       <button
//                         onClick={() => setDraftFeaturedGift(null)}
//                         className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] border transition-all"
//                         style={{
//                           background: "rgba(255,255,255,0.04)",
//                           borderColor: "rgba(255,255,255,0.1)",
//                           color: "rgba(255,255,255,0.3)",
//                           outline:
//                             draftFeaturedGift === null
//                               ? "2px solid #A78BFA"
//                               : "2px solid transparent",
//                           outlineOffset: "2px",
//                         }}
//                       >
//                         ✕
//                       </button>
//                       {gifts.map((giftId) => {
//                         const gift = GIFTS[giftId];
//                         if (!gift) return null;
//                         return (
//                           <button
//                             key={giftId}
//                             onClick={() => setDraftFeaturedGift(giftId)}
//                             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
//                             style={{
//                               background: `${RARITY_COLORS[gift.rarity]}15`,
//                               border: `1px solid ${
//                                 RARITY_COLORS[gift.rarity]
//                               }40`,
//                               outline:
//                                 draftFeaturedGift === giftId
//                                   ? "2px solid #A78BFA"
//                                   : "2px solid transparent",
//                               outlineOffset: "2px",
//                             }}
//                           >
//                             <img
//                               src={gift.imageUrl}
//                               alt={gift.name}
//                               className="w-7 h-7 object-contain"
//                             />
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}
//                 <div>
//                   <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
//                     Card color
//                   </p>
//                   <div className="flex items-center gap-2">
//                     <div className="grid grid-cols-8 gap-1.5 flex-1">
//                       {CARD_COLOR_PRESETS.map((c) => (
//                         <button
//                           key={c}
//                           onClick={() => setDraftCardColor(c)}
//                           className="h-6 rounded-md transition-all"
//                           style={{
//                             backgroundColor: c,
//                             border:
//                               draftCardColor === c
//                                 ? "2px solid #A78BFA"
//                                 : "2px solid rgba(255,255,255,0.1)",
//                           }}
//                         />
//                       ))}
//                     </div>
//                     <button
//                       onClick={() => colorInputRef.current?.click()}
//                       title="Custom color"
//                       className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.10] hover:border-[#A78BFA]/50 text-white/40 hover:text-[#A78BFA] transition-colors relative overflow-hidden"
//                       style={{ backgroundColor: draftCardColor }}
//                     >
//                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
//                         <Pipette size={13} className="text-white/70" />
//                       </div>
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                       setEditing(false);
//                       setBannerLocalPreview(null);
//                       setAvatarLocalPreview(null);
//                       setDraftAvatar(null);
//                     }}
//                     className="flex-1 py-2 text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-lg transition-colors tracking-widest"
//                   >
//                     CANCEL
//                   </button>
//                   <button
//                     onClick={saveEdit}
//                     disabled={saving || bannerUploading || avatarUploading}
//                     className="flex-1 py-2 text-[11px] text-[#A78BFA] hover:text-white border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
//                   >
//                     {saving ? (
//                       "SAVING..."
//                     ) : (
//                       <>
//                         <Check size={12} /> SAVE
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 {gifts.length > 0 && (
//                   <div className="w-full mb-4">
//                     <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] text-center mb-3">
//                       Gifts
//                     </div>
//                     <div
//                       className={`grid grid-cols-2 gap-4 ${
//                         gifts.length > 4
//                           ? "max-h-[380px] overflow-y-auto pr-1"
//                           : ""
//                       }`}
//                       style={
//                         gifts.length > 4
//                           ? {
//                               scrollbarWidth: "thin",
//                               scrollbarColor: "#A78BFA40 transparent",
//                             }
//                           : {}
//                       }
//                     >
//                       {gifts.map((giftId, i) => {
//                         const gift = GIFTS[giftId];
//                         if (!gift) return null;
//                         return (
//                           <button
//                             key={giftId + i}
//                             onClick={() => setGiftModal(giftId)}
//                             className="flex flex-col items-center gap-1.5 group cursor-pointer"
//                           >
//                             <div
//                               className="w-full aspect-square rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
//                               style={{
//                                 background: `${RARITY_COLORS[gift.rarity]}15`,
//                                 border: `1px solid ${
//                                   RARITY_COLORS[gift.rarity]
//                                 }40`,
//                               }}
//                             >
//                               <img
//                                 src={gift.imageUrl}
//                                 alt={gift.name}
//                                 className="w-4/5 h-4/5 object-contain"
//                               />
//                             </div>
//                             <span
//                               className="text-[10px]"
//                               style={{ color: RARITY_COLORS[gift.rarity] }}
//                             >
//                               {gift.name}
//                             </span>
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 <div className="w-full h-px bg-white/[0.06] mb-4" />

//                 <div className="flex items-center justify-between w-full">
//                   {isOwnProfile ? (
//                     <button
//                       onClick={logout}
//                       className="text-[11px] text-red-400/55 hover:text-red-400 tracking-widest transition-colors"
//                     >
//                       LOG OUT
//                     </button>
//                   ) : (
//                     <div />
//                   )}
//                   {isOwnProfile && (
//                     <button
//                       onClick={openEdit}
//                       className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 tracking-widest transition-colors"
//                     >
//                       <Pencil size={12} />
//                       EDIT
//                     </button>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {showFullProfile && (
//         <FullProfileView
//           onClose={() => setShowFullProfile(false)}
//           username={username}
//           avatar={avatar}
//           avatarBorder={avatarBorder}
//           avatarDecoration={avatarDecoration}
//           bannerGradient={bannerGradient}
//           bannerIsImage={bannerIsImage}
//           cardColor={cardColor}
//           gifts={gifts}
//         />
//       )}
//     </>
//   );
// }
"use client";

import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import {
  Gem,
  X,
  Pencil,
  Check,
  Upload,
  Pipette,
  Megaphone,
} from "lucide-react";
import ImageCropper from "../image-cropper/ImageCropper";
import { AVATAR_DECORATIONS } from "@/lib/avatarDecorations";
import FullProfileView from "./Fullprofileview";
import { BADGE } from "@/lib/badge";
import { getChannelByOwner } from "@/lib/firestore/channels";
import { useChannelStore } from "@/store/channel-store";
import { useChatStore } from "@/store/chat-store";

const BANNER_PRESETS = [
  { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
  { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
  { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
  { id: "indigo-purple", value: "linear-gradient(135deg, #6366F1, #A78BFA)" },
  { id: "rose-pink", value: "linear-gradient(135deg, #FB7185, #F472B6)" },
  { id: "amber-red", value: "linear-gradient(135deg, #FBBF24, #EF4444)" },
  { id: "sky-indigo", value: "linear-gradient(135deg, #38BDF8, #6366F1)" },
  { id: "dark", value: "linear-gradient(135deg, #1e2535, #0B0F14)" },
];

const AVATAR_BORDERS = [
  { id: "purple-blue", value: "linear-gradient(135deg, #A78BFA, #60A5FA)" },
  { id: "pink-orange", value: "linear-gradient(135deg, #F472B6, #FB923C)" },
  { id: "teal-green", value: "linear-gradient(135deg, #2DD4BF, #34D399)" },
  { id: "gold", value: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
  { id: "rose", value: "linear-gradient(135deg, #FB7185, #E11D48)" },
  { id: "white", value: "linear-gradient(135deg, #ffffff, #d1d5db)" },
];

const CARD_COLOR_PRESETS = [
  "#0f1520",
  "#1a1025",
  "#0d1a1a",
  "#1a1000",
  "#0d0d1a",
  "#1a0d0d",
  "#0d1a10",
  "#12121a",
];

async function uploadToCloudinary(
  file: Blob | File,
  folder: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", folder);
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

interface ProfileModalProps {
  onClose: () => void;
  userId?: string;
}

type CropTarget = "banner" | "avatar" | null;

export default function ProfileModal({ onClose, userId }: ProfileModalProps) {
  const router = useRouter();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [joined, setJoined] = useState("");
  const [bio, setBio] = useState("");
  const [gifts, setGifts] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [bannerGradient, setBannerGradient] = useState(BANNER_PRESETS[0].value);
  const [avatarBorder, setAvatarBorder] = useState(AVATAR_BORDERS[0].value);
  const [cardColor, setCardColor] = useState("#0f1520");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftBanner, setDraftBanner] = useState(BANNER_PRESETS[0].value);
  const [draftBorder, setDraftBorder] = useState(AVATAR_BORDERS[0].value);
  const [draftCardColor, setDraftCardColor] = useState("#0f1520");
  const [bannerIsImage, setBannerIsImage] = useState(false);
  const [draftBannerIsImage, setDraftBannerIsImage] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerLocalPreview, setBannerLocalPreview] = useState<string | null>(
    null
  );
  const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(
    null
  );
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [giftModal, setGiftModal] = useState<string | null>(null);
  const [avatarDecoration, setAvatarDecoration] = useState<string | null>(null);
  const [draftDecoration, setDraftDecoration] = useState<string | null>(null);
  const [featuredGift, setFeaturedGift] = useState<string | null>(null);
  const [draftFeaturedGift, setDraftFeaturedGift] = useState<string | null>(
    null
  );
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [ownedChannel, setOwnedChannel] = useState<{
    id: string;
    name: string;
    avatarUrl: string | null;
    subscriberCount: number;
  } | null>(null);
  const [showChannelInProfile, setShowChannelInProfile] = useState(false);
  const [draftShowChannelInProfile, setDraftShowChannelInProfile] =
    useState(false);

  const currentUser = auth.currentUser;
  const targetUid = userId ?? currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    if (!targetUid) return;
    getDoc(doc(db, "users", targetUid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setAvatar(data.avatar || "");
        setBio(data.bio || "");
        setGifts(data.gifts || []);
        setBadges(data.badges || []);
        const bg = data.bannerGradient || BANNER_PRESETS[0].value;
        const isImg = data.bannerIsImage || false;
        const ab = data.avatarBorder || AVATAR_BORDERS[0].value;
        const cc = data.cardColor || "#0f1520";
        setBannerGradient(bg);
        setBannerIsImage(isImg);
        setAvatarBorder(ab);
        setCardColor(cc);
        setDraftBanner(bg);
        setDraftBannerIsImage(isImg);
        setDraftBorder(ab);
        setDraftCardColor(cc);
        const dec = data.avatarDecoration || null;
        setAvatarDecoration(dec);
        setDraftDecoration(dec);
        setFeaturedGift(data.featuredGift || null);
        setDraftFeaturedGift(data.featuredGift || null);
        setShowChannelInProfile(data.showChannelInProfile || false);
        setDraftShowChannelInProfile(data.showChannelInProfile || false);
      }
    });
    if (userId) return;
    const user = auth.currentUser;
    if (!user) return;
    const date = new Date(user.metadata.creationTime!);
    setJoined(
      date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    );
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid) return;
    getChannelByOwner(targetUid).then((ch) => {
      setOwnedChannel(
        ch
          ? {
              id: ch.id,
              name: ch.name,
              avatarUrl: ch.avatarUrl,
              subscriberCount: ch.subscriberCount,
            }
          : null
      );
    });
  }, [targetUid]);

  function openEdit() {
    setDraftBanner(bannerGradient);
    setDraftBannerIsImage(bannerIsImage);
    setDraftBorder(avatarBorder);
    setDraftCardColor(cardColor);
    setDraftAvatar(null);
    setBannerLocalPreview(null);
    setAvatarLocalPreview(null);
    setDraftDecoration(avatarDecoration);
    setEditing(true);
    setDraftFeaturedGift(featuredGift);
    setDraftShowChannelInProfile(showChannelInProfile);
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type === "image/gif") {
      const preview = URL.createObjectURL(file);
      setBannerLocalPreview(preview);
      setBannerUploading(true);
      uploadToCloudinary(file, "banners")
        .then((url) => {
          setDraftBanner(url);
          setDraftBannerIsImage(true);
        })
        .catch((err) => {
          console.error("Banner upload failed:", err);
          setBannerLocalPreview(null);
        })
        .finally(() => setBannerUploading(false));
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    setCropTarget("banner");
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type === "image/gif") {
      const preview = URL.createObjectURL(file);
      setAvatarLocalPreview(preview);
      setAvatarUploading(true);
      uploadToCloudinary(file, "avatars")
        .then((url) => {
          setDraftAvatar(url);
        })
        .catch((err) => {
          console.error("Avatar upload failed:", err);
          setAvatarLocalPreview(null);
        })
        .finally(() => setAvatarUploading(false));
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    setCropTarget("avatar");
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null);
    if (cropTarget === "banner") {
      const preview = URL.createObjectURL(blob);
      setBannerLocalPreview(preview);
      setBannerUploading(true);
      try {
        const url = await uploadToCloudinary(blob, "banners");
        setDraftBanner(url);
        setDraftBannerIsImage(true);
      } catch (err) {
        console.error("Banner upload failed:", err);
        setBannerLocalPreview(null);
      } finally {
        setBannerUploading(false);
      }
    } else if (cropTarget === "avatar") {
      const preview = URL.createObjectURL(blob);
      setAvatarLocalPreview(preview);
      setAvatarUploading(true);
      try {
        const url = await uploadToCloudinary(blob, "avatars");
        setDraftAvatar(url);
      } catch (err) {
        console.error("Avatar upload failed:", err);
        setAvatarLocalPreview(null);
      } finally {
        setAvatarUploading(false);
      }
    }
    setCropTarget(null);
  }

  function handleCropCancel() {
    setCropSrc(null);
    setCropTarget(null);
  }

  async function saveEdit() {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        bannerGradient: draftBanner,
        bannerIsImage: draftBannerIsImage,
        avatarBorder: draftBorder,
        cardColor: draftCardColor,
        avatarDecoration: draftDecoration,
        featuredGift: draftFeaturedGift ?? null,
        showChannelInProfile: draftShowChannelInProfile,
      };
      if (draftAvatar) updates.avatar = draftAvatar;
      await updateDoc(doc(db, "users", user.uid), updates);
      setBannerGradient(draftBanner);
      setBannerIsImage(draftBannerIsImage);
      setAvatarBorder(draftBorder);
      setCardColor(draftCardColor);
      if (draftAvatar) setAvatar(draftAvatar);
      setShowChannelInProfile(draftShowChannelInProfile);
      setEditing(false);
    } finally {
      setSaving(false);
      setBannerLocalPreview(null);
      setAvatarLocalPreview(null);
      setDraftAvatar(null);
      setAvatarDecoration(draftDecoration);
      setFeaturedGift(draftFeaturedGift);
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  function openOwnedChannel() {
    if (!ownedChannel) return;
    useChannelStore.getState().setActiveChannel(ownedChannel.id);
    useChatStore.getState().setActiveChat(null);
    onClose();
  }

  const activeBannerValue = editing
    ? bannerLocalPreview || draftBanner
    : bannerGradient;
  const activeBannerIsImage = editing
    ? !!bannerLocalPreview || draftBannerIsImage
    : bannerIsImage;
  const activeBorder = editing ? draftBorder : avatarBorder;
  const activeDecoration = editing ? draftDecoration : avatarDecoration;
  const activeAvatar = editing
    ? avatarLocalPreview || draftAvatar || avatar
    : avatar;
  const activeCardColor = editing ? draftCardColor : cardColor;
  const bannerStyle = activeBannerIsImage
    ? {
        backgroundImage: `url(${activeBannerValue})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: activeBannerValue };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(200%); }
        }
        @keyframes gemBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          40% { transform: translateY(-2px) rotate(-8deg); }
          60% { transform: translateY(-1px) rotate(5deg); }
        }
        @keyframes giftModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspectRatio={cropTarget === "banner" ? 320 / 88 : 1}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          label={cropTarget === "banner" ? "Adjust banner" : "Adjust avatar"}
        />
      )}

      <div
        className="fixed inset-0 bg-black/55 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="border border-white/[0.08] rounded-2xl w-[320px] flex flex-col items-center relative overflow-hidden transition-colors duration-200"
          style={{ backgroundColor: activeCardColor }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* gift modal overlay */}
          {giftModal &&
            (() => {
              const gift = GIFTS[giftModal];
              if (!gift) return null;
              const color = RARITY_COLORS[gift.rarity];

              const rarityBg: Record<string, string> = {
                common: "linear-gradient(160deg, #3f3f46, #27272a)",
                rare: "linear-gradient(160deg, #1e3a5f, #1e2a4a)",
                epic: "linear-gradient(160deg, #3b1f6e, #2d1a5a)",
                legendary: "linear-gradient(160deg, #D9A827, #9E7510)",
                unreal: "linear-gradient(160deg, #D90CED, #520661)",
                divine: "linear-gradient(160deg, #FFF8DC)",
                unusual: "linear-gradient(160deg, #7d5279, #7d5279)",
              };

              return (
                <div
                  className="absolute inset-0 z-20 flex flex-col rounded-2xl overflow-hidden"
                  style={{
                    animation:
                      "giftModalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
                  }}
                >
                  {/* art */}
                  <div
                    className="relative flex items-center justify-center flex-1"
                    style={{ background: rarityBg[gift.rarity] }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
                        backgroundSize: "24px 24px",
                      }}
                    />
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="w-56 h-56 object-contain drop-shadow-2xl relative z-10"
                      style={{ filter: `drop-shadow(0 0 32px ${color}60)` }}
                    />
                    <button
                      onClick={() => setGiftModal(null)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {/* info */}
                  <div
                    className="flex flex-col items-center gap-3 px-6 py-5"
                    style={{ backgroundColor: activeCardColor }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-white font-bold text-base tracking-wide">
                        {gift.name}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full"
                        style={{
                          color,
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {gift.rarity}
                      </span>
                    </div>
                    <div className="w-full rounded-xl overflow-hidden border border-white/[0.07]">
                      {[
                        {
                          label: "Rarity",
                          value:
                            gift.rarity.charAt(0).toUpperCase() +
                            gift.rarity.slice(1),
                        },
                        { label: "Gift ID", value: gift.id },
                      ].map(({ label, value }, i, arr) => (
                        <div
                          key={label}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                            i < arr.length - 1
                              ? "border-b border-white/[0.05]"
                              : ""
                          }`}
                          style={{ backgroundColor: `${activeCardColor}` }}
                        >
                          <span className="text-white/40 text-xs">{label}</span>
                          <span
                            className="text-white/80 text-xs font-medium"
                            style={label === "Rarity" ? { color } : {}}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setGiftModal(null)}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: `${color}22`,
                        color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* banner */}
          <div
            className="w-full h-[88px] relative z-0 shrink-0"
            style={bannerStyle}
          >
            {bannerUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {editing && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white text-[11px] tracking-widest transition-colors">
                  <Upload size={13} />
                  {bannerUploading ? "UPLOADING..." : "CHANGE BANNER"}
                </div>
              </button>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors bg-black/20 rounded-full p-0.5"
            >
              <X size={18} />
            </button>
          </div>

          <div className="w-full flex flex-col items-center px-8 pb-7 relative">
            {/* avatar */}
            <div
              className="relative z-10 -mt-9 mb-3 shrink-0 flex items-center justify-center"
              style={{ width: 122, height: 102, overflow: "visible" }}
            >
              {activeDecoration &&
                (() => {
                  const dec = AVATAR_DECORATIONS.find(
                    (d) => d.url === activeDecoration
                  );
                  return (
                    <img
                      src={activeDecoration}
                      alt=""
                      className="absolute pointer-events-none select-none"
                      style={{
                        width: 160,
                        height: 160,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        objectFit: "contain",
                        zIndex: 10,
                        mixBlendMode: (dec?.blendMode as any) || "normal",
                      }}
                    />
                  );
                })()}

              <div
                className="rounded-full p-[2.5px] absolute"
                style={{
                  background: activeBorder,
                  width: 72,
                  height: 72,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: activeCardColor }}
                >
                  {avatarUploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : activeAvatar ? (
                    <img
                      src={activeAvatar}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg font-medium">
                      {username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {editing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                  style={{
                    width: 72,
                    height: 72,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                  }}
                >
                  <Upload
                    size={14}
                    className="text-white/60 hover:text-white"
                  />
                </button>
              )}

              {!editing && gifts.length > 0 && (
                <button
                  onClick={() => setShowFullProfile(true)}
                  className="absolute rounded-full"
                  style={{
                    width: 72,
                    height: 72,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 15,
                  }}
                  aria-label="View gift cloud"
                />
              )}
            </div>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileChange}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <input
              ref={colorInputRef}
              type="color"
              className="hidden"
              value={draftCardColor}
              onChange={(e) => setDraftCardColor(e.target.value)}
            />

            {/* Username / joined / badge */}
            <div className="flex flex-col items-center gap-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg tracking-[0.03em]">
                  {username}
                </span>
                {featuredGift &&
                  (() => {
                    const gift = GIFTS[featuredGift];
                    if (!gift) return null;
                    return (
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        title={gift.name}
                        className="w-6 h-6 object-contain shrink-0"
                        style={{
                          filter: `drop-shadow(0 0 4px ${
                            RARITY_COLORS[gift.rarity]
                          }90)`,
                        }}
                      />
                    );
                  })()}
              </div>
              <span className="text-[10px] text-white/22 tracking-widest uppercase">
                joined {joined}
              </span>
              {badges.map((badgeId) => {
                const badgeData = BADGE.find((b) => b.id === badgeId);

                if (!badgeData) return null;

                return (
                  <div
                    key={badgeData.id}
                    className="mt-1 px-2 py-1.5 flex items-center gap-2 rounded-xl relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${badgeData.colors?.[0]}, ${badgeData.colors?.[1]})`,
                    }}
                  >
                    <span className="text-xs font-bold tracking-wide text-white">
                      {badgeData.label}
                    </span>

                    {badgeData.url && (
                      <img
                        src={badgeData.url}
                        alt={badgeData.label}
                        className="w-6 h-6 object-contain"
                      />
                    )}

                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
                        animation: "shimmer 3s ease-in-out infinite",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {bio && !editing && (
              <p className="text-xs text-white/40 text-center leading-relaxed mb-4">
                {bio}
              </p>
            )}

            {!editing && showChannelInProfile && ownedChannel && (
              <button
                onClick={openOwnedChannel}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors mb-4 cursor-pointer"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-[#A78BFA]/15 flex items-center justify-center overflow-hidden text-[#A78BFA] text-sm font-semibold">
                  {ownedChannel.avatarUrl ? (
                    <img
                      src={ownedChannel.avatarUrl}
                      alt={ownedChannel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ownedChannel.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white truncate">
                    {ownedChannel.name}
                    <Megaphone size={12} className="text-[#A78BFA] shrink-0" />
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {ownedChannel.subscriberCount} subscribers
                  </div>
                </div>
              </button>
            )}

            {editing ? (
              <div className="w-full flex flex-col gap-5 mb-5">
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                    Banner
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setDraftBanner(p.value);
                          setDraftBannerIsImage(false);
                          setBannerLocalPreview(null);
                        }}
                        className="h-8 rounded-lg transition-all"
                        style={{
                          background: p.value,
                          outline:
                            !draftBannerIsImage &&
                            !bannerLocalPreview &&
                            draftBanner === p.value
                              ? "2px solid #A78BFA"
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                    Avatar border
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_BORDERS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setDraftBorder(b.value)}
                        className="h-7 rounded-full transition-all"
                        style={{
                          background: b.value,
                          outline:
                            draftBorder === b.value
                              ? "2px solid #A78BFA"
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                    Decoration
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_DECORATIONS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDraftDecoration(d.url)}
                        className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          outline:
                            draftDecoration === d.url
                              ? "2px solid #A78BFA"
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      >
                        {d.url ? (
                          <img
                            src={d.url}
                            alt={d.label}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-white/30 text-[10px]">
                            None
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {gifts.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                      Featured gift
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setDraftFeaturedGift(null)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] border transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.3)",
                          outline:
                            draftFeaturedGift === null
                              ? "2px solid #A78BFA"
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      >
                        ✕
                      </button>
                      {gifts.map((giftId) => {
                        const gift = GIFTS[giftId];
                        if (!gift) return null;
                        return (
                          <button
                            key={giftId}
                            onClick={() => setDraftFeaturedGift(giftId)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{
                              background: `${RARITY_COLORS[gift.rarity]}15`,
                              border: `1px solid ${
                                RARITY_COLORS[gift.rarity]
                              }40`,
                              outline:
                                draftFeaturedGift === giftId
                                  ? "2px solid #A78BFA"
                                  : "2px solid transparent",
                              outlineOffset: "2px",
                            }}
                          >
                            <img
                              src={gift.imageUrl}
                              alt={gift.name}
                              className="w-7 h-7 object-contain"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {ownedChannel && (
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                      Channel
                    </p>
                    <button
                      onClick={() => setDraftShowChannelInProfile((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors"
                    >
                      <span className="flex items-center gap-2 text-xs text-white/60">
                        <Megaphone size={13} className="text-[#A78BFA]" />
                        Show my channel on profile
                      </span>
                      <span
                        className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                        style={{
                          background: draftShowChannelInProfile
                            ? "#A78BFA"
                            : "rgba(255,255,255,0.15)",
                        }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                          style={{
                            transform: draftShowChannelInProfile
                              ? "translateX(16px)"
                              : "translateX(0)",
                          }}
                        />
                      </span>
                    </button>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                    Card color
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      {CARD_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setDraftCardColor(c)}
                          className="h-6 rounded-md transition-all"
                          style={{
                            backgroundColor: c,
                            border:
                              draftCardColor === c
                                ? "2px solid #A78BFA"
                                : "2px solid rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      title="Custom color"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.10] hover:border-[#A78BFA]/50 text-white/40 hover:text-[#A78BFA] transition-colors relative overflow-hidden"
                      style={{ backgroundColor: draftCardColor }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Pipette size={13} className="text-white/70" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setBannerLocalPreview(null);
                      setAvatarLocalPreview(null);
                      setDraftAvatar(null);
                    }}
                    className="flex-1 py-2 text-[11px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded-lg transition-colors tracking-widest"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving || bannerUploading || avatarUploading}
                    className="flex-1 py-2 text-[11px] text-[#A78BFA] hover:text-white border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {saving ? (
                      "SAVING..."
                    ) : (
                      <>
                        <Check size={12} /> SAVE
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {gifts.length > 0 && (
                  <div className="w-full mb-4">
                    <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] text-center mb-3">
                      Gifts
                    </div>
                    <div
                      className={`grid grid-cols-2 gap-4 ${
                        gifts.length > 4
                          ? "max-h-[380px] overflow-y-auto pr-1"
                          : ""
                      }`}
                      style={
                        gifts.length > 4
                          ? {
                              scrollbarWidth: "thin",
                              scrollbarColor: "#A78BFA40 transparent",
                            }
                          : {}
                      }
                    >
                      {gifts.map((giftId, i) => {
                        const gift = GIFTS[giftId];
                        if (!gift) return null;
                        return (
                          <button
                            key={giftId + i}
                            onClick={() => setGiftModal(giftId)}
                            className="flex flex-col items-center gap-1.5 group cursor-pointer"
                          >
                            <div
                              className="w-full aspect-square rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                              style={{
                                background: `${RARITY_COLORS[gift.rarity]}15`,
                                border: `1px solid ${
                                  RARITY_COLORS[gift.rarity]
                                }40`,
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
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="w-full h-px bg-white/[0.06] mb-4" />

                <div className="flex items-center justify-between w-full">
                  {isOwnProfile ? (
                    <button
                      onClick={logout}
                      className="text-[11px] text-red-400/55 hover:text-red-400 tracking-widest transition-colors"
                    >
                      LOG OUT
                    </button>
                  ) : (
                    <div />
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={openEdit}
                      className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 tracking-widest transition-colors"
                    >
                      <Pencil size={12} />
                      EDIT
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showFullProfile && (
        <FullProfileView
          onClose={() => setShowFullProfile(false)}
          username={username}
          avatar={avatar}
          avatarBorder={avatarBorder}
          avatarDecoration={avatarDecoration}
          bannerGradient={bannerGradient}
          bannerIsImage={bannerIsImage}
          cardColor={cardColor}
          gifts={gifts}
        />
      )}
    </>
  );
}

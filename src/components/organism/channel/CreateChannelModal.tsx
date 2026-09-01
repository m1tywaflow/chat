// "use client";

// import { useState, useRef } from "react";
// import { X, Camera, Megaphone } from "lucide-react";
// import { createChannel } from "@/lib/firestore/channels";

// async function uploadAvatar(file: File): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "jhravxtb");
//   formData.append("folder", "channel_avatars");
//   const res = await fetch(
//     "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
//     { method: "POST", body: formData }
//   );
//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.secure_url;
// }

// function Field({
//   label,
//   children,
//   trailing,
// }: {
//   label: string;
//   children: React.ReactNode;
//   trailing?: React.ReactNode;
// }) {
//   return (
//     <div
//       className="field-glass rounded-xl px-3.5 py-2.5 transition-all duration-200"
//     >
//       <div className="flex items-center justify-between mb-1">
//         <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
//           {label}
//         </span>
//         {trailing}
//       </div>
//       {children}
//     </div>
//   );
// }

// export default function CreateChannelModal({
//   uid,
//   username,
//   onClose,
//   onCreated,
// }: {
//   uid: string;
//   username: string;
//   onClose: () => void;
//   onCreated: (channelId: string) => void;
// }) {
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [avatarFile, setAvatarFile] = useState<File | null>(null);
//   const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
//   const [creating, setCreating] = useState(false);
//   const fileRef = useRef<HTMLInputElement | null>(null);

//   function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setAvatarFile(file);
//     setAvatarPreview(URL.createObjectURL(file));
//   }

//   async function handleCreate() {
//     if (!name.trim() || creating) return;
//     setCreating(true);
//     try {
//       let avatarUrl: string | null = null;
//       if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
//       const channelId = await createChannel(
//         uid,
//         username,
//         name.trim(),
//         description.trim(),
//         avatarUrl
//       );
//       onCreated(channelId);
//       onClose();
//     } catch (err) {
//       console.error("Create channel failed:", err);
//     } finally {
//       setCreating(false);
//     }
//   }

//   const initial = name.trim() ? name.trim()[0].toUpperCase() : null;

//   return (
//     <div
//       className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
//       onClick={onClose}
//     >
//       <svg width="0" height="0" style={{ position: "absolute" }}>
//         <defs>
//           <filter
//             id="glass-distortion-channel-modal"
//             x="0%"
//             y="0%"
//             width="100%"
//             height="100%"
//           >
//             <feTurbulence
//               type="fractalNoise"
//               baseFrequency="0.008 0.008"
//               numOctaves={2}
//               seed={92}
//               result="noise"
//             />
//             <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
//             <feDisplacementMap
//               in="SourceGraphic"
//               in2="blurred"
//               scale={22}
//               xChannelSelector="R"
//               yChannelSelector="G"
//             />
//           </filter>
//         </defs>
//       </svg>

//       <style>{`
//         @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

//         /* Liquid glass window background */
//         .channel-modal-glass {
//           position: relative;
//           isolation: isolate;
//           box-shadow: 0px 0px 21px -8px rgba(255, 255, 255, 0.3);
//         }

//         /* tint + inner shadow */
//         .channel-modal-glass::before {
//           content: '';
//           position: absolute;
//           inset: 0;
//           z-index: 0;
//           border-radius: inherit;
//           box-shadow: inset 0 0 20px -4px rgba(255, 255, 255, 0.18),
//             inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
//           background: linear-gradient(
//             160deg,
//             rgba(18, 15, 32, 0.82) 0%,
//             rgba(7, 6, 13, 0.88) 100%
//           );
//           pointer-events: none;
//         }

//         /* backdrop blur + turbulence distortion (kept subtle — background is
//            already dark, so this just adds texture, not visibility loss) */
//         .channel-modal-glass::after {
//           content: '';
//           position: absolute;
//           inset: 0;
//           z-index: -1;
//           border-radius: inherit;
//           backdrop-filter: blur(18px) saturate(140%);
//           -webkit-backdrop-filter: blur(18px) saturate(140%);
//           filter: url(#glass-distortion-channel-modal);
//           -webkit-filter: url(#glass-distortion-channel-modal);
//           isolation: isolate;
//           pointer-events: none;
//         }

//         .channel-modal-glass > * {
//           position: relative;
//           z-index: 10;
//         }

//         /* Fields — a soft inner glow so they read as "lit" glass panes
//            against the dark card, instead of near-invisible flat boxes */
//         .field-glass {
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.055) 0%,
//             rgba(255, 255, 255, 0.02) 100%
//           );
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
//             0 1px 2px rgba(0, 0, 0, 0.15);
//         }
//         .field-glass:hover {
//           border-color: rgba(255, 255, 255, 0.16);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.07) 0%,
//             rgba(255, 255, 255, 0.03) 100%
//           );
//         }
//         .field-glass:focus-within {
//           border-color: rgba(124, 92, 255, 0.55);
//           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
//             0 0 0 3px rgba(124, 92, 255, 0.15),
//             0 0 18px -4px rgba(124, 92, 255, 0.35);
//         }

//         /* Submit button — brighter gradient + glass rim so it pops
//            instead of blending into the card */
//         .submit-glow {
//           position: relative;
//           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
//             0 8px 24px -8px rgba(124, 92, 255, 0.65),
//             0 0 0 1px rgba(255, 255, 255, 0.08);
//         }
//         .submit-glow:not(:disabled):hover {
//           box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
//             0 10px 28px -6px rgba(124, 92, 255, 0.8),
//             0 0 0 1px rgba(255, 255, 255, 0.12);
//           transform: translateY(-1px);
//         }
//         .submit-glow:not(:disabled):active {
//           transform: translateY(0);
//         }
//       `}</style>

//       <div
//         className="relative w-[400px] rounded-[26px] overflow-hidden"
//         style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#5b3df0]/25 blur-[90px]" />
//         <div className="pointer-events-none absolute -bottom-24 -right-10 w-56 h-56 rounded-full bg-[#2b1f78]/25 blur-[90px]" />

//         <div className="channel-modal-glass rounded-[26px] shadow-[0_0_70px_-15px_rgba(91,61,240,0.4)]">
//           <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
//             <div className="flex items-center gap-2.5">
//               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center shrink-0">
//                 <Megaphone size={15} className="text-white" />
//               </div>
//               <div>
//                 <h3 className="text-[15px] font-semibold text-white leading-tight">
//                   New channel
//                 </h3>
//                 <p className="text-[11px] text-white/30 leading-tight mt-0.5">
//                   broadcast to your subscribers
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
//             >
//               <X size={14} />
//             </button>
//           </div>

//           <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
//             <div className="flex items-center gap-4">
//               <input
//                 ref={fileRef}
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={handleAvatarChange}
//               />
//               <button
//                 onClick={() => fileRef.current?.click()}
//                 className="group relative shrink-0 w-[68px] h-[68px] rounded-2xl cursor-pointer"
//               >
//                 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78] blur-[2px] opacity-80 group-hover:opacity-100 transition-opacity" />
//                 <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#12111f] flex items-center justify-center">
//                   {avatarPreview ? (
//                     <img
//                       src={avatarPreview}
//                       alt="avatar"
//                       className="w-full h-full object-cover"
//                     />
//                   ) : initial ? (
//                     <span className="text-2xl font-semibold text-white/90">
//                       {initial}
//                     </span>
//                   ) : (
//                     <Camera size={20} className="text-white/70" />
//                   )}
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <Camera size={16} className="text-white" />
//                   </div>
//                 </div>
//               </button>
//               <div className="text-[11px] text-white/30 leading-relaxed">
//                 Channel avatar
//                 <br />
//                 Optional — a letter badge is used if you skip it
//               </div>
//             </div>
//             <Field label="Name">
//               <input
//                 value={name}
//                 onChange={(e) => setName(e.target.value.slice(0, 40))}
//                 placeholder="Channel name"
//                 className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
//               />
//             </Field>
//             <Field
//               label="Description"
//               trailing={
//                 <span className="text-[10px] text-white/20 tabular-nums">
//                   {description.length}/160
//                 </span>
//               }
//             >
//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value.slice(0, 160))}
//                 placeholder="What this channel is about"
//                 rows={3}
//                 className="w-full bg-transparent text-[14px] text-white placeholder-white/20 outline-none resize-none leading-relaxed"
//               />
//             </Field>
//             <button
//               onClick={handleCreate}
//               disabled={!name.trim() || creating}
//               className="submit-glow w-full h-12 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] flex items-center justify-center gap-2"
//             >
//               {creating ? (
//                 <>
//                   <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//                   creating…
//                 </>
//               ) : (
//                 "Create channel"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useRef } from "react";
import { X, Camera, Megaphone } from "lucide-react";
import { createChannel } from "@/lib/firestore/channels";

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "channel_avatars");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

// same glass tokens as ChannelInfoModal, so every modal in the app reads
// as one consistent surface
const GLASS_PANEL =
  "bg-[rgba(13,11,23,0.55)] [backdrop-filter:blur(24px)_saturate(160%)] [-webkit-backdrop-filter:blur(24px)_saturate(160%)] border border-[rgba(168,147,255,0.16)] shadow-[0_10px_40px_0_rgba(8,4,24,0.55),inset_0_0_1px_1px_rgba(255,255,255,0.05)]";

function Field({
  label,
  children,
  trailing,
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="field-glass rounded-xl px-3.5 py-2.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          {label}
        </span>
        {trailing}
      </div>
      {children}
    </div>
  );
}

export default function CreateChannelModal({
  uid,
  username,
  onClose,
  onCreated,
}: {
  uid: string;
  username: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadAvatar(avatarFile);
      const channelId = await createChannel(
        uid,
        username,
        name.trim(),
        description.trim(),
        avatarUrl
      );
      onCreated(channelId);
      onClose();
    } catch (err) {
      console.error("Create channel failed:", err);
    } finally {
      setCreating(false);
    }
  }

  const initial = name.trim() ? name.trim()[0].toUpperCase() : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

        /* Fields — a soft inner glow so they read as "lit" glass panes
           against the dark card, instead of near-invisible flat boxes */
        .field-glass {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.055) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .field-glass:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.07) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
        }
        .field-glass:focus-within {
          border-color: rgba(124, 92, 255, 0.55);
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
            0 0 0 3px rgba(124, 92, 255, 0.15),
            0 0 18px -4px rgba(124, 92, 255, 0.35);
        }

        /* Submit button — brighter gradient + glass rim so it pops
           instead of blending into the card */
        .submit-glow {
          position: relative;
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
            0 8px 24px -8px rgba(124, 92, 255, 0.65),
            0 0 0 1px rgba(255, 255, 255, 0.08);
        }
        .submit-glow:not(:disabled):hover {
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
            0 10px 28px -6px rgba(124, 92, 255, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }
        .submit-glow:not(:disabled):active {
          transform: translateY(0);
        }
      `}</style>

      <div
        className="relative w-[400px] rounded-[26px] overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#5b3df0]/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-56 h-56 rounded-full bg-[#2b1f78]/25 blur-[90px]" />

        <div className={`relative rounded-[26px] ${GLASS_PANEL}`}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4028b0] flex items-center justify-center shrink-0">
                <Megaphone size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white leading-tight">
                  New channel
                </h3>
                <p className="text-[11px] text-white/30 leading-tight mt-0.5">
                  broadcast to your subscribers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="group relative shrink-0 w-[68px] h-[68px] rounded-2xl cursor-pointer"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c5cff] via-[#5b3df0] to-[#2b1f78] blur-[2px] opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#12111f] flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : initial ? (
                    <span className="text-2xl font-semibold text-white/90">
                      {initial}
                    </span>
                  ) : (
                    <Camera size={20} className="text-white/70" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              </button>
              <div className="text-[11px] text-white/30 leading-relaxed">
                Channel avatar
                <br />
                Optional — a letter badge is used if you skip it
              </div>
            </div>
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Channel name"
                className="w-full bg-transparent text-[15px] text-white placeholder-white/20 outline-none"
              />
            </Field>
            <Field
              label="Description"
              trailing={
                <span className="text-[10px] text-white/20 tabular-nums">
                  {description.length}/160
                </span>
              }
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 160))}
                placeholder="What this channel is about"
                rows={3}
                className="w-full bg-transparent text-[14px] text-white placeholder-white/20 outline-none resize-none leading-relaxed"
              />
            </Field>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="submit-glow w-full h-12 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[#7c5cff] to-[#5b3df0] hover:from-[#8d70ff] hover:to-[#6c4dff] flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  creating…
                </>
              ) : (
                "Create channel"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
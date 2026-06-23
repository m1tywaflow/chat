"use client";

import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { Gem, X, Pencil, Check, Upload, Pipette } from "lucide-react";
import ImageCropper from "../image-cropper/ImageCropper";

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

  function openEdit() {
    setDraftBanner(bannerGradient);
    setDraftBannerIsImage(bannerIsImage);
    setDraftBorder(avatarBorder);
    setDraftCardColor(cardColor);
    setDraftAvatar(null);
    setBannerLocalPreview(null);
    setAvatarLocalPreview(null);
    setEditing(true);
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
      };
      if (draftAvatar) updates.avatar = draftAvatar;
      await updateDoc(doc(db, "users", user.uid), updates);
      setBannerGradient(draftBanner);
      setBannerIsImage(draftBannerIsImage);
      setAvatarBorder(draftBorder);
      setCardColor(draftCardColor);
      if (draftAvatar) setAvatar(draftAvatar);
      setEditing(false);
    } finally {
      setSaving(false);
      setBannerLocalPreview(null);
      setAvatarLocalPreview(null);
      setDraftAvatar(null);
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  const activeBannerValue = editing
    ? bannerLocalPreview || draftBanner
    : bannerGradient;
  const activeBannerIsImage = editing
    ? !!bannerLocalPreview || draftBannerIsImage
    : bannerIsImage;
  const activeBorder = editing ? draftBorder : avatarBorder;
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
            <div className="relative z-10 -mt-9 mb-3 shrink-0">
              <div
                className="w-[72px] h-[72px] rounded-full p-[2.5px]"
                style={{ background: activeBorder }}
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
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <Upload
                    size={14}
                    className="text-white/60 hover:text-white"
                  />
                </button>
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

            <div className="flex flex-col items-center gap-1 mb-4">
              <span className="text-white font-semibold text-lg tracking-[0.03em]">
                {username}
              </span>
              <span className="text-[10px] text-white/22 tracking-widest uppercase">
                joined {joined}
              </span>
              <div className="mt-1 px-3 py-1 flex items-center gap-2 bg-gradient-to-r from-[#A78BFA]/20 to-[#60A5FA]/20 border border-white/10 text-xs text-white rounded-lg">
                Early Member
                <Gem size={14} color="gold" />
              </div>
            </div>

            {bio && !editing && (
              <p className="text-xs text-white/40 text-center leading-relaxed mb-4">
                {bio}
              </p>
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
                    <div className="grid grid-cols-2 gap-4">
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
                          </div>
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
    </>
  );
}

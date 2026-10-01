"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { decoSrc } from "@/lib/cdn";
import {
  X,
  Pencil,
  Check,
  Upload,
  Pipette,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import { AVATAR_DECORATIONS } from "@/lib/avatarDecorations";
import { BADGE } from "@/lib/badge";
import { getChannelByOwner } from "@/lib/firestore/channels";
import { useChannelStore } from "@/store/channel-store";
import { useChatStore } from "@/store/chat-store";

const ImageCropper = dynamic(() => import("../image-cropper/ImageCropper"), {
  ssr: false,
});
const FullProfileView = dynamic(() => import("./Fullprofileview"), {
  ssr: false,
});

const ACCENT = "#A78BFA";

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

const DECO_BY_URL = new Map(AVATAR_DECORATIONS.map((d) => [d.url, d]));
const BADGE_BY_ID = new Map(BADGE.map((b) => [b.id, b]));

type Gift = (typeof GIFTS)[string];

const CSS = `
@keyframes pmFade{from{opacity:0}to{opacity:1}}
@keyframes pmCardIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes giftModalIn{from{opacity:0;transform:scale(.96) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
.pm-overlay{animation:pmFade .16s ease-out}
.pm-card{animation:pmCardIn .24s cubic-bezier(.2,.9,.3,1.05)}
.pm-gift-detail{animation:giftModalIn .18s ease-out}
.pm-acc{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .2s ease-out,visibility 0s linear .2s}
.pm-acc[data-open="true"]{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .2s ease-out,visibility 0s}
@media (prefers-reduced-motion:reduce){
  .pm-overlay,.pm-card,.pm-gift-detail{animation:none!important}
  .pm-acc,.pm-acc[data-open="true"]{transition:none!important}
}
`;

function rarityColorOf(rarity: string | undefined): string {
  const colors: Record<string, string> = RARITY_COLORS;
  return (rarity && colors[rarity]) || ACCENT;
}

function cloudinaryUrl(url: string, transform: string) {
  if (!url?.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

const tinySrc = (url: string) =>
  cloudinaryUrl(url, "e_blur:1000,q_1,w_24,f_auto");
const fullSrc = (url: string, w = 320) =>
  cloudinaryUrl(url, `f_auto,q_auto,dpr_auto,w_${w}`);

const SmartImage = memo(function SmartImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  rounded = "rounded-xl",
  priority = false,
  width = 320,
  onLoad,
  onClick,
  style,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
  priority?: boolean;
  width?: number;
  onLoad?: () => void;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={style}
    >
      <img
        src={tinySrc(src)}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        style={{ filter: "blur(8px)" }}
      />
      <img
        ref={imgRef}
        src={fullSrc(src, width)}
        alt={alt}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onClick={onClick}
        className={`relative w-full h-full object-cover block transition-opacity duration-150 ${imgClassName}`}
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
});

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

const GiftTile = memo(function GiftTile({
  giftId,
  index,
  onSelect,
}: {
  giftId: string;
  index: number;
  onSelect: (id: string) => void;
}) {
  const gift = GIFTS[giftId];
  const color = rarityColorOf(gift.rarity);

  return (
    <button
      type="button"
      onClick={() => onSelect(giftId)}
      className="group flex flex-col items-center gap-1.5 cursor-pointer"
      style={{ "--rc": `${color}55` } as CSSProperties}
    >
      <div
        className="w-full aspect-square rounded-xl flex items-center justify-center border border-white/[0.05] bg-white/[0.03] transition-[background-color,box-shadow,transform] duration-200 group-hover:bg-white/[0.05] group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_-10px_var(--rc)]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, ${color}18, transparent 70%)`,
        }}
      >
        <img
          src={gift.imageUrl}
          alt={gift.name}
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          className="w-3/5 h-3/5 object-contain"
        />
      </div>
      <span className="flex items-center gap-1 text-[10px] text-white/50 group-hover:text-white/75 transition-colors">
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ background: color }}
        />
        {gift.name}
      </span>
    </button>
  );
});

const GiftDetail = memo(function GiftDetail({
  gift,
  cardColor,
  onClose,
}: {
  gift: Gift;
  cardColor: string;
  onClose: () => void;
}) {
  const color = rarityColorOf(gift.rarity);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={gift.name}
      className="pm-gift-detail absolute inset-0 z-20 flex flex-col rounded-2xl overflow-hidden"
      style={{ backgroundColor: cardColor }}
    >
      <div
        className="relative flex items-center justify-center flex-1 bg-white/[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${color}22, transparent 65%)`,
        }}
      >
        <img
          src={gift.imageUrl}
          alt={gift.name}
          loading="eager"
          decoding="async"
          draggable={false}
          className="w-52 h-52 object-contain relative z-10"
          style={{ filter: `drop-shadow(0 0 28px ${color}45)` }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/25 text-white/60 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-5">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-semibold text-[15px] tracking-wide">
            {gift.name}
          </span>
          <span
            className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{ color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
            {gift.rarity}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
});

const DecorationPicker = memo(function DecorationPicker({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (url: string | null) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {AVATAR_DECORATIONS.map((d) => (
        <button
          type="button"
          key={d.id}
          onClick={() => onPick(d.url)}
          className="relative rounded-full flex items-center justify-center transition-all"
          style={{
            width: 52,
            height: 52,
            background: "rgba(255,255,255,0.04)",
            outline:
              value === d.url
                ? `2px solid ${ACCENT}`
                : "2px solid transparent",
            outlineOffset: "2px",
          }}
        >
          {d.url ? (
            <img
              src={decoSrc(d.url, 128)}
              alt={d.label}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-white/30 text-[10px]">None</span>
          )}
        </button>
      ))}
    </div>
  );
});

const FeaturedGiftPicker = memo(function FeaturedGiftPicker({
  gifts,
  value,
  onPick,
}: {
  gifts: string[];
  value: string | null;
  onPick: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onPick(null)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] transition-all bg-white/[0.04] text-white/30"
        style={{
          outline:
            value === null ? `2px solid ${ACCENT}` : "2px solid transparent",
          outlineOffset: "2px",
        }}
      >
        ✕
      </button>
      {gifts.map((giftId) => {
        const gift = GIFTS[giftId];
        return (
          <button
            type="button"
            key={giftId}
            onClick={() => onPick(giftId)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/[0.04]"
            style={{
              outline:
                value === giftId
                  ? `2px solid ${ACCENT}`
                  : "2px solid transparent",
              outlineOffset: "2px",
            }}
          >
            <img
              src={gift.imageUrl}
              alt={gift.name}
              loading="lazy"
              decoding="async"
              className="w-6 h-6 object-contain"
            />
          </button>
        );
      })}
    </div>
  );
});

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
  const colorRaf = useRef<number | null>(null);

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
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

  const validGifts = useMemo(
    () => gifts.filter((id) => !!GIFTS[id]),
    [gifts]
  );

  const joined = useMemo(() => {
    if (userId) return "";
    const t = auth.currentUser?.metadata.creationTime;
    return t
      ? new Date(t).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
      : "";
  }, [userId]);


  useEffect(() => {
    if (!targetUid) return;
    let cancelled = false;

    getDoc(doc(db, "users", targetUid)).then((snap) => {
      if (cancelled || !snap.exists()) return;
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
    });

    return () => {
      cancelled = true;
    };
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid) return;
    let cancelled = false;

    getChannelByOwner(targetUid).then((ch) => {
      if (cancelled) return;
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

    return () => {
      cancelled = true;
    };
  }, [targetUid]);


  useEffect(
    () => () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    },
    [cropSrc]
  );
  useEffect(
    () => () => {
      if (bannerLocalPreview) URL.revokeObjectURL(bannerLocalPreview);
    },
    [bannerLocalPreview]
  );
  useEffect(
    () => () => {
      if (avatarLocalPreview) URL.revokeObjectURL(avatarLocalPreview);
    },
    [avatarLocalPreview]
  );
  useEffect(
    () => () => {
      if (colorRaf.current) cancelAnimationFrame(colorRaf.current);
    },
    []
  );



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || showFullProfile || cropSrc) return;
      if (giftModal) setGiftModal(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giftModal, showFullProfile, cropSrc, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);


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

  const runUpload = useCallback(
    async (file: Blob | File, kind: "banner" | "avatar") => {
      const isBanner = kind === "banner";
      const setPreview = isBanner
        ? setBannerLocalPreview
        : setAvatarLocalPreview;
      const setUploading = isBanner ? setBannerUploading : setAvatarUploading;

      setPreview(URL.createObjectURL(file));
      setUploading(true);
      try {
        const url = await uploadToCloudinary(
          file,
          isBanner ? "banners" : "avatars"
        );
        if (isBanner) {
          setDraftBanner(url);
          setDraftBannerIsImage(true);
        } else {
          setDraftAvatar(url);
        }
      } catch (err) {
        console.error(`${kind} upload failed:`, err);
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    []
  );

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement>,
    kind: "banner" | "avatar"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type === "image/gif") {
      void runUpload(file, kind);
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    setCropTarget(kind);
  }

  async function handleCropConfirm(blob: Blob) {
    const target = cropTarget;
    setCropSrc(null);
    setCropTarget(null);
    if (target) await runUpload(blob, target);
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
      setAvatarDecoration(draftDecoration);
      setFeaturedGift(draftFeaturedGift);
      setBannerLocalPreview(null);
      setAvatarLocalPreview(null);
      setDraftAvatar(null);
      setEditing(false);
    } catch (err) {
      console.error("Profile save failed:", err);
    } finally {
      setSaving(false);
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

  const handleSelectGift = useCallback((id: string) => setGiftModal(id), []);
  const closeGift = useCallback(() => setGiftModal(null), []);
  const closeFullProfile = useCallback(() => setShowFullProfile(false), []);

  function handleCustomColor(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (colorRaf.current) cancelAnimationFrame(colorRaf.current);
    colorRaf.current = requestAnimationFrame(() => setDraftCardColor(v));
  }

  function openColorPicker() {
    if (colorInputRef.current) {
      colorInputRef.current.value = draftCardColor;
      colorInputRef.current.click();
    }
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

  const activeDecoBlend = activeDecoration
    ? (DECO_BY_URL.get(activeDecoration)?.blendMode as
      | CSSProperties["mixBlendMode"]
      | undefined)
    : undefined;

  const featured = featuredGift ? GIFTS[featuredGift] : null;
  const activeGift = giftModal ? GIFTS[giftModal] : null;

  return (
    <>
      <style>{CSS}</style>

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
        role="dialog"
        aria-modal="true"
        aria-label={`${username || "User"} profile`}
        className="pm-overlay fixed inset-0 bg-black/55 backdrop-blur-[6px] flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="pm-card border border-white/[0.08] rounded-2xl w-[320px] max-w-[calc(100vw-24px)] flex flex-col items-center relative overflow-hidden transition-colors duration-200"
          style={{
            backgroundColor: activeCardColor,
            boxShadow:
              "0 24px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%)",
            }}
          />

          {/* gift detail overlay */}
          {activeGift && (
            <GiftDetail
              gift={activeGift}
              cardColor={activeCardColor}
              onClose={closeGift}
            />
          )}

          {/* banner */}
          <div
            className="w-full h-[84px] relative z-0 shrink-0 overflow-hidden"
            style={
              !activeBannerIsImage
                ? { background: activeBannerValue }
                : undefined
            }
          >
            {activeBannerIsImage && activeBannerValue && (
              <SmartImage
                key={activeBannerValue}
                src={activeBannerValue}
                alt="banner"
                className="absolute inset-0"
                rounded=""
                priority
              />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
              style={{
                background: `linear-gradient(to bottom, transparent, ${activeCardColor}80)`,
              }}
            />
            {bannerUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {editing && (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 hover:bg-black/45 transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white text-[10px] tracking-widest transition-colors">
                  <Upload size={12} />
                  {bannerUploading ? "UPLOADING…" : "CHANGE BANNER"}
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="absolute top-3 right-3 z-10 text-white/45 hover:text-white transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div className="w-full flex flex-col items-center px-7 pb-7 relative">
            {/* avatar */}
            <div
              className="relative z-10 -mt-8 mb-3 shrink-0 flex items-center justify-center"
              style={{ width: 122, height: 96, overflow: "visible" }}
            >
              {activeDecoration && (
                <img
                  src={decoSrc(activeDecoration, 320)}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="absolute pointer-events-none select-none"
                  style={{
                    width: 152,
                    height: 152,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    objectFit: "contain",
                    zIndex: 10,
                    mixBlendMode: activeDecoBlend || "normal",
                  }}
                />
              )}

              <div
                className="rounded-full p-[2px] absolute"
                style={{
                  background: activeBorder,
                  width: 68,
                  height: 68,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 0 4px ${activeCardColor}, 0 8px 22px rgba(0,0,0,0.35)`,
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
                    <SmartImage
                      key={activeAvatar}
                      src={activeAvatar}
                      alt="avatar"
                      className="w-full h-full"
                      rounded="rounded-full"
                      width={136}
                      priority
                    />
                  ) : (
                    <span className="text-white text-base font-medium">
                      {username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {editing && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Change avatar"
                  className="absolute rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                  style={{
                    width: 68,
                    height: 68,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                  }}
                >
                  <Upload
                    size={13}
                    className="text-white/60 hover:text-white"
                  />
                </button>
              )}

              {!editing && validGifts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFullProfile(true)}
                  className="absolute rounded-full"
                  style={{
                    width: 68,
                    height: 68,
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
              onChange={(e) => handleFileChange(e, "banner")}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "avatar")}
            />
            <input
              ref={colorInputRef}
              type="color"
              className="hidden"
              defaultValue={cardColor}
              onChange={handleCustomColor}
            />

            {/* identity */}
            <div className="flex flex-col items-center gap-1.5 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-[16px] tracking-tight">
                  {username}
                </span>
                {featured && (
                  <img
                    src={featured.imageUrl}
                    alt={featured.name}
                    title={featured.name}
                    loading="eager"
                    decoding="async"
                    className="w-[18px] h-[18px] object-contain shrink-0"
                  />
                )}
              </div>
              {joined && (
                <span className="text-[10px] text-white/25 tracking-widest uppercase">
                  joined {joined}
                </span>
              )}

              {badges.map((badgeId) => {
                const badgeData = BADGE_BY_ID.get(badgeId);
                if (!badgeData) return null;
                return (
                  <div
                    key={badgeData.id}
                    className="mt-1 px-2.5 py-1 flex items-center gap-1.5 rounded-full border border-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    {badgeData.url && (
                      <img
                        src={badgeData.url}
                        alt={badgeData.label}
                        loading="lazy"
                        decoding="async"
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <span className="text-[12px] font-medium tracking-wide text-white/70">
                      {badgeData.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {bio && !editing && (
              <p className="text-[12px] text-white/40 text-center leading-relaxed mb-4">
                {bio}
              </p>
            )}

            {!editing && showChannelInProfile && ownedChannel && (
              <button
                type="button"
                onClick={openOwnedChannel}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.06] transition-colors mb-4 cursor-pointer"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center overflow-hidden text-white/60 text-sm font-medium">
                  {ownedChannel.avatarUrl ? (
                    <SmartImage
                      src={ownedChannel.avatarUrl}
                      alt={ownedChannel.name}
                      className="w-full h-full"
                      rounded=""
                      width={72}
                    />
                  ) : (
                    ownedChannel.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-white truncate">
                    {ownedChannel.name}
                    <Megaphone size={11} className="text-white/40 shrink-0" />
                  </div>
                  <div className="text-[11px] text-white/30">
                    {ownedChannel.subscriberCount} subscribers
                  </div>
                </div>
              </button>
            )}

            {editing ? (
              <div className="w-full flex flex-col gap-1.5 mb-5">
                <AccordionSection
                  label="Banner"
                  badge={
                    <span
                      className="w-4 h-4 rounded-md shrink-0"
                      style={
                        bannerLocalPreview
                          ? {
                            backgroundImage: `url(${bannerLocalPreview})`,
                            backgroundSize: "cover",
                          }
                          : draftBannerIsImage
                            ? {
                              backgroundImage: `url(${fullSrc(draftBanner, 32)})`,
                              backgroundSize: "cover",
                            }
                            : { background: draftBanner }
                      }
                    />
                  }
                >
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((p) => (
                      <button
                        type="button"
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
                              ? `2px solid ${ACCENT}`
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection
                  label="Avatar border"
                  badge={
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ background: draftBorder }}
                    />
                  }
                >
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_BORDERS.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => setDraftBorder(b.value)}
                        className="h-7 rounded-full transition-all"
                        style={{
                          background: b.value,
                          outline:
                            draftBorder === b.value
                              ? `2px solid ${ACCENT}`
                              : "2px solid transparent",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection
                  label="Decoration"
                  badge={
                    draftDecoration ? (
                      <img
                        src={decoSrc(draftDecoration, 128)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-4 h-4 object-contain opacity-70"
                      />
                    ) : undefined
                  }
                >
                  <DecorationPicker
                    value={draftDecoration}
                    onPick={setDraftDecoration}
                  />
                </AccordionSection>

                {validGifts.length > 0 && (
                  <AccordionSection
                    label="Featured gift"
                    badge={
                      draftFeaturedGift && GIFTS[draftFeaturedGift] ? (
                        <img
                          src={GIFTS[draftFeaturedGift].imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-4 h-4 object-contain"
                        />
                      ) : undefined
                    }
                  >
                    <FeaturedGiftPicker
                      gifts={validGifts}
                      value={draftFeaturedGift}
                      onPick={setDraftFeaturedGift}
                    />
                  </AccordionSection>
                )}

                {ownedChannel && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setDraftShowChannelInProfile((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="flex items-center gap-2 text-[12px] text-white/60">
                        <Megaphone size={13} className="text-white/40" />
                        Show my channel on profile
                      </span>
                      <span
                        className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                        style={{
                          background: draftShowChannelInProfile
                            ? ACCENT
                            : "rgba(255,255,255,0.12)",
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

                <AccordionSection
                  label="Card color"
                  badge={
                    <span
                      className="w-4 h-4 rounded-md shrink-0"
                      style={{ background: draftCardColor }}
                    />
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      {CARD_COLOR_PRESETS.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setDraftCardColor(c)}
                          className="h-6 rounded-md transition-all"
                          style={{
                            backgroundColor: c,
                            border:
                              draftCardColor === c
                                ? `2px solid ${ACCENT}`
                                : "2px solid rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={openColorPicker}
                      title="Custom color"
                      aria-label="Custom color"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white transition-colors relative overflow-hidden"
                      style={{ backgroundColor: draftCardColor }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Pipette size={13} className="text-white/70" />
                      </div>
                    </button>
                  </div>
                </AccordionSection>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setBannerLocalPreview(null);
                      setAvatarLocalPreview(null);
                      setDraftAvatar(null);
                    }}
                    className="flex-1 py-2.5 text-[11px] text-white/35 hover:text-white/70 rounded-lg transition-colors tracking-widest bg-white/[0.03] hover:bg-white/[0.06]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving || bannerUploading || avatarUploading}
                    className="flex-1 py-2.5 text-[11px] text-white hover:opacity-90 rounded-lg transition-colors tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={{
                      background: ACCENT,
                      boxShadow: `0 6px 18px -6px ${ACCENT}99`,
                    }}
                  >
                    {saving ? (
                      "SAVING…"
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
                {validGifts.length > 0 && (
                  <div className="w-full mb-4">
                    <div className="text-[10px] text-white/30 uppercase tracking-[0.18em] text-center mb-3">
                      Gifts
                    </div>
                    <div
                      className={`grid grid-cols-2 gap-3 ${validGifts.length > 4
                        ? "max-h-[380px] overflow-y-auto pr-1"
                        : ""
                        }`}
                      style={
                        validGifts.length > 4
                          ? {
                            scrollbarWidth: "thin",
                            scrollbarColor: `${ACCENT}40 transparent`,
                          }
                          : undefined
                      }
                    >
                      {validGifts.map((giftId, i) => (
                        <GiftTile
                          key={giftId + i}
                          giftId={giftId}
                          index={i}
                          onSelect={handleSelectGift}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="w-full h-px mb-4"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  }}
                />

                <div className="flex items-center justify-between w-full">
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={logout}
                      className="text-[11px] text-red-400/50 hover:text-red-400 tracking-widest transition-colors"
                    >
                      LOG OUT
                    </button>
                  ) : (
                    <div />
                  )}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={openEdit}
                      className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 tracking-widest transition-colors"
                    >
                      <Pencil size={12} />
                      CUSTOMIZE
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
          onClose={closeFullProfile}
          username={username}
          avatar={avatar}
          avatarBorder={avatarBorder}
          avatarDecoration={avatarDecoration}
          bannerGradient={bannerGradient}
          bannerIsImage={bannerIsImage}
          cardColor={cardColor}
          gifts={validGifts}
        />
      )}
    </>
  );
}
function AccordionSection({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggle = useCallback(() => {
    setMounted(true);
    setOpen((v) => !v);
  }, []);

  return (
    <div className="border-b border-white/[0.04] last:border-b-0 pb-1.5 last:pb-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-1"
      >
        <p className="text-[10px] text-white/35 uppercase tracking-[0.18em] flex items-center gap-2">
          {label}
          {badge}
        </p>
        <ChevronDown
          size={13}
          className={`text-white/30 transition-transform duration-150 ${open ? "rotate-180" : ""
            }`}
        />
      </button>
      <div className="pm-acc" data-open={open}>
        <div className="min-h-0 overflow-hidden -mx-1 px-1">
          <div className="pt-2 pb-1.5">{mounted && children}</div>
        </div>
      </div>
    </div>
  );
}
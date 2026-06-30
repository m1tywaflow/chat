"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";

interface FullProfileViewProps {
  onClose: () => void;
  username: string;
  avatar: string;
  avatarBorder: string;
  avatarDecoration: string | null;
  bannerGradient: string;
  bannerIsImage: boolean;
  cardColor: string;
  gifts: string[];
}

const FLOAT_VARIANTS = ["floatA", "floatB", "floatC"];

export default function FullProfileView({
  onClose,
  username,
  avatar,
  avatarBorder,
  avatarDecoration,
  bannerGradient,
  bannerIsImage,
  cardColor,
  gifts,
}: FullProfileViewProps) {
  const [giftModal, setGiftModal] = useState<string | null>(null);

  const validGifts = useMemo(() => gifts.filter((id) => GIFTS[id]), [gifts]);

  const compact = validGifts.length > 8;
  const radius = compact ? 120 : 140;
  const iconSize = compact ? 44 : 58;

  const positions = useMemo(() => {
    const n = validGifts.length;
    return validGifts.map((id, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const jitterAngle = ((i * 37) % 11) * 0.012;
      const jitterRadius = ((i * 53) % 17) - 8;
      const r = radius + jitterRadius;
      const x = Math.cos(angle + jitterAngle) * r;
      const y = Math.sin(angle + jitterAngle) * r;
      return {
        id,
        x,
        y,
        variant: FLOAT_VARIANTS[i % FLOAT_VARIANTS.length],
        duration: 3.4 + (i % 4) * 0.4,
        delay: -((i * 0.35) % 4),
        reverse: i % 2 === 0,
      };
    });
  }, [validGifts, radius]);

  const bannerStyle = bannerIsImage
    ? {
        backgroundImage: `url(${bannerGradient})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: bannerGradient };

  return (
    <>
      <style>{`
        @keyframes floatA{0%,100%{transform:translate(var(--gx),var(--gy)) translate(0,0) rotate(0deg)}50%{transform:translate(var(--gx),var(--gy)) translate(4px,-10px) rotate(6deg)}}
        @keyframes floatB{0%,100%{transform:translate(var(--gx),var(--gy)) translate(0,0) rotate(0deg)}50%{transform:translate(var(--gx),var(--gy)) translate(-6px,-8px) rotate(-5deg)}}
        @keyframes floatC{0%,100%{transform:translate(var(--gx),var(--gy)) translate(0,0) rotate(0deg)}50%{transform:translate(var(--gx),var(--gy)) translate(5px,8px) rotate(4deg)}}
        @keyframes fullProfileIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
        style={{ ...bannerStyle, animation: "fullProfileIn 0.18s ease-out" }}
        onClick={onClose}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: cardColor, opacity: 0.86 }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/25 text-white/60 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div
          className="relative z-[1] flex items-center justify-center"
          style={{ width: 300, height: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {avatarDecoration && (
            <img
              src={avatarDecoration}
              alt=""
              className="absolute pointer-events-none select-none"
              style={{
                width: 220,
                height: 220,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                objectFit: "contain",
                zIndex: 5,
              }}
            />
          )}

          <div
            className="rounded-full p-[3px] absolute z-[4]"
            style={{
              background: avatarBorder,
              width: 108,
              height: 108,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 30px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: cardColor }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-medium">
                  {username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {positions.map((p) => {
            const gift = GIFTS[p.id];
            if (!gift) return null;
            const color = RARITY_COLORS[gift.rarity];
            return (
              <button
                key={p.id}
                onClick={() => setGiftModal(p.id)}
                className="absolute z-[3]"
                style={{
                  width: iconSize,
                  height: iconSize,
                  top: "50%",
                  left: "50%",
                  ["--gx" as any]: `${p.x}px`,
                  ["--gy" as any]: `${p.y}px`,
                  transform: `translate(calc(-50% + var(--gx)), calc(-50% + var(--gy)))`,
                  animation: `${p.variant} ${
                    p.duration
                  }s ease-in-out infinite ${
                    p.reverse ? "alternate-reverse" : "alternate"
                  }`,
                  animationDelay: `${p.delay}s`,
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${color}40, transparent 70%)`,
                    filter: `drop-shadow(0 0 10px ${color}60)`,
                  }}
                >
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="w-4/5 h-4/5 object-contain"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="relative z-[1] flex flex-col items-center gap-1 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-white font-semibold text-lg tracking-[0.03em]">
            {username}
          </span>
          {validGifts.length > 0 && (
            <span className="text-[10px] text-white/35 tracking-widest uppercase">
              {validGifts.length} gifts
            </span>
          )}
        </div>

        {giftModal &&
          (() => {
            const gift = GIFTS[giftModal];
            if (!gift) return null;
            const color = RARITY_COLORS[gift.rarity];
            return (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/55"
                onClick={() => setGiftModal(null)}
              >
                <div
                  className="w-[260px] rounded-2xl overflow-hidden border border-white/[0.08]"
                  style={{ backgroundColor: cardColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex items-center justify-center h-44 bg-black/20">
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="w-32 h-32 object-contain"
                      style={{ filter: `drop-shadow(0 0 24px ${color}60)` }}
                    />
                    <button
                      onClick={() => setGiftModal(null)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2 px-5 py-4">
                    <span className="text-white font-semibold text-sm">
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
                </div>
              </div>
            );
          })()}
      </div>
    </>
  );
}

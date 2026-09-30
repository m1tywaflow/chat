"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { X } from "lucide-react";
import { GIFTS, RARITY_COLORS } from "@/lib/gifts";
import { decoSrc } from "@/lib/cdn";
import { TiltCard, TiltLayer } from "@/components/atoms/TiltCard";

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

type Gift = (typeof GIFTS)[string];

interface GiftItem {
  id: string;
  gift: Gift;
  color: string;
  rank: number;
  x: number;
  y: number;
  size: number;
  depth: number;
  variant: string;
  duration: number;
  delay: number;
  reverse: boolean;
  popDelay: number;
}

const FLOAT_VARIANTS = ["fpFloatA", "fpFloatB", "fpFloatC"];

// Порядок ключей RARITY_COLORS считаем от обычного к редкому.
// Если у тебя наоборот — поменяй знак в сортировке ниже.
const RARITY_ORDER = Object.keys(RARITY_COLORS);
const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity);

// Статичный CSS — вынесен из компонента, чтобы не пересоздавать строку на каждый рендер.
const CSS = `
@keyframes fpFloatA{0%,100%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(4px,-10px,0) rotate(6deg)}}
@keyframes fpFloatB{0%,100%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(-6px,-8px,0) rotate(-5deg)}}
@keyframes fpFloatC{0%,100%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(5px,8px,0) rotate(4deg)}}
@keyframes fpIn{from{opacity:0}to{opacity:1}}
@keyframes fpPop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
@keyframes fpBreathe{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes fpModal{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}
.fp-gift{will-change:transform}
.fp-gift:hover,.fp-gift:focus-visible{animation-play-state:paused!important;z-index:2}
.fp-gift:focus-visible{outline:2px solid rgba(255,255,255,.75);outline-offset:2px;border-radius:9999px}
.fp-gift-icon{animation:fpPop .5s cubic-bezier(.2,.9,.3,1.3) backwards;transition:transform .18s ease}
.fp-gift:hover .fp-gift-icon,.fp-gift:focus-visible .fp-gift-icon{transform:scale(1.18)}
.fp-aura{animation:fpBreathe 5s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .fp-gift,.fp-gift-icon,.fp-aura{animation:none!important}
}
`;

/* ------------------------------------------------------------------ */
/* Раскладка подарков: одно кольцо, а если много — два (внешнее+внутр) */
/* ------------------------------------------------------------------ */
function layoutGifts(ids: string[]): GiftItem[] {
  const unique = Array.from(new Set(ids));

  const sorted = unique
    .map((id) => ({ id, gift: GIFTS[id] }))
    .filter((g): g is { id: string; gift: Gift } => Boolean(g.gift))
    .map((g) => ({
      ...g,
      color: RARITY_COLORS[g.gift.rarity] as string,
      rank: rarityRank(g.gift.rarity),
    }))
    // самые редкие — первыми: окажутся сверху внешнего кольца
    .sort((a, b) => b.rank - a.rank);

  const n = sorted.length;
  if (n === 0) return [];

  const rings =
    n <= 8
      ? [{ count: n, radius: 135, size: 58, offset: 0, depth: 30 }]
      : (() => {
          const outer = Math.ceil(n * 0.6);
          return [
            { count: outer, radius: 152, size: 46, offset: 0, depth: 32 },
            {
              count: n - outer,
              radius: 98,
              size: 40,
              // сдвиг на пол-шага, чтобы иконки не стояли строго под внешними
              offset: Math.PI / outer,
              depth: 18,
            },
          ];
        })();

  const out: GiftItem[] = [];
  let cursor = 0;

  rings.forEach((ring) => {
    for (let k = 0; k < ring.count; k++) {
      const item = sorted[cursor];
      const i = cursor;
      cursor++;

      const angle = (2 * Math.PI * k) / ring.count - Math.PI / 2 + ring.offset;
      const jitterAngle = ((i * 37) % 11) * 0.012;
      const jitterRadius = ((i * 53) % 17) - 8;
      const r = ring.radius + jitterRadius * 0.6;

      out.push({
        ...item,
        x: Math.cos(angle + jitterAngle) * r,
        y: Math.sin(angle + jitterAngle) * r,
        size: ring.size,
        depth: ring.depth + (k % 2) * 6,
        variant: FLOAT_VARIANTS[i % FLOAT_VARIANTS.length],
        duration: 3.4 + (i % 4) * 0.4,
        delay: -((i * 0.35) % 4),
        reverse: i % 2 === 0,
        popDelay: 0.12 + i * 0.035,
      });
    }
  });

  return out;
}

/* ------------------------------------------------------------------ */
/* Кнопка подарка (memo — не ререндерится при открытии модалки)        */
/* ------------------------------------------------------------------ */
const GiftButton = memo(function GiftButton({
  item,
  onSelect,
}: {
  item: GiftItem;
  onSelect: (id: string) => void;
}) {
  const { gift, color, size } = item;

  return (
    <TiltLayer
      depth={item.depth}
      className="absolute inset-0 pointer-events-none"
    >
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        aria-label={`${gift.name}, ${gift.rarity}`}
        className="fp-gift group absolute pointer-events-auto"
        style={{
          width: size,
          height: size,
          left: `calc(50% + ${item.x}px - ${size / 2}px)`,
          top: `calc(50% + ${item.y}px - ${size / 2}px)`,
          animation: `${item.variant} ${item.duration}s ease-in-out infinite ${
            item.reverse ? "alternate-reverse" : "alternate"
          }`,
          animationDelay: `${item.delay}s`,
        }}
      >
        <div
          className="fp-gift-icon w-full h-full rounded-full flex items-center justify-center"
          style={
            {
              background: `radial-gradient(circle, ${color}40, transparent 70%)`,
              filter: `drop-shadow(0 0 10px ${color}60)`,
              animationDelay: `${item.popDelay}s`,
            } as CSSProperties
          }
        >
          <img
            src={gift.imageUrl}
            alt=""
            draggable={false}
            decoding="async"
            className="w-4/5 h-4/5 object-contain select-none"
          />
        </div>

        <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {gift.name}
        </span>
      </button>
    </TiltLayer>
  );
});

/* ------------------------------------------------------------------ */
/* Модалка подарка                                                     */
/* ------------------------------------------------------------------ */
const GiftModal = memo(function GiftModal({
  gift,
  color,
  cardColor,
  onClose,
}: {
  gift: Gift;
  color: string;
  cardColor: string;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/55"
      style={{ animation: "fpIn 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={gift.name}
        className="w-[260px] rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{
          backgroundColor: cardColor,
          animation: "fpModal 0.22s cubic-bezier(.2,.9,.3,1.1)",
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${color}25`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex items-center justify-center h-44"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${color}30, transparent 70%), rgba(0,0,0,0.2)`,
          }}
        >
          <img
            src={gift.imageUrl}
            alt={gift.name}
            draggable={false}
            className="w-32 h-32 object-contain select-none"
            style={{ filter: `drop-shadow(0 0 24px ${color}70)` }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 px-5 py-4">
          <span className="text-white font-semibold text-sm">{gift.name}</span>
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
});

/* ------------------------------------------------------------------ */
/* Основной компонент                                                  */
/* ------------------------------------------------------------------ */
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const items = useMemo(() => layoutGifts(gifts), [gifts]);

  // Самый редкий подарок красит ауру за аватаром
  const auraColor = items[0]?.color ?? null;

  // Сводка по редкости: "2 legendary · 5 rare"
  const summary = useMemo(() => {
    const map = new Map<string, { color: string; count: number; rank: number }>();
    items.forEach(({ gift, color, rank }) => {
      const prev = map.get(gift.rarity);
      if (prev) prev.count++;
      else map.set(gift.rarity, { color, count: 1, rank });
    });
    return Array.from(map, ([rarity, v]) => ({ rarity, ...v })).sort(
      (a, b) => b.rank - a.rank,
    );
  }, [items]);

  const activeGift = giftModal ? GIFTS[giftModal] : null;

  const handleSelect = useCallback((id: string) => setGiftModal(id), []);
  const closeGift = useCallback(() => setGiftModal(null), []);

  // Escape: сначала закрывает подарок, потом профиль
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (giftModal) setGiftModal(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giftModal, onClose]);

  // Лочим скролл страницы и возвращаем фокус после закрытия
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  const bannerStyle = useMemo<CSSProperties>(
    () =>
      bannerIsImage
        ? {
            backgroundImage: `url(${bannerGradient})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : { background: bannerGradient },
    [bannerIsImage, bannerGradient],
  );

  return (
    <>
      <style>{CSS}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${username}'s profile`}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
        style={{ ...bannerStyle, animation: "fpIn 0.18s ease-out" }}
        onClick={onClose}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: cardColor, opacity: 0.86 }}
        />

        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/25 text-white/60 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div
          className="relative z-[1] max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* width: 400 на узких экранах ломается — ужимаем */}
          <TiltCard style={{ width: "min(400px, 92vw)" }}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            />

            <div
              className="relative flex flex-col items-center py-8"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="relative"
                style={{
                  width: 300,
                  height: 300,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Аура цвета самой редкой вещи — единственный «живой» фон */}
                {auraColor && (
                  <TiltLayer
                    depth={4}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <div
                      className="fp-aura absolute rounded-full"
                      style={{
                        width: 280,
                        height: 280,
                        top: "50%",
                        left: "50%",
                        marginTop: -140,
                        marginLeft: -140,
                        background: `radial-gradient(circle, ${auraColor}38, transparent 65%)`,
                      }}
                    />
                  </TiltLayer>
                )}

                {avatarDecoration && (
                  <TiltLayer
                    depth={42}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <img
                      src={decoSrc(avatarDecoration, 320)}
                      alt=""
                      draggable={false}
                      decoding="async"
                      className="absolute select-none"
                      style={{
                        width: 220,
                        height: 220,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        objectFit: "contain",
                      }}
                    />
                  </TiltLayer>
                )}

                <TiltLayer
                  depth={18}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div
                    className="rounded-full p-[3px] absolute"
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
                          alt={username}
                          draggable={false}
                          decoding="async"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-2xl font-medium">
                          {username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </TiltLayer>

                {items.map((item) => (
                  <GiftButton
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              <TiltLayer
                depth={16}
                className="flex flex-col items-center gap-2 mt-4"
              >
                <span className="text-white font-semibold text-lg tracking-[0.03em]">
                  {username}
                </span>

                {items.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 text-[11px] text-white/50">
                    <span>
                      {items.length} {items.length === 1 ? "gift" : "gifts"}
                    </span>
                    {summary.map((s) => (
                      <span
                        key={s.rarity}
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: s.color,
                            boxShadow: `0 0 6px ${s.color}`,
                          }}
                        />
                        {s.count} {s.rarity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-white/35">No gifts yet</span>
                )}
              </TiltLayer>
            </div>
          </TiltCard>
        </div>

        {activeGift && (
          <GiftModal
            gift={activeGift}
            color={RARITY_COLORS[activeGift.rarity]}
            cardColor={cardColor}
            onClose={closeGift}
          />
        )}
      </div>
    </>
  );
}
"use client";

import { Pin, List, X } from "lucide-react";
import type { PinnedBannerState } from "@/hooks/usePinnedBanner";
import PinText from "./PinText";

export interface PinnedBannerItem {
    id: string;
    text: string;
}

interface PinnedBannerProps {
    banner: PinnedBannerState<PinnedBannerItem>;
    noun: "message" | "post";
    placement: "overlay" | "inline";
    canUnpin?: boolean;
    onUnpin: (id: string) => void;
}

export default function PinnedBanner({
    banner,
    noun,
    placement,
    canUnpin = true,
    onUnpin,
}: PinnedBannerProps) {
    const {
        pins,
        current,
        currentIndex,
        hasMany,
        listOpen,
        toggleList,
        handleBannerClick,
        handleSelect,
    } = banner;

    if (!current) return null;

    const overlay = placement === "overlay";

    return (
        <div
            className={
                overlay
                    ? "absolute left-0 right-0 top-full z-30 border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-md"
                    : "relative z-20 flex-none border-b border-white/[0.06] bg-[#0d0b17]/90 backdrop-blur-md"
            }
        >
            <div
                onClick={handleBannerClick}
                className={`flex items-center gap-2.5 py-2 cursor-pointer hover:bg-white/[0.04] transition-colors ${overlay ? "px-4" : "px-5"
                    }`}
            >
                {hasMany ? (
                    <div className="flex flex-col gap-[2px] w-[3px] h-8 shrink-0">
                        {pins.map((p, i) => (
                            <span
                                key={p.id}
                                className={`flex-1 min-h-[2px] rounded-[1px] transition-colors ${i === currentIndex ? "bg-[#a893ff]" : "bg-white/15"
                                    }`}
                            />
                        ))}
                    </div>
                ) : (
                    <Pin
                        size={overlay ? 12 : 13}
                        className="text-[#a893ff] shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-[#a893ff] leading-none mb-0.5">
                        {hasMany
                            ? `Pinned ${noun} #${currentIndex + 1}`
                            : `Pinned ${noun}`}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                        <PinText text={current.text} />
                    </div>
                </div>
                {hasMany ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleList();
                        }}
                        aria-label={`All pinned ${noun}s`}
                        title={`All pinned ${noun}s`}
                        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${listOpen
                                ? "text-[#a893ff] bg-[#7c5cff]/15"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                            }`}
                    >
                        <List size={14} />
                    </button>
                ) : (
                    canUnpin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUnpin(current.id);
                            }}
                            aria-label={`Unpin ${noun}`}
                            title="Unpin"
                            className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                        >
                            <X size={12} />
                        </button>
                    )
                )}
            </div>

            {hasMany && listOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="msg-ctx-menu absolute left-3 right-3 top-full mt-1 z-30 max-h-64 overflow-y-auto rounded-xl bg-[#0d0b17] border border-white/[0.08] shadow-xl shadow-black/50"
                >
                    <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-zinc-500">
                        {pins.length} pinned {noun}s
                    </div>
                    {pins.map((p, i) => (
                        <div
                            key={p.id}
                            onClick={() => handleSelect(i)}
                            className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.05] ${i === currentIndex ? "bg-[#7c5cff]/10" : ""
                                }`}
                        >
                            <span
                                className={`shrink-0 w-5 text-[11px] font-semibold ${i === currentIndex ? "text-[#a893ff]" : "text-zinc-600"
                                    }`}
                            >
                                {i + 1}
                            </span>
                            <span className="flex-1 min-w-0 text-xs text-zinc-300 truncate">
                                <PinText text={p.text} />
                            </span>
                            {canUnpin && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnpin(p.id);
                                    }}
                                    aria-label={`Unpin ${noun}`}
                                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
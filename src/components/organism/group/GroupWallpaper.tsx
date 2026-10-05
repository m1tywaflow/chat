"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { decoSrc } from "@/lib/cdn";

const loadedFull = new Set<string>();

function pickWidth() {
    if (typeof window === "undefined") return 1600;
    const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5);
    return Math.min(1920, Math.max(800, Math.round(px / 100) * 100));
}

function tinySrc(url: string) {
    if (!url.includes("/upload/")) return url;
    return url.replace("/upload/", "/upload/f_auto,q_30,w_32,e_blur:400/");
}

export function preloadWallpaper(url?: string | null) {
    if (!url || typeof window === "undefined") return;
    const full = decoSrc(url, pickWidth());
    if (loadedFull.has(full)) return;
    const img = new Image();
    img.decoding = "async";
    img.src = full;
    img.decode().catch(() => { }).then(() => loadedFull.add(full));
}
export function getCachedWallpaper(groupId: string) {
    try {
        const url = localStorage.getItem(`gwp:${groupId}`);
        return url ? { url, type: "image" } : null;
    } catch {
        return null;
    }
}

export function cacheWallpaper(groupId: string, wp: { url?: string } | null) {
    try {
        if (wp?.url) localStorage.setItem(`gwp:${groupId}`, wp.url);
        else localStorage.removeItem(`gwp:${groupId}`);
    } catch { }
}

function GroupWallpaper({ url }: { url: string }) {
    const full = useMemo(() => decoSrc(url, pickWidth()), [url]);
    const small = useMemo(() => tinySrc(url), [url]);
    const [ready, setReady] = useState(() => loadedFull.has(full));

    useEffect(() => {
        if (loadedFull.has(full)) {
            setReady(true);
            return;
        }
        setReady(false);
        let cancelled = false;
        const img = new Image();
        img.decoding = "async";
        img.src = full;
        img
            .decode()
            .catch(() => { })
            .then(() => {
                if (cancelled) return;
                loadedFull.add(full);
                setReady(true);
            });
        return () => {
            cancelled = true;
        };
    }, [full]);

    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0d0b17]">
            <div
                className="absolute inset-0 scale-110 bg-cover bg-center"
                style={{ backgroundImage: `url(${small})` }}
            />
            <div
                className={`absolute inset-0 bg-cover bg-center ${ready ? "opacity-100 transition-opacity duration-300" : "opacity-0"
                    }`}
                style={{ backgroundImage: `url(${full})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
        </div>
    );
}

export default memo(GroupWallpaper);
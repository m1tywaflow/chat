"use client";

import { useRef, useState } from "react";

interface SmoothImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function SmoothImage({
    src,
    alt,
    className = "",
    width,
    height,
}: SmoothImageProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const loaded = loadedSrc === src;

    const setImageRef = (image: HTMLImageElement | null) => {
        imageRef.current = image;
        if (image?.complete && image.naturalWidth > 0) {
            setLoadedSrc(src);
        }
    };

    return (
        <span
            className={`relative block shrink-0 overflow-hidden bg-white/[0.04] ${className}`}
            style={{ width, height }}
        >
            <img
                ref={setImageRef}
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoadedSrc(src)}
                onError={() => setLoadedSrc(null)}
                className={`h-full w-full object-cover transition-opacity duration-200 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </span>
    );
}

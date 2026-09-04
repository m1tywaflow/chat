"use client";

import { useState } from "react";

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
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`${className} transition-opacity duration-200 ease-out ${loaded ? "opacity-100" : "opacity-0"
                }`}
            style={{ backgroundColor: loaded ? "transparent" : "rgba(255,255,255,0.04)" }}
        />
    );
}
"use client";

import { memo, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { videoPoster } from "@/lib/cdn";

const POSTER_WIDTH = 520;

interface VideoThumbProps {
    url: string;
    width?: number | null;
    height?: number | null;
    disabled?: boolean;
    onLoad: () => void;
    onOpen: (url: string) => void;
}

const VideoThumb = memo(function VideoThumb({
    url,
    width,
    height,
    disabled,
    onLoad,
    onOpen,
}: VideoThumbProps) {
    const poster = useMemo(() => videoPoster(url, POSTER_WIDTH), [url]);
    const [posterFailed, setPosterFailed] = useState(false);
    const hasDimensions =
        typeof width === "number" &&
        width > 0 &&
        typeof height === "number" &&
        height > 0;

    return (
        <div
            className="video-thumb"
            onClick={() => {
                if (!disabled) onOpen(url);
            }}
        >
            {poster && !posterFailed ? (
                <img
                    src={poster}
                    alt="video"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="chat-video object-cover"
                    style={hasDimensions ? { aspectRatio: `${width} / ${height}` } : undefined}
                    onLoad={onLoad}
                    onError={() => setPosterFailed(true)}
                />
            ) : (
                <video
                    src={url}
                    className="chat-video"
                    preload="metadata"
                    onLoadedMetadata={onLoad}
                />
            )}
            <div className="play-overlay">
                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                    <Play size={18} className="text-white ml-0.5" fill="white" />
                </div>
            </div>
        </div>
    );
});

export default VideoThumb;
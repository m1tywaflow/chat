"use client";

import { memo, useEffect, useState } from "react";

export interface LinkPreviewData {
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string;
}

const cache = new Map<string, Promise<LinkPreviewData | null>>();

function loadPreview(url: string) {
    let promise = cache.get(url);
    if (!promise) {
        promise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => (d?.preview as LinkPreviewData | null) ?? null)
            .catch(() => null);
        cache.set(url, promise);
    }
    return promise;
}

const LinkPreview = memo(function LinkPreview({
    url,
    isMine,
    onLayout,
}: {
    url: string;
    isMine: boolean;
    onLayout: () => void;
}) {
    const [preview, setPreview] = useState<LinkPreviewData | null>(null);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setPreview(null);
        setImageFailed(false);
        loadPreview(url).then((data) => {
            if (!cancelled) setPreview(data);
        });
        return () => {
            cancelled = true;
        };
    }, [url]);

    useEffect(() => {
        if (preview) onLayout();
    }, [preview, onLayout]);

    if (!preview) return null;

    const surface = isMine ? "bg-white/[0.14]" : "bg-[#7c5cff]/[0.14]";
    const barColor = isMine ? "bg-white" : "bg-[#8f75ff]";
    const siteColor = isMine ? "text-white" : "text-[#a996ff]";
    const showImage = Boolean(preview.image) && !imageFailed;

    return (
        <a
            href={preview.url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className={`relative block overflow-hidden rounded-md mt-1.5 w-full min-w-[240px] pl-3 pr-2 py-1.5 hover:brightness-110 transition-[filter] ${surface}`}
        >
            <span className={`absolute left-0 top-0 h-full w-[3px] ${barColor}`} />
            <div className={`truncate text-[13px] font-semibold leading-[1.3] ${siteColor}`}>
                {preview.siteName}
            </div>
            {preview.title && (
                <div className="line-clamp-2 text-[13px] font-semibold leading-[1.3]">
                    {preview.title}
                </div>
            )}
            {preview.description && (
                <div className="line-clamp-3 text-[13px] leading-[1.3] opacity-90">
                    {preview.description}
                </div>
            )}
            {showImage && (
                <div className="mt-1.5 w-full aspect-video overflow-hidden rounded-md bg-black/20">
                    <img
                        src={preview.image!}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="block w-full h-full object-cover"
                        onLoad={onLayout}
                        onError={() => setImageFailed(true)}
                    />
                </div>
            )}
        </a>
    );
});

export default LinkPreview;
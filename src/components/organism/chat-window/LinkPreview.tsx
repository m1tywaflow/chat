// "use client";

// import { memo, useEffect, useState } from "react";

// export interface LinkPreviewData {
//     url: string;
//     title: string;
//     description: string;
//     image: string | null;
//     siteName: string;
// }

// const cache = new Map<string, Promise<LinkPreviewData | null>>();

// function loadPreview(url: string) {
//     let promise = cache.get(url);
//     if (!promise) {
//         promise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
//             .then((r) => (r.ok ? r.json() : null))
//             .then((d) => (d?.preview as LinkPreviewData | null) ?? null)
//             .catch(() => null);
//         cache.set(url, promise);
//     }
//     return promise;
// }

// const LinkPreview = memo(function LinkPreview({
//     url,
//     isMine,
//     onLayout,
// }: {
//     url: string;
//     isMine: boolean;
//     onLayout: () => void;
// }) {
//     const [preview, setPreview] = useState<LinkPreviewData | null>(null);
//     const [imageFailed, setImageFailed] = useState(false);

//     useEffect(() => {
//         let cancelled = false;
//         setPreview(null);
//         setImageFailed(false);
//         loadPreview(url).then((data) => {
//             if (!cancelled) setPreview(data);
//         });
//         return () => {
//             cancelled = true;
//         };
//     }, [url]);

//     useEffect(() => {
//         if (preview) onLayout();
//     }, [preview, onLayout]);

//     if (!preview) return null;

//     const surface = isMine ? "bg-white/[0.14]" : "bg-[#7c5cff]/[0.14]";
//     const barColor = isMine ? "bg-white" : "bg-[#8f75ff]";
//     const siteColor = isMine ? "text-white" : "text-[#a996ff]";
//     const showImage = Boolean(preview.image) && !imageFailed;

//     return (
//         <a
//             href={preview.url}
//             target="_blank"
//             rel="noreferrer noopener"
//             onClick={(e) => e.stopPropagation()}
//             className={`relative block overflow-hidden rounded-md mt-1.5 w-full min-w-[240px] pl-3 pr-2 py-1.5 hover:brightness-110 transition-[filter] ${surface}`}
//         >
//             <span className={`absolute left-0 top-0 h-full w-[3px] ${barColor}`} />
//             <div className={`truncate text-[13px] font-semibold leading-[1.3] ${siteColor}`}>
//                 {preview.siteName}
//             </div>
//             {preview.title && (
//                 <div className="line-clamp-2 text-[13px] font-semibold leading-[1.3]">
//                     {preview.title}
//                 </div>
//             )}
//             {preview.description && (
//                 <div className="line-clamp-3 text-[13px] leading-[1.3] opacity-90">
//                     {preview.description}
//                 </div>
//             )}
//             {showImage && (
//                 <div className="mt-1.5 w-full aspect-video overflow-hidden rounded-md bg-black/20">
//                     <img
//                         src={preview.image!}
//                         alt=""
//                         loading="lazy"
//                         decoding="async"
//                         referrerPolicy="no-referrer"
//                         className="block w-full h-full object-cover"
//                         onLoad={onLayout}
//                         onError={() => setImageFailed(true)}
//                     />
//                 </div>
//             )}
//         </a>
//     );
// });

// export default LinkPreview;


"use client";

import { memo, useEffect, useRef, useState } from "react";

export interface LinkPreviewData {
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string;
}

const MAX_CACHE = 300;
const MAX_PARALLEL = 4;
const LOOKAHEAD = "300px 0px";

const resolved = new Map<string, LinkPreviewData | null>();
const inflight = new Map<string, Promise<LinkPreviewData | null>>();
const waiting: Array<() => void> = [];
let active = 0;

function acquire() {
    if (active < MAX_PARALLEL) {
        active++;
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        waiting.push(() => {
            active++;
            resolve();
        });
    });
}

function release() {
    active--;
    waiting.shift()?.();
}

function remember(url: string, data: LinkPreviewData | null) {
    if (resolved.size >= MAX_CACHE) {
        const oldest = resolved.keys().next().value;
        if (oldest !== undefined) resolved.delete(oldest);
    }
    resolved.set(url, data);
}

async function fetchPreview(url: string): Promise<LinkPreviewData | null> {
    await acquire();
    try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (res.status === 400) {
            remember(url, null);
            return null;
        }
        if (!res.ok) return null;
        const data = await res.json();
        const preview = (data?.preview as LinkPreviewData | null) ?? null;
        remember(url, preview);
        return preview;
    } catch {
        return null;
    } finally {
        release();
    }
}

function loadPreview(url: string) {
    if (resolved.has(url)) return Promise.resolve(resolved.get(url) ?? null);
    let promise = inflight.get(url);
    if (!promise) {
        promise = fetchPreview(url).finally(() => inflight.delete(url));
        inflight.set(url, promise);
    }
    return promise;
}

interface Props {
    url: string;
    isMine: boolean;
    onLayout?: () => void;
}

const LinkPreviewInner = memo(function LinkPreviewInner({
    url,
    isMine,
    onLayout,
}: Props) {
    const [preview, setPreview] = useState<LinkPreviewData | null>(
        () => resolved.get(url) ?? null
    );
    const [near, setNear] = useState(() => resolved.has(url));
    const [imageFailed, setImageFailed] = useState(false);
    const sentinelRef = useRef<HTMLSpanElement | null>(null);
    const onLayoutRef = useRef(onLayout);

    useEffect(() => {
        onLayoutRef.current = onLayout;
    });

    useEffect(() => {
        if (near) return;
        const el = sentinelRef.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") {
            setNear(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setNear(true);
                    io.disconnect();
                }
            },
            { rootMargin: LOOKAHEAD }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [near]);

    useEffect(() => {
        if (!near) return;
        let cancelled = false;
        loadPreview(url).then((data) => {
            if (!cancelled) setPreview(data);
        });
        return () => {
            cancelled = true;
        };
    }, [near, url]);

    useEffect(() => {
        if (preview) onLayoutRef.current?.();
    }, [preview]);

    if (!preview) {
        return near ? null : (
            <span ref={sentinelRef} aria-hidden className="block h-0 w-full" />
        );
    }

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
                        onError={() => setImageFailed(true)}
                    />
                </div>
            )}
        </a>
    );
});

export default function LinkPreview(props: Props) {
    return <LinkPreviewInner key={props.url} {...props} />;
}
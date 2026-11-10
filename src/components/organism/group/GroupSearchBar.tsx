"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";

interface GroupSearchBarProps {
    query: string;
    onQueryChange: (value: string) => void;
    total: number;
    activeIndex: number;
    hasMore: boolean;
    loading: boolean;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

const HIGHLIGHT_CSS = `
::highlight(search-match) {
  background-color: rgba(255, 214, 10, 0.35);
}
::highlight(search-current) {
  background-color: #ffd60a;
  color: #07060d;
}
`;

export default function GroupSearchBar({
    query,
    onQueryChange,
    total,
    activeIndex,
    hasMore,
    loading,
    onPrev,
    onNext,
    onClose,
}: GroupSearchBarProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const hasQuery = query.trim().length > 0;

    let status = "";
    if (hasQuery) {
        if (total > 0) {
            status = `${activeIndex + 1} of ${total}${hasMore ? "+" : ""}`;
        } else if (loading) {
            status = "Searching…";
        } else {
            status = hasMore ? "No results yet" : "No results";
        }
    }

    const prevDisabled =
        loading || !hasQuery || (total > 0 ? activeIndex >= total - 1 && !hasMore : !hasMore);
    const nextDisabled = !hasQuery || total === 0 || activeIndex <= 0;

    return (
        <div className="h-14 flex items-center gap-2 px-4">
            <style>{HIGHLIGHT_CSS}</style>
            <div className="flex-1 min-w-0 flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.05] border border-white/[0.08] focus-within:border-[#7c5cff]/50 transition-colors">
                <Search size={14} className="shrink-0 text-zinc-500" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            onClose();
                            return;
                        }
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            if (e.shiftKey) {
                                if (!nextDisabled) onNext();
                            } else if (!prevDisabled) {
                                onPrev();
                            }
                        }
                    }}
                    placeholder="Search messages"
                    aria-label="Search messages"
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
                />
                {loading && total > 0 && (
                    <Loader2 size={14} className="shrink-0 animate-spin text-[#a893ff]" />
                )}
                {status && (
                    <span className="shrink-0 text-[11px] font-medium text-zinc-500 tabular-nums">
                        {status}
                    </span>
                )}
            </div>

            <button
                onClick={onPrev}
                disabled={prevDisabled}
                aria-label="Previous match"
                title="Older match"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors cursor-pointer disabled:cursor-default"
            >
                <ChevronUp size={16} />
            </button>
            <button
                onClick={onNext}
                disabled={nextDisabled}
                aria-label="Next match"
                title="Newer match"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors cursor-pointer disabled:cursor-default"
            >
                <ChevronDown size={16} />
            </button>
            <button
                onClick={onClose}
                aria-label="Close search"
                title="Close search"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
                <X size={16} />
            </button>
        </div>
    );
}
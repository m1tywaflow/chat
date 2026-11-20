"use client";

import { memo } from "react";
import { X, Trash2, CheckCheck } from "lucide-react";
import { useSelectionCount, type SelectionStore } from "@/hooks/useMessageSelection";

interface SelectionBarProps {
    store: SelectionStore;
    total: number;
    onCancel: () => void;
    onSelectAll: () => void;
    onDelete: () => void;
}

function SelectionBar({
    store,
    total,
    onCancel,
    onSelectAll,
    onDelete,
}: SelectionBarProps) {
    const count = useSelectionCount(store);

    return (
        <div className="relative h-14 flex items-center justify-between gap-3 px-4 bg-gradient-to-r from-[#7c5cff]/[0.14] via-[#7c5cff]/[0.06] to-transparent">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-[#7c5cff]/60 via-[#7c5cff]/20 to-transparent" />

            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Cancel selection"
                    title="Cancel (Esc)"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 cursor-pointer"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-[#7c5cff] text-[13px] font-bold tabular-nums text-white">
                        {count}
                    </span>
                    <span className="text-sm font-semibold text-white/90 truncate">
                        {count === 1 ? "message selected" : "messages selected"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {count < total && (
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="h-9 px-3 flex items-center gap-2 rounded-lg text-[13px] font-semibold text-[#b9a8ff] hover:text-white hover:bg-white/[0.08] active:scale-95 cursor-pointer"
                    >
                        <CheckCheck size={15} />
                        Select all
                    </button>
                )}

                <button
                    type="button"
                    onClick={onDelete}
                    disabled={count === 0}
                    className="h-9 px-4 flex items-center gap-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                    <Trash2 size={15} />
                    {count > 0 ? `Delete ${count}` : "Delete"}
                </button>
            </div>
        </div>
    );
}

export default memo(SelectionBar);
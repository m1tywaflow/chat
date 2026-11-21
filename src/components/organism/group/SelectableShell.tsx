"use client";

import { useCallback, type MouseEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import {
    useIsSelected,
    useSelectionMode,
    type SelectionStore,
} from "@/hooks/useMessageSelection";

interface SelectableShellProps {
    store: SelectionStore;
    id: string;
    selectable: boolean;
    children: ReactNode;
}

export default function SelectableShell({
    store,
    id,
    selectable,
    children,
}: SelectableShellProps) {
    const mode = useSelectionMode(store);
    const selected = useIsSelected(store, id);

    const onMouseDown = useCallback(
        (e: MouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();
            if (selectable) store.toggle(id);
        },
        [store, id, selectable]
    );

    return (
        <div
            className={`relative ${selected ? "bg-[#7c5cff]/[0.14]" : ""} ${mode && selectable ? "cursor-pointer" : ""}`}
            onMouseDown={mode ? onMouseDown : undefined}
        >
            {mode && selectable && (
                <span
                    className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center rounded-md border ${selected
                        ? "bg-gradient-to-br from-[#7c5cff] to-[#5b3df0] border-[#a996ff]/60 text-white"
                        : "border-white/25 bg-black/20 text-transparent"
                        }`}
                >
                    <Check size={12} strokeWidth={3.5} />
                </span>
            )}
            <div
                className={
                    mode
                        ? `pointer-events-none select-none ${selectable ? "" : "opacity-50"}`
                        : undefined
                }
            >
                {children}
            </div>
        </div>
    );
}
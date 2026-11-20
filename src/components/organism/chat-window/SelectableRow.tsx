"use client";

import { memo, useCallback, type ComponentProps, type MouseEvent } from "react";
import { Check } from "lucide-react";
import MessageRow from "./MessageRow";
import CallLogMessage from "./CallLogMessage";
import {
    useIsSelected,
    useSelectionMode,
    type SelectionStore,
} from "@/hooks/useMessageSelection";

const BaseMessageRow = memo(MessageRow);
const BaseCallLog = memo(CallLogMessage);

type MessageRowProps = ComponentProps<typeof MessageRow>;
type CallLogProps = ComponentProps<typeof CallLogMessage>;

type SelectableRowProps = MessageRowProps & {
    store: SelectionStore;
    selectable: boolean;
};

type SelectableCallRowProps = CallLogProps & {
    store: SelectionStore;
};

function SelectableRowInner({ store, selectable, ...rest }: SelectableRowProps) {
    const rowProps = rest as unknown as MessageRowProps;
    const id = (rowProps as any).m.id as string;
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
            <div className={mode ? "pointer-events-none select-none" : undefined}>
                <BaseMessageRow {...rowProps} />
            </div>
        </div>
    );
}

function SelectableCallRowInner({ store, ...rest }: SelectableCallRowProps) {
    const callProps = rest as unknown as CallLogProps;
    const mode = useSelectionMode(store);
    return (
        <div className={mode ? "pointer-events-none select-none" : undefined}>
            <BaseCallLog {...callProps} />
        </div>
    );
}

export const SelectableRow = memo(SelectableRowInner);
export const SelectableCallRow = memo(SelectableCallRowInner);
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ListChecks, Plus, Trash2, X } from "lucide-react";
import {
    POLL_MAX_OPTIONS,
    POLL_OPTION_MAX,
    POLL_QUESTION_MAX,
    isValidPollInput,
} from "@/lib/polls";

interface CreatePollModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (question: string, options: string[], multiple: boolean) => Promise<void> | void;
}

export default function CreatePollModal({ open, onClose, onCreate }: CreatePollModalProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [multiple, setMultiple] = useState(false);
    const [sending, setSending] = useState(false);

    if (!open || typeof document === "undefined") return null;

    const filledCount = options.filter((o) => o.trim()).length;
    const valid = isValidPollInput(question, options);

    const reset = () => {
        setQuestion("");
        setOptions(["", ""]);
        setMultiple(false);
        setSending(false);
    };

    const close = () => {
        if (sending) return;
        reset();
        onClose();
    };

    const setOption = (index: number, value: string) => {
        setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
    };

    const addOption = () => {
        setOptions((prev) => (prev.length >= POLL_MAX_OPTIONS ? prev : [...prev, ""]));
    };

    const removeOption = (index: number) => {
        setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
    };

    const submit = async () => {
        if (!valid || sending) return;
        setSending(true);
        try {
            await onCreate(question, options, multiple);
            reset();
            onClose();
        } catch {
            setSending(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
            }}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0b17]/95 shadow-2xl shadow-black/60"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
                    <div className="flex items-center gap-2 text-white/80">
                        <ListChecks size={16} className="text-[#a893ff]" />
                        <span className="text-sm font-semibold">New poll</span>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-[#a893ff]">Question</span>
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            maxLength={POLL_QUESTION_MAX}
                            placeholder="Ask a question"
                            className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#7c5cff]/60"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-[#a893ff]">
                            Options ({filledCount}/{POLL_MAX_OPTIONS})
                        </span>
                        <div className="flex flex-col gap-2">
                            {options.map((value, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        value={value}
                                        onChange={(e) => setOption(index, e.target.value)}
                                        maxLength={POLL_OPTION_MAX}
                                        placeholder={`Option ${index + 1}`}
                                        className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#7c5cff]/60"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            aria-label="Remove option"
                                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {options.length < POLL_MAX_OPTIONS && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-1 flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-lg px-2.5 text-xs text-[#a893ff] transition-colors hover:bg-white/[0.06]"
                            >
                                <Plus size={13} />
                                Add option
                            </button>
                        )}
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-1">
                        <button
                            type="button"
                            onClick={() => setMultiple((v) => !v)}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm text-zinc-200">Multiple answers</span>
                                <span className="text-[11px] text-zinc-500">
                                    Members can pick more than one option
                                </span>
                            </div>
                            <span
                                className={`flex h-5 w-9 items-center rounded-md px-0.5 transition-colors ${multiple ? "bg-[#7c5cff]" : "bg-white/10"
                                    }`}
                            >
                                <span
                                    className={`h-4 w-4 rounded-[5px] bg-white transition-transform ${multiple ? "translate-x-4" : "translate-x-0"
                                        }`}
                                />
                            </span>
                        </button>
                    </div>

                    {filledCount < 2 && (
                        <span className="text-[11px] text-zinc-500">
                            Add at least two options to create the poll
                        </span>
                    )}
                </div>

                <div className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] px-5">
                    <button
                        type="button"
                        onClick={close}
                        className="h-9 cursor-pointer rounded-lg px-4 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!valid || sending}
                        className="h-9 cursor-pointer rounded-lg bg-gradient-to-b from-[#7c5cff] to-[#5b3df0] px-5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {sending ? "Creating…" : "Create"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
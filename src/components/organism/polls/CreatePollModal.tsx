"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
            }}
        >
            <div className="flex max-h-[85vh] w-full max-w-[420px] flex-col border border-white/10 bg-[#07060d]/90 backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="text-base font-semibold text-white">
                        New poll</div>
                    <button
                        type="button"
                        onClick={close}
                        className="text-white/50 transition-colors hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <label className="mb-1 block text-xs text-white/50">Вопрос</label>
                    <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        maxLength={POLL_QUESTION_MAX}
                        placeholder="What should we ask about?"
                        className="w-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#7c5cff]/70"
                    />

                    <label className="mb-1 mt-4 block text-xs text-white/50">Options</label>
                    <div className="flex flex-col gap-2">
                        {options.map((value, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    value={value}
                                    onChange={(e) => setOption(index, e.target.value)}
                                    maxLength={POLL_OPTION_MAX}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#7c5cff]/70"
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="px-2 py-2 text-white/40 transition-colors hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < POLL_MAX_OPTIONS && (
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-3 text-sm text-[#a996ff] transition-colors hover:text-white"
                        >
                            Add an option
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setMultiple((v) => !v)}
                        className="mt-5 flex w-full items-center justify-between border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                    >
                        <span>Several answers</span>
                        <span
                            className={`flex h-5 w-9 items-center border px-0.5 transition-colors ${multiple ? "border-[#7c5cff] bg-[#7c5cff]/40" : "border-white/20 bg-white/5"
                                }`}
                        >
                            <span
                                className={`h-3.5 w-3.5 bg-white transition-transform ${multiple ? "translate-x-4" : "translate-x-0"
                                    }`}
                            />
                        </span>
                    </button>
                </div>

                <div className="flex gap-2 border-t border-white/10 px-5 py-4">
                    <button
                        type="button"
                        onClick={close}
                        className="flex-1 border border-white/10 py-2 text-sm text-white/70 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!valid || sending}
                        className="flex-1 bg-gradient-to-b from-[#7c5cff] to-[#5b3df0] py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                    >
                        {sending ? "Send" : "Create a poll"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
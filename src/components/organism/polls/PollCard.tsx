"use client";

import { useEffect, useState } from "react";
import { Check, ListChecks, X } from "lucide-react";
import { countVoters, type Poll, type PollVotes } from "@/lib/polls";

interface PollCardProps {
    poll: Poll;
    votes: PollVotes;
    myUid: string;
    onVote: (optionId: string) => Promise<void> | void;
}

const CARD_BG =
    "linear-gradient(160deg, rgba(124,92,255,0.14) 0%, rgba(13,11,23,0.9) 42%, rgba(7,6,13,0.94) 100%)";
const FILL_MINE =
    "linear-gradient(90deg, rgba(124,92,255,0.5) 0%, rgba(91,61,240,0.14) 100%)";
const FILL_CORRECT =
    "linear-gradient(90deg, rgba(16,185,129,0.45) 0%, rgba(16,185,129,0.12) 100%)";
const FILL_WRONG =
    "linear-gradient(90deg, rgba(239,68,68,0.45) 0%, rgba(239,68,68,0.12) 100%)";
const FILL_OTHER = "rgba(255,255,255,0.07)";

export default function PollCard({ poll, votes, myUid, onVote }: PollCardProps) {
    const [pending, setPending] = useState<string | null>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const totalVoters = countVoters(votes);
    const totalVotes = poll.options.reduce(
        (sum, o) => sum + (votes[o.id]?.length ?? 0),
        0
    );
    const maxCount = poll.options.reduce(
        (max, o) => Math.max(max, votes[o.id]?.length ?? 0),
        0
    );
    const hasVoted = poll.options.some((o) => (votes[o.id] ?? []).includes(myUid));
    const isQuiz = !!poll.quiz;
    const locked = isQuiz && hasVoted;
    const revealed = isQuiz && hasVoted && !!poll.correctOptionId;

    const handleVote = async (optionId: string) => {
        if (pending || locked) return;
        setPending(optionId);
        try {
            await onVote(optionId);
        } finally {
            setPending(null);
        }
    };

    const subtitle = isQuiz
        ? "Select the correct answer"
        : poll.multiple
            ? "Select one or more"
            : "Select one";

    const footerLabel = isQuiz ? "Quiz" : poll.multiple ? "Multiple choice" : "Single choice";

    return (
        <div
            role="group"
            aria-label={poll.question}
            style={{ background: CARD_BG }}
            className={`relative w-[378px] max-w-full overflow-hidden rounded-2xl border border-white/[0.08] backdrop-blur-2xl shadow-[0_10px_40px_rgba(91,61,240,0.14)] transition-all duration-500 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
        >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a996ff]/60 to-transparent" />

            <div className="flex items-center gap-2 px-4 pt-3 text-[13px] font-semibold text-[#a893ff]">
                <ListChecks size={14} />
                {isQuiz ? "Quiz" : "Poll"}
            </div>

            <div className="px-4 pt-2 text-[15px] font-semibold leading-snug text-white break-words">
                {poll.question}
            </div>
            <div className="px-4 pt-1 text-[12px] text-white/40">{subtitle}</div>

            <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
                {poll.options.map((option) => {
                    const count = votes[option.id]?.length ?? 0;
                    const percent =
                        totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const mine = (votes[option.id] ?? []).includes(myUid);
                    const isLeader = hasVoted && count > 0 && count === maxCount;
                    const isCorrectOption = revealed && option.id === poll.correctOptionId;
                    const isWrongMine = revealed && mine && !isCorrectOption;

                    const boxClass = isCorrectOption
                        ? "border-emerald-400/60 bg-emerald-500/[0.08]"
                        : isWrongMine
                            ? "border-red-400/60 bg-red-500/[0.08]"
                            : mine
                                ? "border-[#7c5cff]/60 bg-[#7c5cff]/[0.08]"
                                : locked
                                    ? "border-white/[0.08] bg-white/[0.025]"
                                    : "border-white/[0.08] bg-white/[0.025] hover:border-[#7c5cff]/35 hover:bg-white/[0.045]";

                    const markClass = isCorrectOption
                        ? "border-emerald-300 bg-emerald-500"
                        : isWrongMine
                            ? "border-red-300 bg-red-500"
                            : mine
                                ? "border-[#a996ff] bg-[#7c5cff]"
                                : "border-white/25 bg-transparent";

                    const fill = isCorrectOption
                        ? FILL_CORRECT
                        : isWrongMine
                            ? FILL_WRONG
                            : mine
                                ? FILL_MINE
                                : FILL_OTHER;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            aria-pressed={mine}
                            onClick={() => handleVote(option.id)}
                            disabled={pending !== null || locked}
                            className={`relative w-full overflow-hidden rounded-xl border text-left transition-colors duration-200 ${locked ? "cursor-default" : "cursor-pointer disabled:cursor-wait"
                                } ${boxClass} ${pending === option.id ? "opacity-70" : ""}`}
                        >
                            {hasVoted && (
                                <span
                                    className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                                    style={{
                                        width: `${percent}%`,
                                        background: fill,
                                    }}
                                />
                            )}

                            <span className="relative flex items-center gap-3 px-3 py-2.5">
                                <span
                                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors ${poll.multiple ? "rounded-md" : "rounded-full"
                                        } ${markClass}`}
                                >
                                    {isCorrectOption ? (
                                        <Check size={12} strokeWidth={3} className="text-white" />
                                    ) : isWrongMine ? (
                                        <X size={12} strokeWidth={3} className="text-white" />
                                    ) : (
                                        mine &&
                                        (poll.multiple ? (
                                            <Check size={12} strokeWidth={3} className="text-white" />
                                        ) : (
                                            <span className="h-2 w-2 rounded-full bg-white" />
                                        ))
                                    )}
                                </span>

                                <span className="flex-1 break-words text-[14px] text-white/95">
                                    {option.text}
                                </span>

                                {hasVoted && (
                                    <span
                                        className={`shrink-0 text-[12px] tabular-nums ${isLeader
                                            ? "font-semibold text-white"
                                            : "text-white/55"
                                            }`}
                                    >
                                        {percent}%
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex h-9 items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-4 text-[11px] tabular-nums text-white/45">
                <span>
                    {totalVoters === 0
                        ? "No votes yet"
                        : `${totalVoters} ${totalVoters === 1 ? "vote" : "votes"}`}
                </span>
                <span>{footerLabel}</span>
            </div>
        </div>
    );
}
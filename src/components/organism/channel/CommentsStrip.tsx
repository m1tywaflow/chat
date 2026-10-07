"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getUsersByIds } from "@/lib/firestore/channels";

export default function CommentsStrip({
    count,
    commenterIds,
    onClick,
}: {
    count: number;
    commenterIds: string[];
    onClick: () => void;
}) {
    const [users, setUsers] = useState<
        Record<string, { username: string; avatarUrl: string | null }>
    >({});

    const idsKey = commenterIds.join(",");

    useEffect(() => {
        if (!commenterIds.length) return;
        let cancelled = false;
        getUsersByIds(commenterIds).then((res) => {
            if (!cancelled) setUsers(res);
        });
        return () => {
            cancelled = true;
        };
    }, [idsKey]);

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-t border-white/[0.08] bg-white/[0.03] hover:bg-[#7c5cff]/[0.12] transition-colors cursor-pointer text-left"
        >
            {count > 0 && commenterIds.length > 0 && (
                <div className="flex items-center -space-x-2 shrink-0">
                    {commenterIds.slice(0, 3).map((uid) => {
                        const u = users[uid];
                        return u?.avatarUrl ? (
                            <img
                                key={uid}
                                src={u.avatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#12111f]"
                            />
                        ) : (
                            <div
                                key={uid}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold bg-[#1e2a3a] text-[#a893ff] ring-2 ring-[#12111f]"
                            >
                                {u?.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                        );
                    })}
                </div>
            )}

            <span className="flex-1 text-[13px] font-medium text-[#a893ff]">
                {count > 0
                    ? `${count} comment${count === 1 ? "" : "s"}`
                    : "Leave a comment"}
            </span>

            <ChevronRight size={16} className="text-zinc-500 shrink-0" />
        </button>
    );
}
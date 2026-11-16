"use client";

import { memo } from "react";
import { getCustomEmoji } from "@/lib/customEmoji";

const PIN_TOKEN_SPLIT_RE = /(::[\w-]+::)/g;
const PIN_TOKEN_MATCH_RE = /^::([\w-]+)::$/;

const PinText = memo(function PinText({ text }: { text: string }) {
    const parts = text.split(PIN_TOKEN_SPLIT_RE);
    return (
        <>
            {parts.map((part, i) => {
                const match = part.match(PIN_TOKEN_MATCH_RE);
                if (match) {
                    const custom = getCustomEmoji(match[1]);
                    if (custom) {
                        return (
                            <img
                                key={i}
                                src={custom.url}
                                alt={custom.id}
                                className="inline-block align-text-bottom w-4 h-4 object-contain mx-0.5"
                            />
                        );
                    }
                }
                return part ? <span key={i}>{part}</span> : null;
            })}
        </>
    );
});

export default PinText;
export default function TypingLabel({ text, color }: { text: string; color: string }) {
    return (
        <span className="inline-flex items-center gap-1" style={{ color }}>
            {text}
            <span className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
            </span>
        </span>
    );
}
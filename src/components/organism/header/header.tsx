export default function Header() {
  return (
    <header className="w-full h-[60px] flex items-center justify-between px-7 bg-[#0F1620] border-b border-white/[0.07]">
      <div className="flex flex-col gap-0.5">
        <span className="text-white font-semibold tracking-[0.15em] text-base">
          PISLK
        </span>
        <span className="text-[9px] text-white/25 tracking-[0.2em] uppercase">
          modern chat experience
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-[5px] h-[5px] rounded-full bg-[#A78BFA] animate-pulse" />
        <span className="text-[9px] text-[#A78BFA]/50 tracking-[0.18em] font-medium">
          ENCRYPTED
        </span>
      </div>
    </header>
  );
}

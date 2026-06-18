export default function Header() {
  return (
    <header className="w-full h-16 flex items-center justify-between px-6 bg-[#0F1620]/70 backdrop-blur-xl border-b border-white/10 shadow-md shadow-black/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#A78BFA] via-[#60A5FA] to-[#34D399] shadow-lg shadow-purple-500/20" />

        <div className="flex flex-col leading-tight">
          <h1 className="text-white font-semibold tracking-wide text-lg">
            PISLK
          </h1>
          <span className="text-xs text-zinc-400">modern chat experience</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />
        <span className="text-xs text-zinc-400 tracking-widest">ENCRYPTED</span>
      </div>
    </header>
  );
}

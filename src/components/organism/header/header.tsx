export default function Header() {
  return (
    <header className="w-full h-16 flex items-center justify-between px-8 bg-[#0b1019] border-b border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="" width={26} height={26} />
        <span className="text-white font-semibold text-[17px] tracking-[0.06em]">
          pislk
        </span>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <header className="relative w-full h-16 flex items-center px-8 bg-[#0d0b14]">
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0.4) 100%)",
        }}
      />
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="" width={26} height={26} />
        <span className="text-white font-semibold text-[17px] tracking-[0.06em]">
          pislk
        </span>
      </div>
    </header>
  );
}

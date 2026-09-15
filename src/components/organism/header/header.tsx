// export default function Header() {
//   return (
//     <header className="relative w-full h-16 flex items-center px-8 bg-[#0d0d1d]">
//       <div
//         className="absolute bottom-0 left-0 right-0 h-px"
//         style={{
//           background:
//             "linear-gradient(90deg, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0.4) 100%)",
//         }}
//       />
//       <div className="flex items-center gap-2.5">
//         <img src="/logo.png" alt="" width={26} height={26} />
//         <span className="text-white font-semibold text-[17px] tracking-[0.06em]">
//           NEXO
//         </span>
//       </div>
//     </header>
//   );
// }

export default function Header() {
  return (
    <header className="relative flex h-[68px] w-full items-center border-b border-white/[0.06] bg-[#0d0d1d]/95 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <img
            src="/logo.png"
            alt="Nexo"
            width={27}
            height={27}
            className="relative object-contain"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[16px] font-semibold tracking-[0.18em] text-white">
            NEXO
          </span>

          <span className="h-1 w-1 rounded-full bg-[#8b6cff]/70" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8b6cff]/15 to-transparent" />
    </header>
  );
}


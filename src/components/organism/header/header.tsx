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
    <header className="relative w-full h-16 flex items-center px-8 bg-[#0d0d1d]/95 backdrop-blur-md">
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.35) 50%, transparent 100%)",
        }}
      />

      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#A78BFA]/25 blur-md" />
          <img
            src="/logo.png"
            alt=""
            width={26}
            height={26}
            className="relative"
          />
        </div>
        <span className="text-white font-semibold text-[17px] tracking-[0.06em]">
          NEXO
        </span>
      </div>
    </header>
  );
}
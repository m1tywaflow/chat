// "use client";

// import type { MouseEvent } from "react";

// export default function Header() {
//   const onMove = (e: MouseEvent<HTMLElement>) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
//   };

//   return (
//     <header
//       onMouseMove={onMove}
//       className="group relative flex h-[68px] w-full items-center overflow-hidden border-b border-white/[0.06] bg-[#08070f] px-8"
//     >
//       {/* ambient light behind the glass */}
//       <div className="pointer-events-none absolute -left-16 top-1/2 h-28 w-72 -translate-y-1/2 rounded-full bg-[#7c5cff]/30 blur-3xl" />
//       <div className="pointer-events-none absolute -top-16 left-1/2 h-24 w-[28rem] -translate-x-1/2 rounded-full bg-[#5b3df0]/15 blur-3xl" />

//       {/* glass sheet */}
//       <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-2xl" />

//       {/* light that follows the cursor */}
//       <div
//         className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
//         style={{
//           background:
//             "radial-gradient(260px circle at var(--mx, 50%) 50%, rgba(169,150,255,0.10), transparent 70%)",
//         }}
//       />

//       {/* content */}
//       <div className="relative flex items-center gap-3">
//         <img
//           src="/logo.png"
//           alt="Nexo"
//           width={28}
//           height={28}
//           className="object-contain [filter:drop-shadow(0_0_10px_rgba(124,92,255,0.55))]"
//         />
//         <div className="flex items-center gap-2.5">
//           <span className="text-[16px] font-semibold tracking-[0.2em] text-white [text-shadow:0_0_20px_rgba(169,150,255,0.4)]">
//             NEXO
//           </span>
//           <span className="h-1 w-1 rounded-full bg-[#a996ff] shadow-[0_0_8px_2px_rgba(124,92,255,0.8)]" />
//         </div>
//       </div>
//       <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7c5cff]/40 to-transparent" />
//       <div
//         className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
//         style={{
//           background:
//             "radial-gradient(180px circle at var(--mx, 50%) 100%, rgba(199,186,255,0.9), transparent 70%)",
//         }}
//       />
//     </header>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Minus, Square, Copy, X } from "lucide-react";

type ElectronAPI = NonNullable<Window["electronAPI"]>;

export default function Header() {
  const [api, setApi] = useState<ElectronAPI | null>(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    setApi(electronAPI);

    electronAPI.isWindowMaximized().then(setMaximized);

    return electronAPI.onWindowMaximizedChange(setMaximized);
  }, []);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  };

  return (
    <header
      onMouseMove={onMove}
      className="group relative flex h-[68px] w-full shrink-0 items-center overflow-hidden border-b border-white/[0.06] bg-[#08070f] px-8"
    >
      {/* Ambient light */}
      <div className="pointer-events-none absolute -left-16 top-1/2 h-28 w-72 -translate-y-1/2 rounded-full bg-[#7c5cff]/30 blur-3xl" />
      <div className="pointer-events-none absolute -top-16 left-1/2 h-24 w-[28rem] -translate-x-1/2 rounded-full bg-[#5b3df0]/15 blur-3xl" />

      {/* Glass sheet */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-2xl" />

      {/* Cursor light */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--mx, 50%) 50%, rgba(169,150,255,0.10), transparent 70%)",
        }}
      />

      {/* Brand */}
      <div className="relative flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Nexo"
          width={28}
          height={28}
          className="object-contain [filter:drop-shadow(0_0_10px_rgba(124,92,255,0.55))]"
        />

        <div className="flex items-center gap-2.5">
          <span className="text-[16px] font-semibold tracking-[0.2em] text-white [text-shadow:0_0_20px_rgba(169,150,255,0.4)]">
            NEXO
          </span>
          <span className="h-1 w-1 rounded-full bg-[#a996ff] shadow-[0_0_8px_2px_rgba(124,92,255,0.8)]" />
        </div>
      </div>

      {/* Electron window controls */}
      {api && (
  <div className="nexo-window-controls">
    <button
      onClick={() => api.minimizeWindow()}
      aria-label="Minimize"
      title="Minimize"
    >
      <Minus size={15} strokeWidth={1.5} />
    </button>

    <button
      onClick={() => api.maximizeWindow()}
      aria-label={maximized ? "Restore" : "Maximize"}
      title={maximized ? "Restore" : "Maximize"}
    >
      {maximized ? (
        <Copy size={13} strokeWidth={1.5} />
      ) : (
        <Square size={13} strokeWidth={1.5} />
      )}
    </button>

    <button
      className="close"
      onClick={() => api.closeWindow()}
      aria-label="Close"
      title="Close"
    >
      <X size={16} strokeWidth={1.5} />
    </button>
  </div>
)}

      {/* Bottom glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7c5cff]/40 to-transparent" />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(180px circle at var(--mx, 50%) 100%, rgba(199,186,255,0.9), transparent 70%)",
        }}
      />
    </header>
  );
}

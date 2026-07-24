"use client";

export default function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0b14]">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 50%{transform:scale(1.15);opacity:0.3} 100%{transform:scale(0.8);opacity:0.8} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin-arc { 0%{stroke-dashoffset:220;transform:rotate(-90deg)} 50%{stroke-dashoffset:40} 100%{stroke-dashoffset:220;transform:rotate(270deg)} }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        .loader-pulse { animation: pulse-ring 2.2s ease-in-out infinite; }
        .loader-pulse-2 { animation: pulse-ring 2.2s ease-in-out infinite 0.5s; }
        .loader-shimmer { animation: shimmer 2.5s linear infinite; }
        .loader-name-shimmer { background: linear-gradient(90deg,#c4b5fd,#A78BFA,#7c3aed,#A78BFA,#c4b5fd); background-size:300% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation: shimmer 3s linear infinite; }
        .loader-arc { fill:none; stroke:url(#arcGrad); stroke-width:2.5; stroke-linecap:round; stroke-dasharray:220; transform-origin:44px 44px; animation: spin-arc 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        .loader-dot { width:5px; height:5px; border-radius:50%; background:#A78BFA; }
        .loader-dot:nth-child(1){animation:blink 1.4s ease-in-out infinite 0s}
        .loader-dot:nth-child(2){animation:blink 1.4s ease-in-out infinite 0.2s}
        .loader-dot:nth-child(3){animation:blink 1.4s ease-in-out infinite 0.4s}
        .loader-label { animation: fade-in 0.6s ease both 0.2s; }
      `}</style>

      <div className="relative w-[88px] h-[88px] flex items-center justify-center">
        <div className="loader-pulse absolute inset-[-12px] rounded-full border-2 border-[#A78BFA44]" />
        <div className="loader-pulse-2 absolute inset-[-24px] rounded-full border border-[#A78BFA22]" />

        <div className="relative z-10 w-[62px] h-[62px] rounded-[20px] bg-gradient-to-br from-[#1e1b2e] to-[#2d1f4e] border border-[#A78BFA33] flex items-center justify-center text-[28px] font-bold text-[#A78BFA] overflow-hidden">
          <span className="loader-shimmer absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,#A78BFA22_50%,transparent_70%)] bg-[length:200%_100%]" />
          <img src="/logo.png" alt="img-loader" width={40} height={40} />
        </div>

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 88 88"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
              <stop offset="50%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <circle
            fill="none"
            stroke="#A78BFA18"
            strokeWidth="2.5"
            cx="44"
            cy="44"
            r="40"
          />
          <circle className="loader-arc" cx="44" cy="44" r="40" />
        </svg>
      </div>

      <div className="loader-label flex flex-col items-center gap-3 mt-7">
        <span className="loader-name-shimmer text-[22px] font-medium tracking-wide">
          Nexo
        </span>
        <div className="flex gap-[6px]">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
      </div>
    </div>
  );
}

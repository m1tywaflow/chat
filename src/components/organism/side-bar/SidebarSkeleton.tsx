export default function SidebarSkeleton() {
  return (
    <div className="px-2" aria-label="Loading conversations" aria-busy="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[64px] flex items-center gap-3 px-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-white/[0.04]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded-full bg-white/[0.04]" />
            <div className="h-2.5 w-3/5 rounded-full bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

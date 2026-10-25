"use client";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] bg-zinc-800 z-[1000] pointer-events-none">
      <div className="h-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-route-load" />
      
      <div className="absolute top-8 right-8">
        <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}
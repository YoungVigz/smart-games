"use client";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] bg-surface-3 z-[1000] pointer-events-none">
      <div className="h-full bg-primary shadow-[0_0_12px_var(--primary)] animate-route-load" />
      
      <div className="absolute top-8 right-8">
        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}
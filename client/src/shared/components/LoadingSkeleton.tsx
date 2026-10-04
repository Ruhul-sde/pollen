import React from "react";

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 animate-pulse flex flex-col justify-between"
        >
          <div>
            <div className="aspect-[4/3] rounded-xl bg-neutral-800" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-1/4 rounded bg-neutral-800" />
              <div className="h-5 w-2/3 rounded bg-neutral-800" />
              <div className="h-4 w-full rounded bg-neutral-800/70" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between gap-3">
            <div className="h-8 flex-1 rounded bg-neutral-800" />
            <div className="h-8 w-16 rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="aspect-square rounded-2xl bg-neutral-200" />
      <div className="flex flex-col justify-center space-y-4">
        <div className="h-4 w-1/3 bg-neutral-200 rounded" />
        <div className="h-8 w-3/4 bg-neutral-300 rounded" />
        <div className="h-4 w-full bg-neutral-200 rounded" />
        <div className="h-4 w-5/6 bg-neutral-200 rounded" />
        <div className="h-8 w-1/2 bg-neutral-300 rounded mt-4" />
        <div className="h-12 w-full bg-neutral-300 rounded mt-6" />
      </div>
    </div>
  );
}

import React from "react";

export default function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center rounded-full 
        border border-neutral-700 
        bg-neutral-800 
        px-2.5 py-1 
        text-xs text-slate-300
        transition-colors duration-150
        hover:bg-neutral-700
      "
    >
      {children}
    </span>
  );
}

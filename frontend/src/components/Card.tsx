import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export default function Card({ title, subtitle, className = "", children }: Props) {
  return (
    <section
      className={`rounded-2xl bg-neutral-900 shadow-sm border border-slate-800 ${className}`}
    >
      {(title || subtitle) && (
        <header className="px-5 pt-5">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-300 mt-1">
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div className="p-5 text-slate-200">{children}</div>
    </section>
  );
}

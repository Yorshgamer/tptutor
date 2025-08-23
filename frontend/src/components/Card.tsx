import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export default function Card({ title, subtitle, className = "", children }: Props) {
  return (
    <section className={`rounded-2xl bg-white shadow-sm border border-slate-200 ${className}`}>
      {(title || subtitle) && (
        <header className="px-5 pt-5">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

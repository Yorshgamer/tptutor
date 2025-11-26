import React, { useMemo } from "react";

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const classes = useMemo(() => {
    const base =
      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-0";

    const map: Record<Variant, string> = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",

      secondary:
        "bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-600",

      ghost:
        "bg-transparent text-blue-300 hover:bg-neutral-800 focus:ring-blue-500",

      subtle:
        "bg-neutral-800 text-slate-200 hover:bg-neutral-700 focus:ring-slate-400",

      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    };

    return `${base} ${map[variant]} ${className}`;
  }, [variant, className]);

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

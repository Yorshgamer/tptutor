import React, { useMemo } from "react";

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger";;

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const classes = useMemo(() => {
    const base =
      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const map: Record<Variant, string> = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
      secondary: "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-500",
      ghost: "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-600",
      subtle: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400",
      danger:   "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    };
    return `${base} ${map[variant]} ${className}`;
  }, [variant, className]);

  return <button className={classes} {...rest}>{children}</button>;
}
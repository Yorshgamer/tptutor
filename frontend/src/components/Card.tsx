type Props = { title?: string; children: React.ReactNode; className?: string };

export default function Card({ title, children, className = "" }: Props) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm border p-5 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {children}
    </div>
  );
}
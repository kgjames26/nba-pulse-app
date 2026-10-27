import { useState, type ReactNode } from "react";

export function Wordmark() {
  return (
    <p className="font-display text-3xl leading-none tracking-wide text-fg">
      NBA <span className="text-accent">PULSE</span>
    </p>
  );
}

export function TeamMark({
  abbr,
  color,
  sources,
}: {
  abbr: string;
  color: string;
  sources: string[];
}) {
  const [index, setIndex] = useState(0);
  const src = sources[index];
  return (
    <span
      className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-raised"
      style={{ boxShadow: `inset 0 0 0 1px ${color}` }}
    >
      {src ? (
        <img src={src} alt="" className="size-8 object-contain" onError={() => setIndex((value) => value + 1)} />
      ) : (
        <span className="font-display text-base text-fg">{abbr.slice(0, 3)}</span>
      )}
    </span>
  );
}

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 w-full rounded-full bg-accent px-5 text-sm font-medium text-accent-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}

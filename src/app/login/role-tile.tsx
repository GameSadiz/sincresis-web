"use client";

interface RoleTileProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function RoleTile({ title, description, selected, onSelect }: RoleTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex-1 rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface hover:border-foreground/20"
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{description}</p>
    </button>
  );
}

'use client';

interface ThemeChipProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function ThemeChip({ emoji, label, selected, onClick }: ThemeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full px-4 py-2.5 text-sm font-semibold border cursor-pointer
        transition-all duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
        ${
          selected
            ? 'border-primary bg-primary-container/20 text-primary shadow-sm'
            : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/40 hover:bg-primary-container/10'
        }
      `}
    >
      {emoji} {label}
    </button>
  );
}

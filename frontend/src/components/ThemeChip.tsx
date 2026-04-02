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
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8734A]
        ${
          selected
            ? 'border-[#E8734A] bg-[#FFF0EB] text-[#E8734A] shadow-sm'
            : 'bg-[#FFF8F0] border-[#E0D6CC] text-[#2D2D2D] hover:border-[#E8734A]/40 hover:bg-[#FFF0EB]'
        }
      `}
    >
      {emoji} {label}
    </button>
  );
}

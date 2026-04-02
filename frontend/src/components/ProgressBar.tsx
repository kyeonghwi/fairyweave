interface ProgressBarProps {
  progress: number; // 0-100
  stepText: string;
}

export default function ProgressBar({ progress, stepText }: ProgressBarProps) {
  return (
    <div className="mt-8">
      <div className="w-full h-2.5 rounded-full bg-[#E0D6CC]">
        <div
          className="h-full rounded-full bg-[#E8734A] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-base text-[#2D2D2D] mt-4 text-center" aria-live="polite">
        {stepText}
      </p>
      <p className="text-sm text-[#5C5C5C] mt-1 text-center">약 1~2분 소요</p>
    </div>
  );
}

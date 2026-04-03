interface ProgressBarProps {
  progress: number; // 0-100
  stepText: string;
}

export default function ProgressBar({ progress, stepText }: ProgressBarProps) {
  return (
    <div className="mt-8">
      <div className="w-full h-2.5 rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-base text-on-surface mt-4 text-center" aria-live="polite">
        {stepText}
      </p>
      <p className="text-sm text-on-surface-variant mt-1 text-center">잠시만 기다려 주세요. 정성껏 만들고 있어요.</p>
    </div>
  );
}

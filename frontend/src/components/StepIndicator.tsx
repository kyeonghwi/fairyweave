const STEPS = [
  { key: 'preview', label: '미리보기' },
  { key: 'details', label: '주문 상세' },
  { key: 'shipping', label: '배송 정보' },
  { key: 'complete', label: '완료' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

interface StepIndicatorProps {
  current: StepKey;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isDone
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'bg-tertiary text-white'
                      : 'bg-outline-variant/30 text-on-surface-variant'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-tertiary font-semibold' : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

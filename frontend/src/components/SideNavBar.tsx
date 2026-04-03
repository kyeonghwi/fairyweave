type StepKey = 'preview' | 'details' | 'shipping' | 'complete';

const SIDE_STEPS = [
  { key: 'preview' as const, label: 'Preview', icon: 'auto_stories' },
  { key: 'details' as const, label: 'Order Details', icon: 'receipt_long' },
  { key: 'shipping' as const, label: 'Shipping', icon: 'local_shipping' },
  { key: 'complete' as const, label: 'Confirmation', icon: 'auto_awesome' },
];

interface SideNavBarProps {
  currentStep: StepKey;
  onStepClick?: (step: StepKey) => void;
}

export default function SideNavBar({ currentStep, onStepClick }: SideNavBarProps) {
  const currentIdx = SIDE_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <aside className="hidden lg:flex flex-col py-8 h-screen w-64 border-r border-outline-variant/15 bg-surface-container-low sticky top-20 shrink-0">
      <div className="px-6 mb-8">
        <h2 className="text-primary font-jua text-xl">Your Journey</h2>
        <p className="text-secondary text-sm">Creating the magic</p>
      </div>
      <nav className="flex flex-col gap-2">
        {SIDE_STEPS.map((step, i) => {
          const isActive = step.key === currentStep;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;

          return (
            <button
              key={step.key}
              onClick={() => isPast && onStepClick?.(step.key)}
              disabled={isFuture}
              className={`
                mx-2 px-4 py-3 flex items-center gap-3 rounded-full transition-all text-left
                ${isActive
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-medium'
                  : isFuture
                    ? 'text-secondary opacity-50 cursor-default'
                    : 'text-secondary hover:bg-surface-container-lowest/50 cursor-pointer'
                }
              `}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {step.icon}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

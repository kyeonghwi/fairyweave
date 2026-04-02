import { useId, Children, cloneElement, isValidElement } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  // Inject aria-describedby into the first child input/select/textarea
  const enhancedChildren = Children.map(children, (child) => {
    if (isValidElement<React.HTMLAttributes<HTMLElement>>(child) && error) {
      return cloneElement(child, { 'aria-describedby': errorId } as React.HTMLAttributes<HTMLElement>);
    }
    return child;
  });

  return (
    <div className={error ? 'animate-shake' : ''}>
      <label className="block text-sm font-semibold text-[#2D2D2D] mb-1.5">
        {label}
        {required && <span className="text-[#D14343] ml-0.5">*</span>}
      </label>
      {enhancedChildren}
      {error && (
        <p id={errorId} className="text-xs text-[#D14343] mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

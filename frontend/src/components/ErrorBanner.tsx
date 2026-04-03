'use client';

import Button from './ui/Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="bg-error-container/20 border-l-4 border-error rounded-r-xl p-4" role="alert">
      <p className="font-semibold text-error">앗, 문제가 발생했어요</p>
      <p className="text-sm text-on-surface mt-1">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry} className="mt-3">
          다시 시도하기
        </Button>
      )}
    </div>
  );
}

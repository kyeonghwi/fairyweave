'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import ThemeChip from '../../components/ThemeChip';
import ProgressBar from '../../components/ProgressBar';
import ErrorBanner from '../../components/ErrorBanner';

const THEMES = [
  { emoji: '🦕', label: '공룡' },
  { emoji: '🚀', label: '우주' },
  { emoji: '🧙', label: '마법' },
  { emoji: '🌊', label: '바다' },
  { emoji: '🌲', label: '숲' },
  { emoji: '✏️', label: '직접 입력' },
];

interface FormErrors {
  childName?: string;
  age?: string;
  theme?: string;
}

export default function CreatePage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [moral, setMoral] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const [apiError, setApiError] = useState('');

  const isCustomTheme = selectedTheme === '직접 입력';
  const effectiveTheme = isCustomTheme ? customTheme : selectedTheme;

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!childName.trim()) errs.childName = '이름을 입력해 주세요';
    if (!age) errs.age = '나이를 선택해 주세요';
    if (!effectiveTheme.trim()) errs.theme = '테마를 선택해 주세요';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setProgress(5);
    setStepText('스토리 쓰는 중...');
    setApiError('');

    try {
      // Simulate progress while waiting for API
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 25) {
            setStepText('스토리 쓰는 중...');
            return prev + 2;
          }
          if (prev < 85) {
            const imageCount = Math.floor(((prev - 25) / 60) * 16);
            setStepText(`삽화 그리는 중 (${Math.min(imageCount, 16)}/16)...`);
            return prev + 1;
          }
          if (prev < 95) {
            setStepText('거의 다 되었어요!');
            return prev + 0.5;
          }
          return prev;
        });
      }, 800);

      const res = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim(),
          age: Number(age),
          theme: effectiveTheme.trim(),
          moral: moral.trim(),
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '동화책 생성에 실패했어요');
      }

      const data = await res.json();
      setProgress(100);
      setStepText('완성!');

      // Navigate to book preview
      setTimeout(() => {
        router.push(`/book/${data.bookId}`);
      }, 500);
    } catch (err) {
      setLoading(false);
      setProgress(0);
      setApiError(err instanceof Error ? err.message : '다시 시도해 주세요. 문제가 계속되면 잠시 후 시도해 주세요.');
    }
  }

  if (loading) {
    return (
      <PageLayout className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-[#FDE8E8] rounded-2xl p-6 text-center w-full max-w-lg">
          {/* Animated book skeleton */}
          <div className="mx-auto w-24 h-32 bg-[#E8734A]/20 rounded-lg animate-pulse" />
          <ProgressBar progress={progress} stepText={stepText} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            ← 뒤로가기
          </Button>
        </Link>

        {/* Form card */}
        <div className="bg-[#FDE8E8] rounded-2xl p-6 sm:p-8">
          <h1 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D] mb-6">
            동화책 만들기
          </h1>

          {apiError && (
            <div className="mb-6">
              <ErrorBanner message={apiError} onRetry={() => setApiError('')} />
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* 아이 이름 */}
            <FormField label="아이 이름" required error={errors.childName}>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="주인공 이름을 입력해 주세요"
                maxLength={20}
                aria-invalid={!!errors.childName}
                className={`w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border text-base
                  placeholder:text-[#9E9E9E] focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20
                  transition-colors outline-none
                  ${errors.childName ? 'border-[#D14343]' : 'border-[#E0D6CC]'}`}
              />
            </FormField>

            {/* 나이 */}
            <FormField label="나이" required error={errors.age}>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-invalid={!!errors.age}
                className={`w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border text-base
                  focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20
                  transition-colors outline-none appearance-none cursor-pointer
                  ${!age ? 'text-[#9E9E9E]' : ''}
                  ${errors.age ? 'border-[#D14343]' : 'border-[#E0D6CC]'}`}
              >
                <option value="" disabled>나이를 선택해 주세요</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}세</option>
                ))}
              </select>
            </FormField>

            {/* 테마 */}
            <FormField label="테마" required error={errors.theme}>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <ThemeChip
                    key={t.label}
                    emoji={t.emoji}
                    label={t.label}
                    selected={selectedTheme === t.label}
                    onClick={() => setSelectedTheme(t.label)}
                  />
                ))}
              </div>
              {isCustomTheme && (
                <div className="animate-slideDown mt-3">
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="원하는 테마를 입력해 주세요"
                    maxLength={20}
                    className="w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border border-[#E0D6CC] text-base
                      placeholder:text-[#9E9E9E] focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20
                      transition-colors outline-none"
                  />
                </div>
              )}
            </FormField>

            {/* 스토리 방향 */}
            <FormField label="스토리 방향 / 교훈">
              <textarea
                value={moral}
                onChange={(e) => setMoral(e.target.value)}
                rows={3}
                placeholder="예: 형제간의 우애, 편식 극복"
                className="w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border border-[#E0D6CC] text-base
                  placeholder:text-[#9E9E9E] focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20
                  transition-colors outline-none resize-none"
              />
              <p className="text-xs text-[#5C5C5C] mt-1">
                선택사항이에요. 비워두면 AI가 자유롭게 구성해요.
              </p>
            </FormField>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full mt-8">
              동화책 만들기
            </Button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

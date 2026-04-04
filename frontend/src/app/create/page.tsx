'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNavBar from '../../components/TopNavBar';
import Footer from '../../components/Footer';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import ThemeChip from '../../components/ThemeChip';
import ProgressBar from '../../components/ProgressBar';
import ErrorBanner from '../../components/ErrorBanner';

const BOOK_SPECS = [
  { uid: 'SQUAREBOOK_HC', label: '정사각 하드커버', desc: '243×248mm · 24~130쪽', emoji: '📕' },
  { uid: 'PHOTOBOOK_A4_SC', label: 'A4 소프트커버', desc: '210×297mm · 24~130쪽', emoji: '📖' },
  { uid: 'PHOTOBOOK_A5_SC', label: 'A5 소프트커버', desc: '148×210mm · 50~200쪽', emoji: '📓' },
] as const;

const THEMES = [
  { emoji: '🦕', label: '공룡' },
  { emoji: '🚀', label: '우주' },
  { emoji: '🧙', label: '마법' },
  { emoji: '🌊', label: '바다' },
  { emoji: '🌲', label: '숲' },
  { emoji: '✏️', label: '직접 입력' },
];

const LANGUAGES = [
  { emoji: '🇰🇷', label: '한국어', value: 'korean' },
  { emoji: '🇺🇸', label: '영어', value: 'english' },
  { emoji: '🌏', label: '이중언어', value: 'bilingual' },
] as const;

interface FormErrors {
  childName?: string;
  age?: string;
  theme?: string;
}

export default function CreatePage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [bookSpecUid, setBookSpecUid] = useState('SQUAREBOOK_HC');
  const [pageCount, setPageCount] = useState(16);
  const [bookTitle, setBookTitle] = useState('');
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [moral, setMoral] = useState('');
  const [language, setLanguage] = useState('korean');
  const [generateImages, setGenerateImages] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const [apiError, setApiError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => stopPolling, [stopPolling]);

  const isCustomTheme = selectedTheme === '직접 입력';
  const effectiveTheme = isCustomTheme ? customTheme : selectedTheme;

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!childName.trim()) errs.childName = '이름을 입력해 주세요';
    if (!age) errs.age = '나이를 선택해 주세요';
    if (!effectiveTheme.trim()) errs.theme = '테마를 선택해 주세요';
    return errs;
  }

  function startPolling(id: string) {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-book/${id}/status`);
        if (!res.ok) {
          // Generation failed or server restarted
          stopPolling();
          setLoading(false);
          setProgress(0);
          setApiError('생성 중 문제가 발생했어요. 다시 시도해 주세요.');
          return;
        }
        const status = await res.json();

        if (status.step === 'story') {
          setProgress(10);
          setStepText('이야기를 쓰고 있어요...');
        } else if (status.step === 'images') {
          const pct = 15 + Math.round((status.imagesCompleted / status.totalImages) * 75);
          setProgress(pct);
          setStepText(`삽화를 그리고 있어요 (${status.imagesCompleted}/${status.totalImages})`);
        } else if (status.step === 'cover') {
          setProgress(92);
          setStepText('표지를 만들고 있어요...');
        } else if (status.step === 'done') {
          stopPolling();
          setProgress(100);
          setStepText('완성!');
          setTimeout(() => router.push(`/book/${id}`), 600);
        } else if (status.step === 'error') {
          stopPolling();
          setLoading(false);
          setProgress(0);
          setApiError(status.reason ?? '생성 중 문제가 발생했어요. 다시 시도해 주세요.');
        }
      } catch (err) {
        console.warn('[FairyWeave] polling error, will retry:', err);
      }
    }, 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setProgress(5);
    setStepText('준비 중...');
    setApiError('');

    try {
      const res = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim(),
          age: Number(age),
          theme: effectiveTheme.trim(),
          moral: moral.trim(),
          skipImages: !generateImages,
          bookSpecUid,
          pageCount,
          title: bookTitle.trim() || undefined,
          language,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '동화책 생성에 실패했어요');
      }

      const data = await res.json();
      setStepText('이야기를 쓰고 있어요...');
      setProgress(10);
      startPolling(data.bookId);
    } catch (err) {
      setLoading(false);
      setProgress(0);
      setApiError(err instanceof Error ? err.message : '다시 시도해 주세요.');
    }
  }

  if (loading) {
    return (
      <>
        <TopNavBar />
        <main className="min-h-screen bg-surface pt-20 flex flex-col items-center justify-center px-4">
          <div className="bg-surface-container-low rounded-lg p-6 text-center w-full max-w-lg tonal-shadow">
            <div className="mx-auto w-24 h-32 bg-primary-container/20 rounded-lg animate-pulse" />
            <ProgressBar progress={progress} stepText={stepText} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="min-h-screen bg-surface pt-20">
        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Back */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              ← 뒤로가기
            </Button>
          </Link>

          {/* Form card */}
          <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 tonal-shadow border border-outline-variant/10">
            <h1 className="font-jua text-2xl text-on-surface mb-6">
              동화책 만들기
            </h1>

            {apiError && (
              <div className="mb-6">
                <ErrorBanner message={apiError} onRetry={() => setApiError('')} />
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* 판형 선택 */}
              <FormField label="판형 선택" required>
                <div className="grid gap-2">
                  {BOOK_SPECS.map((spec) => (
                    <button
                      key={spec.uid}
                      type="button"
                      onClick={() => setBookSpecUid(spec.uid)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-colors
                        ${bookSpecUid === spec.uid
                          ? 'border-primary bg-primary-container/20 ring-2 ring-primary/20'
                          : 'border-outline-variant bg-surface-container-highest hover:border-outline'}`}
                    >
                      <span className="text-2xl">{spec.emoji}</span>
                      <div>
                        <p className={`text-sm font-medium ${bookSpecUid === spec.uid ? 'text-primary' : 'text-on-surface'}`}>
                          {spec.label}
                        </p>
                        <p className="text-xs text-on-surface-variant">{spec.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </FormField>

              {/* 언어 선택 */}
              <FormField label="언어 선택" required>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <ThemeChip
                      key={lang.value}
                      emoji={lang.emoji}
                      label={lang.label}
                      selected={language === lang.value}
                      onClick={() => setLanguage(lang.value)}
                    />
                  ))}
                </div>
              </FormField>

              {/* 페이지 수 */}
              <FormField label="페이지 수" required>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={8}
                    max={40}
                    step={2}
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-medium text-on-surface w-16 text-center bg-surface-container-highest rounded-lg py-1.5">
                    {pageCount}쪽
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  페이지가 많을수록 생성 시간이 길어져요
                </p>
              </FormField>

              {/* 책 제목 */}
              <FormField label="책 제목">
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="비워두면 AI가 이야기에 맞는 제목을 만들어요"
                  maxLength={50}
                  className="w-full rounded-xl px-4 py-3 bg-surface-container-highest border border-outline-variant text-base
                    placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-colors outline-none"
                />
              </FormField>

              {/* 아이 이름 */}
              <FormField label="아이 이름" required error={errors.childName}>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="주인공 이름을 입력해 주세요"
                  maxLength={20}
                  aria-invalid={!!errors.childName}
                  className={`w-full rounded-xl px-4 py-3 bg-surface-container-highest border text-base
                    placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-colors outline-none
                    ${errors.childName ? 'border-error' : 'border-outline-variant'}`}
                />
              </FormField>

              {/* 나이 */}
              <FormField label="나이" required error={errors.age}>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  aria-invalid={!!errors.age}
                  className={`w-full rounded-xl px-4 py-3 bg-surface-container-highest border text-base
                    focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-colors outline-none appearance-none cursor-pointer
                    ${!age ? 'text-outline' : ''}
                    ${errors.age ? 'border-error' : 'border-outline-variant'}`}
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
                      className="w-full rounded-xl px-4 py-3 bg-surface-container-highest border border-outline-variant text-base
                        placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
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
                  className="w-full rounded-xl px-4 py-3 bg-surface-container-highest border border-outline-variant text-base
                    placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-colors outline-none resize-none"
                />
                <p className="text-xs text-on-surface-variant mt-1">
                  비워두셔도 괜찮아요. AI가 따뜻한 이야기를 만들어 드릴게요.
                </p>
              </FormField>

              {/* 삽화 생성 토글 */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-surface-container-highest border border-outline-variant">
                <div>
                  <p className="text-sm font-medium text-on-surface">AI 삽화 생성</p>
                  <p className="text-xs text-on-surface-variant">끄면 토큰을 절약할 수 있어요</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={generateImages}
                  onClick={() => setGenerateImages(!generateImages)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200
                    ${generateImages ? 'bg-primary' : 'bg-outline/40'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-1
                      ${generateImages ? 'translate-x-6 ml-0' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full mt-8">
                동화책 만들기
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

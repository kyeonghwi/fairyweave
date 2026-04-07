'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TopNavBar from '../../../components/TopNavBar';
import Footer from '../../../components/Footer';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ProgressBar';
import ErrorBanner from '../../../components/ErrorBanner';

interface StoryPage {
  pageNumber: number;
  text: string;
  textEn?: string;
  imagePrompt: string;
  skipImage?: boolean;
}

interface StoryData {
  title: string;
  pages: StoryPage[];
  language: 'korean' | 'english' | 'bilingual';
}

export default function StoryReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [story, setStory] = useState<StoryData | null>(null);
  const [loadError, setLoadError] = useState('');

  // 전체 재작성
  const [showRegenPanel, setShowRegenPanel] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState('');

  // 이미지 생성
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    fetch(`/api/generate-book/${id}/story`)
      .then(r => {
        if (!r.ok) throw new Error('스토리를 불러올 수 없어요');
        return r.json();
      })
      .then((data: StoryData) => setStory(data))
      .catch(err => setLoadError(err.message));
  }, [id]);

  const isBilingual = story?.language === 'bilingual';

  async function handleRegenStory() {
    if (!regenInstruction.trim()) return;
    setRegenLoading(true);
    setRegenError('');
    try {
      const res = await fetch(`/api/generate-book/${id}/regenerate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: regenInstruction }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { title: string; pages: StoryPage[] };
      setStory(prev => prev ? { ...prev, title: data.title, pages: data.pages } : prev);
      setRegenInstruction('');
      setShowRegenPanel(false);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : '재생성에 실패했어요');
    } finally {
      setRegenLoading(false);
    }
  }

  function startPolling() {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-book/${id}/status`);
        if (!res.ok) {
          stopPolling();
          setGenerating(false);
          setSubmitError('이미지 생성 중 문제가 발생했어요. 다시 시도해 주세요.');
          return;
        }
        const status = await res.json();
        if (status.step === 'images') {
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
          setGenerating(false);
          setProgress(0);
          setSubmitError(status.reason ?? '이미지 생성 중 문제가 발생했어요.');
        }
      } catch {
        // retry next tick
      }
    }, 2000);
  }

  async function handleConfirm() {
    if (!story) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/generate-book/${id}/story`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, pages: story.pages }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '확인 처리에 실패했어요');
      }
      setGenerating(true);
      setProgress(10);
      setStepText('이미지를 생성하고 있어요...');
      startPolling();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (generating) {
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

  if (loadError) {
    return (
      <>
        <TopNavBar />
        <main className="min-h-screen bg-surface pt-20 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <p className="text-on-surface-variant">{loadError}</p>
            <Button onClick={() => router.back()}>뒤로가기</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!story) {
    return (
      <>
        <TopNavBar />
        <main className="min-h-screen bg-surface pt-20 flex items-center justify-center">
          <p className="text-on-surface-variant animate-pulse">스토리 불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="min-h-screen bg-surface pt-20 pb-32">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          <div>
            <h1 className="font-jua text-2xl text-on-surface mb-1">스토리 검토</h1>
            <p className="text-sm text-on-surface-variant">
              전체 내용을 확인하세요. 마음에 들지 않으면 다시 써달라고 할 수 있어요.
            </p>
          </div>

          {submitError && <ErrorBanner message={submitError} onRetry={() => setSubmitError('')} />}

          {/* 책 제목 */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5">
            <p className="text-xs font-medium text-on-surface-variant mb-1">책 제목</p>
            <p className="text-base font-medium text-on-surface">{story.title}</p>
          </section>

          {/* 전체 페이지 텍스트 */}
          <div className="space-y-3">
            {story.pages.map((page, idx) => (
              <section
                key={page.pageNumber}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-5 py-4"
              >
                <p className="text-xs font-medium text-on-surface-variant mb-2">
                  페이지 {idx + 1}
                </p>
                <p className="text-sm text-on-surface leading-relaxed">{page.text}</p>
                {isBilingual && page.textEn && (
                  <p className="text-xs text-on-surface-variant leading-relaxed italic mt-1">{page.textEn}</p>
                )}
              </section>
            ))}
          </div>

          {/* 전체 스토리 다시 쓰기 */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => setShowRegenPanel(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-on-surface hover:bg-surface-container/40 transition-colors"
            >
              <span>전체 스토리 다시 쓰기</span>
              <span className="text-on-surface-variant">{showRegenPanel ? '▲' : '▼'}</span>
            </button>
            {showRegenPanel && (
              <div className="px-5 pb-5 space-y-3 border-t border-outline-variant/20 pt-4">
                <textarea
                  value={regenInstruction}
                  onChange={e => setRegenInstruction(e.target.value)}
                  rows={3}
                  placeholder="예: 더 신나고 모험적인 내용으로 바꿔줘, 결말을 더 감동적으로 써줘"
                  className="w-full rounded-xl px-4 py-3 bg-surface-container-highest border border-outline-variant text-sm
                    placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors outline-none resize-none"
                />
                {regenError && <p className="text-xs text-error">{regenError}</p>}
                <Button
                  onClick={handleRegenStory}
                  disabled={!regenInstruction.trim() || regenLoading}
                  variant="outline"
                  className="w-full"
                >
                  {regenLoading ? <span className="animate-pulse">다시 쓰는 중...</span> : 'AI로 전체 다시 쓰기'}
                </Button>
              </div>
            )}
          </section>

        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/20 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleConfirm} disabled={submitting} size="lg" className="w-full">
            {submitting ? '처리 중...' : '이미지 생성 시작'}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
}

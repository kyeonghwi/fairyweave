'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BookSpread from './BookSpread';

interface BookViewerProps {
  pages: { text: string; textEn?: string }[];
  imageUrls: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle?: string;
  language?: string;
}

/**
 * Mobile view mapping:
 *  view 0 = cover (image[0] only)
 *  view 1 = title page (book title)
 *  view 2+ = image[i] + text[i-2] overlay  (image = view-1, text = view-2)
 */
function getMobileViewCount(totalPages: number) {
  // cover + title + N image+text pages + colophon + backcover
  return totalPages + 4;
}

/** Mobile-only single page view */
function MobileView({
  pages,
  imageUrls,
  currentPage,
  onPageChange,
  bookTitle,
  language,
}: BookViewerProps) {
  const totalViews = getMobileViewCount(pages.length);
  const touchStartX = useRef(0);
  const prevPageRef = useRef(currentPage);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');

  useEffect(() => {
    setSlideDir(currentPage > prevPageRef.current ? 'right' : 'left');
    prevPageRef.current = currentPage;
  }, [currentPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goNext = useCallback(() => {
    if (currentPage < totalViews - 1) onPageChange(currentPage + 1);
  }, [currentPage, totalViews, onPageChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const maxDots = 5;
  let dotStart = Math.max(0, currentPage - Math.floor(maxDots / 2));
  if (dotStart + maxDots > totalViews) dotStart = Math.max(0, totalViews - maxDots);
  const dots = Array.from({ length: Math.min(maxDots, totalViews) }, (_, i) => dotStart + i);

  // Map view index to content
  const isCover = currentPage === 0;
  const isTitle = currentPage === 1;
  const isBackcover = currentPage === totalViews - 1;
  const isColophon = currentPage === totalViews - 2;
  const imageIndex = currentPage >= 2 ? currentPage - 1 : 0;
  const textIndex = currentPage >= 2 ? currentPage - 2 : 0;

  return (
    <div className="w-full flex flex-col items-center select-none">
      {bookTitle && (
        <p className="text-sm text-on-surface-variant opacity-60 mb-2 font-jua tracking-wide">
          {bookTitle}
        </p>
      )}

      {/* Content area */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-outline-variant"
        style={{ maxHeight: '60vh', aspectRatio: '1 / 1' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isCover ? (
          /* Cover: image only */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key="cover"
            src={imageUrls[0]}
            alt="표지"
            className={`w-full h-full object-cover ${
              slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
            }`}
          />
        ) : isBackcover ? (
          /* Back cover */
          <div
            key="backcover"
            className={`w-full h-full flex flex-col items-center justify-end ${
              slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
            }`}
            style={{ background: 'linear-gradient(135deg, #5d4e37 0%, #3e3226 100%)' }}
          >
            <div className="flex-1 flex items-center justify-center">
              <p className="font-jua text-white/20 tracking-widest select-none text-2xl">
                FairyWeave
              </p>
            </div>
            <div className="pb-6 text-white/15 text-xs select-none">
              ✦
            </div>
          </div>
        ) : isColophon ? (
          /* Colophon page */
          <div
            key="colophon"
            className={`w-full h-full flex flex-col items-center justify-center px-8 py-6 ${
              slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
            }`}
            style={{ background: '#faf6f0' }}
          >
            <div className="opacity-15 text-on-surface text-2xl mb-4">✦</div>
            <p className="font-jua text-on-surface text-xl leading-snug text-center word-break-keep">
              {bookTitle}
            </p>
            <div className="mt-4 space-y-1 text-on-surface-variant text-xs text-center">
              <p>발행일 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일</p>
              <p>AI 동화 생성 플랫폼</p>
            </div>
            <p className="font-jua text-primary text-sm tracking-wider mt-4">FairyWeave</p>
            <div className="opacity-15 text-on-surface text-2xl mt-4 rotate-180">✦</div>
          </div>
        ) : isTitle ? (
          /* Title page */
          <div
            key="title"
            className={`w-full h-full flex flex-col items-center justify-center px-8 py-6 ${
              slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
            }`}
            style={{ background: '#faf6f0' }}
          >
            <div className="opacity-15 text-on-surface text-3xl mb-6">✦</div>
            <p className="font-jua text-on-surface text-2xl leading-snug text-center word-break-keep">
              {bookTitle}
            </p>
            <div className="opacity-15 text-on-surface text-3xl mt-6 rotate-180">✦</div>
          </div>
        ) : (
          /* Story pages: image + text overlay */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={currentPage}
              src={imageUrls[imageIndex]}
              alt={`${imageIndex}페이지`}
              className={`w-full h-full object-cover ${
                slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
              }`}
            />

            {/* Text overlay at bottom */}
            <div
              key={`txt-${currentPage}`}
              className={`absolute bottom-0 left-0 right-0 px-5 py-4 ${
                slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'
              }`}
              style={{
                background:
                  'linear-gradient(to top, rgba(30,20,10,0.82) 0%, rgba(30,20,10,0.55) 60%, transparent 100%)',
              }}
            >
              {language === 'bilingual' && pages[textIndex]?.textEn ? (
                <>
                  <p className="font-jua text-white text-base leading-relaxed text-center word-break-keep drop-shadow">
                    {pages[textIndex]?.text}
                  </p>
                  <div className="border-t border-white/20 my-1" />
                  <p className="text-white/90 text-sm leading-relaxed text-center drop-shadow" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {pages[textIndex]?.textEn}
                  </p>
                </>
              ) : (
                <p className="font-jua text-white text-base leading-relaxed text-center word-break-keep drop-shadow">
                  {pages[textIndex]?.text}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-5 mt-4">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          aria-label="이전 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="flex gap-1.5">
          {dots.map((i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === currentPage
                  ? 'w-2 h-2 bg-primary'
                  : 'w-1.5 h-1.5 bg-outline-variant opacity-40'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={currentPage === totalViews - 1}
          aria-label="다음 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <p className="text-xs text-on-surface-variant opacity-50 mt-1">
        {currentPage === 0
          ? '표지'
          : currentPage === totalViews - 1
            ? '뒷표지'
            : currentPage === 1
              ? '1'
              : currentPage === totalViews - 2
                ? '끝'
                : `${currentPage} / ${totalViews - 3}`}
      </p>
    </div>
  );
}

/** Top-level responsive wrapper. Same props as the old PageSlider. */
export default function BookViewer(props: BookViewerProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop ? <BookSpread {...props} /> : <MobileView {...props} />;
}

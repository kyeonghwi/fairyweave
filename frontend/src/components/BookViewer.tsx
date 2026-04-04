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

/** Mobile-only single page view — image + text overlay at the bottom */
function MobileView({
  pages,
  imageUrls,
  currentPage,
  onPageChange,
  bookTitle,
  language,
}: BookViewerProps) {
  const totalPages = pages.length;
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
    if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

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
  if (dotStart + maxDots > totalPages) dotStart = Math.max(0, totalPages - maxDots);
  const dots = Array.from({ length: Math.min(maxDots, totalPages) }, (_, i) => dotStart + i);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {bookTitle && (
        <p className="text-sm text-on-surface-variant opacity-60 mb-2 font-jua tracking-wide">
          {bookTitle}
        </p>
      )}

      {/* Image with text overlay */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-outline-variant"
        style={{ maxHeight: '60vh', aspectRatio: '1 / 1' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentPage}
          src={imageUrls[currentPage]}
          alt={`${currentPage + 1}페이지`}
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
          {language === 'bilingual' && pages[currentPage]?.textEn ? (
            <>
              <p className="font-jua text-white text-base leading-relaxed text-center word-break-keep drop-shadow">
                {pages[currentPage]?.text}
              </p>
              <div className="border-t border-white/20 my-1" />
              <p className="text-white/90 text-sm leading-relaxed text-center drop-shadow" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {pages[currentPage]?.textEn}
              </p>
            </>
          ) : (
            <p className="font-jua text-white text-base leading-relaxed text-center word-break-keep drop-shadow">
              {pages[currentPage]?.text}
            </p>
          )}
        </div>
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
          disabled={currentPage === totalPages - 1}
          aria-label="다음 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <p className="text-xs text-on-surface-variant opacity-50 mt-1">
        {currentPage + 1} / {totalPages}
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

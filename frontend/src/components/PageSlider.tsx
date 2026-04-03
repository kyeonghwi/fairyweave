'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PageSliderProps {
  pages: { text: string }[];
  imageUrls: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle?: string;
}

export default function PageSlider({ pages, imageUrls, currentPage, onPageChange, bookTitle }: PageSliderProps) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Dot indicators: show max 5 with sliding window
  const maxDots = 5;
  let dotStart = Math.max(0, currentPage - Math.floor(maxDots / 2));
  if (dotStart + maxDots > totalPages) dotStart = Math.max(0, totalPages - maxDots);
  const dots = Array.from({ length: Math.min(maxDots, totalPages) }, (_, i) => dotStart + i);

  return (
    <div>
      {/* Image */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg border border-outline-variant max-h-[55vh] sm:max-h-[65vh]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrls[currentPage]}
          alt={`${bookTitle ? `${bookTitle} ` : ''}${currentPage + 1}페이지`}
          className={`w-full object-contain ${slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'}`}
          key={currentPage}
        />
      </div>

      {/* Story text */}
      <p
        className={`text-base leading-relaxed text-on-surface mt-4 min-h-[4rem] ${slideDir === 'right' ? 'animate-slidePageRight' : 'animate-slidePageLeft'}`}
        key={`text-${currentPage}`}
      >
        {pages[currentPage].text}
      </p>

      {/* Page indicator */}
      <p className="text-sm text-on-surface-variant text-center mt-3" aria-live="polite">
        {currentPage + 1} / {totalPages}
      </p>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
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

      {/* Navigation arrows */}
      <div className="flex justify-between mt-4">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          aria-label="이전 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          onClick={goNext}
          disabled={currentPage === totalPages - 1}
          aria-label="다음 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

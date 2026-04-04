'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BookPage from './BookPage';

interface BookSpreadProps {
  pages: { text: string; textEn?: string }[];
  imageUrls: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle?: string;
  language?: string;
}

type FlipDir = 'forward' | 'backward';

export default function BookSpread({
  pages,
  imageUrls,
  currentPage,
  onPageChange,
  bookTitle,
  language,
}: BookSpreadProps) {
  const totalPages = pages.length;

  // What's currently visible in the stable layer (only updates after flip completes)
  const [displayedPage, setDisplayedPage] = useState(currentPage);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<FlipDir>('forward');

  // Target page — set at flip start, committed to displayedPage on animationEnd
  const pendingPageRef = useRef(currentPage);

  // Sync if parent jumps currentPage directly (dot click etc.) — only when not animating
  useEffect(() => {
    if (!isFlipping && currentPage !== displayedPage) {
      setDisplayedPage(currentPage);
      pendingPageRef.current = currentPage;
    }
  }, [currentPage, isFlipping, displayedPage]);

  const navigate = useCallback(
    (dir: FlipDir) => {
      if (isFlipping) return;
      const next = dir === 'forward' ? displayedPage + 1 : displayedPage - 1;
      if (next < 0 || next >= totalPages) return;

      pendingPageRef.current = next;
      setFlipDir(dir);
      setIsFlipping(true);
      // Tell parent immediately so external UI (e.g. dots) can sync
      onPageChange(next);
      // NOTE: displayedPage intentionally stays at the OLD page until animationEnd
    },
    [isFlipping, displayedPage, totalPages, onPageChange],
  );

  const goPrev = useCallback(() => navigate('backward'), [navigate]);
  const goNext = useCallback(() => navigate('forward'), [navigate]);

  const handleFlipEnd = () => {
    // Only now reveal the new page in the stable layer
    setDisplayedPage(pendingPageRef.current);
    setIsFlipping(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  // The flip card: for 'forward' it covers the RIGHT half of the old spread
  // For 'backward' it covers the LEFT half of the old spread
  const flipCardSide = flipDir === 'forward' ? 'right' : 'left';

  // Front = old page (what's leaving), Back = new page (what's arriving)
  const flipFrontPage = displayedPage;       // stable layer = old page during flip
  const flipBackPage  = pendingPageRef.current; // destination page

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Book title above */}
      {bookTitle && (
        <p className="text-sm text-on-surface-variant opacity-60 mb-3 font-jua tracking-wide">
          {bookTitle}
        </p>
      )}

      {/* Open book */}
      <div
        className="relative w-full rounded-sm overflow-hidden"
        style={{
          // Aspect ratio: 2:1.35 — wide open book
          aspectRatio: '2 / 1.35',
          maxWidth: '900px',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.28), 0 6px 18px rgba(0,0,0,0.18)',
          perspective: '1500px',
        }}
      >
        {/* ── Left page (image) ── */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full overflow-hidden"
          style={{ zIndex: 1 }}
        >
          <BookPage
            type="image"
            imageUrl={imageUrls[displayedPage]}
            pageNumber={displayedPage}
            side="left"
          />
        </div>

        {/* ── Right page (text) ── */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full overflow-hidden"
          style={{ zIndex: 1 }}
        >
          <BookPage
            type="text"
            text={pages[displayedPage]?.text}
            textEn={pages[displayedPage]?.textEn}
            language={language}
            pageNumber={displayedPage}
            side="right"
          />
        </div>

        {/* ── Book spine ── */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full pointer-events-none"
          style={{
            width: '14px',
            zIndex: 3,
            background: 'linear-gradient(to right, #c4b89a, #e8e0d5 40%, #e8e0d5 60%, #c4b89a)',
            boxShadow:
              '2px 0 6px rgba(0,0,0,0.12), -2px 0 6px rgba(0,0,0,0.12)',
          }}
        />

        {/* ── Flip card (only during animation) ── */}
        {isFlipping && (
          <div
            key={`flip-${flipFrontPage}-${flipDir}`}
            className={flipDir === 'forward' ? 'animate-flipForward' : 'animate-flipBackward'}
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              ...(flipCardSide === 'right'
                ? { left: '50%', right: 0 }
                : { left: 0, right: '50%' }),
              height: '100%',
              zIndex: 10,
              transformOrigin: flipCardSide === 'right' ? 'left center' : 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front face — the page being flipped away */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {flipDir === 'forward' ? (
                // Flipping the right (text) page forward
                <BookPage
                  type="text"
                  text={pages[flipFrontPage]?.text}
                  textEn={pages[flipFrontPage]?.textEn}
                  language={language}
                  pageNumber={flipFrontPage}
                  side="right"
                />
              ) : (
                // Flipping the left (image) page backward
                <BookPage
                  type="image"
                  imageUrl={imageUrls[flipFrontPage]}
                  pageNumber={flipFrontPage}
                  side="left"
                />
              )}
            </div>

            {/* Back face — revealed as the page completes its turn */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {flipDir === 'forward' ? (
                // Landing face shows new image (left page of new spread)
                <BookPage
                  type="image"
                  imageUrl={imageUrls[flipBackPage]}
                  pageNumber={flipBackPage}
                  side="left"
                />
              ) : (
                // Landing face shows new text (right page of new spread)
                <BookPage
                  type="text"
                  text={pages[flipBackPage]?.text}
                  textEn={pages[flipBackPage]?.textEn}
                  language={language}
                  pageNumber={flipBackPage}
                  side="right"
                />
              )}
            </div>

            {/* Page-fold shadow during flip */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  flipDir === 'forward'
                    ? 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)'
                    : 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)',
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-6 mt-5">
        <button
          onClick={goPrev}
          disabled={displayedPage === 0 || isFlipping}
          aria-label="이전 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5" aria-live="polite">
          {(() => {
            const maxDots = 7;
            let start = Math.max(0, displayedPage - Math.floor(maxDots / 2));
            if (start + maxDots > totalPages) start = Math.max(0, totalPages - maxDots);
            return Array.from(
              { length: Math.min(maxDots, totalPages) },
              (_, i) => start + i,
            ).map((i) => (
              <button
                key={i}
                onClick={() => !isFlipping && onPageChange(i)}
                aria-label={`${i + 1}페이지`}
                className={`rounded-full transition-all duration-200 ${
                  i === displayedPage
                    ? 'w-2 h-2 bg-primary'
                    : 'w-1.5 h-1.5 bg-outline-variant opacity-40 hover:opacity-70'
                }`}
              />
            ));
          })()}
        </div>

        <button
          onClick={goNext}
          disabled={displayedPage === totalPages - 1 || isFlipping}
          aria-label="다음 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Page counter */}
      <p className="text-xs text-on-surface-variant opacity-50 mt-2">
        {displayedPage + 1} / {totalPages}
      </p>
    </div>
  );
}

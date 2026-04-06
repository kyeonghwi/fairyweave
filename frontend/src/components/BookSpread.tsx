'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import BookPage from './BookPage';

interface BookSpreadProps {
  pages: { text: string; textEn?: string }[];
  imageUrls: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle?: string;
  language?: string;
  isEditMode?: boolean;
  onStartEdit?: () => void;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
  onTitleChange?: (value: string) => void;
  onTextChange?: (pageIndex: number, field: 'text' | 'textEn', value: string) => void;
}

type FlipDir = 'forward' | 'backward';

type Spread =
  | { type: 'cover'; imageIndex: number }
  | { type: 'title' }
  | { type: 'spread'; imageIndex: number; textIndex: number }
  | { type: 'colophon' }
  | { type: 'backcover' };

function buildSpreads(totalPages: number): Spread[] {
  const spreads: Spread[] = [];
  spreads.push({ type: 'cover', imageIndex: 0 });
  spreads.push({ type: 'title' });
  for (let i = 0; i < totalPages; i++) {
    spreads.push({ type: 'spread', imageIndex: i + 1, textIndex: i });
  }
  spreads.push({ type: 'colophon' });
  spreads.push({ type: 'backcover' });
  return spreads;
}

export default function BookSpread({
  pages,
  imageUrls,
  currentPage,
  onPageChange,
  bookTitle,
  language,
  isEditMode,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onTitleChange,
  onTextChange,
}: BookSpreadProps) {
  const spreads = useMemo(() => buildSpreads(pages.length), [pages.length]);
  const totalSpreads = spreads.length;

  const [displayedSpread, setDisplayedSpread] = useState(currentPage);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<FlipDir>('forward');
  const pendingSpreadRef = useRef(currentPage);

  useEffect(() => {
    if (!isFlipping && currentPage !== displayedSpread) {
      setDisplayedSpread(currentPage);
      pendingSpreadRef.current = currentPage;
    }
  }, [currentPage, isFlipping, displayedSpread]);

  const navigate = useCallback(
    (dir: FlipDir) => {
      if (isFlipping) return;
      const next = dir === 'forward' ? displayedSpread + 1 : displayedSpread - 1;
      if (next < 0 || next >= totalSpreads) return;

      pendingSpreadRef.current = next;
      setFlipDir(dir);
      setIsFlipping(true);
      onPageChange(next);
    },
    [isFlipping, displayedSpread, totalSpreads, onPageChange],
  );

  const goPrev = useCallback(() => navigate('backward'), [navigate]);
  const goNext = useCallback(() => navigate('forward'), [navigate]);

  const handleFlipEnd = () => {
    setDisplayedSpread(pendingSpreadRef.current);
    setIsFlipping(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  // Render helpers for a single spread
  function renderSpreadContent(spread: Spread, side: 'left' | 'right') {
    if (spread.type === 'cover' || spread.type === 'backcover') {
      return null;
    }
    if (spread.type === 'colophon') {
      if (side === 'left') {
        return <BookPage type="colophon" bookTitle={bookTitle} side="left" />;
      }
      return <BookPage type="blank" side="right" />;
    }
    if (spread.type === 'title') {
      if (side === 'left') {
        return <BookPage type="blank" side="left" />;
      }
      return <BookPage type="title" bookTitle={bookTitle} side="right" />;
    }
    // type === 'spread' — display page numbers: left = (t+1)*2, right = (t+1)*2+1
    const leftNum = (spread.textIndex + 1) * 2;
    if (side === 'left') {
      return (
        <BookPage
          type="image"
          imageUrl={imageUrls[spread.imageIndex]}
          pageNumber={leftNum}
          side="left"
        />
      );
    }
    return (
      <BookPage
        type="text"
        text={pages[spread.textIndex]?.text}
        textEn={pages[spread.textIndex]?.textEn}
        language={language}
        pageNumber={leftNum + 1}
        side="right"
        isEditMode={isEditMode && !isFlipping}
        onTextChange={(value) => onTextChange?.(spread.textIndex, 'text', value)}
        onTextEnChange={(value) => onTextChange?.(spread.textIndex, 'textEn', value)}
      />
    );
  }

  const currentSpread = spreads[displayedSpread];

  // For flip animation: determine what the flip card shows
  const flipFrontSpread = spreads[displayedSpread];
  const flipBackSpread = spreads[pendingSpreadRef.current];

  // Cover-to-single transition: flip the cover page as right-half
  const isCoverFlipForward = isFlipping && flipDir === 'forward' && flipFrontSpread?.type === 'cover';
  const isCoverFlipBackward = isFlipping && flipDir === 'backward' && flipBackSpread?.type === 'cover';

  // Backcover-to-single transition: left-half flips right (closing the book)
  const isBackcoverFlipForward = isFlipping && flipDir === 'forward' && flipBackSpread?.type === 'backcover';
  const isBackcoverFlipBackward = isFlipping && flipDir === 'backward' && flipFrontSpread?.type === 'backcover';

  const isFullPageFlip = isCoverFlipForward || isCoverFlipBackward || isBackcoverFlipForward || isBackcoverFlipBackward;

  // During cover/backcover flip in either direction, use spread layout so the
  // animation looks like opening/closing a real book.
  const isCover = currentSpread?.type === 'cover' && !isFullPageFlip;
  const isBackcover = currentSpread?.type === 'backcover' && !isFullPageFlip;

  // Stable layer: pre-set covered side to new content during flip
  let stableSpreadLeft = displayedSpread;
  let stableSpreadRight = displayedSpread;
  if (isFlipping) {
    if (isCoverFlipForward) {
      // cover→title: stable layer shows destination (title spread)
      stableSpreadLeft = pendingSpreadRef.current;
      stableSpreadRight = pendingSpreadRef.current;
    } else if (isCoverFlipBackward) {
      // title→cover: stable layer stays on title, flip card covers left half
      stableSpreadLeft = displayedSpread;
      stableSpreadRight = displayedSpread;
    } else if (isBackcoverFlipForward) {
      // colophon→backcover: stable layer shows current (colophon spread)
      stableSpreadLeft = displayedSpread;
      stableSpreadRight = displayedSpread;
    } else if (isBackcoverFlipBackward) {
      // backcover→colophon: stable layer shows destination (colophon spread)
      stableSpreadLeft = pendingSpreadRef.current;
      stableSpreadRight = pendingSpreadRef.current;
    } else if (flipDir === 'forward') {
      stableSpreadRight = pendingSpreadRef.current;
    } else {
      stableSpreadLeft = pendingSpreadRef.current;
    }
  }

  return (
    <div className="w-full flex flex-col items-center select-none">
      {bookTitle && (
        <p className="text-sm text-on-surface-variant opacity-60 mb-3 font-jua tracking-wide">
          {bookTitle}
        </p>
      )}

      {/* Open book */}
      <div
        className="relative w-full rounded-sm overflow-hidden"
        style={{
          aspectRatio: (isCover || isBackcover) ? '1 / 1.35' : '2 / 1.35',
          maxWidth: (isCover || isBackcover) ? '450px' : '900px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.28), 0 6px 18px rgba(0,0,0,0.18)',
          perspective: '1500px',
          transition: 'max-width 0.3s ease, aspect-ratio 0.3s ease',
        }}
      >
        {isCover ? (
          /* ── Cover: full-width image with title overlay ── */
          <div className="absolute inset-0">
            <BookPage
              type="image"
              imageUrl={imageUrls[currentSpread.imageIndex]}
              pageNumber={0}
              side="left"
            />
            {bookTitle && (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-8 px-6">
                {isEditMode && onTitleChange ? (
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="font-jua text-white text-center leading-snug bg-black/40 border border-white/60 rounded-lg px-3 py-1 w-full max-w-sm outline-none focus:border-white placeholder-white/50"
                    style={{ fontSize: 'clamp(18px, 3.5vw, 36px)', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
                  />
                ) : (
                  <p
                    className="font-jua text-white text-center leading-snug pointer-events-none word-break-keep"
                    style={{ fontSize: 'clamp(18px, 3.5vw, 36px)', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
                  >
                    {bookTitle}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : isBackcover ? (
          /* ── Back cover: single full-width page ── */
          <div className="absolute inset-0">
            <BookPage type="backcover" side="left" />
          </div>
        ) : (
          <>
            {/* ── Left page ── */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full overflow-hidden"
              style={{ zIndex: 1 }}
            >
              {renderSpreadContent(spreads[stableSpreadLeft], 'left')}
            </div>

            {/* ── Right page ── */}
            <div
              className="absolute top-0 right-0 w-1/2 h-full overflow-hidden"
              style={{ zIndex: 1 }}
            >
              {renderSpreadContent(spreads[stableSpreadRight], 'right')}
            </div>

            {/* ── Book spine ── */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full pointer-events-none"
              style={{
                width: '14px',
                zIndex: 3,
                background: 'linear-gradient(to right, #c4b89a, #e8e0d5 40%, #e8e0d5 60%, #c4b89a)',
                boxShadow: '2px 0 6px rgba(0,0,0,0.12), -2px 0 6px rgba(0,0,0,0.12)',
              }}
            />
          </>
        )}

        {/* ── Flip card (only during animation) ── */}
        {isFlipping && !isFullPageFlip && (
          <div
            key={`flip-${displayedSpread}-${flipDir}`}
            className={flipDir === 'forward' ? 'animate-flipForward' : 'animate-flipBackward'}
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              ...(flipDir === 'forward'
                ? { left: '50%', right: 0 }
                : { left: 0, right: '50%' }),
              height: '100%',
              zIndex: 10,
              transformOrigin: flipDir === 'forward' ? 'left center' : 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front face */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {flipDir === 'forward'
                ? renderSpreadContent(flipFrontSpread, 'right')
                : renderSpreadContent(flipFrontSpread, 'left')}
            </div>

            {/* Back face */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {flipDir === 'forward'
                ? renderSpreadContent(flipBackSpread, 'left')
                : renderSpreadContent(flipBackSpread, 'right')}
            </div>

            {/* Page-fold shadow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: flipDir === 'forward'
                  ? 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)'
                  : 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)',
              }}
            />
          </div>
        )}

        {/* ── Cover flip: right-half flips left (like opening a book) ── */}
        {isFlipping && isCoverFlipForward && (
          <div
            key="flip-cover-fwd"
            className="animate-flipForward"
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              right: 0,
              height: '100%',
              zIndex: 10,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front: cover image (right half crop) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-0 h-full" style={{ width: '200%', right: 0 }}>
                <BookPage type="image" imageUrl={imageUrls[0]} pageNumber={0} side="left" />
              </div>
            </div>

            {/* Back: blank (inside of cover) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <BookPage type="blank" side="left" />
            </div>

            {/* Page-fold shadow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
            />
          </div>
        )}

        {/* ── Cover flip backward: left-half flips right (closing the book) ── */}
        {isFlipping && isCoverFlipBackward && (
          <div
            key="flip-cover-bwd"
            className="animate-flipBackward"
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: '50%',
              height: '100%',
              zIndex: 10,
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front: blank (inside of cover) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <BookPage type="blank" side="left" />
            </div>

            {/* Back: cover image (left half crop) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute top-0 left-0 h-full" style={{ width: '200%' }}>
                <BookPage type="image" imageUrl={imageUrls[0]} pageNumber={0} side="left" />
              </div>
            </div>

            {/* Page-fold shadow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
            />
          </div>
        )}

        {/* ── Backcover flip forward: left-half flips right (closing the book) ── */}
        {isFlipping && isBackcoverFlipForward && (
          <div
            key="flip-backcover-fwd"
            className="animate-flipBackward"
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: '50%',
              height: '100%',
              zIndex: 10,
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front: left page of colophon spread (what user sees before flip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {renderSpreadContent(flipFrontSpread, 'left')}
            </div>

            {/* Back: backcover (left half crop) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute top-0 left-0 h-full" style={{ width: '200%' }}>
                <BookPage type="backcover" side="left" />
              </div>
            </div>

            {/* Page-fold shadow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
            />
          </div>
        )}

        {/* ── Backcover flip backward: left-half flips left (opening from back) ── */}
        {isFlipping && isBackcoverFlipBackward && (
          <div
            key="flip-backcover-bwd"
            className="animate-flipForward"
            onAnimationEnd={handleFlipEnd}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              right: 0,
              height: '100%',
              zIndex: 10,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front: backcover (right half crop) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-0 h-full" style={{ width: '200%', right: 0 }}>
                <BookPage type="backcover" side="left" />
              </div>
            </div>

            {/* Back: blank (inside of back cover) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <BookPage type="blank" side="right" />
            </div>

            {/* Page-fold shadow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
            />
          </div>
        )}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-6 mt-5 relative">
        <button
          onClick={goPrev}
          disabled={displayedSpread === 0 || isFlipping}
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
            let start = Math.max(0, displayedSpread - Math.floor(maxDots / 2));
            if (start + maxDots > totalSpreads) start = Math.max(0, totalSpreads - maxDots);
            return Array.from(
              { length: Math.min(maxDots, totalSpreads) },
              (_, i) => start + i,
            ).map((i) => (
              <button
                key={i}
                onClick={() => !isFlipping && onPageChange(i)}
                aria-label={`${i + 1}페이지`}
                className={`rounded-full transition-all duration-200 ${
                  i === displayedSpread
                    ? 'w-2 h-2 bg-primary'
                    : 'w-1.5 h-1.5 bg-outline-variant opacity-40 hover:opacity-70'
                }`}
              />
            ));
          })()}
        </div>

        <button
          onClick={goNext}
          disabled={displayedSpread === totalSpreads - 1 || isFlipping}
          aria-label="다음 페이지"
          className="w-11 h-11 rounded-full bg-surface-container-lowest tonal-shadow flex items-center justify-center
            hover:bg-primary hover:text-on-primary active:scale-90 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Edit toggle */}
      {isEditMode ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-lowest text-on-surface-variant tonal-shadow hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-base">close</span>
            취소
          </button>
          <button
            onClick={onConfirmEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary shadow-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-base">check</span>
            완료
          </button>
        </div>
      ) : onStartEdit ? (
        <button
          onClick={onStartEdit}
          className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-lowest text-on-surface-variant tonal-shadow hover:bg-surface-container-low transition-all"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          글 수정하기
        </button>
      ) : null}

      {/* Page counter */}
      <p className="text-xs text-on-surface-variant opacity-50 mt-2">
        {displayedSpread === 0
          ? '표지'
          : displayedSpread === totalSpreads - 1
            ? '뒷표지'
            : displayedSpread === 1
              ? '1'
              : displayedSpread === totalSpreads - 2
                ? `${(displayedSpread - 1) * 2}`
                : `${(displayedSpread - 1) * 2}~${(displayedSpread - 1) * 2 + 1}`}
      </p>
    </div>
  );
}

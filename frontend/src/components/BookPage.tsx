'use client';

interface BookPageProps {
  type: 'image' | 'text' | 'blank';
  imageUrl?: string;
  text?: string;
  textEn?: string;
  language?: string;
  pageNumber?: number;
  side: 'left' | 'right';
}

export default function BookPage({ type, imageUrl, text, textEn, language, pageNumber, side }: BookPageProps) {
  if (type === 'blank') {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#faf6f0' }}
      >
        <div className="opacity-10 text-center">
          <div className="text-6xl">✦</div>
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="w-full h-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={pageNumber !== undefined ? `${pageNumber + 1}페이지 일러스트` : '일러스트'}
          className="w-full h-full object-cover"
        />
        {/* Spine-side inner shadow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: side === 'left'
              ? 'inset -12px 0 20px rgba(0,0,0,0.12)'
              : 'inset 12px 0 20px rgba(0,0,0,0.12)',
          }}
        />
      </div>
    );
  }

  // type === 'text'
  return (
    <div
      className="w-full h-full flex flex-col justify-center relative overflow-hidden"
      style={{ background: '#faf6f0' }}
    >
      {/* Decorative top-left ornament */}
      <div className="absolute top-5 left-5 opacity-15 text-on-surface select-none text-3xl leading-none">
        ❝
      </div>
      {/* Decorative bottom-right ornament */}
      <div className="absolute bottom-5 right-5 opacity-15 text-on-surface select-none text-3xl leading-none rotate-180">
        ❝
      </div>

      {/* Story text */}
      <div className="px-8 py-10 flex-1 flex flex-col justify-center">
        {language === 'bilingual' && textEn ? (
          <>
            {/* English text - top half */}
            <div className="flex-1 flex flex-col justify-center">
              <p
                className="text-on-surface leading-relaxed text-center"
                style={{ fontSize: 'clamp(12px, 1.8vw, 18px)', fontFamily: 'system-ui, sans-serif' }}
              >
                {textEn}
              </p>
            </div>
            {/* Divider */}
            <div className="border-t border-outline-variant/30 my-2" />
            {/* Korean text - bottom half */}
            <div className="flex-1 flex flex-col justify-center">
              <p
                className="font-jua text-on-surface leading-relaxed text-center word-break-keep"
                style={{ fontSize: 'clamp(12px, 1.8vw, 18px)' }}
              >
                {text}
              </p>
            </div>
          </>
        ) : (
          <p
            className="font-jua text-on-surface leading-relaxed text-center word-break-keep"
            style={{ fontSize: 'clamp(14px, 2.2vw, 22px)' }}
          >
            {text}
          </p>
        )}
      </div>

      {/* Page number at bottom */}
      {pageNumber !== undefined && (
        <div className="absolute bottom-3 w-full text-center">
          <span
            className="text-on-surface-variant opacity-40 select-none"
            style={{ fontSize: '11px' }}
          >
            {pageNumber + 1}
          </span>
        </div>
      )}

      {/* Spine-side inner shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: side === 'left'
            ? 'inset -12px 0 20px rgba(0,0,0,0.06)'
            : 'inset 12px 0 20px rgba(0,0,0,0.06)',
        }}
      />
    </div>
  );
}

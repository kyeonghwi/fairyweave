'use client';

function getTextStyle(text: string | undefined, bilingual: boolean): { fontSize: string; padding: string } {
  const len = (text ?? '').length;
  if (bilingual) {
    // bilingual already splits space, stay conservative
    if (len > 200) return { fontSize: 'clamp(10px, 1.4vw, 14px)', padding: '16px 24px' };
    if (len > 120) return { fontSize: 'clamp(11px, 1.6vw, 16px)', padding: '20px 28px' };
    return { fontSize: 'clamp(12px, 1.8vw, 18px)', padding: '24px 32px' };
  }
  if (len > 300) return { fontSize: 'clamp(11px, 1.6vw, 16px)', padding: '16px 24px' };
  if (len > 180) return { fontSize: 'clamp(12px, 1.9vw, 19px)', padding: '20px 28px' };
  return { fontSize: 'clamp(14px, 2.2vw, 22px)', padding: '40px 32px' };
}

interface BookPageProps {
  type: 'image' | 'text' | 'blank' | 'title' | 'colophon' | 'backcover';
  imageUrl?: string;
  text?: string;
  textEn?: string;
  language?: string;
  pageNumber?: number;
  side: 'left' | 'right';
  bookTitle?: string;
}

export default function BookPage({ type, imageUrl, text, textEn, language, pageNumber, side, bookTitle }: BookPageProps) {
  if (type === 'backcover') {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-end relative"
        style={{ background: 'linear-gradient(135deg, #5d4e37 0%, #3e3226 100%)' }}
      >
        <div className="flex-1 flex items-center justify-center">
          <p
            className="font-jua text-white/20 tracking-widest select-none"
            style={{ fontSize: 'clamp(24px, 4vw, 48px)' }}
          >
            FairyWeave
          </p>
        </div>
        <div className="pb-6 text-white/15 text-xs select-none">
          ✦
        </div>
      </div>
    );
  }

  if (type === 'colophon') {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{ background: '#faf6f0' }}
      >
        <div className="px-8 text-center space-y-6">
          <div className="opacity-15 text-on-surface text-2xl select-none">✦</div>
          <p
            className="font-jua text-on-surface word-break-keep"
            style={{ fontSize: 'clamp(16px, 2.4vw, 28px)' }}
          >
            {bookTitle}
          </p>
          <div className="space-y-2 text-on-surface-variant" style={{ fontSize: 'clamp(10px, 1.4vw, 14px)' }}>
            <p>발행일 {dateStr}</p>
            <p>AI 동화 생성 플랫폼</p>
          </div>
          <div className="pt-4">
            <p
              className="font-jua text-primary tracking-wider"
              style={{ fontSize: 'clamp(12px, 1.6vw, 18px)' }}
            >
              FairyWeave
            </p>
          </div>
          <div className="opacity-15 text-on-surface text-2xl select-none rotate-180">✦</div>
        </div>
      </div>
    );
  }

  if (type === 'title') {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{ background: '#faf6f0' }}
      >
        <div className="px-8 text-center">
          <p
            className="font-jua text-on-surface leading-snug word-break-keep"
            style={{ fontSize: 'clamp(20px, 3vw, 36px)' }}
          >
            {bookTitle}
          </p>
        </div>
        <div className="absolute bottom-3 w-full text-center">
          <span className="text-on-surface-variant opacity-40 select-none" style={{ fontSize: '11px' }}>
            1
          </span>
        </div>
      </div>
    );
  }

  if (type === 'blank') {
    return (
      <div
        className="w-full h-full"
        style={{ background: '#faf6f0' }}
      />
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
  const isBilingual = language === 'bilingual' && !!textEn;
  const { fontSize, padding } = getTextStyle(text, isBilingual);

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
      <div className="flex-1 flex flex-col justify-center" style={{ padding }}>
        {isBilingual ? (
          <>
            {/* English text - top half */}
            <div className="flex-1 flex flex-col justify-center">
              <p
                className="text-on-surface leading-relaxed text-center"
                style={{ fontSize, fontFamily: 'system-ui, sans-serif' }}
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
                style={{ fontSize }}
              >
                {text}
              </p>
            </div>
          </>
        ) : (
          <p
            className="font-jua text-on-surface leading-relaxed text-center word-break-keep"
            style={{ fontSize }}
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
            {pageNumber}
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

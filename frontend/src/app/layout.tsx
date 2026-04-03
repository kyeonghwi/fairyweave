import type { Metadata } from 'next';
import { Jua } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const jua = Jua({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-jua',
  display: 'swap',
  fallback: ['Apple SD Gothic Neo', 'sans-serif'],
});

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  fallback: ['Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'FairyWeave',
  description: '세상에 단 하나뿐인 동화책',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jua.variable} ${pretendard.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-pretendard text-on-surface bg-surface selection:bg-primary-container selection:text-on-primary-container">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg"
        >
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}

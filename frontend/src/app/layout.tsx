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
      <body className="font-pretendard text-[#2D2D2D] bg-[#FFF8F0]">
        {children}
      </body>
    </html>
  );
}

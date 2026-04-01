import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

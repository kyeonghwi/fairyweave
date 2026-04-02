interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FFF8F0] font-[family-name:var(--font-pretendard)] text-[#2D2D2D]">
      <div className={`mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 ${className}`}>
        {children}
      </div>
    </main>
  );
}

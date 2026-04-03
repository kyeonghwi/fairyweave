interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export default function PageLayout({ children, className = '', wide = false }: PageLayoutProps) {
  return (
    <main id="main-content" className="min-h-screen bg-surface font-body text-on-surface">
      <div className={`mx-auto ${wide ? 'max-w-7xl' : 'max-w-4xl'} px-4 sm:px-6 py-8 sm:py-12 ${className}`}>
        {children}
      </div>
    </main>
  );
}

import Link from 'next/link';

export default function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-[0_12px_32px_-8px_rgba(54,50,41,0.08)]">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-jua text-2xl text-primary">
          FairyWeave
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="font-jua text-lg tracking-tight text-secondary hover:text-primary transition-colors"
          >
            내 서재
          </Link>
          <Link
            href="/create"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-jua text-lg hover:opacity-90 transition-all scale-95 active:scale-90"
          >
            동화책 만들기
          </Link>
        </div>
        <Link href="/create" className="md:hidden bg-primary text-on-primary px-4 py-2 rounded-full font-jua text-sm">
          만들기
        </Link>
      </div>
    </nav>
  );
}

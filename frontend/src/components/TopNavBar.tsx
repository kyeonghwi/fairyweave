import Link from 'next/link';

export default function TopNavBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 glass-effect shadow-[0_12px_32px_-8px_rgba(54,50,41,0.08)]">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-jua text-2xl text-primary">
          FairyWeave
        </Link>
        <nav className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="font-jua text-lg tracking-tight text-secondary hover:text-primary transition-colors"
          >
            My Library
          </Link>
          <Link
            href="/create"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-jua text-lg hover:opacity-90 transition-all active:scale-95"
          >
            Create Book
          </Link>
        </nav>
        <button className="md:hidden text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}

import Link from 'next/link';

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 glass-effect flex justify-around items-center py-3 px-6 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/create" className="flex flex-col items-center text-primary">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_stories
        </span>
        <span className="text-[10px] font-medium">Create</span>
      </Link>
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">favorite</span>
        <span className="text-[10px] font-medium">Wishlist</span>
      </Link>
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[10px] font-medium">My Page</span>
      </Link>
    </nav>
  );
}

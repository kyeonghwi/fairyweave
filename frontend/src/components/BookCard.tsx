import Link from 'next/link';

interface BookCardProps {
  id: string;
  title: string;
  theme: string;
  themeColor: string;
  coverImageUrl: string;
}

export default function BookCard({ id, title, theme, themeColor, coverImageUrl }: BookCardProps) {
  return (
    <Link
      href={`/book/${id}`}
      className="
        block bg-[#FDE8E8] rounded-2xl overflow-hidden shadow-sm
        transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:-translate-y-1
        active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8734A]
      "
    >
      <div className="aspect-[3/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImageUrl} alt={`${title} 표지`} className="w-full h-full object-cover" />
      </div>
      <div className="p-3 sm:p-4">
        <p className="font-[family-name:var(--font-jua)] text-base text-[#2D2D2D] truncate">
          {title}
        </p>
        <span
          className="inline-block mt-1.5 text-xs font-semibold rounded-full px-2.5 py-1"
          style={{ backgroundColor: themeColor + '40', color: '#2D2D2D' }}
        >
          {theme}
        </span>
      </div>
    </Link>
  );
}

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
        group block bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1
        active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
      "
    >
      <div className="aspect-[3/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          alt={`${title} 표지`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="p-6 space-y-3">
        <h3 className="font-jua text-lg text-on-surface truncate">{title}</h3>
        <span
          className="inline-block text-xs font-semibold rounded-full px-3 py-1 bg-secondary-container text-on-secondary-container"
        >
          {theme}
        </span>
      </div>
    </Link>
  );
}

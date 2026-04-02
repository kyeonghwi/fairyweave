import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import BookCard from '../components/BookCard';
import Button from '../components/ui/Button';
import { dummyBooks } from '../data/dummyData';

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#FDE8E8_0%,transparent_70%)] pointer-events-none" />
        <div className="relative">
          <span className="text-5xl animate-float inline-block mb-4">📖</span>
          <h1 className="font-[family-name:var(--font-jua)] text-4xl sm:text-5xl leading-tight text-[#2D2D2D]">
            세상에 단 하나뿐인
            <br />
            동화책
          </h1>
          <p className="text-lg text-[#5C5C5C] mt-3">
            우리 아이만의 이야기를 AI가 만들어 드려요
          </p>
          <Link href="/create" className="inline-block mt-8">
            <Button size="lg">내 아이 동화책 만들기</Button>
          </Link>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D] mb-6">
          인기 동화책
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {dummyBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              theme={book.theme}
              themeColor={book.themeColor}
              coverImageUrl={book.coverImageUrl}
            />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#FDE8E8] rounded-3xl mx-4 sm:mx-0 p-8 sm:p-12 text-center mt-16">
        <h2 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D]">
          직접 만들어 보세요
        </h2>
        <p className="text-[#5C5C5C] mt-2">
          5분이면 세상에 하나뿐인 동화책이 완성돼요
        </p>
        <Link href="/create" className="inline-block mt-6">
          <Button size="lg">내 아이 동화책 만들기</Button>
        </Link>
      </section>
    </PageLayout>
  );
}

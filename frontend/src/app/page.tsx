import Link from 'next/link';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import { dummyBooks } from '../data/dummyData';

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main id="main-content" className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 lg:px-24 py-16 lg:py-32 bg-[radial-gradient(circle_at_top_right,#faf2e9_0%,#fff8f1_70%)]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-sm font-medium">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                우리 아이만을 위한 특별한 선물
              </div>
              <h1 className="font-jua text-5xl lg:text-7xl text-on-surface leading-[1.2] tracking-tight">
                세상에 단 하나뿐인<br />
                <span className="text-primary italic">동화책</span>
              </h1>
              <p className="text-secondary text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0">
                소중한 우리 아이의 이름과 꿈을 담아보세요.<br className="hidden md:block" />
                마법 같은 일러스트와 이야기가 아이의 상상력을 완성합니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/create"
                  className="watercolor-gradient text-on-primary px-8 py-4 rounded-xl font-jua text-xl shadow-lg hover:opacity-90 transition-all active:scale-95"
                >
                  내 아이 동화책 만들기
                </Link>
                <Link
                  href="/book/dummy-1"
                  className="bg-surface-container-lowest text-secondary border border-outline-variant/15 px-8 py-4 rounded-xl font-jua text-xl hover:bg-surface-container transition-all"
                >
                  샘플 둘러보기
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-[100px] animate-pulse" />
                <div className="relative z-10 w-full h-full bg-surface-container rounded-[3rem] shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-700 flex items-center justify-center overflow-hidden">
                  <span className="text-8xl">📖</span>
                </div>
                <div className="absolute -top-4 -right-4 text-tertiary transform rotate-12 scale-150">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>colors_spark</span>
                </div>
                <div className="absolute -bottom-8 -left-4 text-tertiary-fixed-dim transform -rotate-12 scale-125">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-24 px-6 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16 px-4">
              <div className="space-y-2">
                <h2 className="font-jua text-4xl text-on-surface">인기 동화책</h2>
                <p className="text-secondary font-medium">수많은 부모님들이 선택한 베스트셀러 테마입니다.</p>
              </div>
              <Link href="/create" className="text-primary font-bold flex items-center gap-1 hover:underline">
                전체 보기 <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dummyBooks.map((book, i) => (
                <div key={book.id} className={i % 3 === 1 ? 'mt-0 lg:mt-8' : ''}>
                  <BookCard
                    id={book.id}
                    title={book.title}
                    theme={book.theme}
                    themeColor={book.themeColor}
                    coverImageUrl={book.coverImageUrl}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 px-6 lg:px-24">
          <div className="max-w-6xl mx-auto">
            <div className="bg-primary-container/20 rounded-xl p-12 lg:p-24 text-center space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-tertiary/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
              <div className="relative z-10 space-y-6">
                <h2 className="font-jua text-4xl lg:text-6xl text-on-surface leading-tight">
                  지금 바로 우리 아이의 상상을<br />현실로 만들어 보세요
                </h2>
                <p className="text-secondary text-lg lg:text-xl font-medium max-w-2xl mx-auto">
                  세상에 단 하나뿐인 특별한 이야기가 우리 아이의 인생에 영원히 남을 소중한 유산이 됩니다.
                </p>
                <div className="pt-6">
                  <Link
                    href="/create"
                    className="watercolor-gradient text-on-primary px-12 py-5 rounded-xl font-jua text-2xl shadow-[0_12px_40px_-12px_rgba(151,67,98,0.4)] hover:scale-105 transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    직접 만들어 보세요
                    <span className="material-symbols-outlined">auto_stories</span>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center gap-12 pt-8 text-on-surface/60 font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <span>프리미엄 하드커버</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  <span>정성 가득한 패키징</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

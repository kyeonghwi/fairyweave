import Link from 'next/link';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

const galleryCards = [
  {
    title: '작은 우주비행사 하늘이',
    tags: ['우주 여행', '꿈과 희망'],
    description: '광활한 우주를 탐험하며 용기를 배우는 소중한 우리 아이의 이야기',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FG2eRqxIEh7m_Pw6O5JXMo9FcSTBmzIvCqlIl9pfsN6dLbKDEzlHNdTwVezzjcneoVh9AI2ll-3-JAEWYUdmEmCO1J_XFKAM7hUVZ-ijyhkgG1Gw3HXJVt9zULc-SUuTFdoLHXbMbwnjDDAaIHC5W22kyTbzCfUlq7T_s-kxPxKQTu-sfaMQIQI8jQ8ydOFk0nJflPi1AJFPekJzlH9WT5Km3I6bCE7WbDzlipdye6t9rbe1f4d2UOXFeL2nyhvrdGaDWbnSmte-',
    alt: 'The Little Astronaut',
    offsetClass: '',
  },
  {
    title: '숲속 비밀 파티',
    tags: ['숲속 친구들', '사회성'],
    description: '친절한 동물 친구들과 함께 특별한 파티를 준비하며 나누는 기쁨을 배워요.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxpDFy4s_GqEQugr0uwdLTn61jmsg9RyitJ_etQzDAYQStWt1m7Rl98NwXzYxzFOUQliAEOqAlZeXcav57dweX1VTHg0JSPEEAiOBiWI6FgcoK_p6pRHetIgkcDiXMIkUMvcQRGedOboGvbqNXcv01QDThoGcwPNEpSPIPWT9Pd7Dxcexdu96CRvukez5pC0DktBEn7PZDDPsrXpRuMF0dCTpJhIpkeaiqQ7-9AhIZpBNfz5fWhUl6TNdGDGiYFgom-2zJ4Yt6Dr1_',
    alt: 'Forest Friends',
    offsetClass: '',
  },
  {
    title: '구름 타고 꿈나라로',
    tags: ['잠자리 동화', '정서 안정'],
    description: '포근한 구름 위에서 펼쳐지는 환상적인 모험, 우리 아이의 편안한 잠자리를 책임집니다.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA80f-PvTop87U0s5PPucT9DYKZNwDiNL6nlu2-I2sxXQVjJHnWhNh1nEgfaxcL05-AwVZ9CN8EgPTi1HZy2Kzb7UZdkar9afV-ov9Jj7BZH8GGVUkNN5dI_qtAC8CidI99jXeePZ0TFW_Jg1za5WREmI7vjxJZqrZXSdOrMpBGkK8Lt1GT8hA1A12bhGUVAtaD2061usyksAWnXjUF3Mmf4XAkJNUUV_AkuIPd9ikNIK8KjZu7avwZME1B4iNNnXcCrwc06v6YSsN3',
    alt: 'Dreamy Clouds',
    offsetClass: '',
  },
  {
    title: '깊은 바다 속 보물찾기',
    tags: ['바다 모험', '호기심'],
    description: '푸른 바다 아래 숨겨진 신비로운 보물을 찾아 떠나는 호기심 가득한 여정.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy8lQppVjIB3IdsSCAG6BJplZl6rcXM-b_qMM4WUmTQInH8qkX4XjUZZLblKA_p9aZyW_y6q7J--VJ_vPChvbOaZ-vP22HjVqZ3VfA4SEil6mL0m4pb6zRaUErjecKNYQst8WdKL4D4LiJQL3VQw-1uIxmWvhR5su6htm27yIeBhiJfFm52l8RnSEGIJVVh5Y0Z5bTmlhGuhJvjjPNXn7mWax7Ob9tR8-ksXWQNDV_EZtTjSmZOY3EROZh2YMeDcCZjnyRECwxMPMf',
    alt: 'Ocean Adventure',
    offsetClass: '',
  },
  {
    title: '신비한 비밀의 정원',
    tags: ['마법 정원', '자연 친화'],
    description: '계절마다 옷을 갈아입는 마법 같은 정원에서 배우는 자연의 신비로움.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCJ-JyDGyri96RbGNVVdzqpKvuKHEZRYqXTca_7AiUewp0M7pT5QXpeJzKt4P5cnKFGJDLKW6vxOSKWw8NrDtf-v2YijzSWXp8EcGcX1FV5fswVtWnJg4zdUn9JHs6ZTmGrTD2FraGUEeijxiadAF3nkW_0Bacxpmf8YLrAC957vbg9TakJ4nK_vtTP5LJ44Fa9xhXNo9W7eV--5Wfr9g7meUPjh0Lpvt7kH9SCk54Tbgz56eZqVgTHK5Ct1JlfHJ7Qhg_4UdtZDSE',
    alt: 'Magic Garden',
    offsetClass: '',
  },
];

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main id="main-content" className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 lg:px-24 py-16 lg:py-32 bg-[radial-gradient(circle_at_top_right,var(--color-surface-container-low)_0%,var(--color-surface)_70%)]">
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJqvndjsAPkexeyCF0Xs86MpEVijR8am_KgcBtWWs-rgLa8jQimefpFroTXFe-BokRA-1G1L-zsmVPk7HY9dHTzKXhaxfu6mZx2kAgDFRPbGZE-vHdpQIAK6sNAkXOuC8FjezwNzUFhK6Kl82cnY-YkuenU6aJssLnWYxJmavdaWm3G99sf2JHDs4EDV-YGTdB9EIhXq_-3G9N1SmkVKJarhn0rVh_pRW3hmbRc_-G9wzyRQwHaGXAcWnQlSBmq_TS52cZkQZ5wgKv"
                  alt="Magical Storybook"
                  className="relative z-10 w-full h-full object-cover rounded-[3rem] shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-700"
                />
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
              {galleryCards.map((card) => (
                <div key={card.title} className={`group bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${card.offsetClass}`}>
                  <div className="aspect-[3/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs rounded-full font-medium">{card.tags[0]}</span>
                      <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-xs rounded-full font-medium">{card.tags[1]}</span>
                    </div>
                    <h3 className="font-jua text-2xl text-on-surface">{card.title}</h3>
                    <p className="text-secondary text-sm leading-relaxed">{card.description}</p>
                  </div>
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
                    className="watercolor-gradient text-on-primary px-12 py-5 rounded-xl font-jua text-2xl shadow-[0_12px_40px_-12px_rgba(151,67,98,0.4)] hover:scale-105 transition-all active:scale-95 inline-flex items-center gap-2 group"
                  >
                    직접 만들어 보세요
                    <span className="material-symbols-outlined align-middle ml-2 group-hover:translate-x-1 transition-transform">auto_stories</span>
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

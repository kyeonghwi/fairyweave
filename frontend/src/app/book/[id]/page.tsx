'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import TopNavBar from '../../../components/TopNavBar';
import SideNavBar from '../../../components/SideNavBar';
import Footer from '../../../components/Footer';
import BookViewer from '../../../components/BookViewer';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import ErrorBanner from '../../../components/ErrorBanner';
import { getDummyBook } from '../../../data/dummyData';

type Step = 'preview' | 'details' | 'shipping' | 'complete';

interface BookData {
  id: string;
  title: string;
  childName: string;
  theme: string;
  pages: { pageNumber: number; text: string; imagePrompt: string }[];
  imageUrls: string[];
  isDummy: boolean;
}

interface OrderErrors {
  recipientName?: string;
  recipientPhone?: string;
  postalCode?: string;
  address1?: string;
}

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [book, setBook] = useState<BookData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<Step>('preview');
  const [currentPage, setCurrentPage] = useState(0);

  // Order form
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');
  const [orderErrors, setOrderErrors] = useState<OrderErrors>({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderApiError, setOrderApiError] = useState('');
  const [orderUid, setOrderUid] = useState('');
  const [orderPricing, setOrderPricing] = useState<{
    totalProductAmount?: number;
    totalShippingFee?: number;
    totalAmount?: number;
    orderStatusDisplay?: string;
    pageCount?: number;
  } | null>(null);

  useEffect(() => {
    // Try dummy book first
    const dummy = getDummyBook(id);
    if (dummy) {
      setBook({
        id: dummy.id,
        title: dummy.title,
        childName: dummy.childName,
        theme: dummy.theme,
        pages: dummy.pages,
        imageUrls: dummy.imageUrls,
        isDummy: true,
      });
      return;
    }

    // Try in-memory cache (set by create page after generation)
    const cached = (window as any).__bookCache;
    if (cached && (cached.bookId === id)) {
      setBook({
        id: cached.bookId,
        title: cached.title || `${cached.request?.childName || '아이'}의 동화책`,
        childName: cached.request?.childName || '',
        theme: cached.request?.theme || '',
        pages: cached.pages,
        imageUrls: cached.imageUrls,
        isDummy: false,
      });
      delete (window as any).__bookCache;
      return;
    }

    // Fetch from API (fallback for direct URL access)
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('AI_BOOK_EXPIRED');
        return res.json();
      })
      .then((data) => {
        setBook({
          id: data.id,
          title: data.title || `${data.request.childName}의 동화책`,
          childName: data.request.childName,
          theme: data.request.theme,
          pages: data.pages,
          imageUrls: data.imageUrls,
          isDummy: false,
        });
      })
      .catch((err) => setLoadError(err.message === 'AI_BOOK_EXPIRED' ? 'AI_BOOK_EXPIRED' : err.message));
  }, [id]);

  if (loadError) {
    const isExpired = loadError === 'AI_BOOK_EXPIRED';
    return (
      <>
        <TopNavBar />
        <div className="flex pt-20 min-h-screen">
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:px-12 bg-surface">
            <div className="text-center">
              <span className="text-5xl block mb-4">{isExpired ? '⏳' : '😢'}</span>
              <h2 className="font-jua text-xl text-on-surface mb-2">
                {isExpired ? '생성된 책 데이터가 만료되었어요' : '문제가 발생했어요'}
              </h2>
              <p className="text-secondary mb-6">
                {isExpired
                  ? 'AI로 생성한 책은 서버 메모리에 임시 저장돼요. 다시 만들어 보세요!'
                  : loadError}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/create">
                  <Button variant="primary">다시 만들기</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">메인으로</Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (!book) {
    return (
      <>
        <TopNavBar />
        <div className="flex pt-20 min-h-screen">
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:px-12 bg-surface">
            <div className="w-16 h-20 bg-primary-container/20 rounded-lg animate-pulse" />
            <p className="text-secondary mt-4">불러오는 중...</p>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // --- Step: Preview ---
  if (step === 'preview') {
    return (
      <>
        <TopNavBar />
        <div className="flex pt-20 min-h-screen">
          <SideNavBar currentStep={step} onStepClick={(s) => setStep(s)} />
          <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-12 bg-surface">
            {/* Step badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold mb-4 tracking-widest">
              <span>STEP 1 / 4</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-jua text-on-surface mb-4 leading-tight word-break-keep">
              {book.title}
            </h1>
            <p className="text-secondary text-lg opacity-80 mb-12">
              꿈꾸는 아이의 이름이 담긴 세상에 하나뿐인 이야기를 확인해보세요.
            </p>

            {/* Book preview area */}
            <div className="w-full max-w-5xl">
              <BookViewer
                pages={book.pages}
                imageUrls={book.imageUrls}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                bookTitle={book.title}
              />
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('details')}
              className="mt-16 watercolor-gradient text-on-primary px-12 py-5 rounded-xl font-jua text-xl tonal-shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-3"
            >
              다음 단계로: 주문 확인하기
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            {/* Info cards */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <div className="bg-surface-container-lowest p-6 rounded-lg text-center">
                <span className="material-symbols-outlined text-tertiary mb-3 text-3xl">child_care</span>
                <h3 className="font-jua text-on-surface mb-2">주인공: {book.childName}</h3>
                <p className="text-on-surface-variant text-sm">아이의 이름이 이야기 곳곳에 자연스럽게 녹아듭니다.</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg text-center">
                <span className="material-symbols-outlined text-tertiary mb-3 text-3xl">auto_fix_high</span>
                <h3 className="font-jua text-on-surface mb-2">커스텀 일러스트</h3>
                <p className="text-on-surface-variant text-sm">선택하신 캐릭터 스타일로 모든 장면이 생성되었습니다.</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg text-center">
                <span className="material-symbols-outlined text-tertiary mb-3 text-3xl">menu_book</span>
                <h3 className="font-jua text-on-surface mb-2">프리미엄 하드커버</h3>
                <p className="text-on-surface-variant text-sm">도톰하고 부드러운 고급 종이에 선명하게 인쇄됩니다.</p>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // --- Step: Details (order summary) ---
  if (step === 'details') {
    return (
      <>
        <TopNavBar />
        <div className="flex pt-20 min-h-screen">
          <SideNavBar currentStep={step} onStepClick={(s) => setStep(s)} />
          <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-12 bg-surface">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold mb-4 tracking-widest">
              <span>STEP 2 / 4</span>
            </div>
            <h1 className="font-jua text-4xl md:text-5xl text-primary mb-4 word-break-keep">주문하실 상품을 확인해 주세요</h1>
            <div className="w-24 h-1 watercolor-gradient rounded-full mb-12" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full max-w-5xl">
              {/* Product card */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface-container-lowest p-6 md:p-8 rounded-lg tonal-shadow flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-48 h-64 flex-shrink-0 rounded-md overflow-hidden shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.imageUrls[0]} alt="표지" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-jua text-2xl text-on-surface mb-2">{book.title}</h3>
                      <p className="text-secondary mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        저자: {book.childName}
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-tertiary">menu_book</span>
                          <span className="text-sm font-medium">프리미엄 하드커버</span>
                        </li>
                        <li className="flex items-center gap-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-tertiary">auto_stories</span>
                          <span className="text-sm font-medium">콘텐츠 {book.pages.length}페이지</span>
                        </li>
                        <li className="flex items-center gap-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-tertiary">aspect_ratio</span>
                          <span className="text-sm font-medium">243mm x 248mm</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-8 pt-6 border-t border-outline-variant/15 flex items-center gap-2 text-tertiary font-medium">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
                      <span className="text-sm">세상에 단 하나뿐인 특별한 이야기</span>
                    </div>
                  </div>
                </div>

                {/* Decorative Quote */}
                <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant/10 text-center">
                  <p className="font-jua text-secondary text-lg italic word-break-keep">&ldquo;우리 아이의 꿈이 자라나는 마법 같은 순간을 간직하세요.&rdquo;</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="lg:col-span-1 sticky top-32">
                <div className="bg-surface-container-lowest p-8 rounded-lg tonal-shadow">
                  <h4 className="font-jua text-xl text-on-surface mb-6">결제 금액 요약</h4>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-on-surface-variant">
                      <span className="text-sm">상품 금액</span>
                      <span className="text-sm font-medium">38,000원</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span className="text-sm">배송비</span>
                      <span className="text-sm font-medium">3,000원</span>
                    </div>
                    <div className="h-px bg-outline-variant/15 my-2" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-on-surface">총 결제 금액</span>
                      <span className="text-2xl font-bold text-primary">41,000원</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('shipping')}
                    className="w-full watercolor-gradient text-on-primary py-4 px-6 rounded-xl font-bold text-lg shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>배송 정보 입력하기</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <p className="text-center text-xs text-on-surface-variant mt-6 px-4">
                    결제 완료 시 제작이 시작되며,<br />영업일 기준 5-7일 내외로 배송됩니다.
                  </p>
                </div>
                {/* Trust badges */}
                <div className="mt-6 flex justify-center gap-4 text-outline opacity-60">
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                    <span className="text-[10px]">Safe Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-xl">eco</span>
                    <span className="text-[10px]">FSC Paper</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // --- Step: Shipping ---
  if (step === 'shipping') {
    function validateOrder(): OrderErrors {
      const errs: OrderErrors = {};
      if (!recipientName.trim()) errs.recipientName = '받으실 분 이름을 입력해 주세요';
      if (!recipientPhone.trim()) errs.recipientPhone = '연락처를 입력해 주세요';
      if (!postalCode.trim()) errs.postalCode = '우편번호를 입력해 주세요';
      if (!address1.trim()) errs.address1 = '주소를 입력해 주세요';
      return errs;
    }

    async function handleOrder(e: React.FormEvent) {
      e.preventDefault();
      const errs = validateOrder();
      setOrderErrors(errs);
      if (Object.keys(errs).length > 0) {
        const firstErrorField = document.querySelector('[aria-invalid="true"]');
        firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setOrderLoading(true);
      setOrderApiError('');

      try {
        const shipping = {
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          postalCode: postalCode.trim(),
          address1: address1.trim(),
          ...(address2.trim() ? { address2: address2.trim() } : {}),
          ...(shippingMemo.trim() ? { shippingMemo: shippingMemo.trim() } : {}),
        };

        let res: Response;

        if (book!.isDummy) {
          // Dummy book: use books-from-data endpoint
          res = await fetch('/api/sweetbook/books-from-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pages: book!.pages,
              imageUrls: book!.imageUrls,
              request: { childName: book!.childName, age: 5, theme: book!.theme, moral: '' },
              shipping,
            }),
          });
        } else {
          // AI book: create via bookId, then order
          const bookRes = await fetch('/api/sweetbook/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: book!.id }),
          });
          if (!bookRes.ok) {
            const data = await bookRes.json().catch(() => ({}));
            throw new Error(data.error || '책 등록에 실패했어요');
          }
          const { bookUid } = await bookRes.json();

          res = await fetch('/api/sweetbook/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookUid, ...shipping }),
          });
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '주문에 실패했어요');
        }

        const data = await res.json();
        setOrderUid(data.orderUid);
        setOrderPricing({
          totalProductAmount: data.totalProductAmount,
          totalShippingFee: data.totalShippingFee,
          totalAmount: data.totalAmount,
          orderStatusDisplay: data.orderStatusDisplay,
          pageCount: data.pageCount,
        });
        setStep('complete');
      } catch (err) {
        setOrderApiError(err instanceof Error ? err.message : '다시 시도해 주세요.');
      } finally {
        setOrderLoading(false);
      }
    }

    const inputClass = (hasError: boolean) =>
      `w-full rounded-xl px-4 py-3 bg-surface-container-highest border text-base
       placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
       transition-colors outline-none ${hasError ? 'border-error' : 'border-outline-variant'}`;

    return (
      <>
        <TopNavBar />
        <div className="flex pt-20 min-h-screen">
          <SideNavBar currentStep={step} onStepClick={(s) => setStep(s)} />
          <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-12 bg-surface">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold mb-4 tracking-widest">
              <span>STEP 3 / 4</span>
            </div>
            <h1 className="font-jua text-4xl md:text-5xl text-primary mb-4 word-break-keep">어디로 보내드릴까요?</h1>
            <div className="w-24 h-1 watercolor-gradient rounded-full mb-12" />

            <div className="w-full max-w-2xl">
              <div className="bg-surface-container-lowest rounded-lg p-8 tonal-shadow border border-outline-variant/10">
                {orderApiError && (
                  <div className="mb-6">
                    <ErrorBanner message={orderApiError} onRetry={() => setOrderApiError('')} />
                  </div>
                )}

                <form onSubmit={handleOrder} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="수령인 이름" required error={orderErrors.recipientName}>
                      <input
                        type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="받으실 분 이름" aria-invalid={!!orderErrors.recipientName}
                        className={inputClass(!!orderErrors.recipientName)}
                      />
                    </FormField>

                    <FormField label="연락처" required error={orderErrors.recipientPhone}>
                      <input
                        type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="010-1234-5678" aria-invalid={!!orderErrors.recipientPhone}
                        className={inputClass(!!orderErrors.recipientPhone)}
                      />
                    </FormField>
                  </div>

                  <FormField label="주소" required error={orderErrors.postalCode}>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="우편번호" maxLength={5} aria-invalid={!!orderErrors.postalCode}
                          className={`w-32 rounded-xl px-4 py-3 bg-surface-container-highest border text-base
                           placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-colors outline-none ${orderErrors.postalCode ? 'border-error' : 'border-outline-variant'}`}
                        />
                        <button
                          type="button"
                          className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">search</span>
                          주소 찾기
                        </button>
                      </div>
                      <input
                        type="text" value={address1} onChange={(e) => setAddress1(e.target.value)}
                        placeholder="기본 주소" aria-invalid={!!orderErrors.address1}
                        className={inputClass(!!orderErrors.address1)}
                      />
                      <input
                        type="text" value={address2} onChange={(e) => setAddress2(e.target.value)}
                        placeholder="상세 주소"
                        className={inputClass(false)}
                      />
                    </div>
                  </FormField>

                  <FormField label="배송 메모">
                    <select
                      value={shippingMemo}
                      onChange={(e) => setShippingMemo(e.target.value)}
                      className={`${inputClass(false)} appearance-none cursor-pointer`}
                    >
                      <option value="">배송 메모를 선택해주세요</option>
                      <option value="부재 시 경비실에 맡겨주세요">부재 시 경비실에 맡겨주세요</option>
                      <option value="배송 전 미리 연락바랍니다">배송 전 미리 연락바랍니다</option>
                      <option value="직접 입력">직접 입력</option>
                    </select>
                  </FormField>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="flex items-center gap-2 text-secondary font-medium hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                      이전 단계로
                    </button>
                    <button
                      type="submit"
                      disabled={orderLoading}
                      className="watercolor-gradient text-on-primary px-12 py-5 rounded-xl font-jua text-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70"
                    >
                      {orderLoading ? '주문 처리 중...' : '결제하고 주문 완료하기'}
                      <span className="material-symbols-outlined">colors_spark</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // --- Step: Complete ---
  return (
    <>
      <TopNavBar />
      <div className="flex pt-20 min-h-screen">
        <SideNavBar currentStep={step} onStepClick={(s) => setStep(s)} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:px-12 bg-surface">
          <div className="max-w-lg mx-auto text-center space-y-8">
            {/* Success icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-inner ring-8 ring-surface-container-low animate-bounceIn">
                <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-jua text-4xl text-on-surface">주문이 완료되었어요!</h2>
              <p className="text-secondary font-medium">따뜻한 마음을 담아 정성껏 제작할게요.</p>
            </div>

            {/* Order summary card */}
            <div className="bg-surface-container-lowest p-6 rounded-lg tonal-shadow text-left space-y-4 border border-outline-variant/10">
              <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                <span className="text-on-surface-variant text-sm">주문번호</span>
                <span className="font-bold text-on-surface">{orderUid}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                <span className="text-on-surface-variant text-sm">상품명</span>
                <span className="font-bold text-on-surface">{book.title}</span>
              </div>
              {orderPricing?.totalProductAmount != null && (
                <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                  <span className="text-on-surface-variant text-sm">상품 금액</span>
                  <span className="font-medium text-on-surface">{orderPricing.totalProductAmount.toLocaleString('ko-KR')}원</span>
                </div>
              )}
              {orderPricing?.totalShippingFee != null && (
                <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                  <span className="text-on-surface-variant text-sm">배송비</span>
                  <span className="font-medium text-on-surface">{orderPricing.totalShippingFee.toLocaleString('ko-KR')}원</span>
                </div>
              )}
              {orderPricing?.totalAmount != null && (
                <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                  <span className="text-on-surface-variant text-sm">결제 금액</span>
                  <span className="font-bold text-primary">{orderPricing.totalAmount.toLocaleString('ko-KR')}원</span>
                </div>
              )}
              {orderPricing?.orderStatusDisplay != null && (
                <div className="flex justify-between pb-3">
                  <span className="text-on-surface-variant text-sm">주문 상태</span>
                  <span className="font-medium text-on-surface">{orderPricing.orderStatusDisplay}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-on-surface-variant text-sm">배송지</span>
                <p className="text-on-surface text-sm leading-relaxed">{address1} {address2}<br />(받는 사람: {recipientName})</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/create"
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-jua text-xl hover:opacity-90 transition-all text-center"
              >
                또 만들기
              </Link>
              <Link
                href="/"
                className="w-full bg-surface-container-highest text-secondary py-4 rounded-xl font-jua text-xl hover:bg-surface-dim transition-all text-center"
              >
                메인으로
              </Link>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

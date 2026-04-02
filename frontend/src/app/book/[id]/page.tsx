'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import PageLayout from '../../../components/PageLayout';
import PageSlider from '../../../components/PageSlider';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import OrderSummary from '../../../components/OrderSummary';
import ErrorBanner from '../../../components/ErrorBanner';
import { getDummyBook } from '../../../data/dummyData';
import { CheckCircle } from 'lucide-react';

type Step = 'preview' | 'order' | 'complete';

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

    // Fetch from API
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('책을 찾을 수 없어요');
        return res.json();
      })
      .then((data) => {
        setBook({
          id: data.id,
          title: `${data.request.childName}의 동화책`,
          childName: data.request.childName,
          theme: data.request.theme,
          pages: data.pages,
          imageUrls: data.imageUrls,
          isDummy: false,
        });
      })
      .catch((err) => setLoadError(err.message));
  }, [id]);

  if (loadError) {
    return (
      <PageLayout className="flex flex-col items-center justify-center min-h-[60vh]">
        <ErrorBanner message={loadError} />
        <Link href="/" className="mt-6">
          <Button variant="outline">메인으로</Button>
        </Link>
      </PageLayout>
    );
  }

  if (!book) {
    return (
      <PageLayout className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-20 bg-[#FDE8E8] rounded-lg animate-pulse" />
        <p className="text-[#5C5C5C] mt-4">불러오는 중...</p>
      </PageLayout>
    );
  }

  // --- Step: Preview ---
  if (step === 'preview') {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">← 뒤로가기</Button>
          </Link>

          <h1 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D] mb-4">
            {book.title}
          </h1>

          <PageSlider
            pages={book.pages}
            imageUrls={book.imageUrls}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            bookTitle={book.title}
          />

          <Button size="lg" className="w-full mt-6" onClick={() => setStep('order')}>
            이 동화책 주문하기
          </Button>
        </div>
      </PageLayout>
    );
  }

  // --- Step: Order ---
  if (step === 'order') {
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
        setStep('complete');
      } catch (err) {
        setOrderApiError(err instanceof Error ? err.message : '다시 시도해 주세요.');
      } finally {
        setOrderLoading(false);
      }
    }

    const inputClass = (hasError: boolean) =>
      `w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border text-base
       placeholder:text-[#9E9E9E] focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20
       transition-colors outline-none ${hasError ? 'border-[#D14343]' : 'border-[#E0D6CC]'}`;

    return (
      <PageLayout>
        <div className="max-w-lg mx-auto animate-slideInRight">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setStep('preview')}>← 미리보기로 돌아가기</Button>

          <div className="bg-[#FDE8E8] rounded-2xl p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D] mb-6">
              배송 정보
            </h2>

            {orderApiError && (
              <div className="mb-6">
                <ErrorBanner message={orderApiError} onRetry={() => setOrderApiError('')} />
              </div>
            )}

            <form onSubmit={handleOrder} className="space-y-4" noValidate>
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

              <FormField label="우편번호" required error={orderErrors.postalCode}>
                <input
                  type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12345" maxLength={5} aria-invalid={!!orderErrors.postalCode}
                  className={inputClass(!!orderErrors.postalCode)}
                />
              </FormField>

              <FormField label="주소" required error={orderErrors.address1}>
                <input
                  type="text" value={address1} onChange={(e) => setAddress1(e.target.value)}
                  placeholder="서울시 강남구 테헤란로 123" aria-invalid={!!orderErrors.address1}
                  className={inputClass(!!orderErrors.address1)}
                />
              </FormField>

              <FormField label="상세주소">
                <input
                  type="text" value={address2} onChange={(e) => setAddress2(e.target.value)}
                  placeholder="101동 202호" className={inputClass(false)}
                />
              </FormField>

              <FormField label="배송 메모">
                <input
                  type="text" value={shippingMemo} onChange={(e) => setShippingMemo(e.target.value)}
                  placeholder="부재 시 경비실에 맡겨 주세요" className={inputClass(false)}
                />
              </FormField>

              <Button type="submit" size="lg" loading={orderLoading} className="w-full mt-6">
                주문하기
              </Button>
            </form>
          </div>
        </div>
      </PageLayout>
    );
  }

  // --- Step: Complete ---
  return (
    <PageLayout>
      <div className="max-w-lg mx-auto text-center py-8 animate-fadeScaleIn">
        <div className="relative inline-block">
          <div className="animate-bounceIn">
            <CheckCircle size={64} className="text-[#2D8A56] mx-auto" />
          </div>
          {/* Confetti circles */}
          <span className="absolute -top-2 -left-4 w-3 h-3 rounded-full bg-[#D4B8E0] animate-confetti" style={{ animationDelay: '0.1s' }} />
          <span className="absolute -top-1 left-8 w-2.5 h-2.5 rounded-full bg-[#A8E6CF] animate-confetti" style={{ animationDelay: '0.25s' }} />
          <span className="absolute top-0 -right-3 w-3 h-3 rounded-full bg-[#FFE4A1] animate-confetti" style={{ animationDelay: '0.15s' }} />
          <span className="absolute -top-3 right-6 w-2 h-2 rounded-full bg-[#87CEEB] animate-confetti" style={{ animationDelay: '0.3s' }} />
        </div>

        <h2 className="font-[family-name:var(--font-jua)] text-2xl text-[#2D2D2D] mt-4">
          주문이 완료되었어요!
        </h2>

        <OrderSummary
          orderUid={orderUid}
          bookTitle={book.title}
          recipientName={recipientName}
          address={`${address1} ${address2}`.trim()}
        />

        <div className="flex gap-3 mt-8 justify-center flex-col sm:flex-row">
          <Link href="/create">
            <Button variant="primary" size="md">또 만들기</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md">메인으로</Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

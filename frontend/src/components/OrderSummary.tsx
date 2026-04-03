interface OrderSummaryProps {
  orderUid: string;
  bookTitle: string;
  recipientName: string;
  address: string;
}

export default function OrderSummary({ orderUid, bookTitle, recipientName, address }: OrderSummaryProps) {
  return (
    <div>
      <p className="font-mono text-sm text-on-surface-variant mt-2">주문번호: {orderUid}</p>
      <div className="bg-surface-container-low rounded-lg p-5 mt-6 text-left border border-outline-variant/10">
        <p className="font-jua text-base text-on-surface">{bookTitle}</p>
        <p className="text-sm text-on-surface-variant mt-2">
          {recipientName} · {address}
        </p>
      </div>
    </div>
  );
}

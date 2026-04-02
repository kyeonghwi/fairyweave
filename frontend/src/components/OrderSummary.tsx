interface OrderSummaryProps {
  orderUid: string;
  bookTitle: string;
  recipientName: string;
  address: string;
}

export default function OrderSummary({ orderUid, bookTitle, recipientName, address }: OrderSummaryProps) {
  return (
    <div>
      <p className="font-mono text-sm text-[#5C5C5C] mt-2">주문번호: {orderUid}</p>
      <div className="bg-[#FDE8E8] rounded-2xl p-5 mt-6 text-left">
        <p className="font-[family-name:var(--font-jua)] text-base text-[#2D2D2D]">{bookTitle}</p>
        <p className="text-sm text-[#5C5C5C] mt-2">
          {recipientName} · {address}
        </p>
      </div>
    </div>
  );
}

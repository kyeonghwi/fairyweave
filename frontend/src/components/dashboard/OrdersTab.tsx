'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import Button from '../ui/Button';
import ErrorBanner from '../ErrorBanner';

interface OrderItem {
  bookTitle: string;
  quantity: number;
  pageCount: number;
  unitPrice: number;
}

interface Order {
  orderUid: string;
  orderStatus: string;
  orderStatusDisplay: string;
  totalProductAmount: number;
  totalShippingFee: number;
  totalAmount: number;
  recipientName: string;
  address1: string;
  items?: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-secondary-container text-on-secondary-container',
  confirmed: 'bg-tertiary-container text-on-tertiary-container',
  status_changed: 'bg-surface-container-high text-on-surface',
  shipped: 'bg-primary-container text-on-primary-container',
  delivered: 'bg-primary-container/60 text-on-primary-container',
  cancelled: 'bg-error-container/30 text-error',
  refund: 'bg-error-container/20 text-error/80',
};

function statusColor(status: unknown) {
  if (typeof status !== 'string') return 'bg-surface-container text-on-surface';
  const lower = status.toLowerCase();
  for (const key of Object.keys(STATUS_COLORS)) {
    if (lower.includes(key)) return STATUS_COLORS[key];
  }
  return 'bg-surface-container text-on-surface';
}

const TERMINAL_KEYWORDS = ['cancel', 'refund', 'delivered', '취소', '환불', '배송완료'];
const CANCELLED_KEYWORDS = ['cancel', 'refund', '취소', '환불'];

function statusText(order: Order) {
  return `${order.orderStatus ?? ''} ${order.orderStatusDisplay ?? ''}`.toLowerCase();
}

/** 취소/환불/배송완료된 주문은 더 이상 취소 불가 */
function isCancellable(order: Order) {
  const text = statusText(order);
  return !TERMINAL_KEYWORDS.some((k) => text.includes(k));
}

/** 취소/환불 주문 여부 — 행 스타일에 사용 */
function isCancelledOrRefunded(order: Order) {
  const text = statusText(order);
  return CANCELLED_KEYWORDS.some((k) => text.includes(k));
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel flow
  const [cancelUid, setCancelUid] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Shipping edit flow
  const [shippingUid, setShippingUid] = useState<string | null>(null);
  const [shippingFields, setShippingFields] = useState({ recipientName: '', recipientPhone: '', postalCode: '', address1: '', address2: '' });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/sweetbook/orders?limit=30');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setOrders(body.items ?? body.orders ?? []);
      setError('');
    } catch (e) {
      if (!silent) setError((e as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    pollingRef.current = setInterval(() => fetchOrders(true), 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchOrders]);

  async function loadDetail(uid: string) {
    if (selectedUid === uid) {
      setSelectedUid(null);
      setDetail(null);
      return;
    }
    setSelectedUid(uid);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sweetbook/orders/${uid}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDetail(await res.json());
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitCancel() {
    if (!cancelUid || !cancelReason.trim()) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/sweetbook/orders/${cancelUid}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: cancelReason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setCancelUid(null);
      setCancelReason('');
      fetchOrders();
    } catch (e) {
      setCancelError((e as Error).message);
    } finally {
      setCancelLoading(false);
    }
  }

  async function submitShipping() {
    if (!shippingUid) return;
    setShippingLoading(true);
    setShippingError('');
    try {
      const payload: Record<string, string> = {};
      if (shippingFields.recipientName) payload.recipientName = shippingFields.recipientName;
      if (shippingFields.recipientPhone) payload.recipientPhone = shippingFields.recipientPhone;
      if (shippingFields.postalCode) payload.postalCode = shippingFields.postalCode;
      if (shippingFields.address1) payload.address1 = shippingFields.address1;
      if (shippingFields.address2) payload.address2 = shippingFields.address2;
      const res = await fetch(`/api/sweetbook/orders/${shippingUid}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setShippingUid(null);
      setShippingFields({ recipientName: '', recipientPhone: '', postalCode: '', address1: '', address2: '' });
      if (selectedUid) loadDetail(selectedUid);
    } catch (e) {
      setShippingError((e as Error).message);
    } finally {
      setShippingLoading(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-on-surface-variant text-sm">불러오는 중...</div>;
  if (error) return <ErrorBanner message={error} onRetry={() => fetchOrders()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-on-surface-variant">총 {orders.length}건</span>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()}>새로고침</Button>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant">주문이 없습니다.</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-outline-variant/20">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high text-on-surface-variant">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">주문 UID</th>
                <th className="text-left px-4 py-3 font-semibold">수신자</th>
                <th className="text-left px-4 py-3 font-semibold">상태</th>
                <th className="text-right px-4 py-3 font-semibold">금액</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {orders.map((order) => (
                <Fragment key={order.orderUid}>
                  <tr
                    className="bg-surface-container-lowest hover:bg-surface-container transition-colors cursor-pointer"
                    style={isCancelledOrRefunded(order) ? { opacity: 0.45 } : undefined}
                    onClick={() => loadDetail(order.orderUid)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{order.orderUid}</td>
                    <td className="px-4 py-3 text-on-surface" style={isCancelledOrRefunded(order) ? { textDecoration: 'line-through', color: 'var(--color-on-surface-variant, #888)' } : undefined}>
                      {order.recipientName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.orderStatus)}`}>
                        {order.orderStatusDisplay ?? order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-on-surface" style={isCancelledOrRefunded(order) ? { textDecoration: 'line-through', color: 'var(--color-on-surface-variant, #888)' } : undefined}>
                      ₩{(order.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {cancelUid !== order.orderUid && isCancellable(order) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { setCancelUid(order.orderUid); setCancelReason(''); setCancelError(''); }}
                        >
                          취소
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* Cancel inline form */}
                  {cancelUid === order.orderUid && (
                    <tr className="bg-error-container/10">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <input
                            className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-lowest text-on-surface focus:outline-primary"
                            placeholder="취소 사유를 입력하세요"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                          <Button variant="destructive" size="sm" loading={cancelLoading} onClick={submitCancel}>
                            확인
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setCancelUid(null); setCancelError(''); }}>
                            취소
                          </Button>
                        </div>
                        {cancelError && <p className="text-xs text-error mt-2">{cancelError}</p>}
                      </td>
                    </tr>
                  )}

                  {/* Detail accordion */}
                  {selectedUid === order.orderUid && (
                    <tr className="bg-surface-container-low">
                      <td colSpan={5} className="px-6 py-4">
                        {detailLoading ? (
                          <p className="text-sm text-on-surface-variant">상세 불러오는 중...</p>
                        ) : detail ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-on-surface-variant text-xs mb-1">상품 금액</p>
                                <p className="text-on-surface font-medium">₩{(detail.totalProductAmount ?? 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-on-surface-variant text-xs mb-1">배송비</p>
                                <p className="text-on-surface font-medium">₩{(detail.totalShippingFee ?? 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-on-surface-variant text-xs mb-1">배송지</p>
                                <p className="text-on-surface font-medium">{detail.address1}</p>
                              </div>
                            </div>
                            {detail.items && detail.items.length > 0 && (
                              <table className="w-full text-xs border border-outline-variant/20 rounded-lg overflow-hidden">
                                <thead className="bg-surface-container text-on-surface-variant">
                                  <tr>
                                    <th className="text-left px-3 py-2">책 제목</th>
                                    <th className="text-center px-3 py-2">수량</th>
                                    <th className="text-center px-3 py-2">페이지</th>
                                    <th className="text-right px-3 py-2">단가</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.items.map((item, i) => (
                                    <tr key={i} className="border-t border-outline-variant/10 bg-surface-container-lowest">
                                      <td className="px-3 py-2">{item.bookTitle}</td>
                                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                                      <td className="px-3 py-2 text-center">{item.pageCount}p</td>
                                      <td className="px-3 py-2 text-right">₩{(item.unitPrice ?? 0).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {/* Shipping edit — 취소/환불 주문은 숨김 */}
                            {!isCancelledOrRefunded(order) && shippingUid !== order.orderUid ? (
                              <Button variant="outline" size="sm" onClick={() => {
                                setShippingUid(order.orderUid);
                                setShippingFields({ recipientName: detail.recipientName ?? '', recipientPhone: '', postalCode: '', address1: detail.address1 ?? '', address2: '' });
                                setShippingError('');
                              }}>
                                배송지 수정
                              </Button>
                            ) : !isCancelledOrRefunded(order) && (
                              <div className="space-y-2 p-3 bg-surface-container rounded-lg">
                                <p className="text-xs font-semibold text-on-surface-variant mb-2">배송지 수정 (변경할 항목만 입력)</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {(['recipientName', 'recipientPhone', 'postalCode', 'address1', 'address2'] as const).map((field) => (
                                    <input
                                      key={field}
                                      className="border border-outline-variant rounded-lg px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-primary"
                                      placeholder={{ recipientName: '수신자명', recipientPhone: '연락처', postalCode: '우편번호', address1: '주소', address2: '상세주소' }[field]}
                                      value={shippingFields[field]}
                                      onChange={(e) => setShippingFields((prev) => ({ ...prev, [field]: e.target.value }))}
                                    />
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <Button variant="secondary" size="sm" loading={shippingLoading} onClick={submitShipping}>저장</Button>
                                  <Button variant="ghost" size="sm" onClick={() => setShippingUid(null)}>취소</Button>
                                </div>
                                {shippingError && <p className="text-xs text-error">{shippingError}</p>}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

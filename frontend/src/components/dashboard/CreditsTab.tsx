'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import ErrorBanner from '../ErrorBanner';

interface CreditBalance {
  availableCredits?: number;
  balance?: number;
  currency?: string;
}

interface CreditTransaction {
  transactionUid?: string;
  transactionType?: string;
  type?: string;
  amount: number;
  balanceAfter?: number;
  createdAt?: string;
  description?: string;
}

export default function CreditsTab() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [balRes, txRes] = await Promise.all([
        fetch('/api/sweetbook/credits/balance'),
        fetch('/api/sweetbook/credits/transactions?limit=50'),
      ]);
      if (!balRes.ok) throw new Error(`잔액 조회 실패 HTTP ${balRes.status}`);
      if (!txRes.ok) throw new Error(`거래 내역 조회 실패 HTTP ${txRes.status}`);
      const balBody = await balRes.json();
      const txBody = await txRes.json();
      setBalance(balBody);
      setTransactions(txBody.items ?? txBody.transactions ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const creditValue = balance?.availableCredits ?? balance?.balance ?? 0;

  if (loading) return <div className="py-12 text-center text-on-surface-variant text-sm">불러오는 중...</div>;
  if (error) return <ErrorBanner message={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {/* Balance card */}
        <div className="bg-primary/10 rounded-2xl p-6 min-w-[200px] flex-shrink-0">
          <p className="text-xs font-semibold text-primary mb-1">현재 잔액</p>
          <p className="font-jua text-3xl text-primary">₩{creditValue.toLocaleString()}</p>
          {balance?.currency && (
            <p className="text-xs text-on-surface-variant mt-1">{balance.currency}</p>
          )}
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchAll}>
            새로고침
          </Button>
        </div>

        {/* Transactions table */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface mb-3">거래 내역</p>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant text-sm">거래 내역이 없습니다.</div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-outline-variant/20">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-high text-on-surface-variant">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">일시</th>
                    <th className="text-left px-4 py-3 font-semibold">유형</th>
                    <th className="text-right px-4 py-3 font-semibold">금액</th>
                    <th className="text-right px-4 py-3 font-semibold">잔액 후</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {transactions.map((tx, i) => {
                    const type = tx.transactionType ?? tx.type ?? '';
                    const isDebit = tx.amount < 0 || type.toLowerCase().includes('debit') || type.toLowerCase().includes('차감');
                    return (
                      <tr key={tx.transactionUid ?? i} className="bg-surface-container-lowest hover:bg-surface-container transition-colors">
                        <td className="px-4 py-3 text-on-surface-variant text-xs">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-on-surface">{type || '-'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${isDebit ? 'text-error' : 'text-secondary'}`}>
                          {isDebit ? '' : '+'} ₩{Math.abs(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface-variant">
                          {tx.balanceAfter != null ? `₩${tx.balanceAfter.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

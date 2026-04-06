'use client';

import { useState } from 'react';
import TopNavBar from '../../components/TopNavBar';
import Footer from '../../components/Footer';
import OrdersTab from '../../components/dashboard/OrdersTab';
import CreditsTab from '../../components/dashboard/CreditsTab';

type Tab = 'orders' | 'credits';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'orders', label: '주문 관리', icon: 'package_2' },
  { id: 'credits', label: '크레딧', icon: 'account_balance_wallet' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  return (
    <>
      <TopNavBar />
      <main className="min-h-screen bg-surface pt-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="font-jua text-3xl text-on-surface mb-6">운영 대시보드</h1>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-outline-variant/30 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — unmounts on tab switch, auto-cleans polling */}
          <div>
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'credits' && <CreditsTab />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

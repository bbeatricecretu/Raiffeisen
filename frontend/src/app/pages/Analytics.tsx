import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, ReceiptText, Wallet, Target } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n';
import { getHideSmallAmountsPreference, shouldHideAmount } from '../services/userPreferences';

type Tx = {
  id: string;
  amount: number;
  category?: string;
  merchant_name?: string;
};

type CanonicalCategory =
  | 'groceries'
  | 'food'
  | 'fuel'
  | 'shopping'
  | 'subscriptions'
  | 'transport'
  | 'health'
  | 'utilities'
  | 'entertainment'
  | 'exchange'
  | 'other';

const CATEGORY_ALIASES: Record<string, CanonicalCategory> = {
  groceries: 'groceries',
  alimente: 'groceries',
  food: 'food',
  mancare: 'food',
  fuel: 'fuel',
  shopping: 'shopping',
  retail: 'shopping',
  subscriptions: 'subscriptions',
  transport: 'transport',
  health: 'health',
  utilities: 'utilities',
  entertainment: 'entertainment',
  schimb: 'exchange',
  exchange: 'exchange',
  other: 'other',
};

const CATEGORY_LABELS: Record<'en' | 'ro', Record<CanonicalCategory, string>> = {
  en: {
    groceries: 'Groceries',
    food: 'Food',
    fuel: 'Fuel',
    shopping: 'Shopping',
    subscriptions: 'Subscriptions',
    transport: 'Transport',
    health: 'Health',
    utilities: 'Utilities',
    entertainment: 'Entertainment',
    exchange: 'Exchange',
    other: 'Other',
  },
  ro: {
    groceries: 'Alimente',
    food: 'Mancare',
    fuel: 'Combustibil',
    shopping: 'Cumparaturi',
    subscriptions: 'Abonamente',
    transport: 'Transport',
    health: 'Sanatate',
    utilities: 'Utilitati',
    entertainment: 'Divertisment',
    exchange: 'Schimb',
    other: 'Altele',
  },
};

function normalizeCategory(value?: string): CanonicalCategory {
  if (!value) return 'other';
  const key = value.trim().toLowerCase();
  return CATEGORY_ALIASES[key] || 'other';
}

export function Analytics() {
  const { t, language } = useI18n();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [hideSmallAmounts, setHideSmallAmounts] = useState<boolean>(() => getHideSmallAmountsPreference());

  useEffect(() => {
    const load = async () => {
      const userId = localStorage.getItem('userId') || 'me';
      try {
        const result = await api.getTransactions(userId, 300);
        setTransactions(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Failed to load analytics data', error);
        setTransactions([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const syncPreference = () => setHideSmallAmounts(getHideSmallAmountsPreference());
    window.addEventListener('settings-changed', syncPreference);
    window.addEventListener('storage', syncPreference);
    return () => {
      window.removeEventListener('settings-changed', syncPreference);
      window.removeEventListener('storage', syncPreference);
    };
  }, []);

  const visibleTransactions = useMemo(
    () => transactions.filter((tx) => !shouldHideAmount(Number(tx.amount) || 0, hideSmallAmounts)),
    [transactions, hideSmallAmounts]
  );

  const stats = useMemo(() => {
    const total = visibleTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const count = visibleTransactions.length;
    const avg = count > 0 ? total / count : 0;

    const byCategory = new Map<CanonicalCategory, number>();
    visibleTransactions.forEach((tx) => {
      const key = normalizeCategory(tx.category);
      byCategory.set(key, (byCategory.get(key) || 0) + (tx.amount || 0));
    });

    const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    const savingsTarget = 2500;
    const progress = Math.min(100, Math.round((total / savingsTarget) * 100));

    return {
      total,
      count,
      avg,
      topCategoryName: topCategory ? CATEGORY_LABELS[language][topCategory[0]] : 'N/A',
      topCategoryAmount: topCategory?.[1] || 0,
      progress,
      categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [visibleTransactions, language]);

  const cardClass = 'bg-white rounded-2xl border border-border p-5';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
          <TrendingUp size={24} className="text-[#1B2B4B]" />
        </div>
        <div>
          <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>{t('analytics.title')}</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('analytics.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Wallet size={15} /> {t('analytics.totalSpend')}</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '24px' }}>{stats.total.toFixed(2)} RON</div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><ReceiptText size={15} /> {t('analytics.transactions')}</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '24px' }}>{stats.count}</div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp size={15} /> {t('analytics.average')}</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '24px' }}>{stats.avg.toFixed(2)} RON</div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Target size={15} /> {t('analytics.topCategory')}</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>{stats.topCategoryName}</div>
          <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{stats.topCategoryAmount.toFixed(2)} RON</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-semibold text-[#1B2B4B] mb-3" style={{ fontSize: '15px' }}>{t('analytics.savingsProgress')}</div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${stats.progress}%`, background: '#FFD100' }} />
          </div>
          <div className="mt-2 text-muted-foreground" style={{ fontSize: '13px' }}>
            {stats.progress}% {t('analytics.savingsDescription')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-semibold text-[#1B2B4B] mb-3" style={{ fontSize: '15px' }}>{t('analytics.breakdown')}</div>
          <div className="space-y-2">
            {stats.categories.length === 0 ? (
              <div className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('analytics.noData')}</div>
            ) : (
              stats.categories.map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                  <span className="text-[#1B2B4B] font-medium" style={{ fontSize: '13px' }}>{CATEGORY_LABELS[language][name]}</span>
                  <span className="text-muted-foreground" style={{ fontSize: '13px' }}>{amount.toFixed(2)} RON</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

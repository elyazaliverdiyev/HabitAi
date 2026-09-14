// ===== VAULT v2 — Extended Financial Ledger Types =====

// === CATEGORIES ===
export type VaultAssetCategory =
    | 'crypto' | 'stocks' | 'farming' | 'staking'
    | 'airdrop' | 'freelance' | 'referral' | 'mining'
    | 'rental' | 'business' | 'salary' | 'cashback'
    | 'real_estate' | 'vehicles' | 'valuables' | 'cash'
    | 'other';

// === TRANSACTION TYPES ===
export type VaultTransactionType =
    | 'deposit' | 'withdraw' | 'swap' | 'harvest' | 'claim'
    | 'reward' | 'dividend' | 'income' | 'fee' | 'expense' | 'transfer';

// === INVESTMENT (ex-EXPENSE) SUBCATEGORIES ===
export type VaultInvestmentCategory =
    | 'joy' | 'self' | 'family' | 'business' | 'comfort' | 'health' | 'other';

// === CORE INTERFACES ===

export interface VaultAsset {
    id: string;
    name: string;
    ticker?: string;
    category: VaultAssetCategory;
    amount: number;
    buyPrice: number;        // price per unit when bought
    currentPrice: number;    // auto-updated for crypto, manual for others
    currency: string;        // USD, EUR, etc
    coingeckoId?: string;    // for auto-price fetch
    note?: string;
    tags?: string[];         // custom tags for filtering
    createdAt: string;
    updatedAt: string;
}

export interface VaultYieldPosition {
    id: string;
    protocol: string;        // e.g. "Aave", "Uniswap", "Farm X"
    pool: string;            // e.g. "ETH/USDT", "Staking SOL"
    invested: number;
    apy: number;             // percentage
    accumulated: number;     // total rewards earned so far
    currency: string;
    isActive: boolean;
    harvestHistory?: VaultHarvest[];  // log of harvests
    note?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface VaultHarvest {
    date: string;            // ISO date
    amount: number;
    note?: string;
}

export interface VaultTransaction {
    id: string;
    type: VaultTransactionType;
    amount: number;
    currency: string;
    category?: string;       // custom category tag
    description: string;
    date: string;            // YYYY-MM-DD
    assetId?: string;        // link to VaultAsset if relevant
    tags?: string[];
    createdAt: string;
}

// === SNAPSHOTS ===
export interface VaultSnapshot {
    id: string;
    date: string;            // ISO date
    label?: string;          // user-defined label (e.g. "End of January")
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalYieldEarned: number;
    assetSummary: VaultSnapshotAsset[];
    yieldSummary: VaultSnapshotYield[];
    createdAt: string;
}

export interface VaultSnapshotAsset {
    name: string;
    ticker?: string;
    category: VaultAssetCategory;
    amount: number;
    price: number;
    value: number;
    pnl: number;
}

export interface VaultSnapshotYield {
    protocol: string;
    pool: string;
    invested: number;
    apy: number;
    accumulated: number;
}

// === MAIN DATA ===
export interface VaultData {
    assets: VaultAsset[];
    yields: VaultYieldPosition[];
    transactions: VaultTransaction[];
    snapshots: VaultSnapshot[];
    lastPriceUpdate?: string; // ISO date of last CoinGecko sync
}

export const EMPTY_VAULT: VaultData = {
    assets: [],
    yields: [],
    transactions: [],
    snapshots: [],
};

// === CATEGORY CONFIG ===
export const VAULT_CATEGORY_CONFIG: Record<VaultAssetCategory, { label: { ru: string; en: string }; emoji: string; color: string }> = {
    crypto: { label: { ru: 'Крипто', en: 'Crypto' }, emoji: '₿', color: '#f7931a' },
    stocks: { label: { ru: 'Акции', en: 'Stocks' }, emoji: '📈', color: '#22c55e' },
    farming: { label: { ru: 'Фарминг', en: 'Farming' }, emoji: '🌾', color: '#eab308' },
    staking: { label: { ru: 'Стейкинг', en: 'Staking' }, emoji: '⛏️', color: '#8b5cf6' },
    airdrop: { label: { ru: 'Аирдроп', en: 'Airdrop' }, emoji: '🪂', color: '#06b6d4' },
    freelance: { label: { ru: 'Фриланс', en: 'Freelance' }, emoji: '💻', color: '#3b82f6' },
    referral: { label: { ru: 'Рефералы', en: 'Referrals' }, emoji: '🤝', color: '#10b981' },
    mining: { label: { ru: 'Майнинг', en: 'Mining' }, emoji: '⚡', color: '#f59e0b' },
    rental: { label: { ru: 'Аренда', en: 'Rental' }, emoji: '🏠', color: '#14b8a6' },
    business: { label: { ru: 'Бизнес', en: 'Business' }, emoji: '💼', color: '#ec4899' },
    salary: { label: { ru: 'Зарплата', en: 'Salary' }, emoji: '💵', color: '#84cc16' },
    cashback: { label: { ru: 'Кэшбек', en: 'Cashback' }, emoji: '🔙', color: '#a855f7' },
    real_estate: { label: { ru: 'Недвижимость', en: 'Real Estate' }, emoji: '🏠', color: '#10b981' },
    vehicles: { label: { ru: 'Транспорт', en: 'Vehicles' }, emoji: '🚗', color: '#3b82f6' },
    valuables: { label: { ru: 'Ценности', en: 'Valuables' }, emoji: '💎', color: '#f59e0b' },
    cash: { label: { ru: 'Наличные/Счёта', en: 'Cash/Bank' }, emoji: '🏦', color: '#6366f1' },
    other: { label: { ru: 'Другое', en: 'Other' }, emoji: '💰', color: '#94a3b8' },
};

// === TRANSACTION TYPE CONFIG (Позитивный рефрейминг!) ===
// Доходы → Урожай, Расходы → Инвестиции, Убытки → Опыт роста
export const VAULT_TX_TYPES: Record<VaultTransactionType, { label: { ru: string; en: string }; emoji: string; color: string; direction: 'in' | 'out' | 'neutral' }> = {
    deposit: { label: { ru: 'Пополнение', en: 'Deposit' }, emoji: '📥', color: '#22c55e', direction: 'in' },
    withdraw: { label: { ru: 'Перенаправление', en: 'Redirect' }, emoji: '📤', color: '#f59e0b', direction: 'out' },
    swap: { label: { ru: 'Обмен', en: 'Swap' }, emoji: '🔄', color: '#3b82f6', direction: 'neutral' },
    harvest: { label: { ru: 'Урожай', en: 'Harvest' }, emoji: '🌾', color: '#eab308', direction: 'in' },
    claim: { label: { ru: 'Сбор', en: 'Claim' }, emoji: '🪂', color: '#06b6d4', direction: 'in' },
    reward: { label: { ru: 'Награда', en: 'Reward' }, emoji: '🎁', color: '#f59e0b', direction: 'in' },
    dividend: { label: { ru: 'Дивиденд', en: 'Dividend' }, emoji: '💎', color: '#8b5cf6', direction: 'in' },
    income: { label: { ru: 'Урожай', en: 'Harvest' }, emoji: '🌱', color: '#84cc16', direction: 'in' },
    fee: { label: { ru: 'Вклад в систему', en: 'System Fee' }, emoji: '⛽', color: '#f97316', direction: 'out' },
    expense: { label: { ru: 'Инвестиция', en: 'Investment' }, emoji: '💫', color: '#a855f7', direction: 'out' },
    transfer: { label: { ru: 'Перемещение', en: 'Transfer' }, emoji: '↔️', color: '#64748b', direction: 'neutral' },
};

// === INVESTMENT SUBCATEGORY CONFIG ===
export const VAULT_INVESTMENT_CATEGORIES: Record<VaultInvestmentCategory, { label: { ru: string; en: string }; emoji: string }> = {
    joy: { label: { ru: 'Инвестиция в радость', en: 'Investment in Joy' }, emoji: '🎉' },
    self: { label: { ru: 'Инвестиция в себя', en: 'Investment in Self' }, emoji: '🧠' },
    family: { label: { ru: 'Инвестиция в родных', en: 'Investment in Family' }, emoji: '❤️' },
    business: { label: { ru: 'Инвестиция в бизнес', en: 'Investment in Business' }, emoji: '💼' },
    comfort: { label: { ru: 'Инвестиция в комфорт', en: 'Investment in Comfort' }, emoji: '🏠' },
    health: { label: { ru: 'Инвестиция в здоровье', en: 'Investment in Health' }, emoji: '🍎' },
    other: { label: { ru: 'Другая инвестиция', en: 'Other Investment' }, emoji: '✨' },
};

// === HELPERS ===
export const isOutgoingTx = (type: VaultTransactionType): boolean =>
    VAULT_TX_TYPES[type]?.direction === 'out';

export const isIncomingTx = (type: VaultTransactionType): boolean =>
    VAULT_TX_TYPES[type]?.direction === 'in';

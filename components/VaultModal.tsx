import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    X, Plus, Trash2, Edit3, TrendingUp, TrendingDown, Wallet, PieChart,
    ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight, Copy, RefreshCw, Download,
    Landmark, Layers, BarChart3, Clock, DollarSign, Shield, Search, Camera, Eye
} from 'lucide-react';
import Modal from './Modal';
import { triggerHaptic } from '../utils/helpers';
import {
    VaultData, VaultAsset, VaultYieldPosition, VaultTransaction, VaultSnapshot,
    VAULT_CATEGORY_CONFIG, VAULT_TX_TYPES, VAULT_INVESTMENT_CATEGORIES, isOutgoingTx,
    VaultAssetCategory, VaultTransactionType, VaultInvestmentCategory, EMPTY_VAULT
} from '../types/vault';
import { analyzeVaultPortfolio } from '../services/ai';
import {
    fetchCryptoPrices, searchCryptoAsset, exportToCSV,
    CoinGeckoSearchResult, POPULAR_COINS
} from '../services/vaultPriceService';

interface VaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    vaultData: VaultData;
    onUpdateVault: (data: VaultData) => void;
    language?: 'ru' | 'en';
    currency?: string;
}

type VaultTab = 'dashboard' | 'assets' | 'yields' | 'transactions' | 'analytics' | 'snapshots';

const getLocalDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const VaultModal: React.FC<VaultModalProps> = ({
    isOpen, onClose, vaultData, onUpdateVault, language = 'ru', currency = 'USD'
}) => {
    const [activeTab, setActiveTab] = useState<VaultTab>('dashboard');
    const [editingAsset, setEditingAsset] = useState<VaultAsset | null>(null);
    const [editingYield, setEditingYield] = useState<VaultYieldPosition | null>(null);
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [showAddYield, setShowAddYield] = useState(false);
    const [showAddTx, setShowAddTx] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Crypto search
    const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
    const [cryptoSearchResults, setCryptoSearchResults] = useState<CoinGeckoSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Snapshot comparison
    const [compareSnapshots, setCompareSnapshots] = useState<[string, string] | null>(null);

    // ---- Form states ----
    const [assetForm, setAssetForm] = useState({
        name: '', ticker: '', category: 'crypto' as VaultAssetCategory,
        amount: '', buyPrice: '', currentPrice: '', note: '', coingeckoId: ''
    });
    const [yieldForm, setYieldForm] = useState({
        protocol: '', pool: '', invested: '', apy: '', accumulated: '', note: ''
    });
    const [txForm, setTxForm] = useState({
        type: 'deposit' as VaultTransactionType,
        amount: '', description: '', category: '', date: getLocalDateString(new Date())
    });

    // ---- Computed ----
    const stats = useMemo(() => {
        const totalValue = vaultData.assets.reduce((s, a) => s + a.amount * a.currentPrice, 0);
        const totalInvested = vaultData.assets.reduce((s, a) => s + a.amount * a.buyPrice, 0);
        const pnl = totalValue - totalInvested;
        const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

        const yieldInvested = vaultData.yields.reduce((s, y) => s + y.invested, 0);
        const yieldEarned = vaultData.yields.reduce((s, y) => s + y.accumulated, 0);
        const activeYields = vaultData.yields.filter(y => y.isActive).length;
        const avgAPY = vaultData.yields.length > 0
            ? vaultData.yields.reduce((s, y) => s + y.apy, 0) / vaultData.yields.length : 0;

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        vaultData.assets.forEach(a => {
            const val = a.amount * a.currentPrice;
            categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + val;
        });

        // Recent transactions
        const recentTx = [...vaultData.transactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 10);

        return {
            totalValue, totalInvested, pnl, pnlPercent,
            yieldInvested, yieldEarned, activeYields, avgAPY,
            categoryBreakdown, recentTx
        };
    }, [vaultData]);

    // ---- Helpers ----
    const genId = () => `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
    const fmtFull = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ---- CRUD ----
    const addAsset = () => {
        if (!assetForm.name || !assetForm.amount) return;
        const now = new Date().toISOString();
        const newAsset: VaultAsset = {
            id: genId(), name: assetForm.name, ticker: assetForm.ticker,
            category: assetForm.category, amount: parseFloat(assetForm.amount) || 0,
            buyPrice: parseFloat(assetForm.buyPrice) || 0,
            currentPrice: parseFloat(assetForm.currentPrice) || 0,
            currency, note: assetForm.note,
            coingeckoId: assetForm.coingeckoId || undefined,
            createdAt: now, updatedAt: now
        };
        onUpdateVault({ ...vaultData, assets: [...vaultData.assets, newAsset] });
        setShowAddAsset(false);
        setAssetForm({ name: '', ticker: '', category: 'crypto', amount: '', buyPrice: '', currentPrice: '', note: '', coingeckoId: '' });
        triggerHaptic();
    };

    const updateAsset = () => {
        if (!editingAsset) return;
        const now = new Date().toISOString();
        const updated: VaultAsset = {
            ...editingAsset,
            name: assetForm.name || editingAsset.name,
            ticker: assetForm.ticker,
            category: assetForm.category,
            amount: parseFloat(assetForm.amount) || editingAsset.amount,
            buyPrice: parseFloat(assetForm.buyPrice) || editingAsset.buyPrice,
            currentPrice: parseFloat(assetForm.currentPrice) || editingAsset.currentPrice,
            note: assetForm.note,
            coingeckoId: assetForm.coingeckoId || editingAsset.coingeckoId,
            updatedAt: now
        };
        onUpdateVault({
            ...vaultData,
            assets: vaultData.assets.map(a => a.id === updated.id ? updated : a)
        });
        setEditingAsset(null);
        triggerHaptic();
    };

    const deleteAsset = (id: string) => {
        onUpdateVault({ ...vaultData, assets: vaultData.assets.filter(a => a.id !== id) });
        triggerHaptic();
    };

    const addYield = () => {
        if (!yieldForm.protocol) return;
        const now = new Date().toISOString();
        const newY: VaultYieldPosition = {
            id: genId(), protocol: yieldForm.protocol, pool: yieldForm.pool,
            invested: parseFloat(yieldForm.invested) || 0,
            apy: parseFloat(yieldForm.apy) || 0,
            accumulated: parseFloat(yieldForm.accumulated) || 0,
            currency, isActive: true, note: yieldForm.note, createdAt: now, updatedAt: now
        };
        onUpdateVault({ ...vaultData, yields: [...vaultData.yields, newY] });
        setShowAddYield(false);
        setYieldForm({ protocol: '', pool: '', invested: '', apy: '', accumulated: '', note: '' });
        triggerHaptic();
    };

    const deleteYield = (id: string) => {
        onUpdateVault({ ...vaultData, yields: vaultData.yields.filter(y => y.id !== id) });
        triggerHaptic();
    };

    const addTransaction = () => {
        if (!txForm.amount) return;
        const newTx: VaultTransaction = {
            id: genId(), type: txForm.type,
            amount: parseFloat(txForm.amount) || 0,
            currency, category: txForm.category,
            description: txForm.description, date: txForm.date,
            createdAt: new Date().toISOString()
        };
        onUpdateVault({ ...vaultData, transactions: [...vaultData.transactions, newTx] });
        setShowAddTx(false);
        setTxForm({ type: 'deposit', amount: '', description: '', category: '', date: getLocalDateString(new Date()) });
        triggerHaptic();
    };

    const deleteTx = (id: string) => {
        onUpdateVault({ ...vaultData, transactions: vaultData.transactions.filter(t => t.id !== id) });
        triggerHaptic();
    };

    // ---- Price Update (CoinGecko) ----
    const updateCryptoPrices = async () => {
        const cryptoAssets = vaultData.assets.filter(a => a.coingeckoId);
        if (cryptoAssets.length === 0) return;
        setIsUpdatingPrices(true);
        try {
            const ids = cryptoAssets.map(a => a.coingeckoId!).filter(Boolean);
            const prices = await fetchCryptoPrices(ids, currency.toLowerCase());
            const now = new Date().toISOString();
            const updatedAssets = vaultData.assets.map(a => {
                if (a.coingeckoId && prices[a.coingeckoId] != null) {
                    return { ...a, currentPrice: prices[a.coingeckoId], updatedAt: now };
                }
                return a;
            });
            onUpdateVault({ ...vaultData, assets: updatedAssets, lastPriceUpdate: now });
        } catch (e) { console.error('Price update error:', e); }
        setIsUpdatingPrices(false);
    };

    // ---- Snapshots ----
    const createSnapshot = () => {
        const now = new Date().toISOString();
        const snapshot: VaultSnapshot = {
            id: genId(),
            date: now,
            totalValue: stats.totalValue,
            totalInvested: stats.totalInvested,
            totalPnL: stats.pnl,
            totalYieldEarned: stats.yieldEarned,
            assetSummary: vaultData.assets.map(a => ({
                name: a.name, ticker: a.ticker, category: a.category,
                amount: a.amount, price: a.currentPrice,
                value: a.amount * a.currentPrice,
                pnl: (a.currentPrice - a.buyPrice) * a.amount
            })),
            yieldSummary: vaultData.yields.map(y => ({
                protocol: y.protocol, pool: y.pool,
                invested: y.invested, apy: y.apy, accumulated: y.accumulated
            })),
            createdAt: now
        };
        const snapshots = [...(vaultData.snapshots || []), snapshot];
        onUpdateVault({ ...vaultData, snapshots });
        triggerHaptic();
    };

    const deleteSnapshot = (id: string) => {
        onUpdateVault({ ...vaultData, snapshots: (vaultData.snapshots || []).filter(s => s.id !== id) });
    };

    // ---- Crypto Search (debounced) ----
    useEffect(() => {
        if (cryptoSearchQuery.length < 2) { setCryptoSearchResults([]); return; }
        setIsSearching(true);
        const t = setTimeout(async () => {
            const results = await searchCryptoAsset(cryptoSearchQuery);
            setCryptoSearchResults(results);
            setIsSearching(false);
        }, 400);
        return () => clearTimeout(t);
    }, [cryptoSearchQuery]);

    const selectCryptoFromSearch = (coin: CoinGeckoSearchResult) => {
        setAssetForm(f => ({
            ...f, name: coin.name, ticker: coin.symbol.toUpperCase(),
            coingeckoId: coin.id, category: 'crypto'
        }));
        setCryptoSearchQuery('');
        setCryptoSearchResults([]);
    };

    // ---- CSV Exports ----
    const exportAssets = () => exportToCSV(
        ['Name', 'Ticker', 'Category', 'Amount', 'Buy Price', 'Current Price', 'Value', 'PnL', 'Note'],
        vaultData.assets.map(a => [
            a.name, a.ticker || '', a.category, a.amount, a.buyPrice, a.currentPrice,
            (a.amount * a.currentPrice).toFixed(2),
            ((a.currentPrice - a.buyPrice) * a.amount).toFixed(2),
            a.note || ''
        ]), 'vault_assets'
    );
    const exportTransactions = () => exportToCSV(
        ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Category'],
        vaultData.transactions.map(t => [
            t.date, t.type, t.amount, t.currency, t.description, t.category || ''
        ]), 'vault_transactions'
    );
    const exportYields = () => exportToCSV(
        ['Protocol', 'Pool', 'Invested', 'APY%', 'Accumulated', 'Active'],
        vaultData.yields.map(y => [
            y.protocol, y.pool, y.invested, y.apy, y.accumulated, y.isActive ? 'Yes' : 'No'
        ]), 'vault_yields'
    );

    // ---- AI ----
    const handleAIAnalysis = async () => {
        if (vaultData.assets.length === 0 && vaultData.yields.length === 0) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeVaultPortfolio({
                assets: vaultData.assets.map(a => ({
                    name: a.name, category: a.category, amount: a.amount,
                    buyPrice: a.buyPrice, currentPrice: a.currentPrice, currency: a.currency
                })),
                yields: vaultData.yields.map(y => ({
                    protocol: y.protocol, pool: y.pool, invested: y.invested,
                    apy: y.apy, accumulated: y.accumulated, currency: y.currency, isActive: y.isActive
                })),
                transactions: vaultData.transactions.map(t => ({
                    type: t.type, amount: t.amount, currency: t.currency,
                    description: t.description, date: t.date
                }))
            }, language as 'ru' | 'en');
            setAiInsight(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ---- Tab config ----
    const tabs: { id: VaultTab; label: { ru: string; en: string }; icon: any }[] = [
        { id: 'dashboard', label: { ru: '📊 Обзор', en: '📊 Overview' }, icon: BarChart3 },
        { id: 'assets', label: { ru: '💰 Активы', en: '💰 Assets' }, icon: Wallet },
        { id: 'yields', label: { ru: '🌾 Урожай', en: '🌾 Yields' }, icon: Layers },
        { id: 'transactions', label: { ru: '📋 Журнал', en: '📋 Journal' }, icon: Clock },
        { id: 'analytics', label: { ru: '📈 Аналитика', en: '📈 Analytics' }, icon: PieChart },
        { id: 'snapshots', label: { ru: '📸 Снапшоты', en: '📸 Snapshots' }, icon: Camera },
    ];

    // ---- Asset form modal ----
    const renderAssetForm = (isEdit: boolean) => (
        <Modal isOpen={showAddAsset || !!editingAsset} onClose={() => { setShowAddAsset(false); setEditingAsset(null); }}
            title={isEdit
                ? (language === 'ru' ? 'Редактировать актив' : 'Edit Asset')
                : (language === 'ru' ? 'Новый актив' : 'New Asset')
            }>
            <div className="space-y-3 p-1">
                {/* CoinGecko Crypto Search */}
                <div className="relative">
                    <div className="flex items-center gap-2 px-4 py-3 bg-surfaceHighlight rounded-xl border border-borderSubtle focus-within:border-brand">
                        <Search size={14} className="text-textSecondary" />
                        <input value={cryptoSearchQuery}
                            onChange={e => setCryptoSearchQuery(e.target.value)}
                            placeholder={language === 'ru' ? '🔍 Найти крипто (авто-цены)...' : '🔍 Search crypto (auto-prices)...'}
                            className="flex-1 bg-transparent text-textPrimary text-sm outline-none" />
                        {isSearching && <RefreshCw size={14} className="text-textSecondary animate-spin" />}
                    </div>
                    {cryptoSearchResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-borderSubtle rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {cryptoSearchResults.map(c => (
                                <button key={c.id} onClick={() => selectCryptoFromSearch(c)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surfaceHighlight text-left transition-colors">
                                    {c.thumb && <img src={c.thumb} alt="" className="w-5 h-5 rounded-full" />}
                                    <span className="text-sm text-textPrimary font-medium">{c.name}</span>
                                    <span className="text-xs text-textSecondary uppercase">{c.symbol}</span>
                                    {c.market_cap_rank && <span className="text-[10px] text-textSecondary ml-auto">#{c.market_cap_rank}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Quick popular coins */}
                {!assetForm.coingeckoId && !cryptoSearchQuery && (
                    <div className="flex flex-wrap gap-1.5">
                        {POPULAR_COINS.slice(0, 8).map(c => (
                            <button key={c.id} onClick={() => selectCryptoFromSearch({ id: c.id, name: c.name, symbol: c.symbol, thumb: '', market_cap_rank: null })}
                                className="px-2.5 py-1 text-[11px] bg-surfaceHighlight rounded-lg text-textSecondary hover:bg-brand/20 hover:text-brand transition-colors">
                                {c.symbol}
                            </button>
                        ))}
                    </div>
                )}
                {assetForm.coingeckoId && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 px-1">
                        <RefreshCw size={10} /> {language === 'ru' ? 'Авто-обновление цен включено' : 'Auto price updates enabled'} ({assetForm.coingeckoId})
                    </div>
                )}
                <input value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder={language === 'ru' ? 'Название (Bitcoin, Tesla...)' : 'Name (Bitcoin, Tesla...)'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                <div className="grid grid-cols-2 gap-3">
                    <input value={assetForm.ticker} onChange={e => setAssetForm({ ...assetForm, ticker: e.target.value })}
                        placeholder="Ticker (BTC, TSLA)"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <select value={assetForm.category} onChange={e => setAssetForm({ ...assetForm, category: e.target.value as VaultAssetCategory })}
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none">
                        {Object.entries(VAULT_CATEGORY_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.emoji} {v.label[language]}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <input value={assetForm.amount} onChange={e => setAssetForm({ ...assetForm, amount: e.target.value })}
                        placeholder={language === 'ru' ? 'Кол-во' : 'Amount'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <input value={assetForm.buyPrice} onChange={e => setAssetForm({ ...assetForm, buyPrice: e.target.value })}
                        placeholder={language === 'ru' ? 'Цена покупки' : 'Buy Price'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <input value={assetForm.currentPrice} onChange={e => setAssetForm({ ...assetForm, currentPrice: e.target.value })}
                        placeholder={language === 'ru' ? 'Текущая' : 'Current'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                </div>
                <input value={assetForm.note} onChange={e => setAssetForm({ ...assetForm, note: e.target.value })}
                    placeholder={language === 'ru' ? 'Заметка (опционально)' : 'Note (optional)'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                <button onClick={isEdit ? updateAsset : addAsset}
                    className="w-full py-3.5 bg-brand text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-brand/20">
                    {isEdit ? (language === 'ru' ? 'Сохранить' : 'Save') : (language === 'ru' ? 'Добавить' : 'Add')}
                </button>
            </div>
        </Modal>
    );

    // ---- Yield form modal ----
    const renderYieldForm = () => (
        <Modal isOpen={showAddYield} onClose={() => setShowAddYield(false)}
            title={language === 'ru' ? 'Новая yield позиция' : 'New Yield Position'}>
            <div className="space-y-3 p-1">
                <input value={yieldForm.protocol} onChange={e => setYieldForm({ ...yieldForm, protocol: e.target.value })}
                    placeholder={language === 'ru' ? 'Протокол (Aave, Uniswap...)' : 'Protocol (Aave, Uniswap...)'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                <input value={yieldForm.pool} onChange={e => setYieldForm({ ...yieldForm, pool: e.target.value })}
                    placeholder={language === 'ru' ? 'Пул (ETH/USDT, SOL Staking...)' : 'Pool (ETH/USDT, SOL Staking...)'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                <div className="grid grid-cols-3 gap-3">
                    <input value={yieldForm.invested} onChange={e => setYieldForm({ ...yieldForm, invested: e.target.value })}
                        placeholder={language === 'ru' ? 'Вложено $' : 'Invested $'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <input value={yieldForm.apy} onChange={e => setYieldForm({ ...yieldForm, apy: e.target.value })}
                        placeholder="APY %" type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <input value={yieldForm.accumulated} onChange={e => setYieldForm({ ...yieldForm, accumulated: e.target.value })}
                        placeholder={language === 'ru' ? 'Накоплено $' : 'Earned $'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                </div>
                <input value={yieldForm.note} onChange={e => setYieldForm({ ...yieldForm, note: e.target.value })}
                    placeholder={language === 'ru' ? 'Заметка' : 'Note'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                <button onClick={addYield}
                    className="w-full py-3.5 bg-brand text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-brand/20">
                    {language === 'ru' ? 'Добавить' : 'Add'}
                </button>
            </div>
        </Modal>
    );

    // ---- Transaction form modal ----
    const renderTxForm = () => (
        <Modal isOpen={showAddTx} onClose={() => setShowAddTx(false)}
            title={language === 'ru' ? 'Новая транзакция' : 'New Transaction'}>
            <div className="space-y-3 p-1">
                <div className="flex flex-wrap gap-2">
                    {Object.entries(VAULT_TX_TYPES).map(([k, v]) => (
                        <button key={k} onClick={() => setTxForm({ ...txForm, type: k as VaultTransactionType })}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${txForm.type === k ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}>
                            {v.emoji} {v.label[language]}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                        placeholder={language === 'ru' ? 'Сумма $' : 'Amount $'} type="number" step="any"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                    <input value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                        type="date"
                        className="px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                </div>
                <input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                    placeholder={language === 'ru' ? 'Описание (Подписка Spotify для любимой...)' : 'Description (Spotify for partner...)'}
                    className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                {/* Investment subcategory picker — only when expense/investment */}
                {txForm.type === 'expense' && (
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wider px-1">
                            {language === 'ru' ? 'Тип инвестиции ✨' : 'Investment Type ✨'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(VAULT_INVESTMENT_CATEGORIES).map(([k, v]) => (
                                <button key={k} onClick={() => setTxForm({ ...txForm, category: k })}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${txForm.category === k ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}>
                                    {v.emoji} {v.label[language]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {txForm.type !== 'expense' && (
                    <input value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                        placeholder={language === 'ru' ? 'Тег (опционально)' : 'Tag (optional)'}
                        className="w-full px-4 py-3 bg-surfaceHighlight rounded-xl text-textPrimary text-sm border border-borderSubtle focus:border-brand outline-none" />
                )}
                <button onClick={addTransaction}
                    className="w-full py-3.5 bg-brand text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-brand/20">
                    {language === 'ru' ? 'Добавить' : 'Add'}
                </button>
            </div>
        </Modal>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-textPrimary tracking-tight">
                            {language === 'ru' ? 'Vault' : 'Vault'}
                        </h1>
                        <p className="text-[10px] text-textSecondary font-medium -mt-0.5">
                            {language === 'ru' ? 'Приватный финансовый леджер' : 'Private Financial Ledger'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleAIAnalysis} disabled={isAnalyzing || (vaultData.assets.length === 0 && vaultData.yields.length === 0)}
                        className="gemini-glow-sm px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold text-textPrimary hover:scale-105 transition-all disabled:opacity-40 bg-surface border border-borderSubtle">
                        {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        ) : (
                            <Sparkles size={14} className="text-brand" />
                        )}
                        AI
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-surfaceHighlight/50 text-textSecondary hover:text-textPrimary transition-all">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="shrink-0 px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-brand text-white shadow-sm shadow-brand/20'
                            : 'bg-surfaceHighlight/50 text-textSecondary hover:text-textPrimary'
                            }`}>
                        {tab.label[language]}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 custom-scrollbar">

                {/* ====== DASHBOARD ====== */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Total Value Card */}
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                    {language === 'ru' ? 'Общий портфель' : 'Total Portfolio'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={updateCryptoPrices} disabled={isUpdatingPrices}
                                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-40">
                                        <RefreshCw size={10} className={isUpdatingPrices ? 'animate-spin' : ''} />
                                        {language === 'ru' ? 'Цены' : 'Prices'}
                                    </button>
                                    <button onClick={createSnapshot}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 transition-all">
                                        <Camera size={10} /> 📸
                                    </button>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-textPrimary">{fmtFull(stats.totalValue)}</div>
                            <div className="flex items-center gap-2 mt-1">
                                {stats.pnl >= 0 ? (
                                    <ArrowUpRight size={14} className="text-emerald-500" />
                                ) : (
                                    <ArrowDownRight size={14} className="text-red-500" />
                                )}
                                <span className={`text-sm font-bold ${stats.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stats.pnl >= 0 ? '+' : ''}{fmtFull(stats.pnl)} ({stats.pnlPercent >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(1)}%)
                                </span>
                            </div>
                            {vaultData.lastPriceUpdate && (
                                <div className="text-[9px] text-textSecondary mt-1">
                                    {language === 'ru' ? 'Обновлено:' : 'Updated:'} {new Date(vaultData.lastPriceUpdate).toLocaleTimeString()}
                                </div>
                            )}
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Wallet size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-bold text-textSecondary uppercase">{language === 'ru' ? 'Активы' : 'Assets'}</span>
                                </div>
                                <div className="text-xl font-black text-textPrimary">{vaultData.assets.length}</div>
                                <div className="text-[10px] text-textSecondary">{language === 'ru' ? 'Вложено' : 'Invested'}: {fmt(stats.totalInvested)}</div>
                            </div>
                            <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Layers size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-textSecondary uppercase">{language === 'ru' ? 'Yield' : 'Yield'}</span>
                                </div>
                                <div className="text-xl font-black text-textPrimary">{stats.activeYields}</div>
                                <div className="text-[10px] text-textSecondary">{language === 'ru' ? 'Заработано' : 'Earned'}: {fmt(stats.yieldEarned)}</div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        {Object.keys(stats.categoryBreakdown).length > 0 && (
                            <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <PieChart size={14} className="text-purple-500" />
                                    <span className="text-xs font-bold text-textPrimary uppercase tracking-wide">
                                        {language === 'ru' ? 'Распределение' : 'Distribution'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(stats.categoryBreakdown)
                                        .sort((a, b) => Number(b[1]) - Number(a[1]))
                                        .map(([cat, val]: [string, number]) => {
                                            const config = VAULT_CATEGORY_CONFIG[cat as VaultAssetCategory];
                                            const percent = stats.totalValue > 0 ? (val / stats.totalValue) * 100 : 0;
                                            return (
                                                <div key={cat} className="flex items-center gap-3">
                                                    <span className="text-sm w-6">{config?.emoji || '💰'}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-xs font-medium text-textPrimary">
                                                                {config?.label[language] || cat}
                                                            </span>
                                                            <span className="text-xs font-bold text-textSecondary">
                                                                {fmt(val)} ({percent.toFixed(0)}%)
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: config?.color || '#94a3b8' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* AI Insight */}
                        {aiInsight && (
                            <div className="bg-surface border border-brand/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-brand" />
                                        <span className="text-xs font-bold text-brand uppercase tracking-wide">AI Analyst</span>
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(aiInsight); triggerHaptic(); }}
                                        className="p-1.5 rounded-lg bg-surfaceHighlight/50 text-textSecondary hover:text-brand transition-all">
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <div className="text-sm text-textPrimary leading-relaxed whitespace-pre-line">
                                    {aiInsight.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**')
                                            ? <strong key={i} className="text-brand">{part.slice(2, -2)}</strong>
                                            : <span key={i}>{part}</span>
                                    )}
                                </div>
                                <button onClick={() => setAiInsight(null)}
                                    className="mt-3 w-full py-2.5 bg-surfaceHighlight text-textPrimary font-bold rounded-xl text-sm active:scale-95 transition-all">
                                    {language === 'ru' ? 'Закрыть' : 'Close'}
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {vaultData.assets.length === 0 && vaultData.yields.length === 0 && (
                            <div className="text-center py-16">
                                <div className="text-4xl mb-3">🔐</div>
                                <div className="text-lg font-bold text-textPrimary mb-1">
                                    {language === 'ru' ? 'Vault пуст' : 'Vault is empty'}
                                </div>
                                <div className="text-sm text-textSecondary mb-6">
                                    {language === 'ru' ? 'Добавьте первый актив или yield позицию' : 'Add your first asset or yield position'}
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => { setActiveTab('assets'); setShowAddAsset(true); }}
                                        className="px-4 py-2.5 bg-brand text-white font-bold rounded-xl text-sm active:scale-95 transition-all">
                                        {language === 'ru' ? '+ Актив' : '+ Asset'}
                                    </button>
                                    <button onClick={() => { setActiveTab('yields'); setShowAddYield(true); }}
                                        className="px-4 py-2.5 bg-surfaceHighlight text-textPrimary font-bold rounded-xl text-sm active:scale-95 transition-all border border-borderSubtle">
                                        {language === 'ru' ? '+ Yield' : '+ Yield'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ====== ASSETS ====== */}
                {activeTab === 'assets' && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                {vaultData.assets.length} {language === 'ru' ? 'активов' : 'assets'}
                            </span>
                            <button onClick={() => setShowAddAsset(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                <Plus size={14} /> {language === 'ru' ? 'Добавить' : 'Add'}
                            </button>
                        </div>

                        {vaultData.assets.map(asset => {
                            const pnl = (asset.currentPrice - asset.buyPrice) * asset.amount;
                            const pnlPct = asset.buyPrice > 0 ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice * 100) : 0;
                            const config = VAULT_CATEGORY_CONFIG[asset.category];
                            return (
                                <div key={asset.id}
                                    className="bg-surface border border-borderSubtle rounded-2xl p-4 active:scale-[0.99] transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: `${config?.color}15` }}>
                                                {config?.emoji || '💰'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-textPrimary text-sm">{asset.name}</div>
                                                <div className="text-[10px] text-textSecondary">
                                                    {asset.ticker && <span className="font-bold">{asset.ticker}</span>}
                                                    {asset.ticker && ' · '}{asset.amount.toLocaleString()} × ${asset.currentPrice}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-textPrimary text-sm">{fmtFull(asset.amount * asset.currentPrice)}</div>
                                            <div className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {pnl >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                {pnl >= 0 ? '+' : ''}{fmtFull(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                                            </div>
                                        </div>
                                    </div>
                                    {asset.note && (
                                        <div className="text-[10px] text-textSecondary mt-2 italic truncate">📝 {asset.note}</div>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => {
                                            setEditingAsset(asset);
                                            setAssetForm({
                                                name: asset.name, ticker: asset.ticker || '', category: asset.category,
                                                amount: String(asset.amount), buyPrice: String(asset.buyPrice),
                                                currentPrice: String(asset.currentPrice), note: asset.note || ''
                                            });
                                        }}
                                            className="flex-1 py-2 bg-surfaceHighlight text-textSecondary rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all">
                                            <Edit3 size={10} /> {language === 'ru' ? 'Изменить' : 'Edit'}
                                        </button>
                                        <button onClick={() => deleteAsset(asset.id)}
                                            className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {vaultData.assets.length === 0 && (
                            <div className="text-center py-12 text-textSecondary text-sm italic">
                                {language === 'ru' ? 'Нет активов. Нажмите + чтобы добавить.' : 'No assets. Tap + to add.'}
                            </div>
                        )}
                    </>
                )}

                {/* ====== YIELDS ====== */}
                {activeTab === 'yields' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                    {vaultData.yields.length} {language === 'ru' ? 'позиций' : 'positions'}
                                </span>
                                {stats.avgAPY > 0 && (
                                    <span className="text-[10px] text-amber-500 font-bold ml-2">
                                        ⌀ {stats.avgAPY.toFixed(1)}% APY
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setShowAddYield(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                <Plus size={14} /> {language === 'ru' ? 'Добавить' : 'Add'}
                            </button>
                        </div>

                        {vaultData.yields.map(yld => (
                            <div key={yld.id}
                                className={`bg-surface border rounded-2xl p-4 transition-all ${yld.isActive ? 'border-emerald-500/20' : 'border-borderSubtle opacity-60'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-textPrimary text-sm flex items-center gap-1.5">
                                            {yld.isActive && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                                            {yld.protocol}
                                        </div>
                                        <div className="text-[10px] text-textSecondary font-medium">{yld.pool}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-amber-500 font-black text-sm">{yld.apy}% APY</div>
                                        <div className="text-[10px] text-textSecondary">{language === 'ru' ? 'Вложено' : 'Invested'}: {fmtFull(yld.invested)}</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between bg-emerald-500/5 rounded-xl px-3 py-2">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">{language === 'ru' ? 'Накоплено' : 'Earned'}</span>
                                    <span className="text-sm font-black text-emerald-500">{fmtFull(yld.accumulated)}</span>
                                </div>
                                {yld.note && (
                                    <div className="text-[10px] text-textSecondary mt-2 italic truncate">📝 {yld.note}</div>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => {
                                        const toggled = { ...yld, isActive: !yld.isActive, updatedAt: new Date().toISOString() };
                                        onUpdateVault({ ...vaultData, yields: vaultData.yields.map(y => y.id === yld.id ? toggled : y) });
                                        triggerHaptic();
                                    }}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all ${yld.isActive ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                        {yld.isActive ? (language === 'ru' ? '⏸ Пауза' : '⏸ Pause') : (language === 'ru' ? '▶ Возобновить' : '▶ Resume')}
                                    </button>
                                    <button onClick={() => deleteYield(yld.id)}
                                        className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all">
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {vaultData.yields.length === 0 && (
                            <div className="text-center py-12 text-textSecondary text-sm italic">
                                {language === 'ru' ? 'Нет yield позиций. Нажмите + чтобы добавить.' : 'No yield positions. Tap + to add.'}
                            </div>
                        )}
                    </>
                )}

                {/* ====== TRANSACTIONS ====== */}
                {activeTab === 'transactions' && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                {vaultData.transactions.length} {language === 'ru' ? 'операций' : 'transactions'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={exportTransactions}
                                    className="flex items-center gap-1 text-[10px] font-bold text-textSecondary hover:text-brand transition-colors">
                                    <Download size={10} /> CSV
                                </button>
                                <button onClick={() => setShowAddTx(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    <Plus size={14} /> {language === 'ru' ? 'Добавить' : 'Add'}
                                </button>
                            </div>
                        </div>

                        {[...vaultData.transactions]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(tx => {
                                const config = VAULT_TX_TYPES[tx.type];
                                return (
                                    <div key={tx.id}
                                        className="bg-surface border border-borderSubtle rounded-2xl p-3.5 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                                            style={{ backgroundColor: `${config?.color}15` }}>
                                            {config?.emoji || '💸'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-textPrimary text-sm truncate">
                                                {tx.description || config?.label[language]}
                                            </div>
                                            <div className="text-[10px] text-textSecondary flex items-center gap-2">
                                                <span>{new Date(tx.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                                {tx.category && <span className="px-1.5 py-0.5 bg-surfaceHighlight rounded text-[9px] font-bold">{tx.category}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <span className={`font-bold text-sm ${isOutgoingTx(tx.type) ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {isOutgoingTx(tx.type) ? '-' : '+'}${tx.amount.toLocaleString()}
                                            </span>
                                            <button onClick={() => deleteTx(tx.id)}
                                                className="p-1.5 rounded-lg text-textSecondary/40 hover:text-red-500 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                        {vaultData.transactions.length === 0 && (
                            <div className="text-center py-12 text-textSecondary text-sm italic">
                                {language === 'ru' ? 'Нет транзакций.' : 'No transactions.'}
                            </div>
                        )}
                    </>
                )}

                {/* ====== ANALYTICS ====== */}
                {activeTab === 'analytics' && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                {language === 'ru' ? 'Доход по категориям' : 'Income by Category'}
                            </span>
                            <button onClick={exportAssets}
                                className="flex items-center gap-1 text-[10px] font-bold text-textSecondary hover:text-brand transition-colors">
                                <Download size={10} /> CSV
                            </button>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-surface border border-borderSubtle rounded-2xl p-4 space-y-3">
                            <div className="text-xs font-bold text-textPrimary mb-2">📊 {language === 'ru' ? 'Распределение' : 'Breakdown'}</div>
                            {Object.entries(stats.categoryBreakdown)
                                .sort((a, b) => Number(b[1]) - Number(a[1]))
                                .map(([cat, val]: [string, number]) => {
                                    const config = VAULT_CATEGORY_CONFIG[cat as VaultAssetCategory];
                                    const pct = stats.totalValue > 0 ? (val / stats.totalValue) * 100 : 0;
                                    return (
                                        <div key={cat}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="flex items-center gap-1.5">
                                                    <span>{config?.emoji}</span>
                                                    <span className="font-medium text-textPrimary">{config?.label[language]}</span>
                                                </span>
                                                <span className="font-bold text-textPrimary">{fmtFull(val)} ({pct.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: config?.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            {Object.keys(stats.categoryBreakdown).length === 0 && (
                                <div className="text-sm text-textSecondary italic text-center py-4">
                                    {language === 'ru' ? 'Добавьте активы для аналитики' : 'Add assets for analytics'}
                                </div>
                            )}
                        </div>

                        {/* Top Gainers / Losers */}
                        {vaultData.assets.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">🚀 {language === 'ru' ? 'Лучшие' : 'Top Gainers'}</div>
                                    {[...vaultData.assets]
                                        .sort((a, b) => ((b.currentPrice - b.buyPrice) / (b.buyPrice || 1)) - ((a.currentPrice - a.buyPrice) / (a.buyPrice || 1)))
                                        .slice(0, 3)
                                        .map(a => {
                                            const pnlPct = a.buyPrice > 0 ? ((a.currentPrice - a.buyPrice) / a.buyPrice) * 100 : 0;
                                            return (
                                                <div key={a.id} className="flex items-center justify-between py-1">
                                                    <span className="text-xs text-textPrimary truncate">{a.ticker || a.name}</span>
                                                    <span className={`text-[10px] font-bold ${pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                                <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">📉 {language === 'ru' ? 'Худшие' : 'Top Losers'}</div>
                                    {[...vaultData.assets]
                                        .sort((a, b) => ((a.currentPrice - a.buyPrice) / (a.buyPrice || 1)) - ((b.currentPrice - b.buyPrice) / (b.buyPrice || 1)))
                                        .slice(0, 3)
                                        .map(a => {
                                            const pnlPct = a.buyPrice > 0 ? ((a.currentPrice - a.buyPrice) / a.buyPrice) * 100 : 0;
                                            return (
                                                <div key={a.id} className="flex items-center justify-between py-1">
                                                    <span className="text-xs text-textPrimary truncate">{a.ticker || a.name}</span>
                                                    <span className={`text-[10px] font-bold ${pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Harvest Timeline */}
                        <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                            <div className="text-xs font-bold text-textPrimary mb-3">🌾 {language === 'ru' ? 'Журнал урожаев' : 'Harvest Log'}</div>
                            {vaultData.transactions
                                .filter(t => ['harvest', 'claim', 'reward', 'dividend', 'income'].includes(t.type))
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 15)
                                .map(tx => {
                                    const cfg = VAULT_TX_TYPES[tx.type];
                                    return (
                                        <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-borderSubtle/50 last:border-0">
                                            <span className="text-sm">{cfg?.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-textPrimary truncate">{tx.description || cfg?.label[language]}</div>
                                                <div className="text-[10px] text-textSecondary">{new Date(tx.date).toLocaleDateString()}</div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-500">+${tx.amount.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            {vaultData.transactions.filter(t => ['harvest', 'claim', 'reward', 'dividend', 'income'].includes(t.type)).length === 0 && (
                                <div className="text-sm text-textSecondary italic text-center py-4">
                                    {language === 'ru' ? 'Нет записей урожаев. Добавьте транзакции типа harvest/claim/reward.' : 'No harvest records. Add harvest/claim/reward transactions.'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ====== SNAPSHOTS ====== */}
                {activeTab === 'snapshots' && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                {(vaultData.snapshots || []).length} {language === 'ru' ? 'снапшотов' : 'snapshots'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={createSnapshot}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    <Camera size={14} /> {language === 'ru' ? 'Снапшот' : 'Snapshot'}
                                </button>
                            </div>
                        </div>

                        {(vaultData.snapshots || []).length === 0 && (
                            <div className="text-center py-12">
                                <Camera size={32} className="text-textSecondary/30 mx-auto mb-3" />
                                <div className="text-sm text-textSecondary">
                                    {language === 'ru' ? 'Нет снапшотов. Создайте первый для отслеживания динамики.' : 'No snapshots. Create your first to track changes.'}
                                </div>
                            </div>
                        )}

                        {[...(vaultData.snapshots || [])]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((snap, i, arr) => {
                                const prevSnap = arr[i + 1];
                                const pnlChange = prevSnap ? snap.totalValue - prevSnap.totalValue : 0;
                                return (
                                    <div key={snap.id} className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-bold text-textPrimary">
                                                    📸 {new Date(snap.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                                {snap.label && <div className="text-[10px] text-textSecondary">{snap.label}</div>}
                                            </div>
                                            <button onClick={() => deleteSnapshot(snap.id)} className="p-1.5 text-textSecondary/40 hover:text-red-500 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <div className="text-[10px] text-textSecondary">{language === 'ru' ? 'Портфель' : 'Portfolio'}</div>
                                                <div className="text-sm font-bold text-textPrimary">{fmtFull(snap.totalValue)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-textSecondary">PnL</div>
                                                <div className={`text-sm font-bold ${snap.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {snap.totalPnL >= 0 ? '+' : ''}{fmtFull(snap.totalPnL)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-textSecondary">Yield</div>
                                                <div className="text-sm font-bold text-blue-400">{fmtFull(snap.totalYieldEarned)}</div>
                                            </div>
                                        </div>
                                        {prevSnap && (
                                            <div className="mt-2 pt-2 border-t border-borderSubtle/50 text-[10px] text-textSecondary flex items-center gap-1">
                                                {language === 'ru' ? 'С прошлого:' : 'Since prev:'}
                                                <span className={`font-bold ${pnlChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {pnlChange >= 0 ? '+' : ''}{fmtFull(pnlChange)}
                                                </span>
                                            </div>
                                        )}
                                        {/* Asset details */}
                                        {snap.assetSummary.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-borderSubtle/50 space-y-1">
                                                {snap.assetSummary.slice(0, 5).map((a, j) => (
                                                    <div key={j} className="flex items-center justify-between text-[11px]">
                                                        <span className="text-textSecondary">{a.ticker || a.name}</span>
                                                        <span className="text-textPrimary font-medium">{fmtFull(a.value)}</span>
                                                    </div>
                                                ))}
                                                {snap.assetSummary.length > 5 && (
                                                    <div className="text-[10px] text-textSecondary italic">+{snap.assetSummary.length - 5} more</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </>
                )}
            </div>

            {/* Modals */}
            {(showAddAsset || editingAsset) && renderAssetForm(!!editingAsset)}
            {showAddYield && renderYieldForm()}
            {showAddTx && renderTxForm()}
        </div>
    );
};

export default VaultModal;

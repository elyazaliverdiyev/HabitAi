import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionContainer } from '../utils/motionPresets';
import { 
  Building2, Car, Briefcase, TrendingUp, Gem, Landmark, Wallet, 
  Plus, X, ChevronRight, Sparkles, PieChart, ShieldCheck, ArrowUpRight, DollarSign
} from 'lucide-react';
import { VaultData, VaultAsset, VaultAssetCategory, VAULT_CATEGORY_CONFIG, EMPTY_VAULT } from '../types/vault';
import { getCurrencySymbol } from '../types';
import CountUp from './CountUp';

interface WealthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  vaultData: VaultData;
  onUpdateVault: (data: VaultData) => void;
  language?: 'ru' | 'en';
  currency?: string;
}

export const WealthDashboard: React.FC<WealthDashboardProps> = ({
  isOpen,
  onClose,
  vaultData = EMPTY_VAULT,
  onUpdateVault,
  language = 'ru',
  currency = 'USD'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VaultAssetCategory>('real_estate');
  const [amount, setAmount] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const currencySymbol = getCurrencySymbol(currency);

  // Calculate capital metrics
  const metrics = useMemo(() => {
    const assets = vaultData.assets || [];
    let totalNetWorth = 0;
    
    const categoryTotals: Record<string, number> = {
      real_estate: 0,
      vehicles: 0,
      business: 0,
      stocks: 0,
      crypto: 0,
      valuables: 0,
      cash: 0,
      other: 0,
    };

    assets.forEach(asset => {
      const val = (asset.amount || 1) * (asset.currentPrice || asset.buyPrice || 0);
      totalNetWorth += val;

      const catKey = ['real_estate', 'vehicles', 'business', 'stocks', 'crypto', 'valuables', 'cash'].includes(asset.category)
        ? asset.category
        : 'other';
        
      categoryTotals[catKey] = (categoryTotals[catKey] || 0) + val;
    });

    // Add Yields if any
    const yieldTotal = (vaultData.yields || []).reduce((sum, y) => sum + (y.invested || 0), 0);
    totalNetWorth += yieldTotal;
    categoryTotals['crypto'] += yieldTotal;

    return {
      totalNetWorth,
      categoryTotals,
      assetsCount: assets.length
    };
  }, [vaultData]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const newAsset: VaultAsset = {
      id: `asset_${Date.now()}`,
      name: name.trim(),
      category,
      amount: parseFloat(amount) || 1,
      buyPrice: parseFloat(price) || 0,
      currentPrice: parseFloat(price) || 0,
      currency,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdateVault({
      ...vaultData,
      assets: [newAsset, ...(vaultData.assets || [])]
    });

    // Reset Form
    setName('');
    setPrice('');
    setNote('');
    setShowAddForm(false);
  };

  const handleDeleteAsset = (id: string) => {
    onUpdateVault({
      ...vaultData,
      assets: vaultData.assets.filter(a => a.id !== id)
    });
  };

  const filteredAssets = useMemo(() => {
    if (selectedCategory === 'all') return vaultData.assets || [];
    return (vaultData.assets || []).filter(a => a.category === selectedCategory);
  }, [vaultData.assets, selectedCategory]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-[12px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={motionContainer}
          className="relative w-full max-w-4xl bg-zinc-900/90 border border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-amber-500/15 to-transparent blur-2xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-2xl">
                <Landmark className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                  {language === 'ru' ? 'Общий Капитал & Активы' : 'Total Net Worth & Assets'}
                </h2>
                <p className="text-xs text-zinc-400">
                  {language === 'ru' ? 'Полный учет недвижимости, авто, бизнеса и инвест-портфеля' : 'Real estate, vehicles, business and investment ledger'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar modal-content-fade">
            {/* Total Capital Banner */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-emerald-950/30 border border-amber-500/30 overflow-hidden shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <span className="text-xs font-medium tracking-wider uppercase text-amber-400/90 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4" />
                    {language === 'ru' ? 'Состояние & Капитал' : 'Total Capital Value'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                    <span>{currencySymbol}</span>
                    <CountUp to={metrics.totalNetWorth} duration={1500} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {language === 'ru' ? `Всего активов: ${metrics.assetsCount} шт.` : `Total items: ${metrics.assetsCount}`}
                  </p>
                </div>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  {language === 'ru' ? 'Добавить актив' : 'Add Asset'}
                </button>
              </div>
            </div>

            {/* Quick Add Asset Form Modal / Collapsible */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddAsset}
                  className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700/80 space-y-4 overflow-hidden"
                >
                  <div className="flex justify-between items-center border-b border-zinc-700/60 pb-3">
                    <h3 className="text-sm font-semibold text-amber-300">
                      {language === 'ru' ? 'Новый актив в капитал' : 'New Capital Asset'}
                    </h3>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Категория</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as VaultAssetCategory)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                      >
                        <option value="real_estate">🏠 Недвижимость</option>
                        <option value="vehicles">🚗 Транспорт</option>
                        <option value="business">💼 Бизнес</option>
                        <option value="stocks">📈 Акции</option>
                        <option value="crypto">₿ Криптовалюта</option>
                        <option value="valuables">💎 Ценности</option>
                        <option value="cash">🏦 Наличные / Банк</option>
                        <option value="other">💰 Другое</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Название (например: "Квартира в центре")</label>
                      <input
                        type="text"
                        required
                        placeholder="Квартира, BMW, Доля в ООО..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Оценочная стоимость ({currencySymbol})</label>
                      <input
                        type="number"
                        required
                        placeholder="100000"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-700/60 text-zinc-300 text-xs hover:bg-zinc-700"
                    >
                      {language === 'ru' ? 'Отмена' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400"
                    >
                      {language === 'ru' ? 'Сохранить' : 'Save Asset'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'all', label: language === 'ru' ? 'Все активы' : 'All', emoji: '💎' },
                { id: 'real_estate', label: language === 'ru' ? 'Недвижимость' : 'Real Estate', emoji: '🏠' },
                { id: 'vehicles', label: language === 'ru' ? 'Транспорт' : 'Vehicles', emoji: '🚗' },
                { id: 'business', label: language === 'ru' ? 'Бизнес' : 'Business', emoji: '💼' },
                { id: 'stocks', label: language === 'ru' ? 'Акции' : 'Stocks', emoji: '📈' },
                { id: 'crypto', label: language === 'ru' ? 'Крипто' : 'Crypto', emoji: '₿' },
                { id: 'valuables', label: language === 'ru' ? 'Ценности' : 'Valuables', emoji: '💎' },
                { id: 'cash', label: language === 'ru' ? 'Наличные' : 'Cash', emoji: '🏦' },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 border ${
                    selectedCategory === chip.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Assets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAssets.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-800/20 border border-zinc-800 rounded-3xl">
                  <Landmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{language === 'ru' ? 'В этой категории пока нет активов.' : 'No assets in this category yet.'}</p>
                </div>
              ) : (
                filteredAssets.map(asset => {
                  const cfg = VAULT_CATEGORY_CONFIG[asset.category] || VAULT_CATEGORY_CONFIG.other;
                  const totalVal = (asset.amount || 1) * (asset.currentPrice || asset.buyPrice || 0);

                  return (
                    <div
                      key={asset.id}
                      className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          {cfg.emoji}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                            {asset.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 capitalize">
                            {cfg.label[language] || asset.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">
                            {currencySymbol}{totalVal.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Удалить"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

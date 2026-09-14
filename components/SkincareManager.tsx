import React, { useState } from 'react';
import { SkincareProduct, SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINE, SKINCARE_FREQUENCY } from '../types';
import { Plus, Trash2, X, Check, Droplets, Edit3, Archive, RotateCcw, Sparkles } from 'lucide-react';
import { searchSkincareProducts } from '../services/ai';

interface SkincareManagerProps {
    products: SkincareProduct[];
    onProductsChange: (products: SkincareProduct[]) => void;
    language: 'ru' | 'en';
    todayStr: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const PRODUCT_COLORS = [
    '#f472b6', '#fb7185', '#f97316', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#a78bfa'
];

const SkincareManager: React.FC<SkincareManagerProps> = ({
    products,
    onProductsChange,
    language,
    todayStr
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'history'>('morning');
    const [formData, setFormData] = useState({
        name: '',
        type: 'moisturizer' as SkincareProduct['type'],
        routine: 'morning' as SkincareProduct['routine'],
        frequency: 'daily' as SkincareProduct['frequency'],
        notes: '',
        color: PRODUCT_COLORS[0]
    });

    // AI Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ name: string, type: SkincareProduct['type'], routine: SkincareProduct['routine'], description: string }>>([]);

    // Filter products by routine and status
    const activeProducts = products.filter(p => p.status !== 'finished');
    const finishedProducts = products.filter(p => p.status === 'finished');

    const morningProducts = activeProducts.filter(p => p.routine === 'morning' || p.routine === 'both').sort((a, b) => a.order - b.order);
    const eveningProducts = activeProducts.filter(p => p.routine === 'evening' || p.routine === 'both').sort((a, b) => a.order - b.order);

    const displayedProducts = activeTab === 'history'
        ? finishedProducts
        : activeTab === 'morning' ? morningProducts : eveningProducts;

    const usedToday = (routine: 'morning' | 'evening') => {
        const key = `${todayStr}-${routine}`;
        const prods = routine === 'morning' ? morningProducts : eveningProducts;
        return prods.filter(p => p.usedDates?.includes(key)).length;
    };

    const toggleUsed = (id: string) => {
        const key = `${todayStr}-${activeTab}`;
        onProductsChange(products.map(p => {
            if (p.id !== id) return p;
            const dates = p.usedDates || [];
            const newDates = dates.includes(key)
                ? dates.filter(d => d !== key)
                : [...dates, key];
            return { ...p, usedDates: newDates };
        }));
    };

    const addProduct = () => {
        if (!formData.name.trim()) return;
        const maxOrder = Math.max(0, ...activeProducts.map(p => p.order));
        const newProduct: SkincareProduct = {
            id: generateId(),
            name: formData.name.trim(),
            type: formData.type,
            routine: formData.routine,
            frequency: formData.frequency,
            order: maxOrder + 1,
            status: 'active',
            notes: formData.notes.trim() || undefined,
            color: formData.color,
            usedDates: []
        };
        onProductsChange([...products, newProduct]);
        resetForm();
    };

    const updateProduct = () => {
        if (!editingId || !formData.name.trim()) return;
        onProductsChange(products.map(p =>
            p.id === editingId ? {
                ...p,
                name: formData.name.trim(),
                type: formData.type,
                routine: formData.routine,
                frequency: formData.frequency,
                notes: formData.notes.trim() || undefined,
                color: formData.color
            } : p
        ));
        resetForm();
    };

    const finishProduct = (id: string) => {
        onProductsChange(products.map(p =>
            p.id === id ? { ...p, status: 'finished' as const } : p
        ));
    };

    const restoreProduct = (id: string) => {
        onProductsChange(products.map(p =>
            p.id === id ? { ...p, status: 'active' as const } : p
        ));
    };

    const deleteProduct = (id: string) => {
        onProductsChange(products.filter(p => p.id !== id));
    };

    const startEdit = (p: SkincareProduct) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            type: p.type,
            routine: p.routine,
            frequency: p.frequency || 'daily',
            notes: p.notes || '',
            color: p.color || PRODUCT_COLORS[0]
        });
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', type: 'moisturizer', routine: 'morning', frequency: 'daily', notes: '', color: PRODUCT_COLORS[0] });
        setSearchResults([]);
    };

    // AI Search
    const handleAiSearch = async () => {
        if (!formData.name.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchSkincareProducts(formData.name, language);
            setSearchResults(results);
        } catch (e) {
            console.error('Search error:', e);
        }
        setIsSearching(false);
    };

    const applySearchResult = (res: { name: string, type: SkincareProduct['type'], routine: SkincareProduct['routine'], description: string }) => {
        setFormData({
            ...formData,
            name: res.name,
            type: res.type,
            routine: res.routine,
            notes: res.description
        });
        setSearchResults([]);
    };

    return (
        <div className="space-y-3">
            {/* Header with tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Droplets className="text-brand" size={20} />
                    <span className="font-bold text-textPrimary">
                        {language === 'ru' ? 'Уход' : 'Skincare'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('morning')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === 'morning' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                    >
                        ☀️ {language === 'ru' ? 'Утро' : 'AM'} ({usedToday('morning')}/{morningProducts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('evening')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === 'evening' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                    >
                        🌙 {language === 'ru' ? 'Вечер' : 'PM'} ({usedToday('evening')}/{eveningProducts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                    >
                        📋
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {activeTab !== 'history' && displayedProducts.length > 0 && (
                <div className="space-y-1">
                    <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${activeTab === 'morning' ? 'bg-brand' : 'bg-brand'}`}
                            style={{ width: `${displayedProducts.length > 0 ? (displayedProducts.filter(p => p.usedDates?.includes(`${todayStr}-${activeTab}`)).length / displayedProducts.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Products list */}
            <div className="space-y-2">
                {displayedProducts.map((p, index) => {
                    const key = `${todayStr}-${activeTab}`;
                    const isUsed = p.usedDates?.includes(key);
                    const typeInfo = SKINCARE_PRODUCT_TYPES[p.type];
                    const isFinished = p.status === 'finished';

                    return (
                        <div
                            key={p.id}
                            className={`p-3 rounded-xl transition-all ${isFinished
                                ? 'bg-surfaceHighlight border border-borderSubtle opacity-70'
                                : isUsed
                                    ? 'bg-green-500/20 border border-green-500/30'
                                    : 'bg-surface border border-borderSubtle'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {!isFinished && activeTab !== 'history' && (
                                    <button
                                        onClick={() => toggleUsed(p.id)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${isUsed ? 'bg-green-500 border-green-500' : 'border-textSecondary/40 hover:border-textSecondary/60'}`}
                                    >
                                        {isUsed && <Check size={14} className="text-white" />}
                                    </button>
                                )}
                                {(isFinished || activeTab === 'history') && (
                                    <div className="w-6 h-6 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0 text-sm">
                                        {typeInfo?.emoji}
                                    </div>
                                )}
                                {!isFinished && activeTab !== 'history' && (
                                    <span className="text-xs text-textSecondary w-4">{index + 1}</span>
                                )}
                                <span className="text-lg">{typeInfo?.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${isUsed && !isFinished ? 'text-green-500 line-through' : 'text-textPrimary'}`}>
                                        {p.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-textSecondary">
                                        <span>{typeInfo?.label[language]}</span>
                                        {p.routine === 'both' && <span className="text-pink-400">🔄</span>}
                                    </div>
                                </div>
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: p.color || '#f472b6' }}
                                />
                                {!isFinished ? (
                                    <>
                                        <button
                                            onClick={() => startEdit(p)}
                                            className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight transition-all"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => finishProduct(p.id)}
                                            className="p-1.5 rounded-lg text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/20 transition-all"
                                        >
                                            <Archive size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => restoreProduct(p.id)}
                                            className="p-1.5 rounded-lg text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/20 transition-all"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(p.id)}
                                            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {displayedProducts.length === 0 && !isAdding && (
                    <div className="text-center py-6 text-textSecondary text-sm">
                        {activeTab === 'history'
                            ? (language === 'ru' ? '📋 Нет завершённых продуктов' : '📋 No finished products')
                            : (language === 'ru' ? `🧴 Добавьте продукты для ${activeTab === 'morning' ? 'утренней' : 'вечерней'} рутины` : `🧴 Add products for ${activeTab} routine`)
                        }
                    </div>
                )}
            </div>

            {/* Add button */}
            {activeTab !== 'history' && !isAdding && (
                <button
                    onClick={() => {
                        setFormData({ ...formData, routine: activeTab });
                        setIsAdding(true);
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-brand/40 bg-brand/5 text-brand font-medium text-sm hover:bg-brand/10 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    {language === 'ru' ? 'Добавить' : 'Add product'}
                </button>
            )}

            {/* Add/Edit form */}
            {isAdding && (
                <div className="p-4 rounded-xl bg-surface border border-borderSubtle space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-textPrimary">
                            {editingId ? (language === 'ru' ? 'Редактировать' : 'Edit') : (language === 'ru' ? 'Новый продукт' : 'New product')}
                        </span>
                        <button onClick={resetForm} className="p-1 text-textSecondary hover:text-textPrimary">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Name input with AI search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={language === 'ru' ? 'Название (напр. CeraVe Cleanser)' : 'Name (e.g. CeraVe Cleanser)'}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                            className="w-full px-3 py-2.5 pr-10 rounded-xl bg-surfaceHighlight text-textPrimary placeholder-textSecondary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                        <button
                            onClick={handleAiSearch}
                            disabled={isSearching || !formData.name.trim()}
                            className="gemini-glow-sm bg-surface absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand hover:bg-brand/20 rounded-lg transition-colors disabled:opacity-30"
                        >
                            {isSearching ? <RotateCcw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-1">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => applySearchResult(res)}
                                    className="w-full text-left p-2.5 bg-surfaceHighlight border border-borderSubtle rounded-xl hover:bg-brand/10 hover:border-brand/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-textPrimary">{res.name}</div>
                                            <div className="text-xs text-textSecondary">
                                                {SKINCARE_PRODUCT_TYPES[res.type]?.emoji} {SKINCARE_PRODUCT_TYPES[res.type]?.label[language]} • {SKINCARE_ROUTINE[res.routine]?.emoji} {SKINCARE_ROUTINE[res.routine]?.label[language]}
                                            </div>
                                            <div className="text-xs text-textSecondary mt-0.5">{res.description}</div>
                                        </div>
                                        <Plus size={14} className="text-brand opacity-0 group-hover:opacity-100" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product Type selector */}
                    <div>
                        <label className="text-xs text-textSecondary mb-1.5 block">{language === 'ru' ? 'Тип продукта' : 'Product type'}</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(SKINCARE_PRODUCT_TYPES) as SkincareProduct['type'][]).map(type => {
                                const info = SKINCARE_PRODUCT_TYPES[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${formData.type === type ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                                    >
                                        <span>{info.emoji}</span>
                                        <span>{info.label[language]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Routine selector */}
                    <div>
                        <label className="text-xs text-textSecondary mb-1.5 block">{language === 'ru' ? 'Рутина' : 'Routine'}</label>
                        <div className="flex gap-1.5">
                            {(Object.keys(SKINCARE_ROUTINE) as SkincareProduct['routine'][]).map(routine => {
                                const info = SKINCARE_ROUTINE[routine];
                                return (
                                    <button
                                        key={routine}
                                        onClick={() => setFormData({ ...formData, routine })}
                                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${formData.routine === routine ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                                    >
                                        <span>{info.emoji}</span>
                                        <span>{info.label[language]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frequency selector */}
                    <div>
                        <label className="text-xs text-textSecondary mb-1.5 block">{language === 'ru' ? 'Частота' : 'Frequency'}</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(SKINCARE_FREQUENCY) as SkincareProduct['frequency'][]).map(freq => {
                                const info = SKINCARE_FREQUENCY[freq];
                                return (
                                    <button
                                        key={freq}
                                        onClick={() => setFormData({ ...formData, frequency: freq })}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${formData.frequency === freq ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                                    >
                                        <span>{info.emoji}</span>
                                        <span>{info.label[language]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="flex gap-1.5">
                        {PRODUCT_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setFormData({ ...formData, color })}
                                className={`w-6 h-6 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <textarea
                        placeholder={language === 'ru' ? 'Заметки (опционально)' : 'Notes (optional)'}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-surfaceHighlight text-textPrimary placeholder-textSecondary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none h-16"
                    />

                    <button
                        onClick={editingId ? updateProduct : addProduct}
                        disabled={!formData.name.trim()}
                        className="w-full py-2.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-brand/30 transition-all"
                    >
                        {editingId ? (language === 'ru' ? 'Сохранить' : 'Save') : (language === 'ru' ? 'Добавить' : 'Add')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SkincareManager;

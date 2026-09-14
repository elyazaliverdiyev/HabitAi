import React, { useState, useRef } from 'react';
import {
    ListChecks, StickyNote, Image as ImageIcon, Plus, Trash2, GripVertical,
    Check, X, ChevronDown, ChevronUp, Sparkles, Camera
} from 'lucide-react';
import { SubItem, SubItemNote, ChecklistItem, getAccentGradient } from '../types';

interface ContentBlocksEditorProps {
    items: SubItem[];
    onItemsChange: (items: SubItem[]) => void;
    language?: 'ru' | 'en';
    accentColor?: string | null;
    compact?: boolean;  // Mini mode for cards
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ContentBlocksEditor: React.FC<ContentBlocksEditorProps> = ({
    items,
    onItemsChange,
    language = 'ru',
    accentColor,
    compact = false
}) => {
    const accent = getAccentGradient(accentColor);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [showAddMenu, setShowAddMenu] = useState(false);

    const t = {
        addItem: language === 'ru' ? 'Добавить элемент' : 'Add item',
        checklist: language === 'ru' ? 'Чеклист' : 'Checklist',
        note: language === 'ru' ? 'Заметка' : 'Note',
        image: language === 'ru' ? 'Изображение' : 'Image',
        placeholder: language === 'ru' ? 'Название...' : 'Name...',
        addCheckItem: language === 'ru' ? 'Добавить пункт' : 'Add item',
        addNote: language === 'ru' ? 'Добавить заметку' : 'Add note',
        noItems: language === 'ru' ? 'Нет элементов' : 'No items',
        queued: language === 'ru' ? 'В очереди' : 'Queued',
        active: language === 'ru' ? 'Активно' : 'Active',
        done: language === 'ru' ? 'Готово' : 'Done',
    };

    const handleAddItem = (type: 'checklist' | 'note') => {
        const newItem: SubItem = {
            id: generateId(),
            name: type === 'checklist'
                ? (language === 'ru' ? 'Новый чеклист' : 'New checklist')
                : (language === 'ru' ? 'Новая заметка' : 'New note'),
            status: 'active',
            notes: type === 'note' ? [{
                id: generateId(),
                content: '',
                createdAt: new Date().toISOString()
            }] : [],
            checklist: type === 'checklist' ? [] : undefined,
            createdAt: new Date().toISOString()
        };
        onItemsChange([...items, newItem]);
        setExpandedItemId(newItem.id);
        setShowAddMenu(false);
    };

    const handleDeleteItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const handleUpdateItem = (id: string, updates: Partial<SubItem>) => {
        onItemsChange(items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    // Checklist handlers
    const handleAddChecklistItem = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newCheckItem: ChecklistItem = {
            id: generateId(),
            text: '',
            done: false,
            order: item.checklist?.length || 0
        };

        handleUpdateItem(itemId, {
            checklist: [...(item.checklist || []), newCheckItem]
        });
    };

    const handleToggleCheckItem = (itemId: string, checkItemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.checklist) return;

        handleUpdateItem(itemId, {
            checklist: item.checklist.map(ci =>
                ci.id === checkItemId ? { ...ci, done: !ci.done } : ci
            )
        });
    };

    const handleUpdateCheckItem = (itemId: string, checkItemId: string, text: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.checklist) return;

        handleUpdateItem(itemId, {
            checklist: item.checklist.map(ci =>
                ci.id === checkItemId ? { ...ci, text } : ci
            )
        });
    };

    const handleDeleteCheckItem = (itemId: string, checkItemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.checklist) return;

        handleUpdateItem(itemId, {
            checklist: item.checklist.filter(ci => ci.id !== checkItemId)
        });
    };

    // Note handlers
    const handleUpdateNote = (itemId: string, noteId: string, content: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        handleUpdateItem(itemId, {
            notes: item.notes.map(n =>
                n.id === noteId ? { ...n, content } : n
            )
        });
    };

    // Get item icon and type
    const getItemTypeInfo = (item: SubItem) => {
        if (item.checklist && item.checklist.length > 0) {
            return { icon: ListChecks, type: 'checklist' as const, color: '#22c55e' };
        }
        if (item.notes.length > 0 && item.notes[0].imageUrl) {
            return { icon: ImageIcon, type: 'image' as const, color: '#8b5cf6' };
        }
        return { icon: StickyNote, type: 'note' as const, color: '#f59e0b' };
    };

    // Calculate checklist progress
    const getChecklistProgress = (checklist?: ChecklistItem[]) => {
        if (!checklist || checklist.length === 0) return null;
        const done = checklist.filter(ci => ci.done).length;
        return { done, total: checklist.length, percent: Math.round((done / checklist.length) * 100) };
    };

    // Compact view for cards
    if (compact) {
        if (items.length === 0) return null;

        return (
            <div className="flex items-center gap-2 flex-wrap">
                {items.map(item => {
                    const typeInfo = getItemTypeInfo(item);
                    const progress = getChecklistProgress(item.checklist);

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                            style={{
                                backgroundColor: `${typeInfo.color}15`,
                                color: typeInfo.color
                            }}
                        >
                            <typeInfo.icon size={10} />
                            {progress ? (
                                <span>{progress.done}/{progress.total}</span>
                            ) : (
                                <span className="max-w-[60px] truncate">{item.name}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Items list */}
            {items.map(item => {
                const isExpanded = expandedItemId === item.id;
                const typeInfo = getItemTypeInfo(item);
                const progress = getChecklistProgress(item.checklist);
                const ItemIcon = typeInfo.icon;

                return (
                    <div
                        key={item.id}
                        className={`bg-surface border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-brand/40 shadow-md' : 'border-borderSubtle'
                            }`}
                    >
                        {/* Header */}
                        <div
                            className="p-3 flex items-center gap-3 cursor-pointer hover:bg-surfaceHighlight/30 transition-colors"
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${typeInfo.color}20` }}
                            >
                                <ItemIcon size={16} style={{ color: typeInfo.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleUpdateItem(item.id, { name: e.target.value });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent text-sm font-bold text-textPrimary focus:outline-none"
                                    placeholder={t.placeholder}
                                />
                                {progress && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${progress.percent}%`,
                                                    backgroundColor: typeInfo.color
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-textSecondary">
                                            {progress.done}/{progress.total}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-textSecondary hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>

                            {isExpanded ? (
                                <ChevronUp size={16} className="text-textSecondary" />
                            ) : (
                                <ChevronDown size={16} className="text-textSecondary" />
                            )}
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 animate-fadeIn">
                                {/* Checklist items */}
                                {item.checklist && (
                                    <div className="space-y-1.5">
                                        {item.checklist.map((checkItem) => (
                                            <div key={checkItem.id} className="flex items-center gap-2 group">
                                                <button
                                                    onClick={() => handleToggleCheckItem(item.id, checkItem.id)}
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checkItem.done
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-borderSubtle hover:border-green-500/50'
                                                        }`}
                                                >
                                                    {checkItem.done && <Check size={12} className="text-white" />}
                                                </button>
                                                <input
                                                    type="text"
                                                    value={checkItem.text}
                                                    onChange={(e) => handleUpdateCheckItem(item.id, checkItem.id, e.target.value)}
                                                    placeholder={language === 'ru' ? 'Пункт...' : 'Item...'}
                                                    className={`flex-1 bg-transparent text-sm focus:outline-none ${checkItem.done ? 'line-through text-textSecondary' : 'text-textPrimary'
                                                        }`}
                                                />
                                                <button
                                                    onClick={() => handleDeleteCheckItem(item.id, checkItem.id)}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-textSecondary hover:text-red-500 transition-all"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => handleAddChecklistItem(item.id)}
                                            className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-brand transition-colors py-1"
                                        >
                                            <Plus size={12} />
                                            {t.addCheckItem}
                                        </button>
                                    </div>
                                )}

                                {/* Notes */}
                                {item.notes.length > 0 && !item.checklist && (
                                    <div className="space-y-2">
                                        {item.notes.map((note) => (
                                            <div key={note.id}>
                                                <textarea
                                                    value={note.content}
                                                    onChange={(e) => handleUpdateNote(item.id, note.id, e.target.value)}
                                                    placeholder={language === 'ru' ? 'Введите заметку...' : 'Enter note...'}
                                                    rows={3}
                                                    className="w-full bg-surfaceHighlight/30 border border-borderSubtle rounded-lg p-3 text-sm text-textPrimary focus:outline-none focus:border-brand/40 resize-none"
                                                />
                                                {note.imageUrl && (
                                                    <div className="mt-2 relative rounded-lg overflow-hidden">
                                                        <img
                                                            src={note.imageUrl}
                                                            alt={note.imageCaption || 'Image'}
                                                            className="w-full h-32 object-cover"
                                                        />
                                                        {note.imageCaption && (
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                                                                {note.imageCaption}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Add button */}
            <div className="relative">
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-borderSubtle hover:border-brand/40 flex items-center justify-center gap-2 text-sm font-bold text-textSecondary hover:text-brand transition-all group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    {t.addItem}
                </button>

                {/* Add menu */}
                {showAddMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-borderSubtle rounded-xl shadow-lg overflow-hidden z-10 animate-fadeIn">
                        <button
                            onClick={() => handleAddItem('checklist')}
                            className="w-full p-3 flex items-center gap-3 hover:bg-surfaceHighlight/50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <ListChecks size={16} className="text-green-500" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-textPrimary">{t.checklist}</div>
                                <div className="text-[10px] text-textSecondary">
                                    {language === 'ru' ? 'Подзадачи с галочками' : 'Sub-tasks with checkboxes'}
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleAddItem('note')}
                            className="w-full p-3 flex items-center gap-3 hover:bg-surfaceHighlight/50 transition-colors border-t border-borderSubtle"
                        >
                            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <StickyNote size={16} className="text-yellow-500" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-textPrimary">{t.note}</div>
                                <div className="text-[10px] text-textSecondary">
                                    {language === 'ru' ? 'Текстовая заметка' : 'Text note'}
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {items.length === 0 && !showAddMenu && (
                <div className="text-center py-6 text-textSecondary text-sm">
                    {t.noItems}
                </div>
            )}
        </div>
    );
};

export default ContentBlocksEditor;

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Check, Clock, Inbox, X, Lightbulb, FileText, Flame, Star, ListChecks, Link2, Flag, Calendar, CornerDownRight } from 'lucide-react';
import { SubItem, SubItemNote, ChecklistItem } from '../types';

interface SubItemsListProps {
    items: SubItem[];
    onUpdate: (items: SubItem[]) => void;
    language: 'ru' | 'en';
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const STATUS_CONFIG = {
    queued: { icon: Inbox, label: { ru: 'В очереди', en: 'Queued' }, color: 'text-gray-400', bg: 'bg-gray-500/10' },
    active: { icon: Clock, label: { ru: 'Активно', en: 'Active' }, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    done: { icon: Check, label: { ru: 'Готово', en: 'Done' }, color: 'text-green-400', bg: 'bg-green-500/10' },
};

const NOTE_TYPES = [
    { emoji: '💡', icon: Lightbulb, label: { ru: 'Идея', en: 'Idea' } },
    { emoji: '📝', icon: FileText, label: { ru: 'Заметка', en: 'Note' } },
    { emoji: '🔥', icon: Flame, label: { ru: 'Инсайт', en: 'Insight' } },
    { emoji: '⭐', icon: Star, label: { ru: 'Важно', en: 'Important' } },
];

const PRIORITY_CONFIG = {
    low: { label: { ru: 'Низкий', en: 'Low' }, color: 'text-gray-400', dot: 'bg-gray-400' },
    medium: { label: { ru: 'Средний', en: 'Medium' }, color: 'text-yellow-400', dot: 'bg-yellow-400' },
    high: { label: { ru: 'Высокий', en: 'High' }, color: 'text-red-400', dot: 'bg-red-400' },
};

// Helper: update a SubItem deep in the tree by ID
function updateItemInTree(items: SubItem[], id: string, updater: (item: SubItem) => SubItem | null): SubItem[] {
    return items.reduce<SubItem[]>((acc, item) => {
        if (item.id === id) {
            const updated = updater(item);
            if (updated) acc.push(updated);
            // if null, item is deleted
        } else {
            acc.push({
                ...item,
                children: item.children ? updateItemInTree(item.children, id, updater) : undefined,
            });
        }
        return acc;
    }, []);
}

// Helper: add a child SubItem to a parent by ID
function addChildToItem(items: SubItem[], parentId: string, child: SubItem): SubItem[] {
    return items.map(item => {
        if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), child] };
        }
        return {
            ...item,
            children: item.children ? addChildToItem(item.children, parentId, child) : undefined,
        };
    });
}

const SubItemsList: React.FC<SubItemsListProps> = ({ items, onUpdate, language }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [newItemName, setNewItemName] = useState('');
    const [addingChildFor, setAddingChildFor] = useState<string | null>(null);
    const [childName, setChildName] = useState('');

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const addItem = () => {
        if (!newItemName.trim()) return;
        const newItem: SubItem = {
            id: generateId(),
            name: newItemName.trim(),
            status: 'queued',
            notes: [],
            createdAt: new Date().toISOString(),
        };
        onUpdate([...items, newItem]);
        setNewItemName('');
    };

    const addChild = (parentId: string) => {
        if (!childName.trim()) return;
        const child: SubItem = {
            id: generateId(),
            name: childName.trim(),
            status: 'queued',
            notes: [],
            createdAt: new Date().toISOString(),
        };
        onUpdate(addChildToItem(items, parentId, child));
        setChildName('');
        setAddingChildFor(null);
    };

    const updateItem = (id: string, updater: (item: SubItem) => SubItem | null) => {
        onUpdate(updateItemInTree(items, id, updater));
    };

    // === NOTE HANDLERS ===
    const addNote = (itemId: string) => {
        updateItem(itemId, item => ({
            ...item,
            notes: [...item.notes, {
                id: generateId(),
                content: '',
                emoji: '📝',
                createdAt: new Date().toISOString()
            }]
        }));
    };

    const deleteNote = (itemId: string, noteId: string) => {
        updateItem(itemId, item => ({
            ...item,
            notes: item.notes.filter(n => n.id !== noteId)
        }));
    };

    // === CHECKLIST HANDLERS ===
    const addChecklistItem = (itemId: string) => {
        updateItem(itemId, item => ({
            ...item,
            checklist: [...(item.checklist || []), {
                id: generateId(),
                text: '',
                done: false,
                order: (item.checklist?.length || 0)
            }]
        }));
    };

    const toggleChecklistItem = (itemId: string, checkId: string) => {
        updateItem(itemId, item => ({
            ...item,
            checklist: item.checklist?.map(c =>
                c.id === checkId ? { ...c, done: !c.done } : c
            )
        }));
    };

    const deleteChecklistItem = (itemId: string, checkId: string) => {
        updateItem(itemId, item => ({
            ...item,
            checklist: item.checklist?.filter(c => c.id !== checkId)
        }));
    };

    const getChecklistProgress = (checklist?: ChecklistItem[]) => {
        if (!checklist || checklist.length === 0) return null;
        const done = checklist.filter(c => c.done).length;
        return { done, total: checklist.length, percent: Math.round((done / checklist.length) * 100) };
    };

    // Days remaining helper
    const getDaysRemaining = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Recursive render
    const renderItem = (item: SubItem, depth: number = 0) => {
        const isExpanded = expanded[item.id];
        const StatusIcon = STATUS_CONFIG[item.status].icon;
        const statusColor = STATUS_CONFIG[item.status].color;
        const checklistProgress = getChecklistProgress(item.checklist);
        const childCount = item.children?.length || 0;
        const doneChildren = item.children?.filter(c => c.status === 'done').length || 0;
        const daysLeft = item.dueDate ? getDaysRemaining(item.dueDate) : null;

        return (
            <div key={item.id} style={{ marginLeft: depth * 16 }}>
                <div
                    className={`group flex items-start gap-2 p-2.5 rounded-xl transition-all duration-200 apple-press
                        ${item.status === 'done' ? 'opacity-50' : ''}
                        ${isExpanded ? 'bg-surfaceHighlight' : 'hover:bg-surfaceHighlight/50'}`}
                >
                    {/* Expand toggle */}
                    <button
                        onClick={() => toggleExpand(item.id)}
                        className="mt-0.5 text-textSecondary hover:text-textPrimary transition-colors shrink-0"
                    >
                        {isExpanded
                            ? <ChevronDown size={16} />
                            : <ChevronRight size={16} />}
                    </button>

                    {/* Status toggle */}
                    <button
                        onClick={() => {
                            const next = item.status === 'queued' ? 'active' : item.status === 'active' ? 'done' : 'queued';
                            updateItem(item.id, i => ({ ...i, status: next }));
                        }}
                        className={`mt-0.5 shrink-0 ${statusColor} hover:scale-110 transition-transform`}
                        title={STATUS_CONFIG[item.status].label[language]}
                    >
                        <StatusIcon size={16} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {/* Priority dot */}
                            {item.priority && (
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_CONFIG[item.priority].dot}`}
                                    title={PRIORITY_CONFIG[item.priority].label[language]}
                                />
                            )}

                            {/* Name */}
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, i => ({ ...i, name: e.target.value }))}
                                className={`bg-transparent text-sm text-textPrimary outline-none flex-1 min-w-0
                                    ${item.status === 'done' ? 'line-through' : ''}`}
                            />

                            {/* Due date badge */}
                            {daysLeft !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium
                                    ${daysLeft < 0 ? 'bg-red-500/20 text-red-400' :
                                        daysLeft === 0 ? 'bg-orange-500/20 text-orange-400' :
                                            daysLeft <= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-gray-500/10 text-textSecondary'}`}>
                                    {daysLeft < 0 ? (language === 'ru' ? 'Просрочено' : 'Overdue') :
                                        daysLeft === 0 ? (language === 'ru' ? 'Сегодня' : 'Today') :
                                            `${daysLeft}${language === 'ru' ? 'д' : 'd'}`}
                                </span>
                            )}

                            {/* Link indicator */}
                            {item.linkUrl && (
                                <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 shrink-0"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Link2 size={12} />
                                </a>
                            )}

                            {/* Children count */}
                            {childCount > 0 && (
                                <span className="text-[10px] text-textSecondary shrink-0">
                                    {doneChildren}/{childCount}
                                </span>
                            )}
                        </div>

                        {/* Checklist progress bar */}
                        {checklistProgress && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1 rounded-full bg-gray-700/30 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${checklistProgress.percent}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-textSecondary">
                                    {checklistProgress.done}/{checklistProgress.total}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Delete */}
                    <button
                        onClick={() => updateItem(item.id, () => null)}
                        className="text-textSecondary/0 group-hover:text-textSecondary hover:!text-red-400 transition-all shrink-0 mt-0.5"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                    <div className="ml-6 mt-1 space-y-2 pb-2 animate-slideUp" style={{ animationDuration: '0.3s' }}>

                        {/* Action buttons row */}
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => addNote(item.id)}
                                className="text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors"
                            >
                                <FileText size={10} /> {language === 'ru' ? 'Заметка' : 'Note'}
                            </button>
                            <button
                                onClick={() => addChecklistItem(item.id)}
                                className="text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors"
                            >
                                <ListChecks size={10} /> {language === 'ru' ? 'Чеклист' : 'Checklist'}
                            </button>
                            <button
                                onClick={() => setAddingChildFor(addingChildFor === item.id ? null : item.id)}
                                className="text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors"
                            >
                                <CornerDownRight size={10} /> {language === 'ru' ? 'Подзадача' : 'Sub-task'}
                            </button>

                            {/* Priority toggle */}
                            <button
                                onClick={() => {
                                    const priorities: (SubItem['priority'])[] = [undefined, 'low', 'medium', 'high'];
                                    const currentIdx = priorities.indexOf(item.priority);
                                    const nextPriority = priorities[(currentIdx + 1) % priorities.length];
                                    updateItem(item.id, i => ({ ...i, priority: nextPriority }));
                                }}
                                className={`text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight flex items-center gap-1 transition-colors
                                    ${item.priority ? PRIORITY_CONFIG[item.priority].color : 'text-textSecondary hover:text-textPrimary'}`}
                            >
                                <Flag size={10} />
                                {item.priority ? PRIORITY_CONFIG[item.priority].label[language] : (language === 'ru' ? 'Приоритет' : 'Priority')}
                            </button>

                            {/* Due date */}
                            <label className="text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-colors cursor-pointer">
                                <Calendar size={10} />
                                <input
                                    type="date"
                                    value={item.dueDate || ''}
                                    onChange={(e) => updateItem(item.id, i => ({ ...i, dueDate: e.target.value || undefined }))}
                                    className="bg-transparent text-[10px] outline-none w-20 cursor-pointer"
                                />
                            </label>

                            {/* Link */}
                            <button
                                onClick={() => {
                                    const url = prompt(language === 'ru' ? 'Введите URL:' : 'Enter URL:', item.linkUrl || 'https://');
                                    if (url !== null) {
                                        updateItem(item.id, i => ({ ...i, linkUrl: url || undefined }));
                                    }
                                }}
                                className={`text-[10px] px-2 py-1 rounded-full bg-surfaceHighlight flex items-center gap-1 transition-colors
                                    ${item.linkUrl ? 'text-blue-400' : 'text-textSecondary hover:text-textPrimary'}`}
                            >
                                <Link2 size={10} /> {language === 'ru' ? 'Ссылка' : 'Link'}
                            </button>
                        </div>

                        {/* Notes */}
                        {item.notes.length > 0 && (
                            <div className="space-y-1.5">
                                {item.notes.map((note) => (
                                    <div key={note.id} className="flex items-start gap-2 bg-surfaceHighlight/50 rounded-lg p-2">
                                        {/* Emoji selector */}
                                        <button
                                            onClick={() => {
                                                const currentIdx = NOTE_TYPES.findIndex(t => t.emoji === note.emoji);
                                                const nextEmoji = NOTE_TYPES[(currentIdx + 1) % NOTE_TYPES.length].emoji;
                                                updateItem(item.id, i => ({
                                                    ...i,
                                                    notes: i.notes.map(n =>
                                                        n.id === note.id ? { ...n, emoji: nextEmoji } : n
                                                    )
                                                }));
                                            }}
                                            className="text-sm mt-0.5 hover:scale-110 transition-transform"
                                        >
                                            {note.emoji || '📝'}
                                        </button>

                                        <textarea
                                            value={note.content}
                                            onChange={(e) => {
                                                updateItem(item.id, i => ({
                                                    ...i,
                                                    notes: i.notes.map(n =>
                                                        n.id === note.id ? { ...n, content: e.target.value } : n
                                                    )
                                                }));
                                            }}
                                            placeholder={language === 'ru' ? 'Напишите заметку...' : 'Write a note...'}
                                            className="flex-1 bg-transparent text-xs text-textPrimary outline-none resize-none min-h-[24px]"
                                            rows={1}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'auto';
                                                target.style.height = target.scrollHeight + 'px';
                                            }}
                                        />

                                        <button
                                            onClick={() => deleteNote(item.id, note.id)}
                                            className="text-textSecondary/50 hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Checklist */}
                        {item.checklist && item.checklist.length > 0 && (
                            <div className="space-y-1">
                                {item.checklist.map((check) => (
                                    <div key={check.id} className="flex items-center gap-2 group/check">
                                        <button
                                            onClick={() => toggleChecklistItem(item.id, check.id)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
                                                ${check.done
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-500 hover:border-green-400'}`}
                                        >
                                            {check.done && <Check size={10} className="text-white" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={check.text}
                                            onChange={(e) => {
                                                updateItem(item.id, i => ({
                                                    ...i,
                                                    checklist: i.checklist?.map(c =>
                                                        c.id === check.id ? { ...c, text: e.target.value } : c
                                                    )
                                                }));
                                            }}
                                            placeholder={language === 'ru' ? 'Пункт...' : 'Item...'}
                                            className={`flex-1 bg-transparent text-xs outline-none
                                                ${check.done ? 'line-through text-textSecondary' : 'text-textPrimary'}`}
                                        />
                                        <button
                                            onClick={() => deleteChecklistItem(item.id, check.id)}
                                            className="text-textSecondary/0 group-hover/check:text-textSecondary hover:!text-red-400 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add child form */}
                        {addingChildFor === item.id && (
                            <div className="flex items-center gap-2 mt-1">
                                <CornerDownRight size={12} className="text-textSecondary shrink-0" />
                                <input
                                    type="text"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addChild(item.id)}
                                    placeholder={language === 'ru' ? 'Подзадача...' : 'Sub-task...'}
                                    className="flex-1 bg-surfaceHighlight rounded-lg px-2.5 py-1.5 text-xs text-textPrimary outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={() => addChild(item.id)}
                                    disabled={!childName.trim()}
                                    className="text-green-400 hover:text-green-300 disabled:opacity-30 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => { setAddingChildFor(null); setChildName(''); }}
                                    className="text-textSecondary hover:text-red-400 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Nested children */}
                        {item.children && item.children.length > 0 && (
                            <div className="space-y-0.5 border-l-2 border-borderSubtle/30 pl-1">
                                {item.children.map(child => renderItem(child, depth + 1))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-1">
            {/* Items list */}
            {items.map(item => renderItem(item, 0))}

            {/* Add new item */}
            <div className="flex items-center gap-2 mt-2">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    placeholder={language === 'ru' ? 'Добавить подзадачу...' : 'Add sub-item...'}
                    className="flex-1 bg-surfaceHighlight rounded-xl px-3 py-2 text-sm text-textPrimary outline-none placeholder:text-textSecondary/50"
                />
                <button
                    onClick={addItem}
                    disabled={!newItemName.trim()}
                    className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center hover:bg-brand/30 disabled:opacity-30 transition-all apple-press"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

export default SubItemsList;

import React, { useState, useMemo } from 'react';
import { X, Plus, Target, Calendar, Link2, Trash2, Check, ChevronRight, Sparkles } from 'lucide-react';
import { Goal, Milestone, Habit, GOAL_EMOJIS, GOAL_COLORS, calculateGoalProgress } from '../types';
import Icon from './Icons';
import { translations } from '../translations';

interface GoalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goals: Goal[];
    habits: Habit[];
    onSaveGoal: (goal: Goal) => void;
    onDeleteGoal: (goalId: string) => void;
    onOpenAIGoalChain?: (goalTitle?: string) => void;
    language: 'ru' | 'en';
}

const GoalsModal: React.FC<GoalsModalProps> = ({
    isOpen,
    onClose,
    goals,
    habits,
    onSaveGoal,
    onDeleteGoal,
    onOpenAIGoalChain,
    language
}) => {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

    const t = {
        ru: {
            title: 'Цели',
            addGoal: 'Добавить цель',
            editGoal: 'Редактировать',
            goalTitle: 'Название цели',
            description: 'Описание (опционально)',
            deadline: 'Дедлайн',
            milestones: 'Этапы',
            addMilestone: 'Добавить этап',
            linkedHabits: 'Связанные привычки',
            selectHabits: 'Выберите привычки',
            save: 'Сохранить',
            delete: 'Удалить',
            cancel: 'Отмена',
            noGoals: 'Пока нет целей',
            createFirst: 'Создайте первую цель',
            progress: 'Прогресс',
            completed: 'Выполнено!',
            emoji: 'Иконка',
            color: 'Цвет'
        },
        en: {
            title: 'Goals',
            addGoal: 'Add Goal',
            editGoal: 'Edit',
            goalTitle: 'Goal Title',
            description: 'Description (optional)',
            deadline: 'Deadline',
            milestones: 'Milestones',
            addMilestone: 'Add Milestone',
            linkedHabits: 'Linked Habits',
            selectHabits: 'Select habits',
            save: 'Save',
            delete: 'Delete',
            cancel: 'Cancel',
            noGoals: 'No goals yet',
            createFirst: 'Create your first goal',
            progress: 'Progress',
            completed: 'Completed!',
            emoji: 'Icon',
            color: 'Color'
        }
    }[language];

    const createNewGoal = (): Goal => ({
        id: `goal_${Date.now()}`,
        title: '',
        emoji: '🎯',
        color: GOAL_COLORS[0],
        milestones: [],
        linkedHabitIds: [],
        createdAt: new Date().toISOString()
    });

    const handleAddGoal = () => {
        setEditingGoal(createNewGoal());
        setView('edit');
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingGoal({ ...goal, milestones: [...goal.milestones] });
        setView('edit');
    };

    const handleSave = () => {
        if (editingGoal && editingGoal.title.trim()) {
            onSaveGoal(editingGoal);
            setEditingGoal(null);
            setView('list');
        }
    };

    const handleAddMilestone = () => {
        if (editingGoal && newMilestoneTitle.trim()) {
            const milestone: Milestone = {
                id: `ms_${Date.now()}`,
                title: newMilestoneTitle.trim(),
                isCompleted: false
            };
            setEditingGoal({
                ...editingGoal,
                milestones: [...editingGoal.milestones, milestone]
            });
            setNewMilestoneTitle('');
        }
    };

    const handleToggleMilestone = (milestoneId: string) => {
        if (editingGoal) {
            setEditingGoal({
                ...editingGoal,
                milestones: editingGoal.milestones.map(m =>
                    m.id === milestoneId
                        ? { ...m, isCompleted: !m.isCompleted, completedAt: !m.isCompleted ? new Date().toISOString() : undefined }
                        : m
                )
            });
        }
    };

    const handleRemoveMilestone = (milestoneId: string) => {
        if (editingGoal) {
            setEditingGoal({
                ...editingGoal,
                milestones: editingGoal.milestones.filter(m => m.id !== milestoneId)
            });
        }
    };

    const handleToggleHabit = (habitId: string) => {
        if (editingGoal) {
            const linked = editingGoal.linkedHabitIds.includes(habitId);
            setEditingGoal({
                ...editingGoal,
                linkedHabitIds: linked
                    ? editingGoal.linkedHabitIds.filter(id => id !== habitId)
                    : [...editingGoal.linkedHabitIds, habitId]
            });
        }
    };

    const handleDelete = () => {
        if (editingGoal) {
            onDeleteGoal(editingGoal.id);
            setEditingGoal(null);
            setView('list');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[85vh] bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-borderSubtle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <Target size={20} className="text-brand" />
                        </div>
                        <h2 className="text-lg font-bold text-textPrimary">
                            {view === 'list' ? t.title : (editingGoal?.id.startsWith('goal_') && !goals.find(g => g.id === editingGoal?.id) ? t.addGoal : t.editGoal)}
                        </h2>
                    </div>
                    <button onClick={view === 'list' ? onClose : () => { setView('list'); setEditingGoal(null); }} className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors">
                        <X size={20} className="text-textSecondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'list' ? (
                        <div className="space-y-3">
                            {goals.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                                        <Target size={32} className="text-brand" />
                                    </div>
                                    <p className="text-textSecondary mb-2">{t.noGoals}</p>
                                    <p className="text-xs text-textSecondary/70">{t.createFirst}</p>
                                </div>
                            ) : (
                                goals.filter(g => !g.archived).map(goal => {
                                    const progress = calculateGoalProgress(goal, habits);
                                    return (
                                        <div
                                            key={goal.id}
                                            onClick={() => handleEditGoal(goal)}
                                            className="group p-4 bg-surfaceHighlight rounded-xl cursor-pointer hover:bg-surfaceHighlight/80 transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                                    style={{ backgroundColor: goal.color + '20' }}
                                                >
                                                    {goal.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-textPrimary truncate">{goal.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex-1 h-1.5 bg-borderSubtle rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-textSecondary">{progress}%</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            {goal.milestones.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {goal.milestones.slice(0, 4).map(m => (
                                                        <span
                                                            key={m.id}
                                                            className={`text-[10px] px-2 py-0.5 rounded-full ${m.isCompleted ? 'bg-green-500/20 text-green-600 line-through' : 'bg-borderSubtle text-textSecondary'}`}
                                                        >
                                                            {m.title}
                                                        </span>
                                                    ))}
                                                    {goal.milestones.length > 4 && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-borderSubtle text-textSecondary">
                                                            +{goal.milestones.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {/* Add buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    onClick={handleAddGoal}
                                    className="p-3.5 border border-dashed border-borderSubtle rounded-xl flex items-center justify-center gap-2 text-textSecondary hover:border-brand hover:text-brand transition-colors"
                                >
                                    <Plus size={18} />
                                    <span className="font-medium text-xs">{t.addGoal}</span>
                                </button>

                                {onOpenAIGoalChain && (
                                    <button
                                        onClick={() => onOpenAIGoalChain()}
                                        className="p-3.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 text-purple-300 hover:text-white transition-all font-semibold text-xs"
                                    >
                                        <Sparkles size={16} className="text-purple-400" />
                                        <span>AI Цепочка шагов</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : editingGoal && (
                        <div className="space-y-5">
                            {/* Emoji & Color picker */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-textSecondary mb-2 block">{t.emoji}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {GOAL_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => setEditingGoal({ ...editingGoal, emoji })}
                                                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${editingGoal.emoji === emoji ? 'bg-brand/20 ring-2 ring-brand' : 'bg-surfaceHighlight hover:bg-surfaceHighlight/80'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Color picker */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.color}</label>
                                <div className="flex gap-2">
                                    {GOAL_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingGoal({ ...editingGoal, color })}
                                            className={`w-8 h-8 rounded-full transition-all ${editingGoal.color === color ? 'ring-2 ring-offset-2 ring-brand' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.goalTitle}</label>
                                <input
                                    type="text"
                                    value={editingGoal.title}
                                    onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                    placeholder={language === 'ru' ? 'Пробежать марафон' : 'Run a marathon'}
                                    className="w-full p-3 bg-surfaceHighlight rounded-xl text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.description}</label>
                                <textarea
                                    value={editingGoal.description || ''}
                                    onChange={e => setEditingGoal({ ...editingGoal, description: e.target.value })}
                                    placeholder={language === 'ru' ? 'Почему это важно для меня...' : 'Why this matters to me...'}
                                    rows={2}
                                    className="w-full p-3 bg-surfaceHighlight rounded-xl text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                                />
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.deadline}</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                                    <input
                                        type="date"
                                        value={editingGoal.targetDate || ''}
                                        onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                                        className="w-full p-3 pl-10 bg-surfaceHighlight rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>
                            </div>

                            {/* Milestones */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.milestones}</label>
                                <div className="space-y-2">
                                    {editingGoal.milestones.map(m => (
                                        <div key={m.id} className="flex items-center gap-2 p-2 bg-surfaceHighlight rounded-lg">
                                            <button
                                                onClick={() => handleToggleMilestone(m.id)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${m.isCompleted ? 'bg-green-500 border-green-500' : 'border-borderSubtle'}`}
                                            >
                                                {m.isCompleted && <Check size={14} className="text-white" />}
                                            </button>
                                            <span className={`flex-1 text-sm ${m.isCompleted ? 'text-textSecondary line-through' : 'text-textPrimary'}`}>
                                                {m.title}
                                            </span>
                                            <button onClick={() => handleRemoveMilestone(m.id)} className="p-1 text-textSecondary hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMilestoneTitle}
                                            onChange={e => setNewMilestoneTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddMilestone()}
                                            placeholder={language === 'ru' ? 'Новый этап...' : 'New milestone...'}
                                            className="flex-1 p-2 bg-surfaceHighlight rounded-lg text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-brand"
                                        />
                                        <button
                                            onClick={handleAddMilestone}
                                            disabled={!newMilestoneTitle.trim()}
                                            className="p-2 bg-brand text-white rounded-lg disabled:opacity-50"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Linked Habits */}
                            <div>
                                <label className="text-xs font-medium text-textSecondary mb-2 block">{t.linkedHabits}</label>
                                <div className="flex flex-wrap gap-2">
                                    {habits.filter(h => h.type !== 'task' && !h.archived).map(habit => {
                                        const isLinked = editingGoal.linkedHabitIds.includes(habit.id);
                                        return (
                                            <button
                                                key={habit.id}
                                                onClick={() => handleToggleHabit(habit.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isLinked ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}
                                            >
                                                {isLinked && <Link2 size={12} />}
                                                <Icon name={habit.icon} size={14} /> {habit.name}
                                            </button>
                                        );
                                    })}
                                    {habits.filter(h => h.type !== 'task' && !h.archived).length === 0 && (
                                        <p className="text-xs text-textSecondary">{t.selectHabits}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {view === 'edit' && editingGoal && (
                    <div className="p-4 border-t border-borderSubtle flex gap-3">
                        {goals.find(g => g.id === editingGoal.id) && (
                            <button
                                onClick={handleDelete}
                                className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => { setView('list'); setEditingGoal(null); }}
                            className="flex-1 p-3 rounded-xl bg-surfaceHighlight text-textSecondary font-medium hover:bg-surfaceHighlight/80 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!editingGoal.title.trim()}
                            className="flex-1 p-3 rounded-xl bg-brand text-white font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={16} />
                            {t.save}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoalsModal;

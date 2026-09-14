import React, { useState } from 'react';
import { Sparkles, Target, X, ChevronRight, Edit3 } from 'lucide-react';

interface IdentityCardProps {
    identityStatement: string;
    visionStatement: string;
    antiVisionStatement: string;
    onSave: (data: { identity: string; vision: string; antiVision: string }) => void;
    language: 'ru' | 'en';
}

const t = {
    ru: {
        identity: 'Я — тот, кто...',
        vision: 'Моя жизнь через год',
        antiVision: 'Жизнь, которую я НЕ хочу',
        editIdentity: 'Редактировать',
        save: 'Сохранить',
        cancel: 'Отмена',
        placeholder: {
            identity: 'встаёт рано, заботится о здоровье и строит бизнес...',
            vision: 'Опишите свою идеальную жизнь через год...',
            antiVision: 'Что случится, если ничего не изменится?'
        }
    },
    en: {
        identity: "I am the type of person who...",
        vision: 'My life in one year',
        antiVision: "Life I DON'T want",
        editIdentity: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        placeholder: {
            identity: 'wakes up early, takes care of health, and builds a business...',
            vision: 'Describe your ideal life in one year...',
            antiVision: 'What happens if nothing changes?'
        }
    }
};

export const IdentityCard: React.FC<IdentityCardProps> = ({
    identityStatement,
    visionStatement,
    antiVisionStatement,
    onSave,
    language
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        identity: identityStatement,
        vision: visionStatement,
        antiVision: antiVisionStatement
    });

    const labels = t[language];

    const handleSave = () => {
        onSave(editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
                onClick={(e) => { if (e.target === e.currentTarget) setIsEditing(false); }}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                <div className="w-full max-w-md bg-surface rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-in">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand" />
                            {labels.identity}
                        </h2>
                        <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-surfaceHighlight">
                            <X className="w-5 h-5 text-textSecondary" />
                        </button>
                    </div>

                    {/* Identity Statement */}
                    <div>
                        <label className="text-sm font-medium text-textSecondary mb-2 block">{labels.identity}</label>
                        <textarea
                            value={editData.identity}
                            onChange={(e) => setEditData({ ...editData, identity: e.target.value })}
                            placeholder={labels.placeholder.identity}
                            className="w-full p-3 rounded-xl bg-surfaceHighlight border border-borderSubtle text-textPrimary resize-none focus:ring-2 focus:ring-brand/50 focus:outline-none"
                            rows={2}
                        />
                    </div>

                    {/* Vision */}
                    <div>
                        <label className="text-sm font-medium text-green-400 mb-2 block flex items-center gap-2">
                            <Target className="w-4 h-4" /> {labels.vision}
                        </label>
                        <textarea
                            value={editData.vision}
                            onChange={(e) => setEditData({ ...editData, vision: e.target.value })}
                            placeholder={labels.placeholder.vision}
                            className="w-full p-3 rounded-xl bg-surfaceHighlight border border-green-500/20 text-textPrimary resize-none focus:ring-2 focus:ring-green-500/50 focus:outline-none"
                            rows={3}
                        />
                    </div>

                    {/* Anti-Vision */}
                    <div>
                        <label className="text-sm font-medium text-red-400 mb-2 block flex items-center gap-2">
                            <X className="w-4 h-4" /> {labels.antiVision}
                        </label>
                        <textarea
                            value={editData.antiVision}
                            onChange={(e) => setEditData({ ...editData, antiVision: e.target.value })}
                            placeholder={labels.placeholder.antiVision}
                            className="w-full p-3 rounded-xl bg-surfaceHighlight border border-red-500/20 text-textPrimary resize-none focus:ring-2 focus:ring-red-500/50 focus:outline-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-3 rounded-xl bg-surfaceHighlight text-textSecondary font-medium"
                        >
                            {labels.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 rounded-xl bg-brand text-white font-medium"
                        >
                            {labels.save}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Identity Statement - Hero Card */}
            <div
                onClick={() => setIsEditing(true)}
                className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 cursor-pointer group hover:border-brand/40 transition-all"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-brand uppercase tracking-wider">{labels.identity}</span>
                        <Edit3 className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-lg font-semibold text-textPrimary leading-relaxed">
                        {identityStatement || <span className="text-textSecondary italic">{labels.placeholder.identity}</span>}
                    </p>
                </div>
            </div>

            {/* Vision & Anti-Vision Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Vision */}
                <div
                    onClick={() => setIsEditing(true)}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 cursor-pointer hover:border-green-500/40 transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-medium text-green-400">{labels.vision}</span>
                    </div>
                    <p className="text-sm text-textPrimary line-clamp-3">
                        {visionStatement || <span className="text-textSecondary italic text-xs">{labels.placeholder.vision}</span>}
                    </p>
                    <ChevronRight className="w-4 h-4 text-green-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Anti-Vision */}
                <div
                    onClick={() => setIsEditing(true)}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 cursor-pointer hover:border-red-500/40 transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-medium text-red-400">{labels.antiVision}</span>
                    </div>
                    <p className="text-sm text-textPrimary line-clamp-3">
                        {antiVisionStatement || <span className="text-textSecondary italic text-xs">{labels.placeholder.antiVision}</span>}
                    </p>
                    <ChevronRight className="w-4 h-4 text-red-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>
    );
};

export default IdentityCard;

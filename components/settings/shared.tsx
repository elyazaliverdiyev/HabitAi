
import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';

// --- Section Title ---
interface SectionTitleProps {
    children: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
    <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider px-2 mb-2 mt-6">{children}</h3>
);

// --- Menu Item ---
interface MenuItemProps {
    icon: React.ElementType;
    label: string;
    subLabel?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
    locked?: boolean;
}

export const MenuItem = ({
    icon: Icon, label, subLabel, onClick, rightElement, danger, locked
}: MenuItemProps) => (
    <button
        onClick={locked ? undefined : onClick}
        className={`w-full flex items-center justify-between p-3.5 hover:bg-surfaceHighlight/50 btn-press first:rounded-t-2xl last:rounded-b-2xl bg-surfaceHighlight/30 border-x border-t last:border-b border-borderSubtle group ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${danger ? 'bg-red-500/10 text-red-500' : 'bg-surfaceHighlight text-textSecondary group-hover:text-textPrimary'}`}>
                <Icon size={16} />
            </div>
            <div className="text-left">
                <div className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-textPrimary'}`}>{label}</div>
                {subLabel && <div className="text-[10px] text-textSecondary">{subLabel}</div>}
            </div>
        </div>
        {locked ? <Lock size={16} className="text-textSecondary" /> : (rightElement || <ChevronRight size={16} className="text-textSecondary/50" />)}
    </button>
);

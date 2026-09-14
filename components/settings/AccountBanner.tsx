
import React from 'react';
import { CloudOff, Camera } from 'lucide-react';
import ShinyText from '../ShinyText';
import { PRESET_AVATARS } from '../../services/avatarService';

interface AccountBannerProps {
    user: any;
    onLogout: () => void;
    isPro: boolean;
    justUnlocked: boolean;
    proExpiry?: string | null;
    language: 'ru' | 'en';
    avatarType?: 'emoji' | 'photo' | 'preset' | 'google';
    avatarValue?: string;
    onOpenAvatarPicker: () => void;
    t: any;
}

const AccountBanner: React.FC<AccountBannerProps> = ({
    user, onLogout, isPro, justUnlocked, proExpiry, language,
    avatarType, avatarValue, onOpenAvatarPicker, t
}) => {
    if (user) {
        return (
            <div className="flex items-center gap-4 p-4 bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle mb-6">
                {/* Interactive Avatar */}
                <button
                    onClick={onOpenAvatarPicker}
                    className="relative w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden group transition-transform hover:scale-105 shrink-0"
                    style={{
                        background: avatarType === 'preset' && avatarValue
                            ? PRESET_AVATARS.find(p => p.id === avatarValue)?.gradient || 'var(--brand)'
                            : avatarType === 'emoji' ? 'var(--surfaceHighlight)'
                                : 'linear-gradient(135deg, var(--brand) 0%, rgba(var(--brand-rgb), 0.7) 100%)'
                    }}
                >
                    {avatarType === 'emoji' && avatarValue ? (
                        <span className="text-3xl">{avatarValue}</span>
                    ) : avatarType === 'photo' && avatarValue ? (
                        <img src={avatarValue} alt="Avatar" className="w-full h-full object-cover" />
                    ) : avatarType === 'preset' && avatarValue ? (
                        <span className="text-white text-xl">{(user.displayName || user.email)?.charAt(0).toUpperCase()}</span>
                    ) : user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-brand">{(user.displayName || user.email)?.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={18} className="text-white" />
                    </div>
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="font-bold text-textPrimary truncate">{user.user_metadata?.full_name || user.user_metadata?.name || user.displayName || user.email?.split('@')[0] || 'User'}</div>
                        {(isPro || justUnlocked) && (
                            <span className="bg-gradient-to-r from-brand to-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase shadow-sm">
                                <ShinyText speed={2} shineColor="rgba(255,255,255,0.6)">PRO</ShinyText>
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-textSecondary truncate">{user.email}</div>
                    {(isPro || justUnlocked) && proExpiry && (
                        <div className="text-[10px] text-brand mt-0.5">{t.proUntil} {proExpiry === 'lifetime' ? (language === 'ru' ? 'Вечно' : 'Forever') : new Date(proExpiry).toLocaleDateString()}</div>
                    )}
                </div>
                <button onClick={onLogout} className="text-xs text-red-500 font-bold hover:underline">{t.logout}</button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
            <CloudOff size={20} className="text-orange-500" />
            <div className="flex-1">
                <div className="text-sm font-bold text-textPrimary">{t.localMode}</div>
                <div className="text-[10px] text-textSecondary">{t.localModeDesc}</div>
            </div>
        </div>
    );
};

export default AccountBanner;

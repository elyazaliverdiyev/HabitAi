import React, { useState, useRef } from 'react';
import { X, Camera, Smile, Palette, Check, Upload, Loader2 } from 'lucide-react';
import { PRESET_AVATARS, AVATAR_EMOJIS, uploadAvatar, compressImage } from '../services/avatarService';

interface AvatarPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'emoji' | 'photo' | 'preset' | 'google', value: string) => void;
    currentType?: 'emoji' | 'photo' | 'preset' | 'google';
    currentValue?: string;
    userId?: string;
    userName?: string;
    language?: 'ru' | 'en';
}

type Tab = 'emoji' | 'photo' | 'preset';

const TABS: { id: Tab; icon: React.ElementType; label: { ru: string; en: string } }[] = [
    { id: 'emoji', icon: Smile, label: { ru: 'Эмодзи', en: 'Emoji' } },
    { id: 'photo', icon: Camera, label: { ru: 'Фото', en: 'Photo' } },
    { id: 'preset', icon: Palette, label: { ru: 'Стиль', en: 'Preset' } },
];

const AvatarPicker: React.FC<AvatarPickerProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentType,
    currentValue,
    userId,
    userName = 'U',
    language = 'ru'
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('emoji');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = {
        title: language === 'ru' ? 'Выберите аватарку' : 'Choose Avatar',
        uploadPhoto: language === 'ru' ? 'Загрузить фото' : 'Upload Photo',
        dragOrClick: language === 'ru' ? 'Нажмите или перетащите файл' : 'Click or drag file',
        uploading: language === 'ru' ? 'Загрузка...' : 'Uploading...',
        error: language === 'ru' ? 'Ошибка загрузки' : 'Upload failed',
        maxSize: language === 'ru' ? 'Макс. 5 МБ' : 'Max 5 MB',
    };

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setUploadError(language === 'ru' ? 'Выберите изображение' : 'Please select an image');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError(language === 'ru' ? 'Файл слишком большой (макс. 5 МБ)' : 'File too large (max 5 MB)');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Compress image
            const compressed = await compressImage(file, 400, 0.85);
            // Convert to Base64
            const url = await uploadAvatar(compressed, userId);
            onSelect('photo', url);
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError(t.error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        onSelect('emoji', emoji);
        onClose();
    };

    const handlePresetSelect = (presetId: string) => {
        onSelect('preset', presetId);
        onClose();
    };

    const getInitials = () => {
        return userName.charAt(0).toUpperCase();
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 modal-overlay"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-surface border border-borderSubtle rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-borderSubtle">
                    <h2 className="text-lg font-bold text-textPrimary">{t.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors"
                    >
                        <X size={20} className="text-textSecondary" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-borderSubtle">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-brand border-b-2 border-brand'
                                : 'text-textSecondary hover:text-textPrimary'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label[language]}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    {/* Emoji Tab */}
                    {activeTab === 'emoji' && (
                        <div className="grid grid-cols-8 gap-2">
                            {AVATAR_EMOJIS.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className={`w-10 h-10 text-2xl flex items-center justify-center rounded-xl transition-all hover:bg-surfaceHighlight hover:scale-110 ${currentType === 'emoji' && currentValue === emoji
                                        ? 'bg-brand/20 ring-2 ring-brand'
                                        : ''
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Photo Tab */}
                    {activeTab === 'photo' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !userId}
                                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all ${isUploading
                                    ? 'border-brand bg-brand/10'
                                    : 'border-borderSubtle hover:border-brand hover:bg-surfaceHighlight'
                                    }`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={32} className="text-brand animate-spin" />
                                        <span className="text-xs text-textSecondary">{t.uploading}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-textSecondary" />
                                        <span className="text-xs text-textSecondary text-center px-2">
                                            {t.dragOrClick}
                                        </span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-textSecondary">{t.maxSize}</p>

                            {uploadError && (
                                <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                            )}

                            {!userId && (
                                <p className="text-xs text-orange-500 font-medium">
                                    {language === 'ru' ? 'Войдите для загрузки фото' : 'Sign in to upload photos'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preset Tab */}
                    {activeTab === 'preset' && (
                        <div className="grid grid-cols-4 gap-3">
                            {PRESET_AVATARS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset.id)}
                                    className={`aspect-square rounded-2xl flex items-center justify-center text-white text-xl font-bold transition-all hover:scale-105 ${currentType === 'preset' && currentValue === preset.id
                                        ? 'ring-4 ring-brand ring-offset-2 ring-offset-surface'
                                        : ''
                                        }`}
                                    style={{ background: preset.gradient }}
                                >
                                    {getInitials()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvatarPicker;



/**
 * Upload avatar image to Firebase Storage
 * @param file - Image file to upload
 * @param userId - User ID for path
 * @returns Download URL of uploaded image
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file as base64'));
        reader.readAsDataURL(file);
    });
};

/**
 * Delete avatar from Firebase Storage (No-op now since we use base64 in Firestore)
 * @param avatarUrl - Full URL or base64 of avatar to delete
 */
export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
    // No-op: previously we deleted from Firebase Storage. Now it's just removed from Firestore document.
};

/**
 * Compress image before upload
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality 0-1
 * @returns Compressed file
 */
export const compressImage = (file: File, maxWidth = 400, quality = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

// Preset avatars - gradient backgrounds with initials
export const PRESET_AVATARS = [
    { id: 'gradient-1', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'gradient-2', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'gradient-3', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'gradient-4', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'gradient-5', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'gradient-6', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'gradient-7', gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' },
    { id: 'gradient-8', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { id: 'gradient-9', gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)' },
    { id: 'gradient-10', gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
    { id: 'gradient-11', gradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)' },
    { id: 'gradient-12', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
];

// Popular emojis for avatars
export const AVATAR_EMOJIS = [
    // Faces
    '😀', '😎', '🤩', '🥳', '😇', '🤗', '🧐', '🤓', '😏', '🥰',
    // People
    '👨', '👩', '🧑', '👶', '🧓', '👷', '🧑‍💻', '🧑‍🎨', '🧑‍🚀', '🦸',
    // Animals
    '🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐸', '🦄',
    // Nature
    '🌸', '🌺', '🌻', '🌈', '⭐', '🌙', '☀️', '🔥', '💎', '🍀',
    // Objects
    '🎯', '🏆', '🎨', '🎭', '🎪', '🎢', '🚀', '⚡', '💫', '✨',
    // Symbols
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '💝',
];

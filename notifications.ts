/**
 * Unified Notification Service
 * Works on both PWA (Web Notifications API) and Capacitor (Android Local Notifications)
 */

import { Capacitor } from '@capacitor/core';

// Check if we're running in Capacitor native environment
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (isNativePlatform()) {
        // For native, we'll use Capacitor Local Notifications
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const permission = await LocalNotifications.requestPermissions();
            return permission.display === 'granted';
        } catch (e) {
            console.warn('Capacitor Local Notifications not available:', e);
            return false;
        }
    } else {
        // Web Notifications API
        if (!('Notification' in window)) {
            console.warn('Notifications not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }
};

// Check current notification permission status
export const getNotificationPermission = async (): Promise<'granted' | 'denied' | 'default'> => {
    if (isNativePlatform()) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const permission = await LocalNotifications.checkPermissions();
            if (permission.display === 'granted') return 'granted';
            if (permission.display === 'denied') return 'denied';
            return 'default';
        } catch {
            return 'default';
        }
    } else {
        if (!('Notification' in window)) return 'denied';
        return Notification.permission;
    }
};

// Schedule a notification
export interface ScheduledNotification {
    id: number;
    title: string;
    body: string;
    scheduleAt: Date;
    habitId?: string;
    sound?: boolean;
}

let notificationIdCounter = 1;

export const scheduleNotification = async (
    notification: Omit<ScheduledNotification, 'id'>
): Promise<number> => {
    const id = notificationIdCounter++;

    if (isNativePlatform()) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
                notifications: [{
                    id,
                    title: notification.title,
                    body: notification.body,
                    schedule: { at: notification.scheduleAt },
                    sound: notification.sound ? 'default' : undefined,
                    extra: { habitId: notification.habitId }
                }]
            });
            console.log(`Scheduled native notification #${id} for ${notification.scheduleAt}`);
        } catch (e) {
            console.error('Failed to schedule native notification:', e);
        }
    } else {
        // For web, use setTimeout (only works while page is open)
        // For background notifications, need Service Worker + Push API
        const delay = notification.scheduleAt.getTime() - Date.now();

        if (delay > 0) {
            setTimeout(() => {
                showInstantNotification(notification.title, notification.body, notification.habitId);
            }, delay);
            console.log(`Scheduled web notification #${id} for ${notification.scheduleAt}`);
        }
    }

    return id;
};

// Show instant notification
export const showInstantNotification = async (
    title: string,
    body: string,
    habitId?: string
): Promise<void> => {
    if (isNativePlatform()) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
                notifications: [{
                    id: notificationIdCounter++,
                    title,
                    body,
                    schedule: { at: new Date(Date.now() + 100) }, // Almost instant
                    extra: { habitId }
                }]
            });
        } catch (e) {
            console.error('Failed to show native notification:', e);
        }
    } else {
        // Web Notifications API
        if (Notification.permission === 'granted') {
            const n = new Notification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: habitId || 'habit-reminder',
                requireInteraction: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => n.close(), 5000);
        }
    }
};

// Cancel a scheduled notification
export const cancelNotification = async (id: number): Promise<void> => {
    if (isNativePlatform()) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch (e) {
            console.error('Failed to cancel notification:', e);
        }
    }
    // For web setTimeout, we'd need to track timeout IDs (not implemented here)
};

// Cancel all notifications for a habit
export const cancelAllHabitNotifications = async (habitId: string): Promise<void> => {
    if (isNativePlatform()) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const pending = await LocalNotifications.getPending();
            const toCancel = pending.notifications
                .filter(n => n.extra?.habitId === habitId)
                .map(n => ({ id: n.id }));

            if (toCancel.length > 0) {
                await LocalNotifications.cancel({ notifications: toCancel });
            }
        } catch (e) {
            console.error('Failed to cancel habit notifications:', e);
        }
    }
};

// Schedule habit reminders based on habit settings
export const scheduleHabitReminders = async (
    habitId: string,
    habitName: string,
    reminderTime: string, // HH:MM format
    frequency: 'daily' | 'weekly' | 'specific_days',
    frequencyDays?: number[], // 0-6 for days of week (0 = Sunday)
    language: 'ru' | 'en' = 'en'
): Promise<void> => {
    // First cancel existing notifications for this habit
    await cancelAllHabitNotifications(habitId);

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();

    const messages = {
        ru: {
            title: '🔔 Напоминание',
            body: `Время для: ${habitName}`
        },
        en: {
            title: '🔔 Reminder',
            body: `Time for: ${habitName}`
        }
    };

    // Schedule for next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const scheduleDate = new Date(now);
        scheduleDate.setDate(now.getDate() + dayOffset);
        scheduleDate.setHours(hours, minutes, 0, 0);

        // Skip if time has passed today
        if (scheduleDate <= now) continue;

        const dayOfWeek = scheduleDate.getDay();

        // Check if we should schedule for this day
        let shouldSchedule = false;

        if (frequency === 'daily') {
            shouldSchedule = true;
        } else if (frequency === 'specific_days' && frequencyDays) {
            shouldSchedule = frequencyDays.includes(dayOfWeek);
        } else if (frequency === 'weekly') {
            // Weekly habits: schedule for Monday by default
            shouldSchedule = dayOfWeek === 1;
        }

        if (shouldSchedule) {
            await scheduleNotification({
                title: messages[language].title,
                body: messages[language].body,
                scheduleAt: scheduleDate,
                habitId,
                sound: true
            });
        }
    }
};

// Morning briefing notification
export const scheduleMorningBriefing = async (
    hour: number = 7,
    minute: number = 0,
    habitCount: number,
    language: 'ru' | 'en' = 'en'
): Promise<void> => {
    const messages = {
        ru: {
            title: '☀️ Доброе утро!',
            body: `У тебя ${habitCount} привычек на сегодня. Удачного дня!`
        },
        en: {
            title: '☀️ Good Morning!',
            body: `You have ${habitCount} habits for today. Have a great day!`
        }
    };

    // Schedule for tomorrow morning
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, minute, 0, 0);

    await scheduleNotification({
        title: messages[language].title,
        body: messages[language].body,
        scheduleAt: tomorrow,
        sound: true
    });
};

// Weekly summary notification (scheduled for Sunday evening)
export const scheduleWeeklySummary = async (
    weeklyCompletions: number,
    bestStreak: number,
    completionRate: number,
    language: 'ru' | 'en' = 'en'
): Promise<void> => {
    const messages = {
        ru: {
            title: '📊 Твоя неделя в HabitAI',
            body: `${weeklyCompletions} выполнений • Лучший streak: ${bestStreak} дней • ${Math.round(completionRate)}% успешность`
        },
        en: {
            title: '📊 Your Week in HabitAI',
            body: `${weeklyCompletions} completions • Best streak: ${bestStreak} days • ${Math.round(completionRate)}% success rate`
        }
    };

    // Find the next Sunday at 18:00
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7; // If Sunday, schedule for next Sunday
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(18, 0, 0, 0);

    await scheduleNotification({
        title: messages[language].title,
        body: messages[language].body,
        scheduleAt: nextSunday,
        sound: true
    });
};

/**
 * Целевая миграция двух пользователей из Firebase в Supabase.
 * Запуск: node scripts/migrate_two_users.js
 */

import { initializeApp as initAdmin, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp as initWeb } from 'firebase/app';
import { getFirestore as getWebFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// ====================================================
// КОНФИГУРАЦИЯ: Firebase UID → Supabase Email
// ====================================================
const USERS_TO_MIGRATE = [
    { firebaseUid: 'J9QjcvAZgkcku81hQ6YgMyhhpCd2', label: 'Owner (Elyaz)' },
    { firebaseUid: 'uLZ4Y0D9IYWECrH1kCB2P9aBg3M2', label: 'Wife (Akkerman)' },
];

// 1. Firebase Admin (только для Auth — узнать email по UID)
const serviceAccountPath = join(process.cwd(), 'scripts', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
initAdmin({ credential: cert(serviceAccount) });
const auth = getAuth();

// 2. Firebase Web SDK (Firestore — без биллинга)
const webApp = initWeb({ projectId: 'habitai-90e1e' });
const webDb = getWebFirestore(webApp);

// 3. Supabase (Service Role — admin доступ)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Нет VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ====================================================
const migrateSub = async (firebaseUid, subName, tableName, sbUuid, mapFn) => {
    try {
        const subRef = collection(webDb, `users/${firebaseUid}/${subName}`);
        const snap = await getDocs(subRef);
        if (snap.empty) { console.log(`  ℹ️  ${subName}: пусто`); return; }
        const items = snap.docs.map(d => mapFn(d.id, d.data(), sbUuid));
        const { error } = await supabase.from(tableName).upsert(items, { onConflict: 'id' });
        if (error) console.error(`  ❌ ${subName}: ${error.message}`);
        else console.log(`  ✅ ${subName}: перенесено ${items.length}`);
    } catch (e) {
        console.error(`  ❌ ${subName}: ${e.message}`);
    }
};

// ====================================================
// ОСНОВНАЯ МИГРАЦИЯ
// ====================================================
async function migrateUser(firebaseUid, label) {
    console.log(`\n${'='.repeat(55)}`);
    console.log(`👤 Мигрируем: ${label} (Firebase UID: ${firebaseUid})`);
    console.log('='.repeat(55));

    // — Шаг 1: Получаем Firebase пользователя (email, displayName)
    let fbUser;
    try {
        fbUser = await auth.getUser(firebaseUid);
        console.log(`  📧 Email: ${fbUser.email}`);
    } catch (e) {
        console.error(`  ❌ Не найден в Firebase Auth: ${e.message}`);
        return;
    }

    // — Шаг 2: Находим или создаём пользователя в Supabase Auth
    let sbUuid;
    try {
        const { data: sbUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = sbUsers?.users?.find(u => u.email?.toLowerCase() === fbUser.email?.toLowerCase());

        if (existing) {
            sbUuid = existing.id;
            console.log(`  🔄 Supabase ID: ${sbUuid} (уже существует)`);
        } else {
            const { data: created, error } = await supabase.auth.admin.createUser({
                email: fbUser.email,
                email_confirm: true,
                user_metadata: {
                    full_name: fbUser.displayName || '',
                    avatar_url: fbUser.photoURL || ''
                }
            });
            if (error) throw new Error(error.message);
            sbUuid = created.user.id;
            console.log(`  ✨ Создан в Supabase Auth: ${sbUuid}`);
        }
    } catch (e) {
        console.error(`  ❌ Ошибка Supabase Auth: ${e.message}`);
        return;
    }

    // — Шаг 3: Читаем данные из Firestore
    try {
        const userDocRef = doc(webDb, 'users', firebaseUid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log('  ⚠️  Нет документа профиля в Firestore');
        } else {
            const d = userDocSnap.data();
            console.log(`  📦 Данные профиля получены из Firestore`);

            // Upsert профиль в Supabase
            const isAdmin = ['elyaz.aliverdiyev@gmail.com', 'akkermanm708@gmail.com']
                .includes(fbUser.email?.toLowerCase());

            const { error: profileError } = await supabase.from('users').upsert({
                id: sbUuid,
                email: d.email || fbUser.email,
                displayName: d.displayName || fbUser.displayName || '',
                photoBase64: d.photoBase64 || null,
                settings: d.settings || {},
                rewards: d.rewards || {},
                isPro: isAdmin || d.isPro || false,
                proExpiry: isAdmin ? 'lifetime' : (d.proExpiry || null),
                isPublic: d.isPublic || false,
                habitConnections: d.habitConnections || [],
                userIdentities: d.userIdentities || [],
                activeIdentityId: d.activeIdentityId || null,
                createdAt: d.createdAt
                    ? new Date(d.createdAt?.seconds ? d.createdAt.seconds * 1000 : d.createdAt).toISOString()
                    : new Date().toISOString()
            }, { onConflict: 'id' });

            if (profileError) console.error(`  ❌ Профиль: ${profileError.message}`);
            else console.log('  ✅ Профиль сохранён');

            // Привычки (из поля habits[] внутри документа)
            if (d.habits && Array.isArray(d.habits) && d.habits.length > 0) {
                const habitsToInsert = d.habits.map(h => ({
                    id: h.id,
                    user_id: sbUuid,
                    name: h.name,
                    type: h.type || 'habit',
                    description: h.description || null,
                    icon: h.icon || null,
                    color: h.color || null,
                    category: h.category || null,
                    frequency: h.frequency || null,
                    frequencyDays: h.frequencyDays || null,
                    targetCount: h.targetCount || null,
                    time: h.time || null,
                    duration: h.duration || null,
                    ultimateTarget: h.ultimateTarget || null,
                    adaptiveLevel: h.adaptiveLevel || null,
                    cost: h.cost || null,
                    currency: h.currency || null,
                    difficulty: h.difficulty || null,
                    isKeystone: h.isKeystone || false,
                    completedDates: h.completedDates || [],
                    extension: h.extension || null,
                    items: h.items || null,
                    tags: h.tags || null,
                    photoJournal: h.photoJournal || null,
                    archived: h.archived || false,
                    createdAt: h.createdAt
                        ? new Date(h.createdAt?.seconds ? h.createdAt.seconds * 1000 : h.createdAt).toISOString()
                        : new Date().toISOString()
                }));
                const { error: habitsError } = await supabase.from('habits').upsert(habitsToInsert, { onConflict: 'id' });
                if (habitsError) console.error(`  ❌ Привычки: ${habitsError.message}`);
                else console.log(`  ✅ Привычки: перенесено ${habitsToInsert.length}`);
            }
        }

        // — Шаг 4: Подколлекции
        await migrateSub(firebaseUid, 'goals', 'goals', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                name: data.name, description: data.description,
                targetDate: data.targetDate, status: data.status,
                progress: data.progress, milestones: data.milestones,
                linkedHabits: data.linkedHabits,
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

        await migrateSub(firebaseUid, 'reflections', 'reflections', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                text: data.text, date: data.date, type: data.type, context: data.context,
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

        await migrateSub(firebaseUid, 'reflectionSessions', 'reflectionSessions', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                date: data.date, entries: data.entries, insights: data.insights,
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

        await migrateSub(firebaseUid, 'deepAnalysis', 'deepAnalysis', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                date: data.date, analysis: data.analysis, context: data.context,
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

        await migrateSub(firebaseUid, 'aiInsights', 'aiInsights', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                date: data.date, insight: data.insight, category: data.category,
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

        await migrateSub(firebaseUid, 'vault', 'vault', sbUuid,
            (id, data, uid) => ({
                id, user_id: uid,
                balance: data.balance || 0, currency: data.currency, transactions: data.transactions || [],
                createdAt: data.createdAt
                    ? new Date(data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
                    : new Date().toISOString()
            }));

    } catch (e) {
        console.error(`  ❌ Ошибка Firestore: ${e.message}`);
    }

    console.log(`\n🎉 ${label} — миграция завершена!`);
}

async function main() {
    console.log('\n🚀 ТОЧЕЧНАЯ МИГРАЦИЯ ДВУХ ПОЛЬЗОВАТЕЛЕЙ\n');
    for (const u of USERS_TO_MIGRATE) {
        await migrateUser(u.firebaseUid, u.label);
    }
    console.log('\n\n✅ ВСЕ ПОЛЬЗОВАТЕЛИ ПЕРЕНЕСЕНЫ!\n');
    process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

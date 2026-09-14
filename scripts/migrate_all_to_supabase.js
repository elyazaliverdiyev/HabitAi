import { initializeApp as initAdmin, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp as initWeb } from 'firebase/app';
import { getFirestore as getWebFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// 1. Initialize Firebase Admin (Only for Auth listUsers)
const serviceAccountPath = join(process.cwd(), 'scripts', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initAdmin({
  credential: cert(serviceAccount)
});

const auth = getAuth();

// 2. Initialize Firebase Web SDK (For Firestore without billing!)
const webApp = initWeb({ projectId: 'habitai-90e1e' });
const webDb = getWebFirestore(webApp);

// 3. Initialize Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ В .env.local отсутствуют VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function migrate() {
    console.log("🚀 Начинаем обходную миграцию (без биллинга Google)...");

    // 1. Fetch all Firebase Users from Auth
    let firebaseUsers = [];
    let pageToken;
    do {
        const result = await auth.listUsers(1000, pageToken);
        firebaseUsers = firebaseUsers.concat(result.users);
        pageToken = result.pageToken;
    } while (pageToken);

    console.log(`Найдено ${firebaseUsers.length} пользователей в Firebase Auth.`);

    for (const fbUser of firebaseUsers) {
        if (!fbUser.email) continue;

        console.log(`\nОбработка пользователя: ${fbUser.email} (FB UID: ${fbUser.uid})`);

        // Create or Get user in Supabase Auth
        let sbUuid;
        const { data: searchData } = await supabase.auth.admin.listUsers();
        let existingUser = searchData?.users?.find(u => u.email === fbUser.email);

        if (existingUser) {
            sbUuid = existingUser.id;
            console.log(`- Пользователь уже есть в Supabase Auth: ${sbUuid}`);
        } else {
            const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                email: fbUser.email,
                email_confirm: true,
                user_metadata: {
                    displayName: fbUser.displayName || '',
                    photoURL: fbUser.photoURL || ''
                }
            });
            if (createError) {
                console.error(`- ❌ Ошибка создания пользователя в Supabase:`, createError.message);
                continue;
            }
            sbUuid = createData.user.id;
            console.log(`- Создан пользователь в Supabase Auth: ${sbUuid}`);
        }

        // Migrate Firestore Data using WEB SDK (No billing required)
        try {
            const userDocRef = doc(webDb, 'users', fbUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                await supabase.from('users').upsert({
                    id: sbUuid,
                    email: userData.email || fbUser.email,
                    displayName: userData.displayName || fbUser.displayName,
                    photoBase64: userData.photoBase64 || fbUser.photoURL || null,
                    settings: userData.settings || {},
                    rewards: userData.rewards || {},
                    createdAt: userData.createdAt ? new Date(userData.createdAt).toISOString() : new Date().toISOString()
                });
                console.log(`- Профиль сохранен.`);

                if (userData.habits && Array.isArray(userData.habits)) {
                    const habitsToInsert = userData.habits.map(h => ({
                        id: h.id,
                        user_id: sbUuid,
                        name: h.name,
                        type: h.type || 'habit',
                        description: h.description,
                        icon: h.icon,
                        color: h.color,
                        category: h.category,
                        frequency: h.frequency,
                        frequencyDays: h.frequencyDays,
                        targetCount: h.targetCount,
                        time: h.time,
                        duration: h.duration,
                        ultimateTarget: h.ultimateTarget,
                        adaptiveLevel: h.adaptiveLevel,
                        cost: h.cost,
                        currency: h.currency,
                        difficulty: h.difficulty,
                        isKeystone: h.isKeystone,
                        completedDates: h.completedDates || [],
                        extension: h.extension,
                        items: h.items,
                        tags: h.tags,
                        photoJournal: h.photoJournal,
                        archived: h.archived || false,
                        createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString()
                    }));

                    if (habitsToInsert.length > 0) {
                        await supabase.from('habits').upsert(habitsToInsert);
                        console.log(`- Перенесено привычек: ${habitsToInsert.length}`);
                    }
                }

                // Helper for subcollections
                const migrateSub = async (subName, tableName, mapFn) => {
                    const subRef = collection(webDb, `users/${fbUser.uid}/${subName}`);
                    const snap = await getDocs(subRef);
                    if (snap.empty) return;
                    
                    const items = snap.docs.map(d => mapFn(d.id, d.data(), sbUuid));
                    await supabase.from(tableName).upsert(items);
                    console.log(`- Перенесено ${subName}: ${items.length}`);
                };

                await migrateSub('goals', 'goals', (id, data, uid) => ({
                    id, user_id: uid, name: data.name, description: data.description,
                    targetDate: data.targetDate, status: data.status, progress: data.progress,
                    milestones: data.milestones, linkedHabits: data.linkedHabits,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

                await migrateSub('reflections', 'reflections', (id, data, uid) => ({
                    id, user_id: uid, text: data.text, date: data.date, type: data.type, context: data.context,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

                await migrateSub('reflectionSessions', 'reflectionSessions', (id, data, uid) => ({
                    id, user_id: uid, date: data.date, entries: data.entries, insights: data.insights,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

                await migrateSub('deepAnalysis', 'deepAnalysis', (id, data, uid) => ({
                    id, user_id: uid, date: data.date, analysis: data.analysis, context: data.context,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

                await migrateSub('aiInsights', 'aiInsights', (id, data, uid) => ({
                    id, user_id: uid, date: data.date, insight: data.insight, category: data.category,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

                await migrateSub('vault', 'vault', (id, data, uid) => ({
                    id, user_id: uid, balance: data.balance, currency: data.currency, transactions: data.transactions,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                }));

            } else {
                console.log(`- ⚠️ Нет данных профиля в Firestore для этого пользователя.`);
            }
        } catch (e) {
            console.error(`- ❌ Ошибка чтения Firestore:`, e.message);
        }
    }

    // 4. Migrate Global Collections
    console.log("\nМиграция глобальных коллекций (промокоды, фидбек)...");
    
    try {
        const promoSnap = await getDocs(collection(webDb, 'promoCodes'));
        if (!promoSnap.empty) {
            const promos = promoSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    code: doc.id,
                    maxUses: data.maxUses,
                    usageCount: data.usageCount,
                    used: data.used,
                    usedBy: data.usedBy,
                    usedAt: data.usedAt,
                    type: data.type,
                    value: data.value,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                };
            });
            await supabase.from('promoCodes').upsert(promos);
            console.log(`✅ Перенесено промокодов: ${promos.length}`);
        }
    } catch (e) { console.error(`❌ Ошибка промокодов:`, e.message); }

    try {
        const feedbackSnap = await getDocs(collection(webDb, 'feedback'));
        if (!feedbackSnap.empty) {
            const feedbacks = feedbackSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    message: data.message,
                    rating: data.rating,
                    type: data.type,
                    userId: null,
                    userEmail: data.userEmail,
                    userAgent: data.userAgent,
                    appVersion: data.appVersion,
                    isHandled: data.isHandled,
                    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
                };
            });
            await supabase.from('feedback').upsert(feedbacks);
            console.log(`✅ Перенесено фидбеков: ${feedbacks.length}`);
        }
    } catch (e) { console.error(`❌ Ошибка фидбека:`, e.message); }

    console.log("\n🎉 ПОЛНАЯ ОБХОДНАЯ МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА!");
}

migrate().catch(console.error);

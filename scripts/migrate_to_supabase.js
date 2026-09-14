import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccountPath = join(process.cwd(), 'scripts', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://otvgzvzcwxffloeeyyiq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseKey) {
    console.error("Please provide VITE_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function migrate() {
    console.log("🚀 Starting migration from Firebase to Supabase (Admin SDK)...");

    // 1. Migrate Users
    console.log("Migrating users...");
    const usersSnap = await db.collection('users').get();
    let userCount = 0;
    
    for (const doc of usersSnap.docs) {
        const data = doc.data();
        const { error } = await supabase.from('users').upsert({
            id: doc.id,
            email: data.email,
            displayName: data.displayName,
            photoBase64: data.photoBase64,
            settings: data.settings || {},
            rewards: data.rewards || {},
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
        });

        if (error) console.error(`Error migrating user ${doc.id}:`, error.message);
        else userCount++;
    }
    console.log(`✅ Migrated ${userCount} users.`);

    // 2. Migrate Habits
    console.log("Migrating habits...");
    const habitsSnap = await db.collection('habits').get();
    let habitsCount = 0;
    
    for (const doc of habitsSnap.docs) {
        const data = doc.data();
        const { error } = await supabase.from('habits').upsert({
            id: doc.id,
            user_id: data.userId || 'MISSING_USER_ID', // Replace with a default if needed
            name: data.name,
            type: data.type || 'habit',
            description: data.description,
            icon: data.icon,
            color: data.color,
            category: data.category,
            frequency: data.frequency,
            frequencyDays: data.frequencyDays || [],
            targetCount: data.targetCount,
            time: data.time,
            duration: data.duration,
            ultimateTarget: data.ultimateTarget,
            adaptiveLevel: data.adaptiveLevel,
            cost: data.cost,
            currency: data.currency,
            difficulty: data.difficulty,
            isKeystone: data.isKeystone,
            completedDates: data.completedDates || [],
            extension: data.extension,
            items: data.items,
            tags: data.tags,
            photoJournal: data.photoJournal,
            archived: data.archived || false,
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()
        });

        if (error) console.error(`Error migrating habit ${doc.id}:`, error.message);
        else habitsCount++;
    }
    console.log(`✅ Migrated ${habitsCount} habits.`);
    
    console.log("🎉 Migration completed!");
}

migrate().catch(console.error);

-- Миграция HabitAI: колонки духовной синхронизации
-- Запуск: supabase db execute или через SQL Editor дашборда
ALTER TABLE users ADD COLUMN IF NOT EXISTS "asmaSrs" jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "transformationJournal" jsonb DEFAULT '[]';

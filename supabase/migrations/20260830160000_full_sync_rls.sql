-- ═══════════════════════════════════════════════════════════════
-- HABITAI: ПОЛНАЯ СИНХРОНИЗАЦИЯ + БЕЗОПАСНОСТЬ (одна миграция)
-- Где выполнить: Supabase Dashboard → SQL Editor → New query → вставить всё → Run
-- https://supabase.com/dashboard/project/otvgzvzcwxffloeeyyiq/sql/new
-- ═══════════════════════════════════════════════════════════════

-- ═══ ЧАСТЬ A: КОЛОНКИ ДУХОВНОЙ СИНХРОНИЗАЦИИ ═══
ALTER TABLE users ADD COLUMN IF NOT EXISTS "asmaSrs" jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "transformationJournal" jsonb DEFAULT '[]';

-- ═══ ЧАСТЬ B: RLS НА users — «каждый правит ТОЛЬКО себя» ═══
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Убираем старые широкие политики (все варианты имён)
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- Новый комплект: аутентифицированный видит/правит/создаёт свою строку
CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Лидерборд: аноним видит только публичные профили (колонка camelCase!)
CREATE POLICY "users_leaderboard_read" ON users FOR SELECT TO anon USING ("isPublic" = true);

-- ═══ ЧАСТЬ C: ДУХОВНЫЕ ТАБЛИЦЫ — RLS «своё только своё» ═══
-- Список таблиц: намерения, мухасаба, благодарности
DO $$
DECLARE tbl TEXT;
DECLARE cols TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['daily_intentions', 'muhasaba_sessions', 'gratitude_entries']
    LOOP
        -- Включаем RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

        -- Чистим старые политики таблицы
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', tbl, tbl);

        -- Каждая операция — только своим user_id
        EXECUTE format(
            'CREATE POLICY "%s_select_own" ON %I FOR SELECT TO authenticated USING (user_id = auth.uid())',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY "%s_insert_own" ON %I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY "%s_update_own" ON %I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
            tbl, tbl
        );
    END LOOP;
END $$;

-- ═══ ЧАСТЬ D: ЖУРНАЛ ТРАНСФОРМАЦИЙ И ТАДАББУР — единая таблица записей ═══
-- Все записи пользователя (благодарности, рефлексии, тадаббур, ответы сердца)
-- в одном месте — фундамент «базы знаний о человеке» для персонального ИИ.
CREATE TABLE IF NOT EXISTS user_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- тип записи: gratitude | reflection | tadabbur | heart_answer | micro_action | custom
    entry_type TEXT NOT NULL,
    -- JSON-контент: { items: [...], mood } | { answer: "..." } | и т.д.
    content JSONB NOT NULL DEFAULT '{}',
    -- связанная сущность (id трансформации, привычки и т.п.)
    ref_id TEXT,
    -- YYYY-MM-DD
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, entry_type, entry_date, ref_id)
);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON user_journal_entries(user_id, entry_date DESC);

ALTER TABLE user_journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_select_own" ON user_journal_entries;
DROP POLICY IF EXISTS "journal_insert_own" ON user_journal_entries;
DROP POLICY IF EXISTS "journal_update_own" ON user_journal_entries;
DROP POLICY IF EXISTS "journal_delete_own" ON user_journal_entries;
CREATE POLICY "journal_select_own" ON user_journal_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "journal_insert_own" ON user_journal_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "journal_update_own" ON user_journal_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "journal_delete_own" ON user_journal_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ═══ ПРОВЕРКА (выполни отдельно после Run) ═══
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('users','daily_intentions','muhasaba_sessions','gratitude_entries','user_journal_entries')
-- ORDER BY tablename, policyname;

-- ═══════════════════════════════════════════════════════════════
-- HABITAI: БЕЗОПАСНОСТЬ RLS + ДУХОВНАЯ СИНХРОНИЗАЦИЯ
-- Выполняется ОДИН раз в Supabase Dashboard → SQL Editor → New query → Run
-- Дашборд: https://supabase.com/dashboard/project/otvgzvzcwxffloeeyyiq/sql/new
-- ═══════════════════════════════════════════════════════════════

-- ─── ЧАСТЬ 1: Колонки духовной синхронизации (99 Имён + Журнал) ───
ALTER TABLE users ADD COLUMN IF NOT EXISTS "asmaSrs" jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "transformationJournal" jsonb DEFAULT '[]';

-- ─── ЧАСТЬ 2: Закрываем дыру — сейчас АНОНИМ может менять чужие данные ───
-- Включаем RLS на таблице users (если вдруг выключен)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые широкие политики (если существуют) — они разрешали всем всё
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Public users are updatable by everyone" ON users;
DROP POLICY IF EXISTS "users_public_select" ON users;
DROP POLICY IF EXISTS "users_public_update" ON users;

-- ─── ЧАСТЬ 3: Новые политики — принцип «каждый видит и правит ТОЛЬКО себя» ───

-- Пользователь читает свою строку
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Пользователь обновляет свою строку
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Пользователь вставляет свою строку (при регистрации)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ─── ЧАСТЬ 4: Лидерборд (публичный рейтинг) ───
-- Приложение читает leaderboard через anon — нужен узкий публичный SELECT,
-- чтобы не сломать существующий функционал рейтинга.
-- ВАЖНО: колонка называется "isPublic" (camelCase, в кавычках!) —
-- так её читает LeaderboardView: .eq('"isPublic"', true)
CREATE POLICY "users_leaderboard_read" ON users
    FOR SELECT
    TO anon
    USING ("isPublic" = true);

-- ═══════════════════════════════════════════════════════════════
-- ПРОВЕРКА ПОСЛЕ ВЫПОЛНЕНИЯ (запусти этот же запрос отдельно):
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
-- Ожидание: 4 политики — select_own, update_own, insert_own, leaderboard_read
--
-- ВАЖНО ПОСЛЕ ЭТОГО ПРОВЕРИТЬ В ПРИЛОЖЕНИИ:
--   1. Лидерборд/Рейтинг — если сломался (нужны данные закрытых юзеров),
--      скажи агенту — добавим отдельную RPC-функцию leaderboard()
--      вместо прямого доступа к таблице.
--   2. Синхронизация настроек/привычек между устройствами должна заработать
--      как задумано (свой пользователь = свои данные).
-- ═══════════════════════════════════════════════════════════════

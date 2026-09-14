/**
 * transformationGenerator.ts — Данные для конструктора собственных трансформаций.
 *
 * По методологии «🛠️ Генератор Трансформаций — Универсальный Шаблон»:
 *  7 шагов из Obsidian-файла → 4 экранных шага визарда:
 *   1. Ситуация + ложная установка (+ источник)
 *   2. Подбор Имени Аллаха по таблице «ложь → Имя» (17 пар)
 *   3. Сборка формулы «Можно мне было думать…» (авто)
 *   4. Проверочный вопрос + сохранение в пользовательскую библиотеку
 *
 * Формула (дословно из шаблона):
 *   Можно мне было думать, что если я [СИТУАЦИЯ],
 *   то только тогда [ЛОЖНАЯ УСТАНОВКА].
 *   Да, мне можно было (3 раза) так думать — это были только мои мысли, только мои.
 *   Мне можно было (3 раза) верить в эти мысли — но они были только мои.
 */

/** Таблица «ложная установка → Имя Аллаха» из шаблона (17 пар) */
export interface NameMatch {
  /** Ключевая ложь (как звучит в голове) */
  lie: string;
  /** Имя Аллаха */
  arabic: string;
  translit: string;
  meaning: string;
  /** Истина для проверочного вопроса */
  truth: string;
}

export const LIE_TO_NAME: NameMatch[] = [
  { lie: 'У меня заберут', arabic: 'المَلِك', translit: 'Аль-Малик', meaning: 'Истинный Владыка — никто не забирает без Его разрешения', truth: 'Аллах — Истинный Владыка всего моего имущества' },
  { lie: 'Я недостоин', arabic: 'الكَرِيم', translit: 'Аль-Карим', meaning: 'Щедрейший — Он даёт не за заслуги', truth: 'Аллах даёт не за заслуги, а по Щедрости' },
  { lie: 'Я урод', arabic: 'المُصَوِّر', translit: 'Аль-Мусаввир', meaning: 'Придающий форму — Он лично создал тебя', truth: 'Аллах лично создал меня в наилучшем образе' },
  { lie: 'Меня не любят', arabic: 'الوَدُود', translit: 'Аль-Вадуд', meaning: 'Любящий безусловно', truth: 'Аллах любит меня безусловно' },
  { lie: 'Мне не помогут', arabic: 'النَّاصِر', translit: 'Ан-Насыр', meaning: 'Помощник — Его помощь не зависит от людей', truth: 'Помощь Аллаха не зависит от людей' },
  { lie: 'Я потеряю всё', arabic: 'الحَفِيظ', translit: 'Аль-Хафиз', meaning: 'Хранитель — Он хранит всё что тебе важно', truth: 'Аллах хранит всё, что мне важно' },
  { lie: 'Будущее страшно', arabic: 'العَلِيم', translit: 'Аль-Алим', meaning: 'Всезнающий — Он знает что будет, и это благо', truth: 'Аллах знает будущее, и оно во благо мне' },
  { lie: 'Я не справлюсь', arabic: 'القَدِير', translit: 'Аль-Кадир', meaning: 'Всемогущий — через Него ты способен на всё', truth: 'Через Аль-Кадира я способен на всё' },
  { lie: 'Никто не поймёт', arabic: 'القَرِيب', translit: 'Аль-Кариб', meaning: 'Ближайший — Он понимает то, что ты не сказал', truth: 'Аллах понимает даже несказанное' },
  { lie: 'Мне нельзя', arabic: 'الفَتَّاح', translit: 'Аль-Фаттах', meaning: 'Открывающий — Он открывает то, что ты считал закрытым', truth: 'Аллах открывает то, что я считал закрытым' },
  { lie: 'Денег не хватит', arabic: 'الرَّزَّاق', translit: 'Ар-Раззак', meaning: 'Дающий удел — Его сокровищницы бесконечны', truth: 'Мой ризк записан, сокровищницы Ар-Раззака бесконечны' },
  { lie: 'Меня предадут', arabic: 'الوَلِيّ', translit: 'Аль-Вали', meaning: 'Покровитель — Он не предаёт и не оставляет', truth: 'Аллах — Покровитель, Который не предаёт' },
  { lie: 'Я слабый', arabic: 'القَوِيّ', translit: 'Аль-Кавий', meaning: 'Сильнейший — Его сила течёт через тебя', truth: 'Сила Аль-Кавия течёт через меня' },
  { lie: 'Всё бессмысленно', arabic: 'الحَكِيم', translit: 'Аль-Хаким', meaning: 'Мудрейший — каждая деталь имеет смысл', truth: 'Каждая деталь моей жизни имеет смысл у Аль-Хакима' },
  { lie: 'Я грешник навсегда', arabic: 'التَّوَّاب', translit: 'Ат-Тавваб', meaning: 'Принимающий покаяние — Он ЖДЁТ твоего возвращения', truth: 'Аллах ждёт моего возвращения и принимает покаяние' },
  { lie: 'Счастье не для меня', arabic: 'الوَهَّاب', translit: 'Аль-Вахаб', meaning: 'Дарующий — Он дарит счастье без причины', truth: 'Аллах дарит благо без причины и без условий' },
  { lie: 'Нужен контроль', arabic: 'الوَكِيل', translit: 'Аль-Вакиль', meaning: 'Попечитель — Он управляет лучше тебя', truth: 'Аллах управляет моей жизнью лучше меня' },
  { lie: 'Меня осудят', arabic: 'العَزِيز', translit: 'Аль-Азиз', meaning: 'Дающий величие — достоинство от Него, не от людей', truth: 'Моё достоинство — от Аль-Азиза, не от людей' },
];

/**
 * Сборка формулы трансформации по шаблону (ШАГ 4 генератора).
 */
export function buildFormula(situation: string, lie: string): string {
  const s = situation.trim().replace(/\.$/, '');
  const l = lie.trim().replace(/\.$/, '');
  return (
    `Можно мне было думать, что если я ${s}, ` +
    `то только тогда ${l}. ` +
    `Да, мне можно было (3 раза) так думать — это были только мои мысли, только мои. ` +
    `Мне можно было (3 раза) верить в эти мысли — но они были только мои.`
  );
}

/**
 * Сборка проверочного вопроса (ШАГ 6): «ВО ЧТО Я ВЕРЮ? ЕСЛИ [ИСТИНА], то...»
 */
export function buildCheckQuestion(truth: string): string {
  return `ВО ЧТО Я ВЕРЮ? ЕСЛИ ${truth.toUpperCase()}, то...`;
}

// ── Пользовательская библиотека (localStorage) ──────────────

const CUSTOM_KEY = 'habitai_custom_transformations';

export interface CustomTransformation {
  id: string;
  title: string;
  /** Собранная формула */
  formula: string;
  /** Проверочный вопрос */
  checkQuestion: string;
  /** Имя Аллаха */
  arabic: string;
  translit: string;
  meaning: string;
  createdAt: string;
}

export function getCustomTransformations(): CustomTransformation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as CustomTransformation[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTransformation(t: Omit<CustomTransformation, 'id' | 'createdAt'>): CustomTransformation {
  const full: CustomTransformation = {
    ...t,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const all = getCustomTransformations();
  all.unshift(full);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all.slice(0, 100)));
  return full;
}

export function deleteCustomTransformation(id: string): void {
  const all = getCustomTransformations().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}

/** Заголовок из установки: «Я потеряю всё» → «Своё: Я потеряю всё» */
export function makeTitle(lie: string): string {
  return lie.trim().replace(/\.$/, '');
}

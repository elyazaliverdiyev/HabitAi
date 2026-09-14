/**
 * asmaulHusna.ts — 99 Прекрасных Имён Аллаха (Асма уль-Хусна).
 *
 * «У Аллаха прекрасные Имена — зовите Его по ним» (Аль-Аъраф, 7:180).
 * «Сердца находят покой только в упоминании Аллаха» (Ар-Раъд, 13:28).
 *
 * Список по известной версии Тирмизи (согласован с материалами пользователя).
 * Каждое Имя — с арабской графикой, транслитерацией и значением.
 * 8 духовных путей (групп) — для курса запоминания и тадабба.
 */

export interface DivineNameEntry {
  /** номер 1-99 */
  n: number;
  arabic: string;
  translit: string;
  /** Краткое значение */
  meaning: string;
  /** Группа-путь */
  group: DivineNameGroup;
}

export type DivineNameGroup =
  | 'mercy'      // Милость и Любовь
  | 'power'      // Могущество и Величие
  | 'oneness'    // Единственность и Владычество
  | 'creator'    // Творение и Форма
  | 'sustainer'  // Наделение и Обеспечение
  | 'knowledge'  // Знание и Мудрость
  | 'justice'    // Справедливость и Суд
  | 'protection';// Защита и Достоинство

export const GROUP_META: Record<DivineNameGroup, {
  id: DivineNameGroup;
  titleRu: string;
  titleEn: string;
  emoji: string;
  color: string;
  /** Смысл пути — против каких слабостей человека */
  purposeRu: string;
}> = {
  mercy: {
    id: 'mercy', titleRu: 'Милость и Любовь', titleEn: 'Mercy & Love', emoji: '💚', color: '#10b981',
    purposeRu: 'Против ненависти к себе и одиночества — сердце учится принимать любовь Творца',
  },
  power: {
    id: 'power', titleRu: 'Могущество и Величие', titleEn: 'Power & Majesty', emoji: '⚡', color: '#ef4444',
    purposeRu: 'Против страха и чувства беспомощности — сила не в тебе, сила — в Нём',
  },
  oneness: {
    id: 'oneness', titleRu: 'Единственность и Владычество', titleEn: 'Oneness & Kingship', emoji: '👑', color: '#f59e0b',
    purposeRu: 'Против рабства перед людьми и мнениями — Владыка один',
  },
  creator: {
    id: 'creator', titleRu: 'Творение и Форма', titleEn: 'Creation & Form', emoji: '🎨', color: '#8b5cf6',
    purposeRu: 'Против стыда за себя — ты создан Творцом без единой ошибки',
  },
  sustainer: {
    id: 'sustainer', titleRu: 'Наделение и Обеспечение', titleEn: 'Provision', emoji: '🌾', color: '#84cc16',
    purposeRu: 'Против страха бедности — ризк записан до твоего рождения',
  },
  knowledge: {
    id: 'knowledge', titleRu: 'Знание и Мудрость', titleEn: 'Knowledge & Wisdom', emoji: '📖', color: '#3b82f6',
    purposeRu: 'Против суеты ума — Он знает то, чего ты не знаешь',
  },
  justice: {
    id: 'justice', titleRu: 'Справедливость и Суд', titleEn: 'Justice & Judgement', emoji: '⚖️', color: '#64748b',
    purposeRu: 'Против обиды на жизнь — Судья справедлив, никому не останется должного',
  },
  protection: {
    id: 'protection', titleRu: 'Защита и Достоинство', titleEn: 'Protection & Honor', emoji: '🛡️', color: '#06b6d4',
    purposeRu: 'Против тревоги за будущее — Хранитель не спит',
  },
};

export const ASMA_UL_HUSNA: DivineNameEntry[] = [
  // ── Единственность и Владычество ──
  { n: 1, arabic: 'اللَّه', translit: 'Аллах', meaning: 'Единый Бог, Истинное Имя, объемлющее все совершенства', group: 'oneness' },
  { n: 2, arabic: 'الرَّحْمَن', translit: 'Ар-Рахман', meaning: 'Милостивый ко всем творениям без исключения', group: 'mercy' },
  { n: 3, arabic: 'الرَّحِيم', translit: 'Ар-Рахим', meaning: 'Милующий верующих особой милостью', group: 'mercy' },
  { n: 4, arabic: 'المَلِك', translit: 'Аль-Малик', meaning: 'Истинный Владыка всего сущего', group: 'oneness' },
  { n: 5, arabic: 'القُدُّوس', translit: 'Аль-Куддус', meaning: 'Пречистый от всяких недостатков', group: 'oneness' },
  { n: 6, arabic: 'السَّلَام', translit: 'Ас-Салям', meaning: 'Источник мира и благополучия', group: 'protection' },
  { n: 7, arabic: 'المُؤْمِن', translit: 'Аль-Муъмин', meaning: 'Дарующий безопасность и веру', group: 'protection' },
  { n: 8, arabic: 'المُهَيْمِن', translit: 'Аль-Мухаймин', meaning: 'Хранитель-Надзиратель всякой вещи', group: 'protection' },
  { n: 9, arabic: 'العَزِيز', translit: 'Аль-Азиз', meaning: 'Всемогущий, Дающий достоинство', group: 'power' },
  { n: 10, arabic: 'الجَبَّار', translit: 'Аль-Джаббар', meaning: 'Исправляющий всякую сломанную вещь', group: 'power' },
  { n: 11, arabic: 'المُتَكَبِّر', translit: 'Аль-Мутакаббир', meaning: 'Величайший, Единственный гордящийся по праву', group: 'power' },
  { n: 12, arabic: 'الخَالِق', translit: 'Аль-Халик', meaning: 'Творец, Создающий из ничего', group: 'creator' },
  { n: 13, arabic: 'البَارِئ', translit: 'Аль-Бари', meaning: 'Создающий без примера и изъяна', group: 'creator' },
  { n: 14, arabic: 'المُصَوِّر', translit: 'Аль-Мусаввир', meaning: 'Придающий форму, Художник творения', group: 'creator' },
  { n: 15, arabic: 'الغَفَّار', translit: 'Аль-Гаффар', meaning: 'Прощающий снова и снова', group: 'mercy' },
  { n: 16, arabic: 'القَهَّار', translit: 'Аль-Каххар', meaning: 'Господствующий над всем', group: 'power' },
  { n: 17, arabic: 'الوَهَّاب', translit: 'Аль-Вахаб', meaning: 'Дарующий без меры и условий', group: 'sustainer' },
  { n: 18, arabic: 'الرَّزَّاق', translit: 'Ар-Раззак', meaning: 'Создатель и Дарующий всякий удел', group: 'sustainer' },
  { n: 19, arabic: 'الفَتَّاح', translit: 'Аль-Фаттах', meaning: 'Открывающий двери блага', group: 'sustainer' },
  { n: 20, arabic: 'العَلِيم', translit: 'Аль-Алим', meaning: 'Всезнающий, Объемлющий знанием всё', group: 'knowledge' },
  { n: 21, arabic: 'القَابِض', translit: 'Аль-Кабид', meaning: 'Удерживающий по мудрости', group: 'justice' },
  { n: 22, arabic: 'البَاسِط', translit: 'Аль-Басит', meaning: 'Распространяющий и дающий простор', group: 'sustainer' },
  { n: 23, arabic: 'الخَافِض', translit: 'Аль-Хафид', meaning: 'Снижающий гордых', group: 'justice' },
  { n: 24, arabic: 'الرَّافِع', translit: 'Ар-Рафиъ', meaning: 'Возвышающий смиренных', group: 'justice' },
  { n: 25, arabic: 'المُعِزّ', translit: 'Аль-Муъизз', meaning: 'Дающий величие и честь', group: 'protection' },
  { n: 26, arabic: 'المُذِلّ', translit: 'Аль-Музилль', meaning: 'Принижающий притеснителей', group: 'justice' },
  { n: 27, arabic: 'السَّمِيع', translit: 'Ас-Самиъ', meaning: 'Всеслышащий каждый шёпот', group: 'knowledge' },
  { n: 28, arabic: 'البَصِير', translit: 'Аль-Басир', meaning: 'Всевидящий всякую вещь', group: 'knowledge' },
  { n: 29, arabic: 'الحَكَم', translit: 'Аль-Хакам', meaning: 'Судья, Чей приговор окончателен', group: 'justice' },
  { n: 30, arabic: 'العَدْل', translit: 'Аль-Адль', meaning: 'Абсолютно Справедливый', group: 'justice' },
  { n: 31, arabic: 'اللَّطِيف', translit: 'Аль-Лятыф', meaning: 'Проницательный, Устраивающий благо незримо', group: 'mercy' },
  { n: 32, arabic: 'الخَبِير', translit: 'Аль-Хабир', meaning: 'Ведающий сокровенное всех вещей', group: 'knowledge' },
  { n: 33, arabic: 'الحَلِيم', translit: 'Аль-Халим', meaning: 'Кроткий, Отсрочивающий наказание', group: 'mercy' },
  { n: 34, arabic: 'العَظِيم', translit: 'Аль-Азым', meaning: 'Величайший, Безграничный', group: 'power' },
  { n: 35, arabic: 'الغَفُور', translit: 'Аль-Гафур', meaning: 'Всепрощающий, Покрывающий грехи', group: 'mercy' },
  { n: 36, arabic: 'الشَّكُور', translit: 'Аш-Шакур', meaning: 'Благодарящий за малое деяние', group: 'mercy' },
  { n: 37, arabic: 'العَلِيّ', translit: 'Аль-Алийй', meaning: 'Всевышний, Высочайший', group: 'power' },
  { n: 38, arabic: 'الكَبِير', translit: 'Аль-Кабир', meaning: 'Величайший над всем', group: 'power' },
  { n: 39, arabic: 'الحَفِيظ', translit: 'Аль-Хафиз', meaning: 'Хранитель всякой вещи', group: 'protection' },
  { n: 40, arabic: 'المُقِيت', translit: 'Аль-Мукит', meaning: 'Поддерживающий силы каждого', group: 'sustainer' },
  { n: 41, arabic: 'الحَسِيب', translit: 'Аль-Хасиб', meaning: 'Достаточный, Ведающий счёт', group: 'justice' },
  { n: 42, arabic: 'الجَلِيل', translit: 'Аль-Джалиль', meaning: 'Величественный, Обладатель величия', group: 'power' },
  { n: 43, arabic: 'الكَرِيم', translit: 'Аль-Карим', meaning: 'Щедрейший без предела', group: 'mercy' },
  { n: 44, arabic: 'الرَّقِيب', translit: 'Ар-Ракиб', meaning: 'Наблюдающий непрестанно', group: 'knowledge' },
  { n: 45, arabic: 'المُجِيب', translit: 'Аль-Муджиб', meaning: 'Отвечающий на каждый зов', group: 'mercy' },
  { n: 46, arabic: 'الوَاسِع', translit: 'Аль-Васиъ', meaning: 'Всеобъемлющий без границ', group: 'sustainer' },
  { n: 47, arabic: 'الحَكِيم', translit: 'Аль-Хаким', meaning: 'Мудрейший в каждом решении', group: 'knowledge' },
  { n: 48, arabic: 'الوَدُود', translit: 'Аль-Вадуд', meaning: 'Любящий и Любимый', group: 'mercy' },
  { n: 49, arabic: 'المَجِيد', translit: 'Аль-Маджид', meaning: 'Славнейший, Благороднейший', group: 'power' },
  { n: 50, arabic: 'البَاعِث', translit: 'Аль-Баис', meaning: 'Воскрешающий после смерти', group: 'justice' },
  { n: 51, arabic: 'الشَّهِيد', translit: 'Аш-Шахид', meaning: 'Свидетель всякого деяния', group: 'knowledge' },
  { n: 52, arabic: 'الحَقّ', translit: 'Аль-Хакк', meaning: 'Истина, Единственная Реальность', group: 'justice' },
  { n: 53, arabic: 'الوَكِيل', translit: 'Аль-Вакиль', meaning: 'Попечитель, Управляющий всеми делами', group: 'protection' },
  { n: 54, arabic: 'القَوِيّ', translit: 'Аль-Кавийй', meaning: 'Всесильный, Неутомимый', group: 'power' },
  { n: 55, arabic: 'المَتِين', translit: 'Аль-Матин', meaning: 'Твёрдый, Крепкий в силе', group: 'power' },
  { n: 56, arabic: 'الوَلِيّ', translit: 'Аль-Валий', meaning: 'Покровитель и Защитник', group: 'protection' },
  { n: 57, arabic: 'الحَمِيد', translit: 'Аль-Хамид', meaning: 'Достойный всей хвалы', group: 'oneness' },
  { n: 58, arabic: 'المُحْصِي', translit: 'Аль-Мухси', meaning: 'Считающий всё до мелочей', group: 'knowledge' },
  { n: 59, arabic: 'المُبْدِئ', translit: 'Аль-Мубди', meaning: 'Начинающий творение', group: 'creator' },
  { n: 60, arabic: 'المُعِيد', translit: 'Аль-Муид', meaning: 'Возвращающий и повторяющий творение', group: 'creator' },
  { n: 61, arabic: 'المُحْيِي', translit: 'Аль-Мухйи', meaning: 'Дающий жизнь', group: 'creator' },
  { n: 62, arabic: 'المُمِيت', translit: 'Аль-Мумит', meaning: 'Определяющий смерть', group: 'justice' },
  { n: 63, arabic: 'الحَيُّ', translit: 'Аль-Хайй', meaning: 'Живой, Вечноживущий', group: 'oneness' },
  { n: 64, arabic: 'القَيُّوم', translit: 'Аль-Каййум', meaning: 'Самосущий, Держитель всего', group: 'oneness' },
  { n: 65, arabic: 'الوَاجِد', translit: 'Аль-Ваджид', meaning: 'Находящий всё, что пожелает', group: 'sustainer' },
  { n: 66, arabic: 'المَاجِد', translit: 'Аль-Маджид', meaning: 'Славный, Великодушный', group: 'power' },
  { n: 67, arabic: 'الوَاحِد', translit: 'Аль-Вахид', meaning: 'Единый без соучастников', group: 'oneness' },
  { n: 68, arabic: 'الأَحَد', translit: 'Аль-Ахад', meaning: 'Единственный, Несравненный', group: 'oneness' },
  { n: 69, arabic: 'الصَّمَد', translit: 'Ас-Самад', meaning: 'Абсолютный, Кого все нуждаются', group: 'oneness' },
  { n: 70, arabic: 'القَادِر', translit: 'Аль-Кадир', meaning: 'Всемогущий, Исполняющий волю', group: 'power' },
  { n: 71, arabic: 'المُقْتَدِر', translit: 'Аль-Муктадир', meaning: 'Полный власти и мощи', group: 'power' },
  { n: 72, arabic: 'المُقَدِّم', translit: 'Аль-Мукаддим', meaning: 'Продвигающий вперёд', group: 'justice' },
  { n: 73, arabic: 'المُؤَخِّر', translit: 'Аль-Муаххир', meaning: 'Откладывающий по мудрости', group: 'justice' },
  { n: 74, arabic: 'الأَوَّل', translit: 'Аль-Авваль', meaning: 'Первый без начала', group: 'oneness' },
  { n: 75, arabic: 'الآخِر', translit: 'Аль-Ахир', meaning: 'Последний без конца', group: 'oneness' },
  { n: 76, arabic: 'الظَّاهِر', translit: 'Аз-Захир', meaning: 'Явный, Очевидный над всем', group: 'oneness' },
  { n: 77, arabic: 'البَاطِن', translit: 'Аль-Батын', meaning: 'Скрытый, Ближайший к сердцу', group: 'oneness' },
  { n: 78, arabic: 'الوَالِي', translit: 'Аль-Вали', meaning: 'Правитель, Распорядитель всего', group: 'oneness' },
  { n: 79, arabic: 'المُتَعَالِي', translit: 'Аль-Мутаалин', meaning: 'Превосходящий всё', group: 'power' },
  { n: 80, arabic: 'البَرّ', translit: 'Аль-Барр', meaning: 'Благодетельный, Источник добра', group: 'mercy' },
  { n: 81, arabic: 'التَّوَّاب', translit: 'Ат-Тавваб', meaning: 'Принимающий покаяние снова и снова', group: 'mercy' },
  { n: 82, arabic: 'المُنْتَقِم', translit: 'Аль-Мунтаким', meaning: 'Воздающий притеснителям', group: 'justice' },
  { n: 83, arabic: 'العَفُوّ', translit: 'Аль-Афувв', meaning: 'Стирающий грехи полностью', group: 'mercy' },
  { n: 84, arabic: 'الرَّؤُوف', translit: 'Ар-Рауф', meaning: 'Сострадательный, Нежный', group: 'mercy' },
  { n: 85, arabic: 'مَالِكُ المُلْك', translit: 'Маликуль-Мульк', meaning: 'Обладатель всей власти', group: 'oneness' },
  { n: 86, arabic: 'ذُو الجَلَالِ وَالإِكْرَام', translit: 'Зуль-Джаляли валь-Икрам', meaning: 'Обладатель Величия и Щедрости', group: 'power' },
  { n: 87, arabic: 'المُقْسِط', translit: 'Аль-Муксит', meaning: 'Восстанавливающий справедливость', group: 'justice' },
  { n: 88, arabic: 'الجَامِع', translit: 'Аль-Джамиъ', meaning: 'Собирающий всё сущее', group: 'justice' },
  { n: 89, arabic: 'الغَنِيُّ', translit: 'Аль-Ганийй', meaning: 'Богатый, Не нуждающийся ни в ком', group: 'oneness' },
  { n: 90, arabic: 'المُغْنِي', translit: 'Аль-Мугни', meaning: 'Обогащающий кого пожелает', group: 'sustainer' },
  { n: 91, arabic: 'المَانِع', translit: 'Аль-Маниъ', meaning: 'Удерживающий вред, Защищающий', group: 'protection' },
  { n: 92, arabic: 'الضَّارّ', translit: 'Ад-Дарр', meaning: 'Позволяющий испытание по мудрости', group: 'justice' },
  { n: 93, arabic: 'النَّافِع', translit: 'Ан-Нафиъ', meaning: 'Дающий всякую пользу', group: 'sustainer' },
  { n: 94, arabic: 'النُّور', translit: 'Ан-Нур', meaning: 'Свет небес и земли', group: 'knowledge' },
  { n: 95, arabic: 'الهَادِي', translit: 'Аль-Хади', meaning: 'Ведущий к благу', group: 'knowledge' },
  { n: 96, arabic: 'البَدِيع', translit: 'Аль-Бадиъ', meaning: 'Творец без подобия и примера', group: 'creator' },
  { n: 97, arabic: 'البَاقِي', translit: 'Аль-Баки', meaning: 'Вечный, Неисчезающий', group: 'oneness' },
  { n: 98, arabic: 'الوَارِث', translit: 'Аль-Варис', meaning: 'Наследник всего сущего', group: 'oneness' },
  { n: 99, arabic: 'الرَّشِيد', translit: 'Ар-Рашид', meaning: 'Направляющий на верный путь', group: 'knowledge' },
];

/** Имя дня: детерминированный цикл по всем 99 (не random) */
export function getNameOfDay(date: Date = new Date()): DivineNameEntry {
  const dayNumber = Math.floor(date.getTime() / 86400000);
  return ASMA_UL_HUSNA[dayNumber % ASMA_UL_HUSNA.length];
}

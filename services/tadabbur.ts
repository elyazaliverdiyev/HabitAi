/**
 * tadabbur.ts — Данные для режима Тадаббур (размышление над Кораном).
 *
 * «Неужели они не размышляют над Кораном?» (Ан-Ниса, 4:82)
 * «Книга, которую Мы ниспослали тебе, благословенна — дабы они
 * размышляли над её аятами» (Сад, 38:29)
 *
 * Подборка аятов о милости, уповании, твёрдости и смысле — по одному
 * в день (детерминированно, не random), с вопросом для размышления
 * и местом для записи рефлексии. Записи сохраняются в localStorage.
 */

export interface TadabburAyah {
  /** Сура:Аят */
  ref: string;
  arabic: string;
  /** Перевод смысла (Кулиев-стиль) */
  translationRu: string;
  translationEn: string;
  /** Вопрос для тадаббура */
  questionRu: string;
  questionEn: string;
  /** Тематическая метка */
  theme: 'mercy' | 'trust' | 'strength' | 'meaning' | 'repentance' | 'gratitude';
}

export const TADABBUR_POOL: TadabburAyah[] = [
  {
    ref: '13:28',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translationRu: '«Разве не в упоминании Аллаха успокаиваются сердца?»',
    translationEn: '"Verily, in the remembrance of Allah do hearts find rest."',
    questionRu: 'Где твоё сердце ищет покой вместо Него — и что сегодня вернуть к поминанию?',
    questionEn: 'Where does your heart seek rest besides Him — and what can you return to His remembrance today?',
    theme: 'trust',
  },
  {
    ref: '94:5-6',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translationRu: '«Ведь за тягостью — облегчение. Воистину, за тягостью — облегчение»',
    translationEn: '"For indeed, with hardship comes ease. Indeed, with hardship comes ease."',
    questionRu: 'Какое облегчение уже готовится за твоей нынешней тягостью?',
    questionEn: 'What ease is already being prepared behind your current hardship?',
    theme: 'strength',
  },
  {
    ref: '2:186',
    arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    translationRu: '«Когда Мои рабы спрашивают тебя обо Мне — Я близок»',
    translationEn: '"And when My servants ask you concerning Me — indeed I am near."',
    questionRu: 'Что ты носишь в себе недосказанным перед Ним? Скажи это сегодня в дуа.',
    questionEn: 'What have you left unsaid before Him? Say it in du\'a today.',
    theme: 'trust',
  },
  {
    ref: '39:53',
    arabic: 'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ',
    translationRu: '«Не отчаивайтесь в милости Аллаха. Воистину, Аллах прощает грехи полностью»',
    translationEn: '"Do not despair of the mercy of Allah. Indeed, Allah forgives all sins."',
    questionRu: 'В чём ты отчаялся(лась) — и готов(а) ли снова попросить прощения?',
    questionEn: 'Where have you despaired — and are you ready to ask forgiveness once more?',
    theme: 'repentance',
  },
  {
    ref: '65:3',
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translationRu: '«Кто уповает на Аллаха — для того Он достаточен»',
    translationEn: '"And whoever relies upon Allah — then He is sufficient for him."',
    questionRu: 'За каким исходом ты следишь с тревогой? Передай его Попечителю письменно.',
    questionEn: 'Which outcome are you anxiously tracking? Hand it over to the Trustee in writing.',
    theme: 'trust',
  },
  {
    ref: '14:7',
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    translationRu: '«Если вы будете благодарны — Я непременно умножу вам»',
    translationEn: '"If you are grateful — I will surely increase you."',
    questionRu: 'Назови три блага этого дня. Как благодарность умножит их?',
    questionEn: 'Name three blessings of this day. How will gratitude multiply them?',
    theme: 'gratitude',
  },
  {
    ref: '3:139',
    arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا',
    translationRu: '«Не слабейте и не печальтесь — вы превозмогете, если вы верующие»',
    translationEn: '"So do not weaken and do not grieve — you will prevail if you are believers."',
    questionRu: 'Что заставило тебя ослабеть? В чём твоя сила на самом деле?',
    questionEn: 'What made you weaken? Where does your strength actually lie?',
    theme: 'strength',
  },
  {
    ref: '2:286',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translationRu: '«Аллах не возлагает на душу сверх её возможностей»',
    translationEn: '"Allah does not burden a soul beyond what it can bear."',
    questionRu: 'Что сегодня кажется непосильным — и какая сила в тебе достаточна для него?',
    questionEn: 'What feels unbearable today — and what strength in you is sufficient for it?',
    theme: 'strength',
  },
  {
    ref: '2:152',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    translationRu: '«Поминайте Меня — и Я помяну вас. Будьте благодарны Мне»',
    translationEn: '"So remember Me — I will remember you. And be grateful to Me."',
    questionRu: 'Ты помянут сегодня. Что меняет это знание в твоём состоянии?',
    questionEn: 'You are remembered today. What does this knowledge change in your state?',
    theme: 'gratitude',
  },
  {
    ref: '40:60',
    arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
    translationRu: '«Взывайте ко Мне — и Я отвечу вам»',
    translationEn: '"Call upon Me — I will respond to you."',
    questionRu: 'Какую одну просьбу ты давно не решаешь произнести? Произнеси.',
    questionEn: 'Which one request have you long dared not voice? Voice it.',
    theme: 'trust',
  },
  {
    ref: '29:69',
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    translationRu: '«А тех, которые усердствуют ради Нас — Мы непременно выведем на Наши пути»',
    translationEn: '"And those who strive for Us — We will surely guide them to Our ways."',
    questionRu: 'В каком усилии тебе нужен ответ сегодня? Аллах обещал путь усердным.',
    questionEn: 'In which effort do you need an answer today? Allah promised a way to the striving.',
    theme: 'meaning',
  },
  {
    ref: '13:11',
    arabic: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
    translationRu: '«Воистину, Аллах не меняет положение людей, пока они не изменят самих себя»',
    translationEn: '"Indeed, Allah will not change the condition of a people until they change what is in themselves."',
    questionRu: 'Какое одно внутреннее изменение откроет внешнюю перемену в твоей жизни?',
    questionEn: 'Which single inner change would unlock the outer change in your life?',
    theme: 'meaning',
  },
  {
    ref: '17:70',
    arabic: 'وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ',
    translationRu: '«Мы почтили сынов Адама» — почёт дан Творцом каждому человеку',
    translationEn: '"We have honored the children of Adam."',
    questionRu: 'Где ты живёшь ниже своего почёта? Что сделает сегодня честь творения видимым?',
    questionEn: 'Where do you live below your honor? What would make the creature\'s dignity visible today?',
    theme: 'meaning',
  },
  {
    ref: '55:13',
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    translationRu: '«Какую же из милостей вашего Господа вы считаете ложью?»',
    translationEn: '"So which of the favors of your Lord would you deny?"',
    questionRu: 'Сосчитай милости только этого утра. Которую ты не замечал(а) до сих пор?',
    questionEn: 'Count the blessings of this morning alone. Which one had you never noticed?',
    theme: 'gratitude',
  },
];

/** Аят дня — детерминированно по дате */
export function getAyahOfDay(date: Date = new Date()): TadabburAyah {
  const dayNumber = Math.floor(date.getTime() / 86400000);
  return TADABBUR_POOL[dayNumber % TADABBUR_POOL.length];
}

// ── Рефлексии: хранение ────────────────────────────────────

const REFLECTIONS_KEY = 'habitai_tadabbur_reflections';

export interface TadabburReflection {
  id: string;
  ayahRef: string;
  question: string;
  answer: string;
  createdAt: string;
}

export function getReflections(): TadabburReflection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    return raw ? (JSON.parse(raw) as TadabburReflection[]) : [];
  } catch {
    return [];
  }
}

export function saveReflection(ayahRef: string, question: string, answer: string): TadabburReflection {
  const entry: TadabburReflection = {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ayahRef,
    question,
    answer: answer.trim(),
    createdAt: new Date().toISOString(),
  };
  const all = getReflections();
  all.unshift(entry);
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(all.slice(0, 300)));
  return entry;
}

/** Есть ли уже рефлексия на этот аят сегодня */
export function hasReflectionToday(ayahRef: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return getReflections().some(r => r.ayahRef === ayahRef && r.createdAt.startsWith(today));
}

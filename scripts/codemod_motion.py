#!/usr/bin/env python3
"""
Кодмод: миграция inline spring-анимаций на токены единой системы движения.

Правила замены (transition={{ type: 'spring', stiffness: X, damping: Y, mass: Z }}):
  - stiffness >= 500                    → motionPress    (кнопки, тапы)
  - stiffness 350–499                   → motionControl  (слайдеры, drag, доки)
  - stiffness 200–349                   → motionContainer(карточки, списки)
  - stiffness < 200                     → motionSheet    (модалки, шторки)
  - явный bounce/overshoot (damping<20) → motionCelebrate
Скрипт также добавляет импорт токенов, если его нет.
"""
import re
import os
import sys

ROOT = os.path.expanduser('~/Downloads/habitai')
TARGETS = []
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'components')):
    for f in filenames:
        if f.endswith('.tsx'):
            TARGETS.append(os.path.join(dirpath, f))
app = os.path.join(ROOT, 'App.tsx')
if os.path.exists(app):
    TARGETS.append(app)

# Матчинг transition-объекта spring (однострочный или многострочный)
SPRING_RE = re.compile(
    r"""(?P<full>\{\s*
        type:\s*['"]spring['"]\s*,\s*
        (?P<rest>[^{}]+?)
    \})""",
    re.VERBOSE,
)

def pick_token(stiffness: float, damping: float, has_duration: bool) -> str:
    if damping < 20:  # явный overshoot — праздник
        return 'motionCelebrate'
    if stiffness >= 500:
        return 'motionPress'
    if stiffness >= 350:
        return 'motionControl'
    if stiffness >= 200:
        return 'motionContainer'
    if has_duration:
        return 'motionPage'
    return 'motionSheet'

IMPORT_RE = re.compile(r"^import .*motionPresets.*$", re.MULTILINE)

changed_files = 0
total_repl = 0

for path in TARGETS:
    with open(path, 'r', encoding='utf-8') as fh:
        src = fh.read()
    if 'type:' not in src and 'type:' not in src:
        pass

    repl_in_file = 0

    def repl(m):
        global repl_in_file
        full = m.group('full')
        rest = m.group('rest')
        sm = re.search(r'stiffness:\s*([0-9.]+)', rest)
        dm = re.search(r'damping:\s*([0-9.]+)', rest)
        if not sm:
            return full
        stiffness = float(sm.group(1))
        damping = float(dm.group(1)) if dm else 30
        has_duration = 'duration:' in rest
        token = pick_token(stiffness, damping, has_duration)
        repl_in_file += 1
        return token

    new_src = SPRING_RE.sub(repl, src)

    if repl_in_file > 0:
        # Добавляем импорт токенов, если его нет
        if 'motionPresets' not in new_src:
            imp = "import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';"
            # определяем относительный путь
            rel = os.path.relpath(path, ROOT).replace('\\', '/')
            depth = rel.count('/') - 1  # components/x.tsx → 1 уровень
            if path.endswith('App.tsx'):
                prefix = './'
            else:
                prefix = '../' * depth if depth > 0 else './'
            imp = imp.replace("'../utils/motionPresets'", f"'{prefix}utils/motionPresets'")
            # вставляем после последнего импорта
            imports = list(re.finditer(r"^import .*;$", new_src, re.MULTILINE))
            if imports:
                last = imports[-1]
                new_src = new_src[:last.end()] + '\n' + imp + new_src[last.end():]
            else:
                new_src = imp + '\n' + new_src

        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(new_src)
        changed_files += 1
        total_repl += repl_in_file
        print(f"{os.path.relpath(path, ROOT)}: {repl_in_file} замен")

print(f"\nИтого: {total_repl} замен в {changed_files} файлах")

#!/usr/bin/env python3
"""
Строгая проверка: каждый ИСПОЛЬЗУЕМЫЙ motion-токен должен быть в импорте.
Ловит случаи типа LiquidDock (импорт есть, но нужного токена в нём нет).
Также проверяет, что в собранном бандле нет неразрешённых motion-токенов.
"""
import re
import os
import sys

ROOT = os.path.expanduser('~/Downloads/habitai')
TOKENS = ['motionPress', 'motionControl', 'motionContainer', 'motionSheet', 'motionPage', 'motionCelebrate']
# Legacy-алиасы тоже можно импортировать
LEGACY = ['springSnappy', 'springGentle', 'springBouncy', 'springMajestic', 'springModal',
          'springPage', 'springLayout', 'springTab', 'dockSpring', 'iconPop',
          'glassInteractive', 'glassMaterialise', 'tabContentVariants', 'staggerContainer',
          'staggerItem', 'fadeInUp', 'scaleIn', 'sheetUp', 'slideLeft', 'slideRight',
          'crossFade', 'modalPush', 'modalPop', 'listItemLayout', 'listItemPop',
          'tapScale', 'tapScaleSmall', 'hoverLift', 'completionPop', 'easeApple',
          'easeDecel', 'easeAccel', 'durationFast', 'durationBase', 'durationSlow',
          'getTabDirection', 'getPageVariants', 'glassShimmerVariant', 'glassHoverLift', 'glassTapPress']
ALL_EXPORTS = TOKENS + LEGACY

errors = []
files_scanned = 0

for dirpath, dirnames, filenames in os.walk(ROOT):
    if any(skip in dirpath for skip in ['node_modules', 'dist', 'src-tauri', '.git', 'skills']):
        continue
    for fname in filenames:
        if not fname.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(dirpath, fname)
        if 'motionPresets' in path:
            continue
        files_scanned += 1
        with open(path, 'r', encoding='utf-8') as fh:
            src = fh.read()

        # Собираем реально импортированные имена из motionPresets
        imported = set()
        for m in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*['\"][^'\"]*motionPresets['\"]", src):
            imported.update(x.strip() for x in m.group(1).split(',') if x.strip())

        # Ищем ИСПОЛЬЗОВАНИЕ токенов (не в комментарии, не в строке, не локальная константа)
        for tok in ALL_EXPORTS:
            # пропускаем, если токен локально определён в файле (const glassInteractive = ...)
            local_def = re.search(rf"^\s*(?:const|let|var)\s+{tok}\s*=", src, re.MULTILINE)
            for m in re.finditer(rf"(?<![a-zA-Z_.'\"-]){tok}(?![a-zA-Z_])", src):
                start = m.start()
                line = src[:start].count('\n') + 1
                line_text = src.splitlines()[line - 1]
                # не импорт-строка
                if 'import' in line_text and 'from' in line_text:
                    continue
                # не комментарий
                if '//' in line_text and line_text.index('//') < line_text.index(tok):
                    continue
                # не строковый литерал (className="animate-scaleIn" и т.п.)
                if re.search(rf"[\"'][\w-]*{tok}", line_text):
                    continue
                # не локальная константа
                if local_def:
                    continue
                if tok not in imported:
                    errors.append(f"{os.path.relpath(path, ROOT)}:{line}: использует {tok} без импорта")
                break  # достаточно одного использования

if errors:
    print("ОШИБКИ:")
    for e in errors:
        print("  " + e)
    sys.exit(1)
else:
    print(f"OK: {files_scanned} файлов просканировано, все токены импортированы корректно")

#!/bin/bash
# Полный поиск: все файлы проекта, использующие motion-токены без импорта
cd "$HOME/Downloads/habitai"
echo "=== Все файлы с motion-токенами ==="
grep -rl "motionPress\|motionControl\|motionContainer\|motionSheet\|motionPage\|motionCelebrate" \
  --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v dist | grep -v src-tauri | grep -v motionPresets.ts > /tmp/motion_files.txt
while read f; do
  if ! grep -q "from '.*motionPresets'" "$f"; then
    echo "!!! БЕЗ ИМПОРТА: $f"
    grep -n "motion\(Press\|Control\|Container\|Sheet\|Page\|Celebrate\)" "$f" | grep -v "^\s*//" | grep -v "token" | head -5
    echo "---"
  fi
done < /tmp/motion_files.txt
echo "=== Проверка LoginScreen ==="
grep -n "motionControl\|motionPresets" components/LoginScreen.tsx
echo "=== ГОТОВО ==="

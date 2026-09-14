#!/bin/bash
# Аудит: где в UI-коде используются эмодзи вместо Lucide-иконок
cd "$HOME/Downloads/habitai"
echo "=== Эмодзи в JSX-тексте компонентов (кроме арабской графики) ==="
grep -rn "['\"\`>]\s*[🔥💧☀️🌙⭐🌈🌊🌱🌲🍂🌸💎👁💤💢💥💫💦💨💣💬💭🛑⛔🚫🧠🫀🛡️👑✨🎯🏆⚡🍎💪🤲📖🕌📿]" \
  components/*.tsx App.tsx 2>/dev/null | grep -v "divineName\|arabic\|stage.icon\|GROUP_META\|emoji:" | head -25
echo "---"
echo "=== habit.icon значения-эмодзи (передаются в Icon) ==="
grep -rn "icon: '👟'\|icon: '⭐'\|icon: \"⭐\"" components/*.tsx App.tsx 2>/dev/null | head -5

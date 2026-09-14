#!/bin/bash
# Аудит по принципам Возняка
cd "$HOME/Downloads/habitai"
echo "═══ 1. СКРЫТЫЕ РЕЖИМЫ: кнопки/элементы, меняющие функцию ═══"
echo "--- Alert/prompt/confirm (нативный шум вместо нормального UI) ---"
grep -rn "alert(\|prompt(\|confirm(" components/*.tsx App.tsx 2>/dev/null | grep -v "//" | wc -l
grep -rn "alert(" components/*.tsx App.tsx 2>/dev/null | grep -v "//" | head -8
echo ""
echo "--- Элементы с onClick-условиями (функция меняется от состояния) ---"
grep -rn "onClick={() =>.*?.*:" components/*.tsx 2>/dev/null | head -8
echo ""
echo "--- Кнопки-иконки без title/aria-label (нельзя предсказать функцию) ---"
echo "(выборочная проверка ключевых)"
echo ""
echo "═══ 2. alert() при копировании/действиях — детали ═══"
grep -rn "alert(" components/settings/*.tsx components/ModalManager.tsx 2>/dev/null | head -6
#!/bin/bash
# Аудит: эмодзи в активных UI-компонентах (кроме арабской каллиграфии) + проверки пропсов настроек
cd "$HOME/Downloads/habitai"
echo "=== 1. Эмодзи в кнопках/заголовках (активные экраны) ==="
grep -rn "👤\|🎨\|⚙️\|🤖\|😔\|📅\|📈\|📊\|⚡\|🙏\|🎯\|🍃\|😴\|😕\|😐\|😊\|🔥\|👑\|✨ \|🧠<" components/SettingsModal.tsx components/settings/*.tsx components/AICoachModal.tsx components/HelpSection.tsx components/settings/HelpSection.tsx 2>/dev/null | head -20
echo ""
echo "=== 2. Какие пропсы НЕ передаются в SettingsModal из App.tsx ==="
grep -n "SettingsModal" App.tsx | head -3
grep -A 40 "<SettingsModal" App.tsx | grep -o "on[A-Za-z]*=" | sort -u
echo ""
echo "=== 3. Что требует SettingsModal, но может не приходить ==="
grep -n "onOpenFeedback\|onShowOnboarding\|onOpenVault\|onGenerateCode\|onOpenFeedbackList" components/SettingsModal.tsx | head -8
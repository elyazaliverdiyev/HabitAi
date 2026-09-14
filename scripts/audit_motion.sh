#!/bin/bash
cd "$HOME/Downloads/habitai"
echo "=== Оставшиеся inline spring (все форматы) ==="
grep -rn "stiffness:" components/ App.tsx 2>/dev/null | grep -v "motionPresets" | wc -l
echo "=== Где именно ==="
grep -rln "stiffness:" components/ App.tsx 2>/dev/null | grep -v motionPresets
echo "=== Примеры ==="
grep -rn "stiffness:" components/ App.tsx 2>/dev/null | grep -v motionPresets | head -8

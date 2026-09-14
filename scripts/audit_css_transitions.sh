#!/bin/bash
cd "$HOME/Downloads/habitai"
echo "=== duration-* в className ==="
grep -rhoE "duration-[0-9]+" components/ App.tsx 2>/dev/null | sort | uniq -c | sort -rn
echo "=== transition-all/ease хардкод ==="
grep -rhoE "ease-(in|out|in-out)(-out)?" components/ App.tsx 2>/dev/null | sort | uniq -c

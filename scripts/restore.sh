#!/bin/bash

# Script de restauration interactive
echo "🔄 Milele4Ever - Backup Restoration"
echo "════════════════════════════════════"
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    read -p "Run Node.js restoration script? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/restore-backup.js
        exit 0
    fi
fi

# Check if Python is installed
if command -v python3 &> /dev/null; then
    read -p "Run Python restoration script? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 scripts/restore-backup.py
        exit 0
    fi
fi

echo "⚠️  No automation available"
echo "Open scripts/restore-gui.html in your browser or use Supabase Dashboard"

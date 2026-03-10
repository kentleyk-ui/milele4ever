#!/usr/bin/env node

/**
 * Simple i18n system verification script
 * Vérifie que toutes les traductions sont cohérentes
 */

import fs from 'fs'
import path from 'path'

// Lire le fichier de traductions
const translationsPath = path.join(process.cwd(), 'lib/i18n/translations.ts')
const fileContent = fs.readFileSync(translationsPath, 'utf-8')

// Extraire les traductions (simple parsing)
const enMatch = fileContent.match(/en:\s*{([\s\S]*?)},\s*fr:/s)
const frMatch = fileContent.match(/fr:\s*{([\s\S]*?)}/s)

if (!enMatch || !frMatch) {
  console.error('❌ Cannot parse translations file')
  process.exit(1)
}

// Extraire les clés
const extractKeys = (content) => {
  const regex = /'([^']+)':/g
  const keys = []
  let match
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1])
  }
  return keys
}

const enKeys = extractKeys(enMatch[1])
const frKeys = extractKeys(frMatch[1])
const enSet = new Set(enKeys)
const frSet = new Set(frKeys)

console.log('📊 i18n System Verification\n')
console.log(`✅ English keys: ${enKeys.length}`)
console.log(`✅ French keys: ${frKeys.length}\n`)

// Vérifier la parité
let missingInFr = 0
let missingInEn = 0

enSet.forEach(key => {
  if (!frSet.has(key)) {
    console.log(`⚠️  Missing French translation for: ${key}`)
    missingInFr++
  }
})

frSet.forEach(key => {
  if (!enSet.has(key)) {
    console.log(`⚠️  Missing English translation for: ${key}`)
    missingInEn++
  }
})

if (missingInFr === 0 && missingInEn === 0) {
  console.log('✅ All translations are consistent!\n')
  console.log('📝 i18n System Status:')
  console.log(`   • Languages: English, French`)
  console.log(`   • Total keys: ${enKeys.length}`)
  console.log(`   • Storage: localStorage for preferences`)
  console.log(`   • Default language: French`)
  console.log(`   • Provider: React Context (I18nProvider)\n`)
  console.log('🎯 Ready for production!')
  process.exit(0)
} else {
  console.log(`\n❌ Found ${missingInFr + missingInEn} translation inconsistencies`)
  process.exit(1)
}

#!/usr/bin/env node

/**
 * Script d'exportation des données vers JSON
 * Permet de sauvegarder votre base de données Supabase en JSON
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to export
const TABLES = [
  'profiles',
  'memorials',
  'memorial_members',
  'posts',
  'media',
  'timeline_events',
  'family_relationships',
  'conversations',
  'conversation_participants',
  'messages',
  'notifications',
  'service_requests',
  'candles'
];

async function exportTable(tableName) {
  try {
    console.log(`📤 Exporting ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(10000); // Safety limit
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error);
      return null;
    }
    
    console.log(`   ✅ ${data?.length || 0} rows exported`);
    return {
      tableName,
      rowCount: data?.length || 0,
      data: data || []
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function exportDatabase() {
  console.log('🔄 Starting Database Export...');
  console.log('═'.repeat(50));
  console.log('');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const exportData = {
    exportDate: new Date().toISOString(),
    database: 'milele4ever',
    tables: {}
  };
  
  let totalRows = 0;
  
  for (const table of TABLES) {
    const result = await exportTable(table);
    if (result) {
      exportData.tables[table] = result;
      totalRows += result.rowCount;
    }
  }
  
  // Save to JSON file
  const fileName = `backup-${timestamp}.json`;
  const filePath = path.join(__dirname, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  
  console.log('');
  console.log('═'.repeat(50));
  console.log(`\n✨ Export completed!`);
  console.log(`   📊 Total rows: ${totalRows}`);
  console.log(`   💾 Saved to: ${fileName}\n`);
  
  return filePath;
}

exportDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

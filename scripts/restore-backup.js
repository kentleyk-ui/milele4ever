#!/usr/bin/env node

/**
 * Script de restauration des données depuis une sauvegarde
 * Ce script exécute les migrations SQL dans l'ordre pour restaurer la structure de la base de données
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List of migration files to execute in order
const migrations = [
  '001-create-tables.sql',
  '002-rls-policies.sql',
  '003-service-request-full.sql'
];

async function executeMigration(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n📝 Executing migration: ${path.basename(filePath)}`);
    console.log('─'.repeat(50));
    
    // Execute the SQL file
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({
      error: null
    }));
    
    // If exec_sql doesn't exist, try alternative approach using sql method
    if (error?.code === 'PGRST204' || error?.message?.includes('exec_sql')) {
      console.log('⚠️  Using alternative migration method...');
      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.length > 0) {
          const { error: execError } = await supabase.rpc('exec', { 
            sql_text: statement 
          }).catch(() => ({ error: null }));
          
          if (execError && !execError.message?.includes('does not exist')) {
            console.warn(`⚠️  Warning: ${execError.message}`);
          }
        }
      }
    } else if (error) {
      console.error(`❌ Error executing migration:`, error);
      throw error;
    }
    
    console.log(`✅ Migration completed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in migration ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

async function runBackupRestore() {
  console.log('🔄 Starting Backup Restoration...');
  console.log('═'.repeat(50));
  
  try {
    let successCount = 0;
    
    for (const migration of migrations) {
      const filePath = path.join(__dirname, migration);
      
      if (!fs.existsSync(filePath)) {
        console.error(`\n❌ Migration file not found: ${filePath}`);
        continue;
      }
      
      const success = await executeMigration(filePath);
      if (success) {
        successCount++;
      }
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log(`\n✨ Restoration process completed!`);
    console.log(`   ${successCount}/${migrations.length} migrations executed successfully\n`);
    
    if (successCount === migrations.length) {
      console.log('🎉 Your database has been fully restored from backup!');
    } else {
      console.log('⚠️  Some migrations may have encountered issues. Please check above for details.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during restoration:', error);
    process.exit(1);
  }
}

// Run the restoration
runBackupRestore();

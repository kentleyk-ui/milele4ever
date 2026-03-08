// Verification script to check if all migration files exist and are valid
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS = [
  '001-create-tables.sql',
  '002-rls-policies.sql',
  '003-service-request-full.sql'
];

const SCRIPTS = [
  'restore-backup.js',
  'restore-backup.py',
  'export-backup.js',
  'restore.sh'
];

const DOCS = [
  'README.md',
  'RESTORE_GUIDE.md',
  'restore-gui.html'
];

console.log('🔍 Verifying Backup & Restoration System...\n');

let allGood = true;

// Check migration files
console.log('📋 Checking Migration Files:');
MIGRATIONS.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allGood = false;
});

// Check script files
console.log('\n🔧 Checking Script Files:');
SCRIPTS.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allGood = false;
});

// Check documentation files
console.log('\n📚 Checking Documentation Files:');
DOCS.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allGood = false;
});

// Check environment variables
console.log('\n🔑 Checking Environment Variables:');
const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(`  ${hasUrl ? '✅' : '⚠️'} NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? 'Set' : 'Not set'}`);
console.log(`  ${hasKey ? '✅' : '⚠️'} SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? 'Set' : 'Not set'}`);

if (!hasUrl || !hasKey) {
  console.log('\n📝 To set these variables, create a .env.local file at the project root:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_secret_key_here');
}

// Summary
console.log('\n' + '═'.repeat(50));
if (allGood) {
  console.log('✨ All files verified successfully!');
  console.log('\n📖 Next Steps:');
  console.log('   1. Set your environment variables in .env.local');
  console.log('   2. Run one of these commands:');
  console.log('      • npm run db:restore          (Node.js)');
  console.log('      • npm run db:restore:py       (Python)');
  console.log('      • Open scripts/restore-gui.html in your browser');
  console.log('   3. Or follow the manual guide in scripts/RESTORE_GUIDE.md');
} else {
  console.log('⚠️  Some files are missing. Please check the messages above.');
  process.exit(1);
}

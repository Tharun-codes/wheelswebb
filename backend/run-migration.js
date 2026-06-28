require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'create-banks-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('✅ Tables created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();

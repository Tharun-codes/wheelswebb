const pool = require('./db');

async function checkTableStructure() {
  try {
    console.log('Checking notifications table structure...');
    
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    
    console.log('Notifications table columns:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check constraints
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'notifications'
    `);
    
    console.log('Notifications table constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`- ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

checkTableStructure();

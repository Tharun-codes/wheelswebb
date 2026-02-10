const pool = require('./db');

async function checkNotifications() {
  try {
    console.log('Checking notifications table...');
    
    // Check if notifications table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'notifications'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Notifications table does not exist!');
      return;
    }
    
    console.log('✅ Notifications table exists');
    
    // Check recent notifications
    const notifications = await pool.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('Recent notifications:', notifications.rows.length);
    notifications.rows.forEach(row => {
      console.log(`- ID: ${row.id}, User: ${row.user_id}, Message: ${row.message}, Read: ${row.is_read}, Created: ${row.created_at}`);
    });
    
    // Check admin users
    const admins = await pool.query(
      "SELECT id, username FROM users WHERE role = 'admin' AND deleted_at IS NULL"
    );
    
    console.log('Admin users:', admins.rows.length);
    admins.rows.forEach(admin => {
      console.log(`- ID: ${admin.id}, Username: ${admin.username}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

checkNotifications();

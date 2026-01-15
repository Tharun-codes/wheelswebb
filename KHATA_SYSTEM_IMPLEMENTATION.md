# Khata (Points) System Implementation

## 📋 Overview
Complete implementation of a points-based Khata system for dealers with strict role-based access control.

## 🗄️ Database Schema

### Table: `dealer_khata`
```sql
CREATE TABLE dealer_khata (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_dealer_khata_dealer_id` on dealer_id
- `idx_dealer_khata_created_by` on created_by  
- `idx_dealer_khata_created_at` on created_at

## 🔧 Backend API Routes

### 1. POST `/api/khata/credit` - Admin gives points to dealer
**Access:** Admin only  
**Input:** `{ dealerId, points, reason }`  
**Validation:**
- Admin authentication required
- Target user must have role = 'dealer'
- Points must be > 0

**Response:** `{ success: true, transactionId, message }`

### 2. POST `/api/khata/redeem` - Dealer redeems points  
**Access:** Dealer only  
**Input:** `{ points, reason }`  
**Validation:**
- Dealer authentication required
- Sufficient balance check
- Points must be > 0

**Response:** `{ success: true, transactionId, pointsRedeemed, remainingBalance }`

### 3. GET `/api/khata` - View khata records
**Access:** Admin & Dealer only  
**Headers:** `x-user-id`, `x-user-role`  
**Behavior:**
- Admin: See ALL dealer transactions
- Dealer: See ONLY own transactions
- Manager/Employee: 403 Forbidden

**Response:** Array of transaction objects

### 4. GET `/api/khata/balance` - Get dealer balance
**Access:** Dealer only  
**Headers:** `x-dealer-id`  
**Calculation:** `SUM(credit) - SUM(debit)`

**Response:** `{ balance: number }`

### 5. GET `/api/khata/dealers` - Get dealers list
**Access:** Admin only  
**Headers:** `x-admin-id`  
**Purpose:** Populate dealer dropdown for credit form

**Response:** Array of dealers with `id`, `username`, `display_name`

## 🔐 Security Features

### Role Validation
- **Never trust frontend roles** - Always validate from database
- `validateUserRole()` helper function for consistent validation
- Strict header-based authentication

### Business Rules Enforcement
- ✅ Admin can credit ONLY to dealers (not employees/managers)
- ✅ Dealers can only redeem their own points
- ✅ Balance validation prevents overdraft
- ✅ Managers/Employees have NO khata access
- ✅ Admin has NO balance (only gives points)

### Database Constraints
- Foreign key constraints ensure data integrity
- CHECK constraints prevent invalid data
- Points must be positive
- Type limited to 'credit'/'debit'

## 🎨 Frontend Implementation

### Admin: `dealer-khata.html`
**Features:**
- Dealer dropdown (populated from API)
- Credit points form with validation
- Complete transaction history table
- Real-time updates after transactions
- Responsive design with modern UI

**Security:**
- Redirects non-admin users to dashboard
- Uses admin authentication headers

### Dealer: `my-khata.html`
**Features:**
- Current balance display
- Redeem points form with balance validation
- Personal transaction history
- Insufficient balance warnings
- Real-time balance updates

**Security:**
- Redirects non-dealer users to dashboard
- Uses dealer authentication headers

### Navigation Updates
**Dashboard (`dashboard.html`):**
- Added "Dealer Khata" menu (admin only)
- Added "My Khata" menu (dealer only)
- Updated `dashboard.js` with role-based visibility

## 🚀 Deployment Instructions

### 1. Database Setup
```bash
# Run the SQL script
psql -d your_database -f create-dealer-khata-table.sql
```

### 2. Restart Server
```bash
node server.js
```

### 3. Test the System
1. **Admin Tests:**
   - Login as admin
   - Access "Dealer Khata" from dashboard
   - Credit points to dealers
   - View transaction history

2. **Dealer Tests:**
   - Login as dealer
   - Access "My Khata" from dashboard
   - Check balance
   - Redeem points
   - View personal history

3. **Security Tests:**
   - Try accessing khata as manager/employee (should get 403)
   - Try crediting non-dealer users (should fail)
   - Try overdrawing balance (should fail)

## 📊 Transaction Flow

### Credit Flow (Admin → Dealer)
1. Admin selects dealer and enters points/reason
2. Frontend sends POST to `/api/khata/credit`
3. Backend validates admin role and dealer existence
4. Inserts record with `type = 'credit'`
5. Updates dealer balance (credit increases)

### Redeem Flow (Dealer Self)
1. Dealer enters points to redeem and reason
2. Frontend validates against current balance
3. Sends POST to `/api/khata/redeem`
4. Backend validates dealer role and sufficient balance
5. Inserts record with `type = 'debit'`
6. Updates dealer balance (debit decreases)

## 🔍 API Examples

### Credit Points
```javascript
const response = await fetch('/api/khata/credit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-id': adminId
  },
  body: JSON.stringify({
    dealerId: 123,
    points: 500,
    reason: 'Monthly performance bonus'
  })
});
```

### Redeem Points
```javascript
const response = await fetch('/api/khata/redeem', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-dealer-id': dealerId
  },
  body: JSON.stringify({
    points: 200,
    reason: 'Redeemed for gift voucher'
  })
});
```

## ✅ Compliance Checklist

- ✅ **Single table** - Only `dealer_khata` created
- ✅ **Role enforcement** - Strict backend validation
- ✅ **Admin → Dealer only** - Credit restricted to dealers
- ✅ **Dealer redemption** - Self-service with balance checks
- ✅ **Manager/Employee exclusion** - 403 errors
- ✅ **No admin balance** - Admin only gives points
- ✅ **Security first** - Never trust frontend roles
- ✅ **Modern UI** - Responsive, user-friendly interfaces
- ✅ **Real-time updates** - Immediate UI feedback
- ✅ **Error handling** - Comprehensive validation and feedback

## 🎯 Business Rules Met

1. ✅ Admin can give points ONLY to users with role = 'dealer'
2. ✅ Admin CANNOT give points to employee, manager, or admin
3. ✅ Dealer can redeem points (spend them)
4. ✅ Redeeming points REDUCES dealer balance (debit)
5. ✅ Managers and employees have NO khata access
6. ✅ Admin has NO balance (admin only gives points)

The system is now ready for production use!

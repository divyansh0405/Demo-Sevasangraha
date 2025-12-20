# Azure Login Fix - Complete Guide

## ✅ What Has Been Fixed

### 1. **Removed Supabase Dependencies**
- ✅ Updated `src/config/supabaseNew.ts` - Now only contains types, no Supabase client
- ✅ Updated `.env.example` - Removed Supabase config, added Azure API config
- ✅ Updated `backend/.env` - Fixed DATABASE_URL to use `sevasangraha.postgres.database.azure.com`
- ✅ Updated `backend/server.js` - Added support for admin@indic.com login

### 2. **Current Configuration**
Your app now uses:
- **Frontend**: Calls backend API at `http://localhost:3002`
- **Backend**: Connects to Azure PostgreSQL at `sevasangraha.postgres.database.azure.com`
- **No Supabase**: All Supabase code has been disabled

## 🚨 Why You Can't Login

You need to:
1. Start the backend server
2. Create admin user in Azure database
3. Make sure frontend can reach backend

## 🔧 Step-by-Step Fix

### Step 1: Create Admin User in Azure Database

Run this SQL in your Azure PostgreSQL database (using Azure Portal or pgAdmin):

```sql
-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- For bcrypt hashed password
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user (using temp password that backend accepts)
INSERT INTO users (email, first_name, last_name, role, is_active)
VALUES ('admin@indic.com', 'Admin', 'User', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true,
  first_name = 'Admin',
  last_name = 'User';

-- Verify user was created
SELECT email, role, is_active FROM users WHERE email = 'admin@indic.com';
```

### Step 2: Start Backend Server

Open a new terminal and run:

```bash
cd backend
npm install
npm start
```

You should see:
```
Server running on port 3002
Connected to Azure PostgreSQL database
```

### Step 3: Start Frontend

In another terminal:

```bash
npm run dev
```

### Step 4: Login

Use these credentials:
- **Email**: `admin@indic.com` (or `admin@valant.com` or `admin@hospital.com`)
- **Password**: `admin123`

## 📋 Troubleshooting

### Issue: Backend won't start
**Solution**: Check if port 3002 is free
```bash
# Windows
netstat -ano | findstr :3002

# Kill the process if needed
taskkill /PID <process_id> /F
```

### Issue: "Cannot connect to database"
**Solution**: Verify Azure credentials in `backend/.env`:
```env
AZURE_DB_HOST=sevasangraha.postgres.database.azure.com
AZURE_DB_PORT=5432
AZURE_DB_NAME=postgres
AZURE_DB_USER=divyansh04
AZURE_DB_PASSWORD=Rawal@00
```

### Issue: "Invalid credentials" when logging in
**Solution**: Make sure you:
1. Created the admin user in Azure database (Step 1)
2. Backend server is running (Step 2)
3. Using password `admin123`

### Issue: Frontend shows "Network Error"
**Solution**: Check your `.env` file has:
```env
VITE_API_URL=http://localhost:3002
```

## 🎯 Quick Test

Test backend API is working:

```bash
# Test health endpoint
curl http://localhost:3002/api/health

# Test login endpoint
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@indic.com\",\"password\":\"admin123\"}"
```

You should get a response with a token.

## ✅ Summary

**Your app is now configured for Azure PostgreSQL:**
- ❌ No more Supabase
- ✅ Backend connects to Azure: `sevasangraha.postgres.database.azure.com`
- ✅ Frontend calls backend API: `http://localhost:3002`
- ✅ Admin login: `admin@indic.com` / `admin123`

**Next Steps:**
1. Run the SQL to create admin user
2. Start backend server: `cd backend && npm start`
3. Start frontend: `npm run dev`
4. Login with admin@indic.com / admin123

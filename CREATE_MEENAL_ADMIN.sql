-- Optional: Create Meenal as admin user in database
-- The frontend code will treat meenal@indic.com as admin regardless of database role

-- First create user in Supabase Auth dashboard:
-- Email: meenal@indic.com
-- Password: Meenal@123

-- Then run this to set admin role (optional):
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin', 
    'full_name', 'Meenal Admin'
)
WHERE email = 'meenal@indic.com';

-- Insert into public.users table (optional):
INSERT INTO public.users (id, email, role, full_name, is_active)
SELECT 
    au.id,
    'meenal@indic.com',
    'admin',
    'Meenal Admin',
    true
FROM auth.users au
WHERE au.email = 'meenal@indic.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Meenal Admin',
    is_active = true;

-- Verify user setup:
SELECT 
    u.email,
    u.role,
    u.full_name,
    u.is_active
FROM public.users u
WHERE u.email = 'meenal@indic.com';

/*
LOGIN CREDENTIALS:
Email: meenal@indic.com
Password: Meenal@123

PERMISSIONS: FULL ADMIN ACCESS
- All sections accessible
- All edit permissions
- All delete permissions  
- All admin functions
- Operations access
- User management
- System settings
*/
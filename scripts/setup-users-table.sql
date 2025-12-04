-- Drop table if exists to ensure clean slate
DROP TABLE IF EXISTS public.users CASCADE;

-- Create user roles enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'FRONTDESK', 'DOCTOR', 'NURSE', 'ACCOUNTANT');
    END IF;
END$$;

-- Create users table
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text,
    first_name text,
    last_name text,
    role text NOT NULL DEFAULT 'FRONTDESK',
    department text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index on email
CREATE INDEX idx_users_email ON public.users(email);

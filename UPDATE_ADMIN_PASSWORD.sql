-- Update Admin Password in Azure PostgreSQL
-- Run this in Azure Query Editor

-- Option 1: If you want to use plain text password (NOT RECOMMENDED for production)
UPDATE users
SET password = 'Admin@1234'
WHERE email = 'admin@indic.com';

-- Option 2: Hash the password with bcrypt (RECOMMENDED)
-- First install bcrypt in a Node.js script and run this:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('Admin@1234', 10);
-- console.log(hash);
--
-- Then use that hash below:
-- UPDATE users
-- SET password = '$2a$10$...' -- Replace with actual bcrypt hash
-- WHERE email = 'admin@indic.com';

-- Verify the update
SELECT email, password, role, is_active
FROM users
WHERE email = 'admin@indic.com';

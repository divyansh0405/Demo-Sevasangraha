import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend directory
dotenv.config({ path: join(__dirname, '../backend/.env') });

const pool = new Pool({
    host: process.env.AZURE_DB_HOST || 'sevasangraha.postgres.database.azure.com',
    port: process.env.AZURE_DB_PORT || 5432,
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER || 'divyansh04',
    password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
    ssl: {
        rejectUnauthorized: false
    }
});

const usersToAdd = [
    {
        email: 'admin@indic.com',
        password: 'Admin@1234',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
    },
    {
        email: 'Frontdesk@indic.com',
        password: 'Front@321',
        firstName: 'Front',
        lastName: 'Desk',
        role: 'FRONTDESK'
    },
    {
        email: 'Hrm@indic.com',
        password: 'HRM@123',
        firstName: 'HRM',
        lastName: 'Manager',
        role: 'HR'
    }
];

async function addProjectUsers() {
    const client = await pool.connect();
    try {
        console.log('🚀 Adding Project Users...');

        // 1. Ensure HR role exists
        try {
            await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HR'");
            console.log('✅ Checked/Added HR role');
        } catch (e) {
            console.log('ℹ️  Note on role update:', e.message);
        }

        // 2. Add Users
        for (const user of usersToAdd) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(user.password, salt);

            // Check if exists
            const check = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);

            if (check.rows.length > 0) {
                console.log(`🔄 Updating existing user: ${user.email}`);
                await client.query(
                    `UPDATE users SET 
           password_hash = $1, 
           first_name = $2, 
           last_name = $3, 
           role = $4, 
           is_active = true, 
           updated_at = NOW() 
           WHERE email = $5`,
                    [passwordHash, user.firstName, user.lastName, user.role, user.email]
                );
            } else {
                console.log(`✨ Creating new user: ${user.email}`);
                await client.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
                    [user.email, passwordHash, user.firstName, user.lastName, user.role]
                );
            }
        }

        console.log('✅ All users processed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

addProjectUsers();

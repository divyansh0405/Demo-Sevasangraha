import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend directory
dotenv.config({ path: join(__dirname, '../backend/.env') });

// Azure PostgreSQL connection
const pool = new Pool({
    host: process.env.AZURE_DB_HOST || 'valantdb.postgres.database.azure.com',
    port: process.env.AZURE_DB_PORT || 5432,
    database: process.env.AZURE_DB_NAME || 'postgres',
    user: process.env.AZURE_DB_USER || 'divyansh04',
    password: process.env.AZURE_DB_PASSWORD || 'Rawal@00',
    ssl: {
        rejectUnauthorized: false
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function addUser() {
    try {
        console.log('🚀 Add New User Script');
        console.log('======================');

        // Connect to DB
        const client = await pool.connect();
        console.log('✅ Connected to database');

        try {
            // Get user details
            const email = await question('Email: ');
            if (!email) throw new Error('Email is required');

            const password = await question('Password: ');
            if (!password) throw new Error('Password is required');

            const firstName = await question('First Name: ');
            const lastName = await question('Last Name: ');

            console.log('\nSelect Role:');
            console.log('1. ADMIN');
            console.log('2. DOCTOR');
            console.log('3. FRONTDESK');
            console.log('4. NURSE');
            console.log('5. ACCOUNTANT');
            console.log('6. HR');

            const roleSelection = await question('Enter number (default 3): ');
            let role = 'FRONTDESK';

            switch (roleSelection.trim()) {
                case '1': role = 'ADMIN'; break;
                case '2': role = 'DOCTOR'; break;
                case '3': role = 'FRONTDESK'; break;
                case '4': role = 'NURSE'; break;
                case '5': role = 'ACCOUNTANT'; break;
                case '6': role = 'HR'; break;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Check if user exists
            const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (checkRes.rows.length > 0) {
                console.log(`\n⚠️  User with email ${email} already exists.`);
                const update = await question('Do you want to update the password? (y/n): ');

                if (update.toLowerCase() === 'y') {
                    await client.query(
                        'UPDATE users SET password_hash = $1, first_name = $2, last_name = $3, role = $4, is_active = true, updated_at = NOW() WHERE email = $5',
                        [passwordHash, firstName, lastName, role, email]
                    );
                    console.log('✅ User updated successfully!');
                } else {
                    console.log('Action cancelled.');
                }
            } else {
                // Insert new user
                await client.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
                    [email, passwordHash, firstName, lastName, role]
                );
                console.log('✅ User created successfully!');
            }

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

addUser();

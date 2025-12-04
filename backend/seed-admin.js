const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to DB');

        // Check if admin exists
        const res = await client.query("SELECT * FROM users WHERE email = 'admin@hospital.com'");

        if (res.rows.length > 0) {
            console.log('✅ Admin user already exists');
        } else {
            console.log('Creating admin user...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);

            // Check if users table has is_active column
            // We assume it does based on server.js, but let's be safe or just try insert
            // If is_active is missing, we might need to add it to users table too?
            // Wait, check-missing-tables.js checked users table existence, but not columns.
            // server.js uses is_active in login query.

            // Let's first ensure users table has is_active
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
                ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';
            `);

            await client.query(`
                INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['admin@hospital.com', hash, 'Admin', 'User', 'ADMIN', true]);

            console.log('✅ Admin user created successfully');
        }

        await client.end();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();

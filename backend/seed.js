require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'agriculture_management'
    });

    try {
        // Try inserting into Farmers (new schema)
        await pool.query("INSERT IGNORE INTO Farmers (name, contact) VALUES ('Admin User', 'admin@example.com')");
        await pool.query("INSERT IGNORE INTO Farmers (name, contact) VALUES ('John Farmer', 'john@example.com')");
        console.log("Seeded Farmers table successfully.");
    } catch (e) {
        try {
            // Fallback to Users (old schema)
            await pool.query("INSERT IGNORE INTO Users (name, role, contact) VALUES ('Admin User', 'Admin', 'admin@example.com')");
            await pool.query("INSERT IGNORE INTO Users (name, role, contact) VALUES ('John Farmer', 'Farmer', 'john@example.com')");
            console.log("Seeded Users table successfully.");
        } catch (err) {
            console.log("Could not seed either table. Is the DB running?");
        }
    }
    process.exit();
}
seed();

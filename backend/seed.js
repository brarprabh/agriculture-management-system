require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    console.log('Connecting to database for seeding...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'agriculture_management'
    });

    try {
        console.log('Clearing existing data...');
        // Disable foreign key checks for clean truncation
        await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
        await pool.query('TRUNCATE TABLE Alerts;');
        await pool.query('TRUNCATE TABLE AuditLog;');
        await pool.query('TRUNCATE TABLE CropDiseases;');
        await pool.query('TRUNCATE TABLE FertilizerUsage;');
        await pool.query('TRUNCATE TABLE SoilProperties;');
        await pool.query('TRUNCATE TABLE Fields;');
        await pool.query('TRUNCATE TABLE Users;');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('1. Seeding Users (Admins & Farmers)...');
        const users = [
            ['Prabhjot Singh', 'Admin', 'prabhjotsinghbrar39@gmail.com'],
            ['Admin User', 'Admin', 'admin@example.com'],
            ['John Farmer', 'Farmer', 'john@example.com'],
            ['Sarah Jenkins', 'Farmer', 'sarah@example.com'],
            ['Michael Chang', 'Farmer', 'michael@example.com'],
            ['Gurpreet Singh', 'Farmer', 'gurpreet@example.com']
        ];

        for (const [name, role, contact] of users) {
            await pool.query(
                'INSERT INTO Users (name, role, contact) VALUES (?, ?, ?)',
                [name, role, contact]
            );
        }

        // Get seeded users map by name
        const [userRows] = await pool.query('SELECT user_id, name FROM Users');
        const userMap = {};
        userRows.forEach(u => { userMap[u.name] = u.user_id; });

        console.log('2. Seeding Fields...');
        const fieldsData = [
            [userMap['John Farmer'], 'North Valley Block A', 45.50],
            [userMap['John Farmer'], 'East Ridge Farm', 30.00],
            [userMap['Sarah Jenkins'], 'Sunny Slope Vineyard', 25.00],
            [userMap['Sarah Jenkins'], 'Green Meadow Plot', 50.25],
            [userMap['Michael Chang'], 'Delta Rice Basin', 60.00],
            [userMap['Michael Chang'], 'Highland Barley Terrace', 35.00],
            [userMap['Gurpreet Singh'], 'Canal Side Cotton Farm', 40.00],
            [userMap['Gurpreet Singh'], 'South Block Sugarcane', 55.00]
        ];

        for (const [userId, location, area] of fieldsData) {
            await pool.query(
                'INSERT INTO Fields (user_id, location, area_size, total_fertilizer) VALUES (?, ?, ?, 0)',
                [userId, location, area]
            );
        }

        const [fieldRows] = await pool.query('SELECT field_id, location FROM Fields');
        const fieldMap = {};
        fieldRows.forEach(f => { fieldMap[f.location] = f.field_id; });

        console.log('3. Seeding Soil Properties (N-P-K & pH)...');
        const soilData = [
            [fieldMap['North Valley Block A'], 6.8, 48.5, 28.0, 36.0, '2026-03-10'],
            [fieldMap['East Ridge Farm'], 6.4, 32.0, 22.5, 40.0, '2026-03-12'],
            [fieldMap['Sunny Slope Vineyard'], 7.1, 55.0, 35.0, 52.0, '2026-03-15'],
            [fieldMap['Green Meadow Plot'], 5.8, 62.0, 42.0, 48.0, '2026-03-18'],
            [fieldMap['Delta Rice Basin'], 6.5, 80.0, 45.0, 65.0, '2026-03-20'],
            [fieldMap['Highland Barley Terrace'], 7.2, 40.0, 26.0, 38.0, '2026-03-22'],
            [fieldMap['Canal Side Cotton Farm'], 7.4, 68.0, 38.0, 58.0, '2026-03-25'],
            [fieldMap['South Block Sugarcane'], 6.6, 74.0, 44.0, 62.0, '2026-03-28']
        ];

        for (const [fieldId, ph, n, p, k, testDate] of soilData) {
            await pool.query(
                'INSERT INTO SoilProperties (field_id, pH, nitrogen, phosphorus, potassium, test_date) VALUES (?, ?, ?, ?, ?, ?)',
                [fieldId, ph, n, p, k, testDate]
            );
        }

        console.log('4. Seeding Fertilizer Usage (Triggers AuditLog)...');
        const fertData = [
            [fieldMap['North Valley Block A'], 'Urea 46-0-0', 45.0, '2026-03-01'],
            [fieldMap['North Valley Block A'], 'DAP 18-46-0', 30.0, '2026-03-15'],
            [fieldMap['East Ridge Farm'], 'NPK 15-15-15', 50.0, '2026-03-05'],
            [fieldMap['Sunny Slope Vineyard'], 'Organic Compost', 35.0, '2026-03-08'],
            [fieldMap['Sunny Slope Vineyard'], 'Potash MOP', 25.0, '2026-03-22'],
            [fieldMap['Green Meadow Plot'], 'Urea 46-0-0', 60.0, '2026-03-10'],
            [fieldMap['Delta Rice Basin'], 'Zinc Sulfate + NPK', 75.0, '2026-03-12'],
            [fieldMap['Highland Barley Terrace'], 'NPK 20-20-20', 40.0, '2026-03-14'],
            [fieldMap['Canal Side Cotton Farm'], 'DAP 18-46-0', 55.0, '2026-03-16'],
            [fieldMap['South Block Sugarcane'], 'Urea 46-0-0', 70.0, '2026-03-18']
        ];

        for (const [fieldId, type, qty, appliedDate] of fertData) {
            await pool.query(
                'INSERT INTO FertilizerUsage (field_id, fertilizer_type, quantity, applied_date) VALUES (?, ?, ?, ?)',
                [fieldId, type, qty, appliedDate]
            );
        }

        // Sync Fields.total_fertilizer
        await pool.query(`
            UPDATE Fields f
            SET total_fertilizer = (
                SELECT COALESCE(SUM(quantity), 0)
                FROM FertilizerUsage fu
                WHERE fu.field_id = f.field_id
            );
        `);

        console.log('5. Seeding Crop Diseases (Triggers Auto-Alerts)...');
        const diseaseData = [
            [fieldMap['North Valley Block A'], 'Wheat', 'Yellow Rust (Puccinia striiformis)', 'Critical', '2026-03-20'],
            [fieldMap['East Ridge Farm'], 'Corn', 'Northern Corn Leaf Blight', 'Medium', '2026-03-22'],
            [fieldMap['Green Meadow Plot'], 'Soybean', 'Frogeye Leaf Spot', 'High', '2026-03-24'],
            [fieldMap['Delta Rice Basin'], 'Rice', 'Bacterial Leaf Blight', 'Critical', '2026-03-25'],
            [fieldMap['Canal Side Cotton Farm'], 'Cotton', 'Cotton Leaf Curl Virus', 'High', '2026-03-27'],
            [fieldMap['South Block Sugarcane'], 'Sugarcane', 'Red Rot (Colletotrichum)', 'Low', '2026-03-29']
        ];

        for (const [fieldId, crop, disease, severity, date] of diseaseData) {
            await pool.query(
                'INSERT INTO CropDiseases (field_id, crop_name, disease_name, severity, detection_date) VALUES (?, ?, ?, ?, ?)',
                [fieldId, crop, disease, severity, date]
            );
        }

        console.log('6. Running Stored Procedure CheckAndAlertCriticalFields() to test Cursor automation...');
        await pool.query('CALL CheckAndAlertCriticalFields();');

        console.log('Seeding completed successfully with comprehensive test data!');
        
        // Print Summary Counts
        for (const table of ['Users', 'Fields', 'SoilProperties', 'FertilizerUsage', 'CropDiseases', 'Alerts', 'AuditLog']) {
            const [cnt] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`  ✓ ${table}: ${cnt[0].count} rows`);
        }
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

seed();
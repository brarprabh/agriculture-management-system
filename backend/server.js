require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agriculture_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Health check route
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', message: 'Backend and Database connected successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// --- User Management & Auth ---
app.post('/api/users', async (req, res) => {
    try {
        const { name, role, contact } = req.body;
        if (!name || !contact) {
            return res.status(400).json({ error: 'Name and contact are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO Users (name, role, contact) VALUES (?, ?, ?)',
            [name.trim(), role || 'Farmer', contact.trim()]
        );
        res.status(201).json({ id: result.insertId, message: 'User created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A user with this contact already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Users ORDER BY user_id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Please enter a name to sign in.' });
        }
        const [users] = await pool.query(
            'SELECT * FROM Users WHERE LOWER(name) = LOWER(?) LIMIT 1',
            [name.trim()]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found. Check your name or register a new account.' });
        }
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Field Management ---
app.post('/api/fields', async (req, res) => {
    try {
        const { user_id, location, area_size } = req.body;
        if (!user_id || !location || !area_size) {
            return res.status(400).json({ error: 'Owner, location, and area size are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO Fields (user_id, location, area_size, total_fertilizer) VALUES (?, ?, ?, 0)',
            [user_id, location.trim(), area_size]
        );
        res.status(201).json({ id: result.insertId, message: 'Field created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/fields', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT f.*, u.name AS owner_name, u.role AS owner_role 
            FROM Fields f 
            JOIN Users u ON f.user_id = u.user_id 
            ORDER BY f.field_id ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Soil Properties ---
app.post('/api/soil', async (req, res) => {
    try {
        const { field_id, pH, nitrogen, phosphorus, potassium, test_date } = req.body;
        if (!field_id || pH === undefined || nitrogen === undefined || phosphorus === undefined || potassium === undefined || !test_date) {
            return res.status(400).json({ error: 'All soil property fields are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO SoilProperties (field_id, pH, nitrogen, phosphorus, potassium, test_date) VALUES (?, ?, ?, ?, ?, ?)',
            [field_id, pH, nitrogen, phosphorus, potassium, test_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Soil properties recorded successfully' });
    } catch (err) {
        // Handle trigger error (ValidateSoilPH)
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/soil', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sp.*, f.location, u.name AS farmer_name 
            FROM SoilProperties sp 
            JOIN Fields f ON sp.field_id = f.field_id 
            JOIN Users u ON f.user_id = u.user_id 
            ORDER BY sp.test_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Fertilizer Usage ---
app.post('/api/fertilizer', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { field_id, fertilizer_type, quantity, applied_date } = req.body;
        if (!field_id || !fertilizer_type || !quantity || !applied_date) {
            return res.status(400).json({ error: 'Field, fertilizer type, quantity, and date are required.' });
        }

        const numQty = parseFloat(quantity);
        if (isNaN(numQty) || numQty <= 0) {
            return res.status(400).json({ error: 'Quantity must be a positive number.' });
        }

        await conn.beginTransaction();

        // Row-level lock on the field to check limit
        const [fieldRows] = await conn.query(
            'SELECT total_fertilizer FROM Fields WHERE field_id = ? FOR UPDATE',
            [field_id]
        );

        if (fieldRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Target field not found.' });
        }

        const currentTotal = parseFloat(fieldRows[0].total_fertilizer || 0);
        if (currentTotal + numQty > 500) {
            await conn.rollback();
            return res.status(400).json({
                error: `Application exceeds maximum allowed field fertilizer capacity (500 units). Current: ${currentTotal} units.`
            });
        }

        // Insert into FertilizerUsage (triggers LogFertilizerUsage audit trigger)
        const [result] = await conn.query(
            'INSERT INTO FertilizerUsage (field_id, fertilizer_type, quantity, applied_date) VALUES (?, ?, ?, ?)',
            [field_id, fertilizer_type.trim(), numQty, applied_date]
        );

        // Update Fields total_fertilizer
        await conn.query(
            'UPDATE Fields SET total_fertilizer = total_fertilizer + ? WHERE field_id = ?',
            [numQty, field_id]
        );

        await conn.commit();
        res.status(201).json({ id: result.insertId, message: 'Fertilizer usage recorded successfully' });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        conn.release();
    }
});

app.get('/api/fertilizer', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT fu.*, f.location, u.name AS farmer_name 
            FROM FertilizerUsage fu 
            JOIN Fields f ON fu.field_id = f.field_id 
            JOIN Users u ON f.user_id = u.user_id 
            ORDER BY fu.applied_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/fertilizer/total/:field_id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { field_id } = req.params;
        await conn.query('CALL CalculateTotalFertilizer(?, @total_quantity)', [field_id]);
        const [result] = await conn.query('SELECT @total_quantity AS total_quantity');
        res.json({ field_id, total_quantity: result[0].total_quantity || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// --- Crop Disease Management ---
app.post('/api/disease', async (req, res) => {
    try {
        const { field_id, crop_name, disease_name, severity, detection_date } = req.body;
        if (!field_id || !crop_name || !disease_name || !severity || !detection_date) {
            return res.status(400).json({ error: 'All disease details are required.' });
        }

        // Insert into CropDiseases (triggers AutoAlertCriticalDisease trigger for High/Critical)
        const [result] = await pool.query(
            'INSERT INTO CropDiseases (field_id, crop_name, disease_name, severity, detection_date) VALUES (?, ?, ?, ?, ?)',
            [field_id, crop_name.trim(), disease_name.trim(), severity, detection_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Crop disease recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/disease', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cd.*, f.location 
            FROM CropDiseases cd 
            JOIN Fields f ON cd.field_id = f.field_id 
            ORDER BY cd.detection_date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/diseases/full-report', async (req, res) => {
    try {
        const query = `
            SELECT 
                cd.disease_id,
                u.name AS farmer_name,
                f.location AS field_location,
                cd.crop_name,
                cd.disease_name,
                cd.severity,
                cd.detection_date
            FROM CropDiseases cd
            JOIN Fields f ON cd.field_id = f.field_id
            JOIN Users u ON f.user_id = u.user_id
            ORDER BY cd.detection_date DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Reports & Analytics ---
app.get('/api/reports/user-field-fertilizer', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM UserFieldFertilizerReport');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/field-summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.name AS farmer_name, 
                COUNT(DISTINCT f.field_id) AS total_fields, 
                COALESCE(SUM(fu.quantity), 0) AS total_fertilizer, 
                COUNT(DISTINCT cd.disease_id) AS disease_count
            FROM Users u
            LEFT JOIN Fields f ON u.user_id = f.user_id
            LEFT JOIN FertilizerUsage fu ON f.field_id = fu.field_id
            LEFT JOIN CropDiseases cd ON f.field_id = cd.field_id
            WHERE u.role = 'Farmer' OR u.role IS NULL
            GROUP BY u.user_id, u.name
            ORDER BY u.name ASC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/field-health-summary', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM FieldHealthSummary');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Main Admin Dashboard Endpoint ---
app.get('/api/dashboard', async (req, res) => {
    try {
        // 1. Total critical/high diseases
        const [diseaseCountResult] = await pool.query(
            "SELECT COUNT(*) AS total_diseases FROM CropDiseases WHERE severity IN ('High', 'Critical')"
        );

        // 2. Monitored fields and their fertilizer totals
        const [fertilizerTotals] = await pool.query(`
            SELECT 
                f.field_id, 
                f.location, 
                COALESCE(f.total_fertilizer, SUM(fu.quantity), 0) AS total_fertilizer
            FROM Fields f
            LEFT JOIN FertilizerUsage fu ON f.field_id = fu.field_id
            GROUP BY f.field_id, f.location, f.total_fertilizer
            ORDER BY f.field_id ASC
        `);

        // 3. Latest Alerts
        const [alerts] = await pool.query('SELECT * FROM Alerts ORDER BY created_at DESC LIMIT 5');

        // 4. Grouped Soil Nutrients (N-P-K) per farmer for grouped bar chart
        const [soilData] = await pool.query(`
            SELECT 
                u.name AS farmer_name, 
                ROUND(AVG(s.nitrogen), 2) AS nitrogen, 
                ROUND(AVG(s.phosphorus), 2) AS phosphorus, 
                ROUND(AVG(s.potassium), 2) AS potassium
            FROM Users u
            JOIN Fields f ON u.user_id = f.user_id
            JOIN SoilProperties s ON f.field_id = s.field_id
            WHERE s.test_date = (
                SELECT MAX(test_date) FROM SoilProperties WHERE field_id = f.field_id
            )
            GROUP BY u.user_id, u.name
            ORDER BY u.name ASC
        `);

        res.json({
            total_diseases: diseaseCountResult[0].total_diseases,
            fertilizer_per_field: fertilizerTotals,
            soil_health: soilData,
            alerts: alerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Alerts & Activity Logs ---
app.get('/api/alerts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Alerts ORDER BY created_at DESC LIMIT 20');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM AuditLog ORDER BY action_date DESC LIMIT 50');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Farmer Portal ---
app.get('/api/farmer/dashboard/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const [fieldsResult] = await pool.query(
            'SELECT COUNT(*) as field_count FROM Fields WHERE user_id = ?',
            [user_id]
        );
        const [fertResult] = await pool.query(
            'SELECT COALESCE(SUM(fu.quantity), 0) as total_fertilizer FROM FertilizerUsage fu JOIN Fields f ON fu.field_id = f.field_id WHERE f.user_id = ?',
            [user_id]
        );
        const [diseaseResult] = await pool.query(
            "SELECT COUNT(*) as disease_count FROM CropDiseases cd JOIN Fields f ON cd.field_id = f.field_id WHERE f.user_id = ? AND cd.severity IN ('High', 'Critical')",
            [user_id]
        );
        const [soilResult] = await pool.query(
            'SELECT COUNT(*) as soil_count FROM SoilProperties sp JOIN Fields f ON sp.field_id = f.field_id WHERE f.user_id = ?',
            [user_id]
        );

        res.json({
            field_count: fieldsResult[0].field_count,
            total_fertilizer: fertResult[0].total_fertilizer,
            disease_count: diseaseResult[0].disease_count,
            soil_count: soilResult[0].soil_count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/farmer/fields/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const query = `
            SELECT 
                f.field_id,
                f.location,
                f.area_size,
                COALESCE(f.total_fertilizer, (SELECT COALESCE(SUM(quantity), 0) FROM FertilizerUsage WHERE field_id = f.field_id)) AS total_fertilizer,
                (SELECT COUNT(*) FROM CropDiseases cd WHERE cd.field_id = f.field_id) AS disease_count,
                (SELECT pH FROM SoilProperties sp WHERE sp.field_id = f.field_id ORDER BY test_date DESC LIMIT 1) AS latest_ph
            FROM Fields f
            WHERE f.user_id = ?
            ORDER BY f.field_id ASC
        `;
        const [rows] = await pool.query(query, [user_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/farmer/field/:field_id', async (req, res) => {
    try {
        const { field_id } = req.params;
        const [fields] = await pool.query('SELECT * FROM Fields WHERE field_id = ?', [field_id]);
        if (fields.length === 0) {
            return res.status(404).json({ error: 'Field not found.' });
        }

        const [fertilizers] = await pool.query(
            'SELECT * FROM FertilizerUsage WHERE field_id = ? ORDER BY applied_date DESC',
            [field_id]
        );
        const [soil] = await pool.query(
            'SELECT * FROM SoilProperties WHERE field_id = ? ORDER BY test_date DESC',
            [field_id]
        );
        const [diseases] = await pool.query(
            'SELECT * FROM CropDiseases WHERE field_id = ? ORDER BY detection_date DESC',
            [field_id]
        );
        const [alerts] = await pool.query(
            "SELECT * FROM Alerts WHERE message LIKE CONCAT('%Field ID ', ?, '%') OR message LIKE CONCAT('%Field ', ?, '%') OR message LIKE CONCAT('%field ', ?, '%') ORDER BY created_at DESC",
            [field_id, field_id, field_id]
        );

        res.json({
            field: fields[0],
            fertilizers,
            soil,
            diseases,
            alerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Agriculture Management API server running on port ${PORT}`);
});

module.exports = app;

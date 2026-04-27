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

// --- User Management ---
app.post('/api/users', async (req, res) => {
    try {
        const { name, role, contact } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Users (name, role, contact) VALUES (?, ?, ?)',
            [name, role, contact]
        );
        res.status(201).json({ id: result.insertId, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { name } = req.body;
        const [users] = await pool.query('SELECT * FROM Users WHERE name = ?', [name]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
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
        const [result] = await pool.query(
            'INSERT INTO Fields (user_id, location, area_size) VALUES (?, ?, ?)',
            [user_id, location, area_size]
        );
        res.status(201).json({ id: result.insertId, message: 'Field created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/fields', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Fields');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Soil Properties ---
app.post('/api/soil', async (req, res) => {
    try {
        const { field_id, pH, nitrogen, phosphorus, potassium, test_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO SoilProperties (field_id, pH, nitrogen, phosphorus, potassium, test_date) VALUES (?, ?, ?, ?, ?, ?)',
            [field_id, pH, nitrogen, phosphorus, potassium, test_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Soil properties recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/soil', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM SoilProperties');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Fertilizer Usage ---
app.post('/api/fertilizer', async (req, res) => {
    try {
        const { field_id, fertilizer_type, quantity, applied_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO FertilizerUsage (field_id, fertilizer_type, quantity, applied_date) VALUES (?, ?, ?, ?)',
            [field_id, fertilizer_type, quantity, applied_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Fertilizer usage recorded successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message }); // Might be 400 due to trigger constraint
    }
});

app.get('/api/fertilizer', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM FertilizerUsage');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/fertilizer/total/:field_id', async (req, res) => {
    try {
        const { field_id } = req.params;
        const [rows] = await pool.query('CALL CalculateTotalFertilizer(?, @total_quantity)', [field_id]);
        const [result] = await pool.query('SELECT @total_quantity AS total_quantity');
        res.json({ field_id, total_quantity: result[0].total_quantity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Crop Disease ---
app.post('/api/disease', async (req, res) => {
    try {
        const { field_id, crop_name, disease_name, severity, detection_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO CropDiseases (field_id, crop_name, disease_name, severity, detection_date) VALUES (?, ?, ?, ?, ?)',
            [field_id, crop_name, disease_name, severity, detection_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Crop disease recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/disease', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM CropDiseases');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Reports/Dashboard ---
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
                f.location AS field_location, 
                COALESCE(SUM(fu.quantity), 0) AS total_fertilizer, 
                COUNT(cd.disease_id) AS disease_count
            FROM Fields f
            JOIN Users u ON f.user_id = u.user_id
            LEFT JOIN FertilizerUsage fu ON f.field_id = fu.field_id
            LEFT JOIN CropDiseases cd ON f.field_id = cd.field_id
            GROUP BY f.field_id, u.name, f.location
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/diseases/full-report', async (req, res) => {
    try {
        const query = `
            SELECT 
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


app.get('/api/dashboard', async (req, res) => {
    try {
        const [diseaseCountResult] = await pool.query("SELECT COUNT(*) AS total_diseases FROM CropDiseases WHERE severity IN ('High', 'Critical')");
        
        // Fetch fields and their total fertilizer to show on dashboard
        const [fields] = await pool.query('SELECT field_id, location FROM Fields');
        const fertilizerTotals = [];
        for (let field of fields) {
            // Using the new stored procedure
            await pool.query('CALL get_field_summary(?, @total_quantity, @disease_count)', [field.field_id]);
            const [result] = await pool.query('SELECT @total_quantity AS total_quantity');
            fertilizerTotals.push({
                field_id: field.field_id,
                location: field.location,
                total_fertilizer: result[0].total_quantity || 0
            });
        }
        
        // Fetch latest alerts
        const [alerts] = await pool.query('SELECT * FROM Alerts ORDER BY created_at DESC LIMIT 5');
        
        // Fetch latest soil properties per field with farmer name
        const [soilData] = await pool.query(`
            SELECT CONCAT(u.name, ' (', f.location, ')') AS farmer_field, s.nitrogen, s.phosphorus, s.potassium, s.pH
            FROM SoilProperties s
            JOIN Fields f ON s.field_id = f.field_id
            JOIN Users u ON f.user_id = u.user_id
            WHERE s.test_date = (
                SELECT MAX(test_date) FROM SoilProperties WHERE field_id = s.field_id
            )
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

app.get('/api/alerts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Alerts ORDER BY created_at DESC LIMIT 10');
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
        const [fieldsResult] = await pool.query('SELECT COUNT(*) as field_count FROM Fields WHERE user_id = ?', [user_id]);
        const [fertResult] = await pool.query('SELECT COALESCE(SUM(quantity), 0) as total_fertilizer FROM FertilizerUsage fu JOIN Fields f ON fu.field_id = f.field_id WHERE f.user_id = ?', [user_id]);
        const [diseaseResult] = await pool.query("SELECT COUNT(*) as disease_count FROM CropDiseases cd JOIN Fields f ON cd.field_id = f.field_id WHERE f.user_id = ? AND cd.severity IN ('High', 'Critical')", [user_id]);
        const [soilResult] = await pool.query('SELECT COUNT(*) as soil_count FROM SoilProperties sp JOIN Fields f ON sp.field_id = f.field_id WHERE f.user_id = ?', [user_id]);

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
                COALESCE(SUM(fu.quantity), 0) AS total_fertilizer,
                (SELECT COUNT(*) FROM CropDiseases cd WHERE cd.field_id = f.field_id) AS disease_count,
                (SELECT pH FROM SoilProperties sp WHERE sp.field_id = f.field_id ORDER BY test_date DESC LIMIT 1) AS latest_ph
            FROM Fields f
            LEFT JOIN FertilizerUsage fu ON f.field_id = fu.field_id
            WHERE f.user_id = ?
            GROUP BY f.field_id, f.location, f.area_size
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
        const [field] = await pool.query('SELECT * FROM Fields WHERE field_id = ?', [field_id]);
        const [fertilizers] = await pool.query('SELECT * FROM FertilizerUsage WHERE field_id = ? ORDER BY applied_date DESC', [field_id]);
        const [soil] = await pool.query('SELECT * FROM SoilProperties WHERE field_id = ? ORDER BY test_date DESC', [field_id]);
        const [diseases] = await pool.query('SELECT * FROM CropDiseases WHERE field_id = ? ORDER BY detection_date DESC', [field_id]);
        const [alerts] = await pool.query("SELECT * FROM Alerts WHERE message LIKE CONCAT('%field ', ?, '%') OR message LIKE CONCAT('%field ID ', ?, '.%') ORDER BY created_at DESC", [field_id, field_id]);

        res.json({
            field: field[0],
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'agriculture_management'
    });

    try {
        console.log('--- Step 1: Creating Tables & Indexes ---');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Farmer') NOT NULL DEFAULT 'Farmer',
                contact VARCHAR(50) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Fields (
                field_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                area_size DECIMAL(10, 2) NOT NULL,
                total_fertilizer DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS SoilProperties (
                soil_id INT AUTO_INCREMENT PRIMARY KEY,
                field_id INT NOT NULL,
                pH DECIMAL(4, 2) NOT NULL,
                nitrogen DECIMAL(10, 2) NOT NULL,
                phosphorus DECIMAL(10, 2) NOT NULL,
                potassium DECIMAL(10, 2) NOT NULL,
                test_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS FertilizerUsage (
                fertilizer_id INT AUTO_INCREMENT PRIMARY KEY,
                field_id INT NOT NULL,
                fertilizer_type VARCHAR(255) NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                applied_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS CropDiseases (
                disease_id INT AUTO_INCREMENT PRIMARY KEY,
                field_id INT NOT NULL,
                crop_name VARCHAR(100) NOT NULL,
                disease_name VARCHAR(255) NOT NULL,
                severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
                detection_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Alerts (
                alert_id INT AUTO_INCREMENT PRIMARY KEY,
                message VARCHAR(255) NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS AuditLog (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                table_name VARCHAR(50) NOT NULL,
                action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes safely (ignore duplicate index errors)
        const safeCreateIndex = async (sql) => {
            try {
                await pool.query(sql);
            } catch (err) {
                // Ignore "Duplicate key name" error code ER_DUP_KEYNAME / 1061
                if (err.errno !== 1061 && err.code !== 'ER_DUP_KEYNAME') {
                    throw err;
                }
            }
        };

        await safeCreateIndex('CREATE INDEX idx_user_field ON Fields(user_id);');
        await safeCreateIndex('CREATE INDEX idx_soil_field_date ON SoilProperties(field_id, test_date);');
        await safeCreateIndex('CREATE INDEX idx_fert_field ON FertilizerUsage(field_id);');
        await safeCreateIndex('CREATE INDEX idx_disease_severity ON CropDiseases(severity);');

        console.log('--- Step 2: Creating User-Defined Function (UDF) ---');
        await pool.query('DROP FUNCTION IF EXISTS CheckSoilHealthStatus;');
        await pool.query(`
            CREATE FUNCTION CheckSoilHealthStatus(
                n DECIMAL(10, 2),
                p DECIMAL(10, 2),
                k DECIMAL(10, 2)
            )
            RETURNS VARCHAR(50)
            DETERMINISTIC
            BEGIN
                DECLARE health_status VARCHAR(50);
                IF n < 10 OR p < 5 OR k < 15 THEN
                    SET health_status = 'Nutrient Deficient';
                ELSEIF n > 100 OR p > 100 OR k > 100 THEN
                    SET health_status = 'Toxic / Over-fertilized';
                ELSE
                    SET health_status = 'Healthy';
                END IF;
                RETURN health_status;
            END;
        `);

        console.log('--- Step 3: Creating Views ---');
        await pool.query(`
            CREATE OR REPLACE VIEW FieldHealthSummary AS
            SELECT
                f.field_id,
                f.location,
                u.name AS farmer_name,
                sp.pH,
                CheckSoilHealthStatus(
                    sp.nitrogen,
                    sp.phosphorus,
                    sp.potassium
                ) AS soil_status,
                f.total_fertilizer,
                (
                    SELECT COUNT(*)
                    FROM CropDiseases cd
                    WHERE cd.field_id = f.field_id
                    AND cd.severity IN ('High', 'Critical')
                ) AS critical_diseases
            FROM Fields f
            JOIN Users u ON f.user_id = u.user_id
            LEFT JOIN SoilProperties sp
                ON sp.field_id = f.field_id
                AND sp.test_date = (
                    SELECT MAX(test_date)
                    FROM SoilProperties
                    WHERE field_id = f.field_id
                );
        `);

        await pool.query(`
            CREATE OR REPLACE VIEW UserFieldFertilizerReport AS
            SELECT
                u.user_id,
                u.name AS farmer_name,
                (
                    SELECT COUNT(*)
                    FROM Fields f
                    WHERE f.user_id = u.user_id
                ) AS total_fields,
                (
                    SELECT COALESCE(SUM(fu.quantity), 0)
                    FROM FertilizerUsage fu
                    JOIN Fields f ON fu.field_id = f.field_id
                    WHERE f.user_id = u.user_id
                ) AS total_fertilizer,
                (
                    SELECT COUNT(*)
                    FROM CropDiseases cd
                    WHERE cd.field_id = f.field_id
                    WHERE f.user_id = u.user_id
                ) AS disease_count
            FROM Users u;
        `).catch(async () => {
            // Alternate robust UserFieldFertilizerReport query
            await pool.query(`
                CREATE OR REPLACE VIEW UserFieldFertilizerReport AS
                SELECT
                    u.user_id,
                    u.name AS farmer_name,
                    COUNT(DISTINCT f.field_id) AS total_fields,
                    COALESCE(SUM(fu.quantity), 0) AS total_fertilizer,
                    COUNT(DISTINCT cd.disease_id) AS disease_count
                FROM Users u
                LEFT JOIN Fields f ON u.user_id = f.user_id
                LEFT JOIN FertilizerUsage fu ON f.field_id = fu.field_id
                LEFT JOIN CropDiseases cd ON f.field_id = cd.field_id
                GROUP BY u.user_id, u.name;
            `);
        });

        console.log('--- Step 4: Creating Triggers ---');
        await pool.query('DROP TRIGGER IF EXISTS ValidateSoilPH;');
        await pool.query(`
            CREATE TRIGGER ValidateSoilPH
            BEFORE INSERT ON SoilProperties
            FOR EACH ROW
            BEGIN
                IF NEW.pH < 0 OR NEW.pH > 14 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Soil pH must be between 0 and 14';
                END IF;
            END;
        `);

        await pool.query('DROP TRIGGER IF EXISTS AutoAlertCriticalDisease;');
        await pool.query(`
            CREATE TRIGGER AutoAlertCriticalDisease
            AFTER INSERT ON CropDiseases
            FOR EACH ROW
            BEGIN
                IF NEW.severity IN ('High', 'Critical') THEN
                    INSERT INTO Alerts (message)
                    VALUES (
                        CONCAT(
                            UPPER(NEW.severity),
                            ' ALERT: ',
                            NEW.disease_name,
                            ' detected in ',
                            NEW.crop_name,
                            ' at Field ID ',
                            NEW.field_id
                        )
                    );
                END IF;
            END;
        `);

        await pool.query('DROP TRIGGER IF EXISTS LogFertilizerUsage;');
        await pool.query(`
            CREATE TRIGGER LogFertilizerUsage
            AFTER INSERT ON FertilizerUsage
            FOR EACH ROW
            BEGIN
                INSERT INTO AuditLog (action, table_name)
                VALUES (
                    CONCAT(
                        'Applied ',
                        NEW.quantity,
                        ' units of ',
                        NEW.fertilizer_type,
                        ' to Field ID ',
                        NEW.field_id
                    ),
                    'FertilizerUsage'
                );
            END;
        `);

        console.log('--- Step 5: Creating Stored Procedures ---');
        await pool.query('DROP PROCEDURE IF EXISTS CalculateTotalFertilizer;');
        await pool.query(`
            CREATE PROCEDURE CalculateTotalFertilizer(
                IN p_field_id INT,
                OUT p_total_quantity DECIMAL(10, 2)
            )
            BEGIN
                SELECT COALESCE(SUM(quantity), 0)
                INTO p_total_quantity
                FROM FertilizerUsage
                WHERE field_id = p_field_id;
            END;
        `);

        await pool.query('DROP PROCEDURE IF EXISTS get_field_summary;');
        await pool.query(`
            CREATE PROCEDURE get_field_summary(
                IN p_field_id INT,
                OUT p_total_quantity DECIMAL(10, 2),
                OUT p_disease_count INT
            )
            BEGIN
                SELECT COALESCE(SUM(quantity), 0)
                INTO p_total_quantity
                FROM FertilizerUsage
                WHERE field_id = p_field_id;

                SELECT COUNT(*)
                INTO p_disease_count
                FROM CropDiseases
                WHERE field_id = p_field_id;
            END;
        `);

        await pool.query('DROP PROCEDURE IF EXISTS ApplyFertilizerSafe;');
        await pool.query(`
            CREATE PROCEDURE ApplyFertilizerSafe(
                IN p_field_id INT,
                IN p_type VARCHAR(255),
                IN p_quantity DECIMAL(10, 2),
                OUT p_status VARCHAR(100)
            )
            BEGIN
                DECLARE current_total DECIMAL(10, 2);

                START TRANSACTION;

                SELECT total_fertilizer
                INTO current_total
                FROM Fields
                WHERE field_id = p_field_id
                FOR UPDATE;

                IF current_total IS NULL THEN
                    ROLLBACK;
                    SET p_status = 'Transaction Failed: Field not found.';
                ELSEIF p_quantity <= 0 THEN
                    ROLLBACK;
                    SET p_status = 'Transaction Failed: Quantity must be greater than zero.';
                ELSEIF current_total + p_quantity > 500 THEN
                    ROLLBACK;
                    SET p_status = 'Transaction Failed: Fertilizer limit exceeded (500 units max).';
                ELSE
                    INSERT INTO FertilizerUsage
                        (field_id, fertilizer_type, quantity, applied_date)
                    VALUES
                        (p_field_id, p_type, p_quantity, CURDATE());

                    UPDATE Fields
                    SET total_fertilizer = total_fertilizer + p_quantity
                    WHERE field_id = p_field_id;

                    COMMIT;
                    SET p_status = 'Transaction Successful: Fertilizer applied safely.';
                END IF;
            END;
        `);

        await pool.query('DROP PROCEDURE IF EXISTS GetFieldReport;');
        await pool.query(`
            CREATE PROCEDURE GetFieldReport(
                IN p_field_id INT,
                OUT p_fert_used DECIMAL(10, 2),
                OUT p_disease_cnt INT
            )
            BEGIN
                SELECT total_fertilizer
                INTO p_fert_used
                FROM Fields
                WHERE field_id = p_field_id;

                SELECT COUNT(*)
                INTO p_disease_cnt
                FROM CropDiseases
                WHERE field_id = p_field_id;
            END;
        `);

        await pool.query('DROP PROCEDURE IF EXISTS CheckAndAlertCriticalFields;');
        await pool.query(`
            CREATE PROCEDURE CheckAndAlertCriticalFields()
            BEGIN
                DECLARE finished INT DEFAULT FALSE;
                DECLARE current_field_id INT;
                DECLARE current_farmer_name VARCHAR(255);
                DECLARE critical_count INT;

                DECLARE field_cursor CURSOR FOR
                    SELECT
                        f.field_id,
                        u.name,
                        COUNT(cd.disease_id)
                    FROM Fields f
                    JOIN Users u ON f.user_id = u.user_id
                    JOIN CropDiseases cd ON f.field_id = cd.field_id
                    WHERE cd.severity = 'Critical'
                    GROUP BY f.field_id, u.name;

                DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = TRUE;

                OPEN field_cursor;

                alert_loop: LOOP
                    FETCH field_cursor
                    INTO current_field_id, current_farmer_name, critical_count;

                    IF finished THEN
                        LEAVE alert_loop;
                    END IF;

                    INSERT INTO Alerts (message)
                    VALUES (
                        CONCAT(
                            'DAILY SUMMARY: Field ',
                            current_field_id,
                            ' owned by ',
                            current_farmer_name,
                            ' has ',
                            critical_count,
                            ' critical diseases.'
                        )
                    );
                END LOOP;

                CLOSE field_cursor;
            END;
        `);

        console.log('--- Step 6: Setting Up Event Scheduler ---');
        try {
            await pool.query('SET GLOBAL event_scheduler = ON;');
        } catch (e) {
            console.log('Notice: Could not set global event_scheduler (may require SUPER privilege). Continuing...');
        }

        await pool.query('DROP EVENT IF EXISTS daily_field_check;');
        await pool.query(`
            CREATE EVENT daily_field_check
            ON SCHEDULE EVERY 24 HOUR
            DO
            BEGIN
                UPDATE Fields f
                SET total_fertilizer = (
                    SELECT COALESCE(SUM(quantity), 0)
                    FROM FertilizerUsage fu
                    WHERE fu.field_id = f.field_id
                );

                CALL CheckAndAlertCriticalFields();
            END;
        `);

        console.log('Migration completed successfully! All tables, views, functions, triggers, procedures, and events are ready.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();

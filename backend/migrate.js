require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Executing advanced PL/SQL migration...');
        
        const sql = `
            -- 1. Create New Tables
            CREATE TABLE IF NOT EXISTS Alerts (
                alert_id INT AUTO_INCREMENT PRIMARY KEY,
                message VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS AuditLog (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                table_name VARCHAR(50) NOT NULL,
                action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add total_fertilizer to Fields if not exists
            SET @dbname = DATABASE();
            SET @tablename = 'Fields';
            SET @columnname = 'total_fertilizer';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE
                    (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
                ) > 0,
                'SELECT 1',
                CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10,2) DEFAULT 0;')
            ));
            PREPARE alterIfNotExists FROM @preparedStatement;
            EXECUTE alterIfNotExists;
            DEALLOCATE PREPARE alterIfNotExists;

            -- 2. Drop existing triggers if they exist to prevent errors
            DROP TRIGGER IF EXISTS ValidateSoilPH;
            DROP TRIGGER IF EXISTS HighSeverityDiseaseAlert;
            DROP TRIGGER IF EXISTS LogFertilizerUsage;

            -- 3. Create Triggers
            -- Soil Validation
            CREATE TRIGGER ValidateSoilPH
            BEFORE INSERT ON SoilProperties
            FOR EACH ROW
            BEGIN
                IF NEW.pH < 0 OR NEW.pH > 14 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'pH must be between 0 and 14';
                END IF;
            END;

            -- Automatic Alert System
            CREATE TRIGGER HighSeverityDiseaseAlert
            AFTER INSERT ON CropDiseases
            FOR EACH ROW
            BEGIN
                IF NEW.severity = 'High' OR NEW.severity = 'Critical' THEN
                    INSERT INTO Alerts (message) 
                    VALUES (CONCAT('High severity disease (', NEW.disease_name, ') detected in field ', NEW.field_id));
                END IF;
            END;

            -- Activity Log System
            CREATE TRIGGER LogFertilizerUsage
            AFTER INSERT ON FertilizerUsage
            FOR EACH ROW
            BEGIN
                INSERT INTO AuditLog (action, table_name) 
                VALUES (CONCAT('Applied ', NEW.quantity, ' units of ', NEW.fertilizer_type, ' to field ', NEW.field_id), 'FertilizerUsage');
            END;

            -- 4. Drop and Create Stored Procedures
            DROP PROCEDURE IF EXISTS get_field_summary;
            DROP PROCEDURE IF EXISTS update_total_fertilizer;

            CREATE PROCEDURE get_field_summary(IN p_field_id INT, OUT p_total_fert DECIMAL(10,2), OUT p_disease_count INT)
            BEGIN
                SELECT COALESCE(SUM(quantity), 0) INTO p_total_fert FROM FertilizerUsage WHERE field_id = p_field_id;
                SELECT COUNT(*) INTO p_disease_count FROM CropDiseases WHERE field_id = p_field_id;
            END;

            CREATE PROCEDURE update_total_fertilizer()
            BEGIN
                UPDATE Fields f
                SET total_fertilizer = (
                    SELECT COALESCE(SUM(quantity), 0) 
                    FROM FertilizerUsage fu 
                    WHERE fu.field_id = f.field_id
                );
            END;

            -- 5. Enable Event Scheduler and Create Event
            SET GLOBAL event_scheduler = ON;
            
            DROP EVENT IF EXISTS daily_fertilizer_update;
            CREATE EVENT daily_fertilizer_update
            ON SCHEDULE EVERY 1 DAY
            DO
                CALL update_total_fertilizer();
        `;

        await pool.query(sql);
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();

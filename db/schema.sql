-- Create Database
CREATE DATABASE IF NOT EXISTS agriculture_management;
USE agriculture_management;

-- Enable Event Scheduler
SET GLOBAL event_scheduler = ON;

-- =========================================================================
-- 1. NORMALIZED TABLES (3NF)
-- =========================================================================

-- Farmers Table (previously Users - updated for better naming)
CREATE TABLE IF NOT EXISTS Farmers (
    farmer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops Table (New - for 3NF normalization)
CREATE TABLE IF NOT EXISTS Crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL UNIQUE,
    optimal_ph_min DECIMAL(4,2),
    optimal_ph_max DECIMAL(4,2)
);

-- Fields Table
CREATE TABLE IF NOT EXISTS Fields (
    field_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_id INT, -- Foreign key to Crops for normalization
    location VARCHAR(255) NOT NULL,
    area_size DECIMAL(10, 2) NOT NULL,
    total_fertilizer DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (farmer_id) REFERENCES Farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES Crops(crop_id) ON DELETE SET NULL
);
-- Index for frequent joins
CREATE INDEX idx_farmer_field ON Fields(farmer_id);

-- SoilHealth Table (previously SoilProperties)
CREATE TABLE IF NOT EXISTS SoilHealth (
    soil_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    pH DECIMAL(4, 2) NOT NULL,
    nitrogen DECIMAL(10, 2) NOT NULL,
    phosphorus DECIMAL(10, 2) NOT NULL,
    potassium DECIMAL(10, 2) NOT NULL,
    test_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);
-- Composite index for fast historical lookups
CREATE INDEX idx_soil_field_date ON SoilHealth(field_id, test_date);

-- FertilizerUsage Table
CREATE TABLE IF NOT EXISTS FertilizerUsage (
    fertilizer_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    fertilizer_type VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    applied_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);
CREATE INDEX idx_fert_field ON FertilizerUsage(field_id);

-- CropDiseases Table
CREATE TABLE IF NOT EXISTS CropDiseases (
    disease_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    disease_name VARCHAR(255) NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    detection_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);
-- Index for severity filtering
CREATE INDEX idx_disease_severity ON CropDiseases(severity);

-- Alerts Table
CREATE TABLE IF NOT EXISTS Alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AuditLog Table
CREATE TABLE IF NOT EXISTS AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. USER-DEFINED FUNCTION (UDF)
-- =========================================================================
DELIMITER //
DROP FUNCTION IF EXISTS CheckSoilHealthStatus //
CREATE FUNCTION CheckSoilHealthStatus(n DECIMAL(10,2), p DECIMAL(10,2), k DECIMAL(10,2)) 
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE status VARCHAR(50);
    -- Simple agronomic logic for N-P-K classification
    IF n < 10 OR p < 5 OR k < 15 THEN
        SET status = 'Nutrient Deficient';
    ELSEIF n > 100 OR p > 100 OR k > 100 THEN
        SET status = 'Toxic / Over-fertilized';
    ELSE
        SET status = 'Healthy';
    END IF;
    RETURN status;
END //
DELIMITER ;

-- =========================================================================
-- 3. VIEW: FieldHealthSummary
-- =========================================================================
CREATE OR REPLACE VIEW FieldHealthSummary AS
SELECT 
    f.field_id,
    f.location,
    frm.name AS farmer_name,
    c.crop_name,
    sh.pH,
    CheckSoilHealthStatus(sh.nitrogen, sh.phosphorus, sh.potassium) AS soil_status,
    f.total_fertilizer,
    (SELECT COUNT(*) FROM CropDiseases cd WHERE cd.field_id = f.field_id AND severity IN ('High', 'Critical')) AS critical_diseases
FROM Fields f
JOIN Farmers frm ON f.farmer_id = frm.farmer_id
LEFT JOIN Crops c ON f.crop_id = c.crop_id
-- Join only the most recent soil test for each field
LEFT JOIN SoilHealth sh ON f.field_id = sh.field_id 
    AND sh.test_date = (SELECT MAX(test_date) FROM SoilHealth WHERE field_id = f.field_id);

-- =========================================================================
-- 4. TRIGGERS
-- =========================================================================
DELIMITER //

-- Trigger 1: Data Validation (Soil pH)
DROP TRIGGER IF EXISTS ValidateSoilPH //
CREATE TRIGGER ValidateSoilPH
BEFORE INSERT ON SoilHealth
FOR EACH ROW
BEGIN
    IF NEW.pH < 0 OR NEW.pH > 14 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Soil pH must be between 0 and 14.';
    END IF;
END //

-- Trigger 2: Auto-Alert on Critical Disease
DROP TRIGGER IF EXISTS AutoAlertCriticalDisease //
CREATE TRIGGER AutoAlertCriticalDisease
AFTER INSERT ON CropDiseases
FOR EACH ROW
BEGIN
    IF NEW.severity = 'Critical' THEN
        INSERT INTO Alerts (message) 
        VALUES (CONCAT('CRITICAL ALERT: ', NEW.disease_name, ' detected in Field ID ', NEW.field_id, '. Immediate action required!'));
    END IF;
END //

-- Trigger 3: Audit Logging for Fertilizer
DROP TRIGGER IF EXISTS LogFertilizerUsage //
CREATE TRIGGER LogFertilizerUsage
AFTER INSERT ON FertilizerUsage
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (action, table_name) 
    VALUES (CONCAT('Applied ', NEW.quantity, ' units of ', NEW.fertilizer_type, ' to Field ID ', NEW.field_id), 'FertilizerUsage');
END //
DELIMITER ;

-- =========================================================================
-- 5. STORED PROCEDURES (With Transactions & Cursors)
-- =========================================================================
DELIMITER //

-- Procedure 1: Safe Fertilizer Application (Transaction + Rollback)
DROP PROCEDURE IF EXISTS ApplyFertilizerSafe //
CREATE PROCEDURE ApplyFertilizerSafe(
    IN p_field_id INT, 
    IN p_type VARCHAR(255), 
    IN p_quantity DECIMAL(10,2),
    OUT p_status VARCHAR(100)
)
BEGIN
    DECLARE current_total DECIMAL(10,2);
    
    -- Start Transaction to ensure atomicity
    START TRANSACTION;
    
    -- Row-level lock to prevent race conditions during calculation
    SELECT total_fertilizer INTO current_total FROM Fields WHERE field_id = p_field_id FOR UPDATE;
    
    -- Business Rule: A field cannot exceed 500 total units of fertilizer globally
    IF (current_total + p_quantity) > 500 THEN
        ROLLBACK;
        SET p_status = 'Transaction Failed: Exceeds maximum allowed field fertilizer capacity (500 units).';
    ELSE
        INSERT INTO FertilizerUsage (field_id, fertilizer_type, quantity, applied_date) 
        VALUES (p_field_id, p_type, p_quantity, CURDATE());
        
        UPDATE Fields SET total_fertilizer = total_fertilizer + p_quantity WHERE field_id = p_field_id;
        
        COMMIT;
        SET p_status = 'Transaction Successful: Fertilizer applied safely.';
    END IF;
END //

-- Procedure 2: Field Report (IN/OUT params)
DROP PROCEDURE IF EXISTS GetFieldReport //
CREATE PROCEDURE GetFieldReport(IN p_field_id INT, OUT p_fert_used DECIMAL(10,2), OUT p_disease_cnt INT)
BEGIN
    SELECT total_fertilizer INTO p_fert_used FROM Fields WHERE field_id = p_field_id;
    SELECT COUNT(*) INTO p_disease_cnt FROM CropDiseases WHERE field_id = p_field_id;
END //

-- Procedure 3: Check Critical Fields with CURSOR
DROP PROCEDURE IF EXISTS CheckAndAlertCriticalFields //
CREATE PROCEDURE CheckAndAlertCriticalFields()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_field_id INT;
    DECLARE v_farmer_name VARCHAR(255);
    DECLARE v_critical_count INT;
    
    -- Declare the cursor to iterate through fields with critical diseases
    DECLARE field_cursor CURSOR FOR 
        SELECT f.field_id, frm.name, COUNT(cd.disease_id) 
        FROM Fields f
        JOIN Farmers frm ON f.farmer_id = frm.farmer_id
        JOIN CropDiseases cd ON f.field_id = cd.field_id
        WHERE cd.severity = 'Critical'
        GROUP BY f.field_id, frm.name;
        
    -- Declare handler for end of cursor loop
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN field_cursor;
    
    read_loop: LOOP
        FETCH field_cursor INTO v_field_id, v_farmer_name, v_critical_count;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insert a daily summary alert for fields with critical issues
        INSERT INTO Alerts (message) 
        VALUES (CONCAT('DAILY SUMMARY: Field ', v_field_id, ' owned by ', v_farmer_name, ' currently has ', v_critical_count, ' critical diseases.'));
    END LOOP;
    
    CLOSE field_cursor;
END //
DELIMITER ;

-- =========================================================================
-- 6. EVENT SCHEDULER (Automation)
-- =========================================================================
DROP EVENT IF EXISTS daily_field_check;
CREATE EVENT daily_field_check
ON SCHEDULE EVERY 24 HOUR
DO
BEGIN
    -- Recalculate fertilizer totals in case of manual data tampering
    UPDATE Fields f
    SET total_fertilizer = (
        SELECT COALESCE(SUM(quantity), 0) FROM FertilizerUsage fu WHERE fu.field_id = f.field_id
    );
    
    -- Run the cursor procedure to alert about critical fields
    CALL CheckAndAlertCriticalFields();
END;

-- Create Database
CREATE DATABASE IF NOT EXISTS agriculture_management;
USE agriculture_management;

-- 1. User Management Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('Farmer', 'Admin') NOT NULL,
    contact VARCHAR(50)
);

-- 2. Field Management Table
CREATE TABLE Fields (
    field_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    area_size DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Soil Properties Module Table
CREATE TABLE SoilProperties (
    soil_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    pH DECIMAL(4, 2) NOT NULL,
    nitrogen DECIMAL(10, 2) NOT NULL,
    phosphorus DECIMAL(10, 2) NOT NULL,
    potassium DECIMAL(10, 2) NOT NULL,
    test_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);

-- 4. Fertilizer Usage Module Table
CREATE TABLE FertilizerUsage (
    fertilizer_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    fertilizer_type VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    applied_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);

-- 5. Crop Disease Module Table
CREATE TABLE CropDiseases (
    disease_id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    crop_name VARCHAR(255) NOT NULL,
    disease_name VARCHAR(255) NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    detection_date DATE NOT NULL,
    FOREIGN KEY (field_id) REFERENCES Fields(field_id) ON DELETE CASCADE
);

-- AUTOMATION (IMPORTANT)

-- Add SQL trigger: Prevent fertilizer quantity > 100 (throw error)
DELIMITER //
CREATE TRIGGER PreventExcessiveFertilizer
BEFORE INSERT ON FertilizerUsage
FOR EACH ROW
BEGIN
    IF NEW.quantity > 100 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Fertilizer quantity cannot exceed 100 units per application.';
    END IF;
END;
//
DELIMITER ;

-- Add stored procedure: Calculate total fertilizer used per field
DELIMITER //
CREATE PROCEDURE CalculateTotalFertilizer(IN p_field_id INT, OUT p_total_quantity DECIMAL(10, 2))
BEGIN
    SELECT COALESCE(SUM(quantity), 0) INTO p_total_quantity
    FROM FertilizerUsage
    WHERE field_id = p_field_id;
END;
//
DELIMITER ;

-- Add view: Generate report combining Users + Fields + FertilizerUsage
CREATE VIEW UserFieldFertilizerReport AS
SELECT 
    u.user_id,
    u.name AS user_name,
    u.role,
    f.field_id,
    f.location,
    f.area_size,
    fu.fertilizer_id,
    fu.fertilizer_type,
    fu.quantity,
    fu.applied_date
FROM 
    Users u
JOIN 
    Fields f ON u.user_id = f.user_id
LEFT JOIN 
    FertilizerUsage fu ON f.field_id = fu.field_id;

# Agriculture Management System

A full-stack web application for managing agricultural data, including users, fields, soil properties, fertilizer usage, and crop diseases.

## Tech Stack
* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** Node.js, Express, MySQL2
* **Database:** MySQL

## Features
1. **User Management:** Register users as Farmers or Admins.
2. **Field Management:** Add and link fields to specific users.
3. **Soil Properties:** Record pH, Nitrogen, Phosphorus, Potassium levels for fields.
4. **Fertilizer Usage:** Log fertilizer applications. Contains a trigger to prevent logging > 100 units.
5. **Crop Diseases:** Track diseases with severity levels.
6. **Dashboard:** Summarizes total diseases and fertilizer usage per field (via stored procedure).

## Setup Instructions

### 1. Database Setup
1. Ensure MySQL is installed and running.
2. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or CLI).
3. Run the SQL script provided in `db/schema.sql` to create the database, tables, trigger, stored procedure, and view.
   ```bash
   mysql -u root -p < db/schema.sql
   ```

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the `.env` file in the `backend` folder with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=agriculture_management
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will run on http://localhost:5000*

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on http://localhost:5173*

## Directory Structure
```
agriculture-management-system/
├── backend/          # Node.js + Express API server
│   ├── .env          # Database credentials
│   ├── package.json
│   └── server.js     # Main application logic
├── db/
│   └── schema.sql    # DDL scripts, triggers, procedures, views
└── frontend/         # React application (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx
    │   │   ├── DiseaseForm.jsx
    │   │   ├── FertilizerForm.jsx
    │   │   ├── FieldForm.jsx
    │   │   ├── SoilForm.jsx
    │   │   └── UserForm.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json
```

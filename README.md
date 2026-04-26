# 🌾 Agriculture Management System



A premium, full-stack web application designed to help agronomists and farmers manage fields, monitor soil health, track fertilizer usage, and automate disease alerts. Built with a modern React frontend and a powerful Node.js/MySQL backend featuring advanced, production-ready PL/SQL database automation.

## ✨ Key Features

### 💻 Modern Frontend (React + Tailwind CSS v4)
* **Glassmorphic Dashboard:** A beautiful, responsive, and animated user interface using `framer-motion` and `recharts`.
* **Soil Nutrients Analysis:** Interactive, grouped bar charts comparing Nitrogen (N), Phosphorus (P), and Potassium (K) levels across different fields.
* **Live System Alerts Panel:** Real-time notifications for critical crop diseases fetched directly from database triggers.
* **Activity Logs Viewer:** A dedicated UI to monitor automated background database events and user inputs.

### ⚙️ Advanced Database Architecture & Automation (MySQL 8.0+)
This project showcases deep database engineering, pushing business logic directly into the data layer:
* **3NF Normalization:** Fully normalized relational structure separating `Farmers`, `Crops`, `Fields`, `SoilHealth`, and `CropDiseases` to prevent data anomalies.
* **User-Defined Functions (UDF):** Features a custom `CheckSoilHealthStatus()` deterministic function to instantly classify N-P-K nutrient levels as 'Healthy', 'Deficient', or 'Toxic'.
* **Dynamic Views:** Utilizes a `FieldHealthSummary` VIEW to instantly join 5 tables and aggregate complex health statuses without writing massive queries in the backend.
* **Data Validation Triggers:** The database strictly prevents invalid data via triggers (e.g., aborting queries if Soil pH isn't between 0-14).
* **Automated Audit Logging:** Un-bypassable triggers automatically log high-severity diseases to an `Alerts` table and track every fertilizer application in an immutable `AuditLog` table.
* **Transactions & Rollbacks:** The `ApplyFertilizerSafe` stored procedure uses `START TRANSACTION`, row-level locking (`FOR UPDATE`), and strict business rules. If an application exceeds the field limit, it triggers an instant `ROLLBACK`.
* **Cursors:** Features an advanced looping mechanism via Cursors inside a stored procedure to iterate over critical fields and generate daily summary alerts row-by-row.
* **Automated Event Scheduler:** A background MySQL cron job (`daily_field_check`) automatically self-heals cached fertilizer totals and runs the Cursor procedure every 24 hours.
* **Performance Indexing:** Strategic composite and foreign-key indexes added to optimize `JOIN` and `WHERE` clauses on massive datasets.

---

## 🛠️ Technology Stack

* **Frontend:** React, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons, Axios.
* **Backend:** Node.js, Express.js.
* **Database:** MySQL 8.0+ (using `mysql2` promise pool).

---

## 🚀 Installation & Setup

### 1. Prerequisites
* Node.js (v18+ recommended)
* MySQL Server (XAMPP, WAMP, or standalone MySQL 8+)

### 2. Database Configuration
1. Open your MySQL server and ensure it is running.
2. In the `backend/` directory, create or modify the `.env` file with your credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agriculture_management
PORT=5001
```

### 3. Initialize the Database
We have provided a comprehensive schema file that builds the 3NF tables, UDFs, Views, Triggers, Procedures, and Events.
You can import the database by running the `schema.sql` file in your MySQL environment:
```bash
mysql -u root -p < db/schema.sql
```
*(Alternatively, you can copy the contents of `db/schema.sql` and run it directly in phpMyAdmin or MySQL Workbench).*

### 4. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
*The server will start on `http://localhost:5001`.*

### 5. Run the Frontend App
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The React app will open on `http://localhost:5173`.*

---

## 📂 Project Structure

```text
agriculture-management-system/
├── backend/
│   ├── server.js         # Express API routes
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React UI Components (Dashboard, Forms, Logs)
│   │   ├── App.jsx       # App routing
│   │   └── index.css     # Global Tailwind configurations
│   └── vite.config.js    # Vite configuration
└── db/
    └── schema.sql        # Advanced 3NF schema with PL/SQL logic
```

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you'd like to improve the project!

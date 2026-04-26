# 🌾 Agriculture Management System

A premium, full-stack web application designed to help agronomists and farmers manage fields, monitor soil health, track fertilizer usage, and automate disease alerts. Built with a modern React frontend and a powerful Node.js/MySQL backend featuring advanced PL/SQL-style database automation.

## ✨ Key Features

### 💻 Modern Frontend (React + Tailwind CSS v4)
* **Glassmorphic Dashboard:** A beautiful, responsive, and animated user interface using `framer-motion` and `recharts`.
* **Soil Nutrients Analysis:** Interactive, grouped bar charts comparing Nitrogen (N), Phosphorus (P), and Potassium (K) levels across different fields.
* **Live System Alerts Panel:** Real-time notifications for critical crop diseases fetched directly from database triggers.
* **Activity Logs Viewer:** A dedicated UI to monitor automated background database events and user inputs.

### ⚙️ Advanced Backend & Database Automation (Node.js + MySQL)
* **Data Validation Triggers:** The database strictly prevents invalid data (e.g., Soil pH must be between 0-14, fertilizer caps at 100 units).
* **Automated Alerting (`HighSeverityDiseaseAlert`):** Whenever a high/critical crop disease is logged, the database automatically generates an alert message using a Trigger.
* **Audit Logging (`LogFertilizerUsage`):** A database trigger silently logs every fertilizer application to an immutable `AuditLog` table.
* **Stored Procedures:** Heavy calculations (like aggregating field summaries) are offloaded to compiled MySQL stored procedures for lightning-fast API responses.
* **Automated Event Scheduler:** A background MySQL cron job automatically recalculates and caches total fertilizer usage globally every 24 hours.

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
We have provided a migration script that builds the tables, triggers, procedures, and events automatically.
```bash
cd backend
npm install
node migrate.js
```

### 4. Run the Backend Server
```bash
cd backend
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
│   ├── migrate.js        # DB migration & PL/SQL generation script
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React UI Components (Dashboard, Forms, Logs)
│   │   ├── App.jsx       # App routing
│   │   └── index.css     # Global Tailwind configurations
│   └── vite.config.js    # Vite configuration
└── db/
    └── schema.sql        # Initial basic schema definitions
```

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you'd like to improve the project!

# NIE Auditorium Booking System

A full-stack web application designed exclusively for the National Institute of Engineering (NIE) to streamline and manage the booking of campus auditoriums. Built with a robust Django backend and a modern React frontend, this system enforces a strict "First Come, First Serve" (FCFS) priority queue while entirely preventing double-booking conflicts.

## 🌟 Features

* **Exclusive Access:** Registration and login are strictly locked down to valid `@nie.ac.in` student and faculty email addresses.
* **Role-Based Access Control (RBAC):** Distinct dashboards for standard users and administrators.
* **Automated Conflict Resolution:** The backend actively prevents time-slot overlaps. If an admin approves a booking, any conflicting pending requests are automatically rejected and users are notified.
* **Interactive Calendar:** A real-time availability grid showing exactly what venues are booked on specific days.
* **Live Notifications:** Users receive instant alerts when their booking status changes.
* **Audit Trail:** Every admin action (approvals, rejections, auditorium additions/removals) is securely logged for total transparency.
* **Dynamic SQL Logging:** The backend prints raw SQL queries to the development console, making it perfect for DBMS academic demonstrations.

## 🛠️ Technology Stack

* **Frontend:** React, Vite, Vanilla CSS (Custom Glassmorphism UI)
* **Backend:** Django, Django REST Framework (DRF), Simple JWT
* **Database:** SQLite (default)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [Python](https://www.python.org/) (v3.10+)

### 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
   ```
4. Run database migrations to build the tables:
   ```bash
   cd ..
   python manage.py makemigrations
   python manage.py migrate
   ```
5. Seed the database with the default Admin account:
   ```bash
   python seed.py
   ```
   *(This creates the default admin login: **Email:** admin@nie.ac.in | **Password:** admin123)*
   
6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   *The backend will now be running on `http://localhost:8000/`*

### 2. Frontend Setup (React/Vite)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will now be running on `http://localhost:5173/`*

---

## 🖥️ Usage Guide

1. **Admin Access:** Navigate to `http://localhost:5173/login` and log in with the default admin credentials (`admin@nie.ac.in` / `admin123`). From the Admin Panel, you can create new auditoriums (North/South campus) and manage incoming FCFS booking requests.
2. **Student Access:** Register a new account. Remember, the email **must** end with `@nie.ac.in`. Once logged in, you can view the availability calendar and submit a booking request.

## 📂 Project Structure

* `/backend/api/` - Contains the Django models, serializers, and core API views (handling FCFS logic, overlapping checks).
* `/frontend/src/pages/` - Contains the React views (`Dashboard.jsx`, `AdminPanel.jsx`, `Login.jsx`, `Register.jsx`).
* `/frontend/src/index.css` - Contains the entire design system and responsive mobile layouts.

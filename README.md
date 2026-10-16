# StaffSync — MERN Stack HR Management System

Beginner-friendly college project using MongoDB, Express, React, Node.js, JWT and Bootstrap.

## Requirements
- Node.js 18+ recommended
- npm
- MongoDB local installation OR a MongoDB Atlas connection string
- VS Code

## 1. Configure the backend
Open a terminal in `StaffSync/backend` and run:
```bash
npm install
```
Copy `.env.example` to `.env` and set your values:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/staffsync
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
Make sure MongoDB is running if using the local connection.

## 2. Start the backend
From `StaffSync/backend`:
```bash
npm run dev
```
The API runs at http://localhost:5000. Visit `/api/health` to test it.

## 3. Configure and start the frontend
Open a second terminal in `StaffSync/frontend`:
```bash
npm install
npm run dev
```
Open the URL Vite prints, usually http://localhost:5173.

## 4. Create the first account
Use the Register screen to create an account. For a college demo, the registration form allows choosing a role. In a real deployment, public registration must NOT allow users to choose HR or Manager roles; restrict role assignment to an authorized administrator.

## Included features
- Register/login with hashed passwords and JWT
- Role-aware navigation and protected API routes
- Employee directory (HR)
- Attendance marking and history
- Leave requests and approval/rejection
- Announcements (HR can create)
- Training programs (HR/Manager can create)
- Dashboard summary cards

## Important notes
- This is an educational starter project, not a production-ready HR system.
- Before deployment, remove role selection from public registration and seed an initial HR administrator securely.
- Add stronger validation, audit logs, pagination, password reset, rate limiting, and automated tests before real use.
- Never commit `.env` or share your JWT secret.

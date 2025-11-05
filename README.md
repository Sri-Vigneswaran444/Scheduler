# 🧭 SlotSwapper — Peer-to-Peer Time Slot Swapping App

### 🚀 Built for the ServiceHive Full Stack Intern Technical Challenge

SlotSwapper is a **peer-to-peer time-slot scheduling web application**.  
Users can create calendar events, mark them as *swappable*, browse other users’ available slots, and propose swaps.  
If accepted, the system automatically exchanges ownership of the two slots.

This project demonstrates **end-to-end full-stack engineering**:  
secure authentication, relational data modeling, transactional swap logic, and a dynamic, animated React frontend.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite) + Axios + Framer Motion + Custom CSS |
| **Backend** | Node.js + Express + JWT + bcrypt |
| **Database** | Lightweight JSON file (using `fs.promises`) — easy to replace with Postgres/Mongo |
| **State Management** | React hooks & `useState`/`useEffect` |
| **Auth** | JWT (Bearer token) |
| **Deployment Ready** | Easily deployable on Render (backend) + Vercel (frontend) |

---

## ✨ Features Overview

### 🔐 Authentication
- Sign Up and Log In with JWT.
- Passwords hashed using bcrypt.
- Protected routes via middleware.
- Auto token storage and renewal on frontend.

### 📅 Calendar & Events
- CRUD operations for user’s events.
- Events can be toggled between:
  - `BUSY`
  - `SWAPPABLE`
  - `SWAP_PENDING`
- Visual chip indicators for each status.

### 🔄 Slot Swapping (Core Logic)
- View all **swappable** slots from other users (`/api/swappable-slots`).
- Request swaps by offering one of your own swappable slots.
- Respond to incoming swap requests with **Accept** or **Reject**.
- On acceptance:
  - Ownership of both slots is exchanged.
  - Both become `BUSY`.
- On rejection:
  - Both slots revert to `SWAPPABLE`.

### 🪄 Frontend Experience
- Beautiful modern UI with gradient backgrounds and animated cards.
- Responsive layout with sidebar navigation.
- Smooth transitions using Framer Motion.
- Accessible color contrast and hover states.
- Dynamic data refresh after every action (no manual reloads).

---

## 🧩 System Architecture

slot-swap/
├── backend/
│ ├── index.js
│ ├── package.json
│ └── db.json
├── frontend/
│ ├── src/
│ │ ├── pages/ # Auth, Dashboard, Marketplace, Requests
│ │ ├── App.jsx # Layout, navigation, routing
│ │ ├── styles.css
│ │ └── main.jsx
│ ├── vite.config.js
│ ├── package.json
│ └── index.html
└── README.md


---

## ⚙️ How to Run Locally

### 1️ Clone the repo
git clone https://github.com/Sri-Vigneswaran444/Scheduler.git
cd slot-swapper

### 2 run the backend
cd backend
npm install
node index.js

### 3 run the frontend
cd ../frontend
npm install
npm run dev



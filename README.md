# Hostel Complaint Management System (HCMS)

**Live:** [https://hcms-project-frontend.onrender.com](https://hcms-project-frontend.onrender.com)

A web application for managing maintenance complaints in a hostel. Students submit complaints, admins assign them to staff, and staff update progress until the issue is resolved.

---

## What it does

- **Students** register, log in, and submit complaints (e.g. electrical issue, water problem, cleanliness). They can track the status of their complaints.
- **Admins (Wardens)** view all complaints, assign them to the right maintenance staff, and monitor the overall status.
- **Maintenance Staff** see complaints assigned to them, mark them as In Progress or Resolved, and add remarks.
- Email notifications are sent at key stages — complaint received, complaint assigned, and status updates.
- Password reset is handled via a time-limited link sent to the user's registered email.

---

## Tech Stack

**Frontend**
- React 18 (Vite)
- React Router v6
- Axios
- Recharts (for analytics charts)
- Vanilla CSS

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- Nodemailer for emails
- bcryptjs for password hashing

---

## Project Structure

```
HCMS/
├── backend/
│   ├── controllers/       # Route handler logic
│   ├── middleware/        # Auth + error middleware
│   ├── models/            # Mongoose schemas (User, Complaint)
│   ├── routes/            # API route definitions
│   ├── utils/             # Email service
│   ├── config/            # DB connection
│   ├── seed/              # Optional seed script
│   ├── .env.example       # Environment variable template
│   └── server.js          # App entry point
│
└── frontend/
    └── src/
        ├── api/           # Axios instance
        ├── components/    # Shared components (ProtectedRoute, etc.)
        ├── context/       # Auth context (login/logout/session)
        ├── pages/         # Login, Register, Dashboards, etc.
        └── styles/        # Global CSS
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for sending emails

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd HCMS
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
copy .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hcms
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_16_char_app_password
MAIL_FROM=HCMS <your_gmail@gmail.com>
```

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

---

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## API Routes

### Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in, receive JWT |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password using token from email |
| GET | `/me` | Get current user (requires JWT) |

### Complaints — `/api/complaints`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Submit a new complaint (student) |
| GET | `/my` | Get current student's complaints |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints` | View all complaints |
| PUT | `/complaints/:id/assign` | Assign complaint to a staff member |
| GET | `/users` | View all registered users |

### Staff — `/api/staff`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints` | View complaints assigned to the logged-in staff |
| PUT | `/complaints/:id/status` | Update complaint status + add remark |

---

## User Roles

| Role | How to register |
|------|----------------|
| Student | Select "Student" on the Register page, provide room number |
| Admin / Warden | Select "Admin / Warden" on the Register page |
| Maintenance Staff | Select "Maintenance Staff" on the Register page, select department |

Each role is redirected to its own dashboard after login.

---

## Password Reset Flow

1. User clicks "Forgot Password" and enters their registered email.
2. Backend generates a random token, stores a SHA-256 hash of it in the database with a 30-minute expiry.
3. A reset link (containing the raw token) is sent to the user's email.
4. User clicks the link, which opens the Reset Password page.
5. User enters a new password. Backend hashes the token, matches it against the stored hash, checks expiry, and updates the password.
6. Token is cleared from the database after use.

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the backend server |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend URL used to build the password reset link |
| `MAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `MAIL_PORT` | SMTP port (465 for SSL, 587 for TLS) |
| `MAIL_SECURE` | `true` for port 465, `false` for 587 |
| `MAIL_USER` | Your email address |
| `MAIL_PASS` | App password (not your regular email password) |
| `MAIL_FROM` | Display name + address for outgoing emails |

> **Note:** Never commit your `.env` file. It is listed in `.gitignore`.

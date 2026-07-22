# DiaPredict AI - Smart Diabetes Management System

DiaPredict AI is a production-ready, full-stack healthcare SaaS application designed to help diabetes patients manage their condition systematically. Using a clinical rule-based AI recommendation engine, the app tracks blood glucose trends, logs nutritional diet guides, controls physical training sessions, maps schedule timelines, tracks water volume hydration, and coordinates doctor checkups.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React (built using Vite)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (featuring a responsive Dark/Light Glassmorphic theme)
- **Animations:** Framer Motion
- **Graphics:** Chart.js integrated via `react-chartjs-2`
- **Icons:** React Icons

### Backend
- **Platform:** Node.js (configured as ES Modules)
- **Framework:** Express.js
- **Auth & Sessions:** JSON Web Tokens (JWT) + bcryptjs password hashing
- **Mailing:** Nodemailer (with development fallback loggers)
- **Database Adapters:** Firebase Admin SDK + Local file JSON database fallback
- **Security:** Helmet, CORS, and Express Rate Limiters

### Database
- **Database Engine:** Firebase Firestore (Runs in Local Mock Mode if cloud parameters are blank)

---

## 📁 Project Structure

```text
AI_Diabetes_Web/
├── backend/
│   ├── .local_db/             # Local database JSON fallback stores (Auto-created)
│   ├── src/
│   │   ├── config/            # db connection config (Firebase Firestore + JSON mock)
│   │   ├── controllers/       # Execution controllers (Auth, Profile, Sugar, etc.)
│   │   ├── middleware/        # Middlewares (Authorization verify, validators, errors)
│   │   ├── routes/            # Routes endpoints routers
│   │   ├── services/          # Services (AI recommendation engine, email sender)
│   │   ├── utils/             # Database seeding scripts
│   │   └── server.js          # Express server entry point
│   ├── .env.example
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/        # Layout, Navbar, Sidebar, GlassCard, LoadingSkeleton
    │   ├── context/           # React Contexts (Auth session, Dark/Light Themes)
    │   ├── pages/             # Landing, Dashboard, Tracker pages, Analytics
    │   ├── utils/             # Axios client config with JWT header injection
    │   ├── index.css          # Design system base, glassmorphism overlays
    │   └── main.jsx           # Bootstrapping script
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── package.json
```

---

## 🗄️ Database Collections Schema

All collections map data isolated per user ID:

1. **`Users`**: Holds credentials, phone, name, registration verification status (`isVerified`), and OTP codes.
2. **`Profiles`**: Physiological stats (age, gender, height, weight, activityLevel, diabetesType, medicalNotes).
3. **`SugarReadings`**: History logs of blood sugar tests (`fasting`, `afterMeal`, `random`), classified ranges, and risk status.
4. **`DietPlans`**: 7-day meal schedule rotation tables, target calories counts, and grocery lists.
5. **`Exercises`**: System workouts catalog (seeding data).
6. **`ExerciseLogs`**: History records of physical activities completed by user.
7. **`WaterLogs`**: Today's hydration mL logs and targets.
8. **`Appointments`**: Clinic consult dates list, physician name, hospital, and checkup notes.
9. **`Notifications`**: Alert triggers logs.
10. **`Subscriptions`**: Web Push client registration keys (optional).

---

## 🌐 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /signup` - Register user & send verification OTP.
- `POST /verify-otp` - Verify email using OTP code & return JWT token.
- `POST /resend-otp` - Resend verification code.
- `POST /login` - Sign in using credentials.
- `POST /forgot-password` - Request password recovery token.
- `POST /reset-password` - Submit new password using reset code.

### 👤 Profile (`/api/profile`)
- `GET /` - Fetch active user clinical profile details.
- `POST /` - Create/Update physiological profile parameters.

### 🩸 Sugar Tracking (`/api/sugar`)
- `GET /` - Fetch blood sugar history logs.
- `POST /` - Log new glucose reading. Automatically classifies range & adds alerts.
- `DELETE /:id` - Cancel/Delete sugar reading record.
- `GET /report` - Generate Smart AI health forecast recommendations.

### 🥗 Diet Generator (`/api/diet`)
- `GET /` - Get user's daily 7-day meal plan.
- `POST /generate` - Re-generate meal schedules.
- `PUT /grocery` - Toggle checked state for items on grocery lists.

### 🏋️ Exercises (`/api/exercises`)
- `GET /` - Fetch recommended exercise catalog.
- `POST /log` - Log physical activity details (duration, reps, calories).
- `GET /log` - Get activity log history list.

### 📅 Daily Scheduler (`/api/schedule`)
- `GET /` - Get timeline elements (meal times, medication timing).
- `PUT /` - Save timing parameters changes.
- `PUT /toggle/:eventId` - Mark slot completed/pending.

### 💧 Hydration Tracker (`/api/water`)
- `GET /` - Get daily water intake and alarm settings.
- `POST /` - Increment today's logged water volume.
- `PUT /settings` - Adjust intervals, notifications toggle, or snooze.

### 🏥 Doctor Appointments (`/api/appointments`)
- `GET /` - List clinical visits.
- `POST /` - Schedule new consult.
- `PUT /:id` - Edit/Mark appointment completed.
- `DELETE /:id` - Delete/Cancel visit.

### 📊 Analytics (`/api/analytics`)
- `GET /` - Compile charts data feeds (distribution percentages, hydration goals, trend labels) and badges.

### 🔔 Alerts (`/api/notifications`)
- `GET /` - Fetch alerts list logs.
- `PUT /:id/read` - Mark alert read.
- `DELETE /` - Clear notification ledger.

---

## ⚙️ Development Installation Guide

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Backend Service Setup
```bash
# Go to backend folder
cd backend

# Install express, bcrypt, jwt, firebase, nodemailer dependencies
npm install

# (Optional) Edit environment settings in .env
# If you leave firebase variables empty, the system automatically 
# launches in mock JSON local DB mode (.local_db/ folder).

# Run the seeding script to populate Foods, Exercises, and Diet templates
npm run seed

# Run Express server
npm run dev
# Running on http://localhost:5000
```

### 2. Frontend Application Setup
```bash
# In a new terminal, navigate to the frontend folder
cd frontend

# Install Vite, Tailwind, Framer Motion, Chart.js dependencies
npm install

# Run the Vite Dev server
npm run dev
# Running on http://localhost:5173
```

Now, navigate to `http://localhost:5173` on your browser to view the Landings page.

---

## ⚡ Local Verification Demo Walkthrough

1. Go to the Sign Up page at `http://localhost:5173/signup`. Create a test account.
2. An OTP notification code will be generated. Go to your **backend console logs** to copy the 6-digit OTP code (e.g. `293848`).
3. Submit the OTP code. The session JWT gets stored, and you are redirected to the dashboard.
4. Since your clinical profile is incomplete, you are **forced** to complete the Biological parameters setup first. Enter your age, gender, height, weight, activity, and diabetes type, then save.
5. You are redirected to the home dashboard! The radial meter shows your calculated health score. The AI advisor logs recommendations.
6. Click **Sugar Tracking** -> Enter a test glucose value (e.g., fasting `135` mg/dL). Click submit. You will see an animated **HIGH RISK** warning card appear and recommendations get customized.
7. Browse **Diet Plan** to view your 7-day meal schedule matching target calories.
8. Go to **Exercise Plan**, select "Brisk Walking" -> click Start. An interactive countdown timer starts. Complete reps, and click "Log Workout".
9. Go to **Water Tracker**, click `+250mL` button and check how your volume progress increases.
10. Navigate to **Analytics** to check your Line charts, Bar diagrams, and unlock achievement badges!

---

## ☁️ Deployment Guidelines

### Backend (Render)
1. Commit the `backend/` folder to GitHub.
2. In Render, create a new **Web Service**.
3. Choose Node.js environment. Set root directory to `backend`.
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add Environment Variables:
   - `JWT_SECRET` = your_production_jwt_secret_phrase
   - `FIREBASE_PROJECT_ID` = your_firebase_project_id
   - `FIREBASE_CLIENT_EMAIL` = your_firebase_client_email
   - `FIREBASE_PRIVATE_KEY` = your_firebase_private_key (replace newlines with `\n`)

### Frontend (Vercel)
1. Commit the `frontend/` folder to GitHub.
2. In Vercel, create a new project and select the repository.
3. Configure Framework Preset: **Vite**.
4. Set root directory to `frontend`.
5. Set Environment Variables:
   - `VITE_API_URL` = your_live_backend_render_api_url (e.g. `https://diapredict-api.onrender.com/api`)
6. Deploy.

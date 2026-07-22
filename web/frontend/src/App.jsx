import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

// Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import ForgotPassword from './pages/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import SugarTracking from './pages/SugarTracking';
import DietPlan from './pages/DietPlan';
import Exercise from './pages/Exercise';
import DailyScheduler from './pages/DailyScheduler';
import WaterReminder from './pages/WaterReminder';
import DoctorAppointment from './pages/DoctorAppointment';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Contact from './pages/Contact';

// AI & Gamification Pages
import Chatbot from './pages/Chatbot';
import FoodScanner from './pages/FoodScanner';
import Calculators from './pages/Calculators';
import Gamification from './pages/Gamification';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<OtpVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected dashboard endpoints */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/sugar-tracking" element={<SugarTracking />} />
                <Route path="/diet-plan" element={<DietPlan />} />
                <Route path="/exercise" element={<Exercise />} />
                <Route path="/scheduler" element={<DailyScheduler />} />
                <Route path="/water-tracker" element={<WaterReminder />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/food-scanner" element={<FoodScanner />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/appointments" element={<DoctorAppointment />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

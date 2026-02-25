import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './components/auth/LoginPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

import IntroSequence from './components/intro/IntroSequence';

import ParticipantLayout from './components/participant/ParticipantLayout';
import ParticipantDashboard from './components/participant/ParticipantDashboard';
import ProblemSelection from './components/participant/ProblemSelection';
import ActivitiesPage from './components/participant/ActivitiesPage';
import ParticipantAttendance from './components/participant/ParticipantAttendance';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProblems from './components/admin/AdminProblems';
import AdminTeams from './components/admin/AdminTeams';
import AdminSelections from './components/admin/AdminSelections';
import AdminSubmissions from './components/admin/AdminSubmissions';
import AdminReviews from './components/admin/AdminReviews';
import AdminAnnouncements from './components/admin/AdminAnnouncements';
import AdminReports from './components/admin/AdminReports';
import AdminTimeline from './components/admin/AdminTimeline';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminEvaluation from './components/admin/AdminEvaluation';
import AdminTeamUpload from './components/admin/AdminTeamUpload';
import AdminCredentials from './components/admin/AdminCredentials';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Cinematic Intro */}
          <Route path="/" element={<IntroSequence />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Participant Portal (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <ParticipantLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<ParticipantDashboard />} />
            <Route path="/problems" element={<ProblemSelection />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/attendance" element={<ParticipantAttendance />} />
          </Route>

          {/* Admin Portal (Admin Only) */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/problems" element={<AdminProblems />} />
            <Route path="/admin/teams" element={<AdminTeams />} />
            <Route path="/admin/upload-teams" element={<AdminTeamUpload />} />
            <Route path="/admin/credentials" element={<AdminCredentials />} />
            <Route path="/admin/selections" element={<AdminSelections />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/evaluation" element={<AdminEvaluation />} />
            <Route path="/admin/timeline" element={<AdminTimeline />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

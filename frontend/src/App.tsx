import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppLayout from './components/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ResumePage from './pages/ResumePage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import InterviewReportPage from './pages/InterviewReportPage';
import ReplayPage from './pages/ReplayPage';
import RoadmapPage from './pages/RoadmapPage';
import RoadmapHistoryPage from './pages/RoadmapHistoryPage';
import HistoryPage from './pages/HistoryPage';
import JobsPage from './pages/JobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

/** Wraps public pages with the top Navbar */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes – have the marketing Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected app routes – AppLayout handles auth guard + sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/interview/setup" element={<InterviewSetupPage />} />
          <Route path="/interview/:sessionId/session" element={<InterviewSessionPage />} />
          <Route path="/interview/:sessionId/report" element={<InterviewReportPage />} />
          <Route path="/interview/:sessionId/replay" element={<ReplayPage />} />
          <Route path="/roadmap" element={<RoadmapHistoryPage />} />
          <Route path="/roadmap/:sessionId" element={<RoadmapPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* Admin routes – standalone layout (no sidebar, no user navbar) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

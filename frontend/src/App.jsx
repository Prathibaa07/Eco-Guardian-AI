import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import ReportsFeed from './pages/ReportsFeed';
import ReportDetails from './pages/ReportDetails';
import Dashboard from './pages/Dashboard';
import InteractiveMap from './pages/InteractiveMap';
import Rewards from './pages/Rewards';

// ── Protected Route Guard ──────────────────────────────────────────────────
// Redirects unauthenticated users to /login and shows a message after redirect
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // While auth state is loading, render nothing (avoids flash redirect)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with a message so Login page can show a prompt
    return <Navigate to="/login" state={{ from: '/report-issue', message: 'Please sign in to submit an environmental report.' }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">

          {/* Header */}
          <Navbar />

          {/* Main Workspace */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* 🔒 Protected: login required to report */}
              <Route
                path="/report-issue"
                element={
                  <ProtectedRoute>
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />

              <Route path="/reports" element={<ReportsFeed />} />
              <Route path="/reports/:id" element={<ReportDetails />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<InteractiveMap />} />
              <Route path="/rewards" element={<Rewards />} />

              {/* Fallback to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Floating Global Chatbot Assistant */}
          <ChatBot />

        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

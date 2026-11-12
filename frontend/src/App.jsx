import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MemberDashboard from './pages/MemberDashboard'
import AcceptInvitation from './pages/AcceptInvitation'
import NotFound from './pages/NotFound'

import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function DashboardRouter() {
  const { user } = useAuth()

  if (user?.role === 'ADMIN') {
    return <Dashboard />
  }

  if (user?.role === 'MEMBER') {
    return <MemberDashboard />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Acceptation des invitations */}
          <Route
            path="/invite/:token"
            element={<AcceptInvitation />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardRouter />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
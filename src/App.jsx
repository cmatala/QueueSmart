import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import JoinQueue from './pages/JoinQueue'
import QueueStatus from './pages/QueueStatus'
import History from './pages/History'
import AdminDashboard from './pages/AdminDashboard'
import ServiceManagement from './pages/ServiceManagement'
import QueueManagement from './pages/QueueManagement'

export default function App() {
  // null = signed out, 'user' or 'admin' once signed in.
  // No backend in A2, so this lives in React state only.
  const [role, setRole] = useState(null)

  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login onSignIn={setRole} />} />
      <Route path="/register" element={<Register />} />

      {/* user screens */}
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/join" element={<JoinQueue />} />
      <Route path="/status" element={<QueueStatus />} />
      <Route path="/history" element={<History />} />

      {/* admin screens */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/services" element={<ServiceManagement />} />
      <Route path="/admin/queues" element={<QueueManagement />} />

      {/* anything unrecognised goes back to the welcome page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
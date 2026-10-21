// OWNER: Celestin — shared file
//
// Routing and the signed-in account.
//
// A2 kept the services and queue entries in App state so every screen saw the
// same data. A3 does not: each screen fetches what it needs from the API, and


import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import ServiceManagement from './pages/ServiceManagement';
import QueueManagement from './pages/QueueManagement';

const STORAGE_KEY = 'queuesmart.account';

/**
 * Reads the signed-in account back from sessionStorage.
 *
 * Typing a URL into the address bar is a full page reload, which wipes React
 * state. Without this, visiting /admin directly would look like being signed
 * out. sessionStorage clears when the tab closes, which is the behaviour we
 * want for a shared campus computer.
 */
function storedAccount() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  // The function form runs once, on first render, instead of on every render.
  const [account, setAccount] = useState(storedAccount);

  const signIn = (user) => {
    setAccount(user);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // A browser with storage blocked still works, it just forgets on reload.
    }
  };

  const signOut = () => {
    setAccount(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do; the state above is what the UI reads.
    }
  };

  const home = account?.role === 'admin' ? '/admin' : '/dashboard';

  if (!account) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login onSignIn={signIn} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar account={account} onSignOut={signOut} />
      <Routes>
        <Route path="/dashboard" element={<UserDashboard account={account} />} />
        <Route path="/join" element={<JoinQueue account={account} />} />
        <Route path="/status" element={<QueueStatus account={account} />} />
        <Route path="/history" element={<History account={account} />} />

        {/* Admin screens. A non-admin who types the URL is sent to their own
            dashboard. The server checks this too, which is the check that
            actually matters: this one is only for tidiness. */}
        <Route
          path="/admin"
          element={account.role === 'admin'
            ? <AdminDashboard account={account} />
            : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/admin/services"
          element={account.role === 'admin'
            ? <ServiceManagement account={account} />
            : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/admin/queues"
          element={account.role === 'admin'
            ? <QueueManagement account={account} />
            : <Navigate to="/dashboard" replace />}
        />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </>
  );
}
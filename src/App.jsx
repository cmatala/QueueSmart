import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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

import { services as seedServices, queueEntries as seedEntries } from './data/mockData';

export default function App() {
  // The signed-in account, or null. No backend in A2, so this is React state.
  // sessionStorage keeps it across a page reload, so refreshing does not sign
  // you out. It clears when the tab closes.
  const [account, setAccount] = useState(() => {
    const saved = sessionStorage.getItem('qs-account');
    return saved ? JSON.parse(saved) : null;
  });

  // Shared app state, so a change made on one screen shows on the others.
  const [services, setServices] = useState(seedServices);
  const [entries, setEntries] = useState(seedEntries);

  const isAdmin = account?.role === 'admin';

  const signIn = (user) => {
    sessionStorage.setItem('qs-account', JSON.stringify(user));
    setAccount(user);
  };

  const signOut = () => {
    sessionStorage.removeItem('qs-account');
    setAccount(null);
  };

  // Not signed in: only the public screens are reachable.
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
      <Navbar role={account.role} onSignOut={signOut} />
      <Routes>
        {/* user screens */}
        <Route
          path="/dashboard"
          element={<UserDashboard account={account} services={services} entries={entries} />}
        />
        <Route
          path="/join"
          element={
            <JoinQueue
              account={account}
              services={services}
              entries={entries}
              setEntries={setEntries}
            />
          }
        />
        <Route
          path="/status"
          element={
            <QueueStatus
              account={account}
              services={services}
              entries={entries}
              setEntries={setEntries}
            />
          }
        />
        <Route path="/history" element={<History account={account} />} />

        {/* admin screens — a regular user is sent back to their own dashboard */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminDashboard
                services={services}
                setServices={setServices}
                entries={entries}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/services"
          element={
            isAdmin ? (
              <ServiceManagement
                services={services}
                setServices={setServices}
                setEntries={setEntries}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/queues"
          element={
            isAdmin ? (
              <QueueManagement
                services={services}
                entries={entries}
                setEntries={setEntries}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* anything else goes to the right home screen for the role */}
        <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />} />
      </Routes>
    </>
  );
}
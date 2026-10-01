// OWNER: Celestin
// Top navigation. Links differ by role; same position and styling on every screen.

import { NavLink, useNavigate } from 'react-router-dom';

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/join',      label: 'Join Queue' },
  { to: '/status',    label: 'Queue Status' },
  { to: '/history',   label: 'History' },
];

const ADMIN_LINKS = [
  { to: '/admin',          label: 'Dashboard' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/queues',   label: 'Queues' },
];

export default function Navbar({ role, onSignOut }) {
  const navigate = useNavigate();
  const links = role === 'admin' ? ADMIN_LINKS : USER_LINKS;

  const handleSignOut = () => {
    onSignOut();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to={role === 'admin' ? '/admin' : '/dashboard'} className="brand">
          QueueSmart
        </NavLink>

        <div className="nav-links">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {label}
            </NavLink>
          ))}
          <button type="button" className="btn-quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
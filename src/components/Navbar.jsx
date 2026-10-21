// OWNER: Celestin 
//
// Top navigation. The links depend on the signed-in role, which now comes
// from the server's login response rather than from a guess in the browser.

import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ account, onSignOut }) {
  const navigate = useNavigate();

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/join', label: 'Join queue' },
    { to: '/status', label: 'Queue status' },
    { to: '/history', label: 'History' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/services', label: 'Services' },
    { to: '/admin/queues', label: 'Queues' },
  ];

  const links = account?.role === 'admin' ? adminLinks : userLinks;

  const handleSignOut = () => {
    onSignOut();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to={account?.role === 'admin' ? '/admin' : '/dashboard'} className="brand">
          Queue<span>Smart</span>
        </NavLink>

        <div className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
          <span className="faint" style={{ padding: '.35rem .6rem' }}>{account?.name}</span>
          <button type="button" className="btn-quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
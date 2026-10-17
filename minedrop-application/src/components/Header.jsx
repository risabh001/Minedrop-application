import { Link, useNavigate } from 'react-router-dom';
import { site } from '../config/site.js';
import { logout, getSessionUser } from '../utils/auth.js';
import { LogoutIcon } from './Icons.jsx';
import logo from '../assets/minedrop-logo.png';

export default function Header({ showLogout = true }) {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="border-b border-ink-700 bg-ink-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/portal" className="flex items-center gap-3">
          <img src={logo} alt={site.orgName} className="w-9 h-9 rounded-lg object-cover" />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold text-ink-50 text-sm">{site.orgName}</span>
            <span className="text-ink-400 text-xs">Application Department</span>
          </span>
        </Link>

        {showLogout && (
          <div className="flex items-center gap-3">
            {sessionUser?.displayName && (
              <span className="hidden sm:inline text-ink-400 text-sm">{sessionUser.displayName}</span>
            )}
            <button onClick={handleLogout} className="btn-secondary !px-4 !py-2 text-sm">
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { site } from '../config/site.js';
import { isAuthenticated, getDiscordLoginUrl } from '../utils/auth.js';
import { DiscordIcon } from '../components/Icons.jsx';
import logo from '../assets/minedrop-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/portal', { replace: true });
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('authError');
    if (authError) {
      setError(authError);
      window.history.replaceState({}, '', '/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logo} alt={site.orgName} className="w-16 h-16 rounded-2xl object-cover mb-4" />
          <h1 className="text-xl font-semibold text-ink-50">{site.orgName}</h1>
          <p className="text-ink-400 text-sm mt-1">Applications portal</p>
        </div>

        <div className="panel p-7 space-y-5">
          <p className="text-ink-300 text-sm leading-relaxed">
            Sign in with the Discord account you use on the Minedrop server to access the application
            portal. You'll need to already be a member of the server.
          </p>

          {error && (
            <div className="border border-signal-600 bg-signal-600/10 text-signal-500 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <a href={getDiscordLoginUrl()} className="btn-primary w-full !bg-[#5865F2] hover:!bg-[#4752C4] !text-white">
            <DiscordIcon className="w-5 h-5" />
            Continue with Discord
          </a>
        </div>
      </div>
    </div>
  );
}

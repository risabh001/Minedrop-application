import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth.js';
import Loader from '../components/Loader.jsx';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    if (!token) {
      navigate(`/?authError=${encodeURIComponent('Discord login failed. Please try again.')}`, { replace: true });
      return;
    }
    setToken(token);
    navigate('/portal', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-ink-400">
      <Loader label="Signing you in..." />
    </div>
  );
}

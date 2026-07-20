import { useState } from 'react';
import './Auth.css';
import './Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Key, Mail, AlertTriangle } from 'lucide-react';
import abhyasLogo from '../../assets/abhyaslogo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      // Redirect based on role
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-container">
        {/* Left pane: Brand illustration */}
        <div className="login-left">
          <div className="login-left-content">
            {/* Inline SVG representing learning/exam console */}
            <svg 
              viewBox="0 0 200 150" 
              className="login-illustration-svg"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="login-grad-stop1" />
                  <stop offset="100%" className="login-grad-stop2" />
                </linearGradient>
              </defs>
              {/* Laptop screen representation */}
              <rect x="30" y="30" width="140" height="90" rx="6" fill="#1c2660" />
              <rect x="35" y="35" width="130" height="75" rx="3" fill="#ffffff" />
              {/* Laptop base */}
              <polygon points="10,125 190,125 175,135 25,135" fill="#94a3b8" />
              <rect x="90" y="125" width="20" height="4" fill="#64748b" />
              {/* Chart lines on screen */}
              <path d="M 50,90 L 80,60 L 110,80 L 140,50" fill="none" stroke="url(#grad1)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="90" r="4" fill="#052b68" />
              <circle cx="80" cy="60" r="4" fill="#f97316" />
              <circle cx="110" cy="80" r="4" fill="#052b68" />
              <circle cx="140" cy="50" r="4" fill="#f97316" />
            </svg>
            <h1>Learn Anywhere, Anytime.</h1>
            <p>Access high quality learning resources, assessments and track your growth on India's premier practice platform.</p>
            <span className="login-tagline">#AbhyasKartaRaho</span>
          </div>
        </div>

        {/* Right pane: Login form */}
        <div className="login-right">
          <div className="login-card">
            <div className="logo-small">
              <img src={abhyasLogo} alt="Abhyas Logo" className="login-logo-img" />
              <span>Abhyas</span>
            </div>
            
            <div className="login-heading">
              <h2>Welcome Back</h2>
              <p>Login to access your exam console</p>
            </div>

            {error && (
              <div className="badge badge-danger login-error-badge">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="form-label">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-input-icon" />
                  <input
                    type="email"
                    className="form-control login-input-field"
                    placeholder="student@abhyas.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="form-label">Password</label>
                <div className="login-input-wrapper">
                  <Key size={18} className="login-input-icon" />
                  <input
                    type="password"
                    className="form-control login-input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="login-row">
                <label>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/reset-password" className="forgot">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : (
                  <>
                    <LogIn size={18} />
                    <span>Log In</span>
                  </>
                )}
              </button>
            </form>

            <div className="divider">or</div>

            <button type="button" className="google-btn">
              <svg className="google-icon login-google-icon" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.96 1 12 1 7.37 1 3.4 3.65 1.48 7.52l3.77 2.92C6.14 7.54 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.48 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.47-1.11 2.71-2.35 3.54l3.66 2.84c2.14-1.97 3.73-4.88 3.73-8.51z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.76c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41L1.48 7.02C.54 8.92 0 11.03 0 13.25s.54 4.33 1.48 6.23l3.77-2.72z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.53 1.19-4.3 1.19-3.13 0-5.86-2.5-6.81-5.41L1.42 16.03C3.34 19.9 7.31 23.25 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="signup-text">
              Don't have an account?{' '}
              <Link to="/register">
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

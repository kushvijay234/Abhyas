import { useState } from 'react';
import './Auth.css';
import './Register.css';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { UserPlus, Mail, Key, User, AlertTriangle, CheckCircle } from 'lucide-react';
import abhyasLogo from '../../assets/abhyaslogo.png';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.auth.register(username, email, password, role);
      if (response.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Check your inputs.');
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
            <svg 
              viewBox="0 0 200 150" 
              className="register-illustration-svg"
            >
              <defs>
                <linearGradient id="gradReg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="register-grad-stop1" />
                  <stop offset="100%" className="register-grad-stop2" />
                </linearGradient>
              </defs>
              {/* stylized user signup icon */}
              <circle cx="100" cy="55" r="30" fill="url(#gradReg)" opacity="0.8" />
              <path d="M 50,130 C 50,95 70,85 100,85 C 130,85 150,95 150,130 Z" fill="#1c2660" />
              <circle cx="140" cy="85" r="14" fill="#f97316" />
              <text x="140" y="90" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>
            </svg>
            <h1>Join Abhyas</h1>
            <p>Create an account to begin learning, take mock examinations, and analyze your ranking with students nationwide.</p>
            <span className="login-tagline">#AbhyasKartaRaho</span>
          </div>
        </div>

        {/* Right pane: Register form */}
        <div className="login-right">
          <div className="login-card">
            <div className="logo-small">
              <img src={abhyasLogo} alt="Abhyas Logo" className="register-logo-img" />
              <span>Abhyas</span>
            </div>
            
            <div className="login-heading">
              <h2>Create Account</h2>
              <p>Sign up to begin your learning journey</p>
            </div>

            {error && (
              <div className="badge badge-danger register-error-badge">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="badge badge-success register-success-badge">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label className="form-label">Full Name</label>
                <div className="register-input-wrapper">
                  <User size={18} className="register-input-icon" />
                  <input
                    type="text"
                    className="form-control register-input-field"
                    placeholder="John Doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="form-label">Email Address</label>
                <div className="register-input-wrapper">
                  <Mail size={18} className="register-input-icon" />
                  <input
                    type="email"
                    className="form-control register-input-field"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="form-label">Password</label>
                <div className="register-input-wrapper">
                  <Key size={18} className="register-input-icon" />
                  <input
                    type="password"
                    className="form-control register-input-field"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn register-btn"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : (
                  <>
                    <UserPlus size={18} />
                    <span>Register</span>
                  </>
                )}
              </button>
            </form>

            <div className="signup-text">
              Already have an account?{' '}
              <Link to="/login">
                Login Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

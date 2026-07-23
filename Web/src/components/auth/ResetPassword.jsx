import { useState } from 'react';
import './Auth.css';
import './ResetPassword.css';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Mail, Key, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import abhyasLogo from '../../assets/abhyaslogo.png';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.auth.resetPassword(email, password);
      if (response.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Reset failed');
      }
    } catch (err) {
      setError(err.message || 'Error updating password');
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
              className="reset-illustration-svg"
            >
              <defs>
                <linearGradient id="gradReset" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="reset-grad-stop1" />
                  <stop offset="100%" className="reset-grad-stop2" />
                </linearGradient>
              </defs>
              {/* stylized padlock protection icon */}
              <rect x="50" y="70" width="100" height="60" rx="10" fill="#1c2660" />
              <path d="M 70,70 L 70,45 C 70,30 80,20 100,20 C 120,20 130,30 130,45 L 130,70" fill="none" stroke="url(#gradReset)" strokeWidth="12" strokeLinecap="round" />
              <circle cx="100" cy="100" r="8" fill="#f97316" />
              <path d="M 100,108 L 100,120" fill="none" stroke="#f97316" strokeWidth="3" />
            </svg>
            <h1>Reset Password</h1>
            <p>Access high quality learning resources, assessments and track your growth on India's premier practice platform.</p>
            <span className="login-tagline">#AbhyasKartaRaho</span>
          </div>
        </div>

        {/* Right pane: Reset form */}
        <div className="login-right">
          <div className="login-card">
            <div className="logo-small">
              <img src={abhyasLogo} alt="Abhyas Logo" className="reset-logo-img" />
              <span>Abhyas</span>
            </div>
            
            <div className="login-heading">
              <h2>Reset Password</h2>
              <p>Enter your email and a new password</p>
            </div>

            {error && (
              <div className="badge badge-danger reset-error-badge">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="badge badge-success reset-success-badge">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleReset}>
              <div className="input-group">
                <label className="form-label">Email Address</label>
                <div className="reset-input-wrapper">
                  <Mail size={18} className="reset-input-icon" />
                  <input
                    type="email"
                    className="form-control reset-input-field"
                    placeholder="registered@abhyas.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="form-label">New Password</label>
                <div className="reset-input-wrapper">
                  <Key size={18} className="reset-input-icon" />
                  <input
                    type="password"
                    className="form-control reset-input-field"
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
                className="login-btn reset-btn"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : (
                  <>
                    <ShieldAlert size={18} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="signup-text">
              Remember your password?{' '}
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

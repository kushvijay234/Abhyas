import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldAlert, Key, Phone, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import Loader from '../common/Loader';
import './ProfileView.css';

export default function ProfileView() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.auth.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setUsername(res.data.user_name || '');
        setPhone(res.data.phone || '');
        setBio(res.data.bio || '');
        setAvatar(res.data.avatar || '');
      }
    } catch (err) {
      setProfileError('Failed to fetch profile settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setUpdatingProfile(true);

    try {
      const payload = { 
        user_name: username,
        phone: phone || null,
        bio: bio || null,
        avatar: avatar || null
      };

      const res = await api.auth.updateProfile(payload);
      if (res.success) {
        setProfileSuccess('Profile details updated successfully!');
        updateUser({ user_name: username, avatar: avatar });
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      <div className="profile-header-row">
        <h1 className="display-title profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your personal details, profile avatar, and account password.</p>
      </div>

      <div className="grid-cols-3 profile-grid">
        {/* Profile Card & Avatar Selection */}
        <div className="glass-card profile-avatar-card">
          <img 
            src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username || 'Student'}`}
            alt="Avatar Preview" 
            className="profile-avatar-img"
          />
          <h3 className="profile-display-name">
            {profile?.user_name}
          </h3>
          <p className="profile-email-desc">
            Registered email: {profile?.email}
          </p>

          <div className="profile-meta-info">
            <span className="profile-meta-label">Role Level:</span>
            <p className="profile-meta-val">
              {profile?.role} User
            </p>
            
            <span className="profile-meta-label">Account Status:</span>
            <p className="profile-meta-val status-active">
              {profile?.status}
            </p>
          </div>
        </div>

        {/* Edit Info Form */}
        <div className="profile-form-column">
          
          {/* Profile Edit Panel */}
          <div className="glass-card profile-form-card">
            <h3 className="section-title profile-section-title">
              <User size={20} className="profile-section-icon-user" />
              <span>Personal Details</span>
            </h3>

            {profileError && (
              <div className="badge badge-danger profile-status-badge">
                <AlertTriangle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="badge badge-success profile-status-badge">
                <CheckCircle size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="grid-cols-2 profile-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="profile-input-wrapper">
                    <Phone size={16} className="profile-input-icon" />
                    <input 
                      type="text" 
                      className="form-control profile-input-with-icon" 
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://api.dicebear.com/7.x/..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio (Brief Description)</label>
                <div className="profile-input-wrapper">
                  <FileText size={16} className="profile-input-icon" />
                  <textarea 
                    className="form-control profile-textarea-with-icon" 
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                {updatingProfile ? 'Saving Details...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Change Panel */}
          <div className="glass-card profile-form-card">
            <h3 className="section-title profile-section-title">
              <Key size={20} className="profile-section-icon-key" />
              <span>Change Password</span>
            </h3>

            {passwordError && (
              <div className="badge badge-danger profile-status-badge">
                <AlertTriangle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="badge badge-success profile-status-badge">
                <CheckCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid-cols-2 profile-form-grid">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                {updatingPassword ? 'Changing Password...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

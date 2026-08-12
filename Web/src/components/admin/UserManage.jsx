import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Users, Search, Trash2, ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck, UserCheck, Award } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import './UserManage.css';

// Debounce helper: delays function execution until after delay ms have passed since typing stopped
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete modal configuration
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Badge management configurations
  const [manageBadgesUser, setManageBadgesUser] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  const loadUsers = async (querySearch, filterStatus) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.admin.users.getAll(querySearch, filterStatus);
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error fetching user directory.');
    } finally {
      setLoading(false);
    }
  };

  // Debounce API calls for typing
  const debouncedFetchUsers = useCallback(
    debounce((searchTerm, statusVal) => {
      loadUsers(searchTerm, statusVal);
    }, 450),
    []
  );

  useEffect(() => {
    loadUsers(search, statusFilter);
  }, [statusFilter]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    debouncedFetchUsers(val, statusFilter);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(search, statusFilter);
  };

  const handleStatusChange = async (userId, newStatus, role) => {
    if (role === 'admin') {
      setError('Cannot modify status of administrator accounts.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const res = await api.admin.users.updateStatus(userId, newStatus);
      if (res.success) {
        setSuccess(`User status updated to ${newStatus} successfully.`);
        loadUsers(search, statusFilter);
      }
    } catch (err) {
      setError(err.message || 'Error updating user status.');
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.users.delete(deleteConfirmUser.user_id || deleteConfirmUser.id);
      if (res.success) {
        setSuccess(`User ${deleteConfirmUser.user_name || deleteConfirmUser.name} deleted successfully.`);
        loadUsers(search, statusFilter);
      }
    } catch (err) {
      setError(err.message || 'Error deleting user account.');
    } finally {
      setDeleting(false);
      setDeleteConfirmUser(null);
    }
  };

  const handleOpenBadgesModal = async (user) => {
    setManageBadgesUser(user);
    setBadgesLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.users.getBadges(user.user_id || user.id);
      if (res.success) {
        setUserBadges(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error fetching user achievements.');
      setManageBadgesUser(null);
    } finally {
      setBadgesLoading(false);
    }
  };

  const handleToggleBadge = async (badgeType, isEarned) => {
    if (!manageBadgesUser) return;
    setBadgesLoading(true);
    setError('');
    setSuccess('');
    const userId = manageBadgesUser.user_id || manageBadgesUser.id;
    try {
      if (isEarned) {
        const res = await api.admin.users.revokeBadge(userId, badgeType);
        if (res.success) {
          setSuccess(`Badge revoked successfully.`);
        }
      } else {
        const res = await api.admin.users.awardBadge(userId, badgeType);
        if (res.success) {
          setSuccess(`Badge awarded successfully.`);
        }
      }
      
      const reloadRes = await api.admin.users.getBadges(userId);
      if (reloadRes.success) {
        setUserBadges(reloadRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error managing user achievements.');
    } finally {
      setBadgesLoading(false);
    }
  };

  // Compute local stats from the user list
  const totalUsers = users.length;
  const activeStudents = users.filter(u => u.status === 'active' && u.role === 'student').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  return (
    <div className="usermanage-container">
      
      {/* Header and Search Form Row */}
      <div className="usermanage-header-row">
        <div className="usermanage-title-box">
          <h1 className="display-title usermanage-title">User Directory</h1>
          <p className="usermanage-subtitle">Browse and manage student credentials and accounts.</p>
        </div>

        {/* Search controls */}
        <SearchBar
          placeholder="Search user by name or email..."
          value={search}
          onSubmit={handleSearchSubmit}
          onChange={handleSearchChange}
          showButton={false}
          maxWidth="520px"
          className="usermanage-search-bar"
        >
          <select
            className="form-control usermanage-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </SearchBar>

      </div>

      {/* Stats Dashboard Grid */}
      <div className="usermanage-stats-grid">
        
        {/* Card 1: Total Users */}
        <div className="glass-card usermanage-stat-card">
          <div className="usermanage-stat-icon-wrapper total">
            <Users size={24} />
          </div>
          <div className="usermanage-stat-content">
            <div className="usermanage-stat-label">Total Accounts</div>
            <div className="usermanage-stat-val primary">{totalUsers}</div>
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div className="glass-card usermanage-stat-card">
          <div className="usermanage-stat-icon-wrapper active">
            <UserCheck size={24} />
          </div>
          <div className="usermanage-stat-content">
            <div className="usermanage-stat-label">Active Students</div>
            <div className="usermanage-stat-val success">{activeStudents}</div>
          </div>
        </div>

        {/* Card 3: Admin Accounts */}
        <div className="glass-card usermanage-stat-card">
          <div className="usermanage-stat-icon-wrapper admin">
            <ShieldCheck size={24} />
          </div>
          <div className="usermanage-stat-content">
            <div className="usermanage-stat-label">Administrators</div>
            <div className="usermanage-stat-val danger">{adminUsers}</div>
          </div>
        </div>

      </div>

      {error && (
        <div className="badge badge-danger usermanage-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success usermanage-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container usermanage-loading-container">
          <div className="spinner"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card usermanage-empty-card">
          <Users size={48} className="catmanage-empty-icon" />
          <h3 className="catmanage-empty-title">No users found</h3>
          <p className="catmanage-empty-desc">No student records matched your current query or filter criteria.</p>
        </div>
      ) : (
        <div className="glass-card usermanage-table-card">
          <div className="table-responsive">
            <table className="custom-table usermanage-table">
              <thead>
                <tr>
                  <th className="usermanage-th">ID</th>
                  <th className="usermanage-th">Student Info</th>
                  <th className="usermanage-th">Email</th>
                  <th className="usermanage-th">Phone</th>
                  <th className="usermanage-th">Role</th>
                  <th className="usermanage-th">Status</th>
                  <th className="usermanage-th">Joined Date</th>
                  <th className="usermanage-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id || u.id} className="usermanage-tr-row">
                    <td className="usermanage-td-id">#{u.user_id || u.id}</td>
                    <td>
                      <div className="usermanage-student-profile">
                        <img 
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.user_name || u.name}`} 
                          alt="Avatar" 
                          className="usermanage-avatar"
                        />
                        <span className="usermanage-student-name">{u.user_name || u.name}</span>
                      </div>
                    </td>
                    <td className="usermanage-td-email">{u.email}</td>
                    <td className="usermanage-td-phone">{u.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-primary'} usermanage-badge-role`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge badge-success usermanage-badge-status-admin">
                          {u.status}
                        </span>
                      ) : (
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.user_id || u.id, e.target.value, u.role)}
                          className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'} usermanage-select-status`}
                        >
                          <option value="active" className="active">Active</option>
                          <option value="inactive" className="inactive">Inactive</option>
                        </select>
                      )}
                    </td>
                    <td className="usermanage-td-date">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="usermanage-action-cell">
                      {u.role !== 'admin' ? (
                        <>
                          <button
                            onClick={() => handleOpenBadgesModal(u)}
                            className="btn btn-secondary usermanage-badge-btn"
                            title="Manage Badges"
                            style={{ marginRight: '8px', padding: '6px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', color: '#1c2660' }}
                          >
                            <Award size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="btn btn-danger usermanage-delete-btn"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="usermanage-protected-text">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="modal-overlay">
          <div className="modal-content usermanage-modal-content">
            <div className="modal-header usermanage-modal-header">
              <h3 className="usermanage-modal-title">Remove Account</h3>
            </div>
            <div className="modal-body usermanage-modal-body">
              <ShieldAlert size={56} className="usermanage-modal-icon" />
              <h4 className="usermanage-modal-confirm-title">Confirm Deletion</h4>
              <p className="usermanage-modal-confirm-desc">
                Are you sure you want to permanently delete <strong>{deleteConfirmUser.user_name || deleteConfirmUser.name}</strong>?
              </p>
              <p className="usermanage-modal-warning-box">
                Warning: This will delete all course enrollments and attempt histories. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer usermanage-modal-footer">
              <button onClick={() => setDeleteConfirmUser(null)} className="btn btn-secondary usermanage-modal-btn-cancel" disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="btn btn-danger usermanage-modal-btn-delete" disabled={deleting}>
                {deleting ? 'Removing...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Badges Modal */}
      {manageBadgesUser && (
        <div className="modal-overlay">
          <div className="modal-content usermanage-modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header usermanage-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="usermanage-modal-title">🏆 Manage Achievements</h3>
              <button 
                onClick={() => setManageBadgesUser(null)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body usermanage-modal-body" style={{ padding: '20px 0' }}>
              <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#111827' }}>Student Information</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4b5563' }}>
                  Name: <strong>{manageBadgesUser.user_name || manageBadgesUser.name}</strong> ({manageBadgesUser.email})
                </p>
              </div>
              
              <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px 24px 0' }}>
                {badgesLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px' }}></div>
                  </div>
                ) : userBadges.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No badges configuration found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userBadges.map(b => (
                      <div 
                        key={b.badge_type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          background: b.isEarned ? '#f9fafb' : '#ffffff',
                          opacity: b.isEarned ? 1 : 0.75
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '28px', filter: b.isEarned ? 'none' : 'grayscale(100%) opacity(0.4)' }}>
                            {b.icon}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: b.isEarned ? '#111827' : '#9ca3af' }}>{b.title}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{b.description}</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleToggleBadge(b.badge_type, b.isEarned)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid',
                            background: b.isEarned ? '#fee2e2' : '#ecfdf5',
                            color: b.isEarned ? '#ef4444' : '#10b981',
                            borderColor: b.isEarned ? '#fca5a5' : '#a7f3d0'
                          }}
                        >
                          {b.isEarned ? 'Revoke' : 'Award'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer usermanage-modal-footer">
              <button onClick={() => setManageBadgesUser(null)} className="btn btn-secondary usermanage-modal-btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Users, Search, Trash2, ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
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
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="btn btn-danger usermanage-delete-btn"
                        >
                          <Trash2 size={14} />
                        </button>
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
    </div>
  );
}

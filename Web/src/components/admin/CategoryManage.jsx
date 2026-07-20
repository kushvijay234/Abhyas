import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Grid, Plus, Edit2, Trash2, Tag, Calendar, Layers, CheckCircle, AlertTriangle, AlertCircle, Search } from 'lucide-react';
import './CategoryManage.css';

export default function CategoryManage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search state
  const [search, setSearch] = useState('');

  // Add/Edit category states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.admin.categories.getAll();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.categories.create(categoryName.trim());
      if (res.success) {
        setSuccess('Subject category created successfully.');
        setShowAddModal(false);
        setCategoryName('');
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Error creating category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !currentCategory) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.categories.update(currentCategory.category_id, categoryName.trim());
      if (res.success) {
        setSuccess('Subject category name updated successfully.');
        setShowEditModal(false);
        setCategoryName('');
        setCurrentCategory(null);
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Error updating category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteConfirmCat) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.categories.delete(deleteConfirmCat.category_id);
      if (res.success) {
        setSuccess('Category deleted successfully.');
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Error deleting category');
    } finally {
      setDeleting(false);
      setDeleteConfirmCat(null);
    }
  };

  // Filter categories local state for responsive instant search
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Compute total counts
  const totalCategories = categories.length;
  const totalCourses = categories.reduce((sum, cat) => sum + (cat.course_count || 0), 0);

  return (
    <div className="catmanage-container">
      
      {/* Header Row */}
      <div className="catmanage-header-row">
        <div className="catmanage-title-container">
          <h1 className="display-title catmanage-title">Subject Categories</h1>
          <p className="catmanage-subtitle">Manage subjects and track course distributions.</p>
        </div>

        <button 
          onClick={() => {
            setCategoryName('');
            setError('');
            setSuccess('');
            setShowAddModal(true);
          }} 
          className="btn btn-primary catmanage-add-btn"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="catmanage-stats-grid">
        
        {/* Card 1: Total Categories */}
        <div className="glass-card catmanage-stat-card">
          <div className="catmanage-stat-icon-wrapper subjects">
            <Grid size={24} />
          </div>
          <div className="catmanage-stat-content">
            <div className="catmanage-stat-label">Active Subjects</div>
            <div className="catmanage-stat-val primary">{totalCategories}</div>
          </div>
        </div>

        {/* Card 2: Total Categorized Courses */}
        <div className="glass-card catmanage-stat-card">
          <div className="catmanage-stat-icon-wrapper courses">
            <Layers size={24} />
          </div>
          <div className="catmanage-stat-content">
            <div className="catmanage-stat-label">Categorized Courses</div>
            <div className="catmanage-stat-val warning">{totalCourses}</div>
          </div>
        </div>

      </div>

      {/* Search Input Filter Row */}
      <div className="glass-card catmanage-search-bar">
        <div className="catmanage-search-wrapper">
          <Search size={16} className="catmanage-search-icon" />
          <input 
            type="text"
            className="form-control search-input catmanage-search-input"
            placeholder="Search subject category by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="badge badge-danger catmanage-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success catmanage-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container catmanage-loading-container">
          <div className="spinner"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="glass-card catmanage-empty-card">
          <Tag size={48} className="catmanage-empty-icon" />
          <h3 className="catmanage-empty-title">No categories found</h3>
          <p className="catmanage-empty-desc">No subject categories matched your current query.</p>
        </div>
      ) : (
        <div className="glass-card catmanage-table-card">
          <div className="table-responsive">
            <table className="custom-table catmanage-table">
              <thead>
                <tr>
                  <th className="catmanage-th">ID</th>
                  <th className="catmanage-th">Category Name</th>
                  <th className="catmanage-th">Associated Courses</th>
                  <th className="catmanage-th">Created Date</th>
                  <th className="catmanage-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <tr key={cat.category_id} className="catmanage-tr-row">
                    <td className="catmanage-td-id">#{cat.category_id}</td>
                    <td className="catmanage-td-name">{cat.name}</td>
                    <td>
                      <span className="badge badge-primary catmanage-badge-primary">
                        {cat.course_count || 0} {(cat.course_count === 1) ? 'Course' : 'Courses'}
                      </span>
                    </td>
                    <td className="catmanage-td-muted">
                      {new Date(cat.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="catmanage-action-cell">
                      <div className="catmanage-action-group">
                        <button
                          onClick={() => {
                          setCurrentCategory(cat);
                          setCategoryName(cat.name);
                          setError('');
                          setSuccess('');
                          setShowEditModal(true);
                        }}
                          className="btn btn-secondary catmanage-edit-btn"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                          setError('');
                          setSuccess('');
                          setDeleteConfirmCat(cat);
                        }}
                          className="btn btn-danger catmanage-delete-btn"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content catmanage-modal-content">
            <form onSubmit={handleAddSubmit}>
              <div className="modal-header catmanage-modal-header">
                <h3 className="catmanage-modal-title">Add Subject Category</h3>
              </div>
              <div className="modal-body catmanage-modal-body">
                <div className="catmanage-modal-field">
                  <label className="form-label catmanage-modal-label">Category Name</label>
                  <input
                    type="text"
                    className="form-control catmanage-modal-input"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer catmanage-modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary catmanage-modal-btn-cancel" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary catmanage-modal-btn-submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content catmanage-modal-content">
            <form onSubmit={handleEditSubmit}>
              <div className="modal-header catmanage-modal-header">
                <h3 className="catmanage-modal-title">Edit Category Name</h3>
              </div>
              <div className="modal-body catmanage-modal-body">
                <div className="catmanage-modal-field">
                  <label className="form-label catmanage-modal-label">Category Name</label>
                  <input
                    type="text"
                    className="form-control catmanage-modal-input"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer catmanage-modal-footer">
                <button type="button" onClick={() => {
                  setShowEditModal(false);
                  setCurrentCategory(null);
                }} className="btn btn-secondary catmanage-modal-btn-cancel" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary catmanage-modal-btn-submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="modal-overlay">
          <div className="modal-content catmanage-modal-content">
            <div className="modal-header catmanage-modal-header">
              <h3 className="catmanage-modal-title">Delete Subject Category</h3>
            </div>
            <div className="modal-body catmanage-modal-body-center">
              <AlertCircle size={56} className="catmanage-modal-icon-danger" />
              <h4 className="catmanage-modal-confirm-title">Confirm Deletion</h4>
              <p className="catmanage-modal-confirm-text">
                Are you sure you want to delete the category <strong>{deleteConfirmCat.name}</strong>?
              </p>
              <p className="catmanage-modal-warning-box">
                Warning: Deleting this category will set all associated courses ({deleteConfirmCat.course_count || 0}) to have no category. No courses will be deleted.
              </p>
            </div>
            <div className="modal-footer catmanage-modal-footer">
              <button onClick={() => setDeleteConfirmCat(null)} className="btn btn-secondary catmanage-modal-btn-cancel" disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDeleteSubmit} className="btn btn-danger catmanage-modal-btn-submit" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

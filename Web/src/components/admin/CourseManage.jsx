import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookOpen, Plus, Edit3, Trash2, CheckCircle, AlertTriangle, Link as LinkIcon, ChevronUp, ChevronDown, ArrowLeft, Video, FileText, Award, Save, Edit } from 'lucide-react';
import Pagination from '../common/Pagination';
import './CourseManage.css';

export default function CourseManage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle page out of bounds adjustment
  useEffect(() => {
    const totalPages = Math.ceil(courses.length / 10);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [courses.length, currentPage]);

  // Curriculum management states
  const [activeCurriculumCourse, setActiveCurriculumCourse] = useState(null);
  const [curriculumSections, setCurriculumSections] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [allExams, setAllExams] = useState([]);
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { sectionIndex, itemIndex }
  const [itemSectionIndex, setItemSectionIndex] = useState(null);
  
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState('article');
  const [itemDuration, setItemDuration] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [itemExamId, setItemExamId] = useState('');

  // Course form state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [courseId, setCourseId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [status, setStatus] = useState('draft');
  const [categoryId, setCategoryId] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesRes, catRes] = await Promise.all([
        api.admin.courses.getAll(),
        api.courses.getCategories() // Reuse public categories endpoint
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching course list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setCourseId(null);
    setTitle('');
    setDescription('');
    setDuration('');
    setThumbnail('');
    setStatus('draft');
    setCategoryId('');
    setShowModal(true);
  };

  const handleOpenEditModal = (course) => {
    setEditMode(true);
    setCourseId(course.course_id);
    setTitle(course.title || '');
    setDescription(course.description || '');
    setDuration(course.duration || '');
    setThumbnail(course.thumbnail || '');
    setStatus(course.status || 'draft');
    setCategoryId(course.category_id || '');
    setShowModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        title,
        description: description || null,
        duration: duration || null,
        thumbnail: thumbnail || null,
        status,
        category_id: categoryId ? parseInt(categoryId) : null
      };

      if (editMode) {
        const updateRes = await api.admin.courses.update(courseId, payload);
        if (updateRes.success) {
          setSuccess(`Course "${title}" updated successfully.`);
        }
      } else {
        const createRes = await api.admin.courses.create(payload);
        if (createRes.success) {
          setSuccess(`Course "${title}" created successfully.`);
          setCurrentPage(1);
        }
      }

      setShowModal(false);
      fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to save course changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id, courseTitle) => {
    if (!confirm(`Are you sure you want to permanently delete course "${courseTitle}"?`)) return;
    setError('');
    setSuccess('');
    
    try {
      const res = await api.admin.courses.delete(id);
      if (res.success) {
        setSuccess(`Course "${courseTitle}" deleted successfully.`);
        fetchCourses();
      }
    } catch (err) {
      setError(err.message || 'Error deleting course.');
    }
  };

  const handleOpenCurriculum = async (course) => {
    setActiveCurriculumCourse(course);
    setCurriculumLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.courses.getCurriculum(course.course_id);
      if (res && Array.isArray(res)) {
        setCurriculumSections(res);
      } else if (res && res.success && Array.isArray(res.data)) {
        setCurriculumSections(res.data);
      } else {
        setCurriculumSections([]);
      }
      
      const examRes = await api.admin.exams.getAll();
      if (examRes.success) {
        setAllExams(examRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load course curriculum.');
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleAddSection = () => {
    setCurriculumSections([
      ...curriculumSections,
      {
        title: `Section ${curriculumSections.length + 1}: New Section`,
        items: []
      }
    ]);
  };

  const handleSectionTitleChange = (index, newTitle) => {
    const updated = [...curriculumSections];
    updated[index].title = newTitle;
    setCurriculumSections(updated);
  };

  const handleDeleteSection = (index) => {
    if (!confirm('Are you sure you want to delete this section and all its contents?')) return;
    const updated = curriculumSections.filter((_, idx) => idx !== index);
    setCurriculumSections(updated);
  };

  const handleMoveSection = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === curriculumSections.length - 1) return;
    
    const updated = [...curriculumSections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setCurriculumSections(updated);
  };

  const handleOpenAddItem = (sectionIndex) => {
    setItemSectionIndex(sectionIndex);
    setEditingItem(null);
    setItemTitle('');
    setItemType('article');
    setItemDuration('');
    setItemNotes('');
    setItemExamId('');
    setShowItemModal(true);
  };

  const handleOpenEditItem = (sectionIndex, itemIndex) => {
    setItemSectionIndex(sectionIndex);
    setEditingItem({ sectionIndex, itemIndex });
    
    const item = curriculumSections[sectionIndex].items[itemIndex];
    setItemTitle(item.title || '');
    setItemType(item.type || 'article');
    setItemDuration(item.duration || '');
    setItemNotes(item.notes || '');
    setItemExamId(item.exam_id || '');
    setShowItemModal(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemTitle) return;
    
    const updated = [...curriculumSections];
    const itemData = {
      title: itemTitle,
      type: itemType,
      duration: itemDuration || null,
      notes: itemType === 'article' ? itemNotes : null,
      exam_id: itemType === 'exam' ? (itemExamId ? parseInt(itemExamId) : null) : null
    };
    
    if (editingItem) {
      const { sectionIndex, itemIndex } = editingItem;
      const originalItem = updated[sectionIndex].items[itemIndex];
      updated[sectionIndex].items[itemIndex] = {
        ...originalItem,
        ...itemData
      };
    } else {
      updated[itemSectionIndex].items.push(itemData);
    }
    
    setCurriculumSections(updated);
    setShowItemModal(false);
  };

  const handleDeleteItem = (sectionIndex, itemIndex) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const updated = [...curriculumSections];
    updated[sectionIndex].items = updated[sectionIndex].items.filter((_, idx) => idx !== itemIndex);
    setCurriculumSections(updated);
  };

  const handleMoveItem = (sectionIndex, itemIndex, direction) => {
    const section = curriculumSections[sectionIndex];
    if (direction === 'up' && itemIndex === 0) return;
    if (direction === 'down' && itemIndex === section.items.length - 1) return;
    
    const updated = [...curriculumSections];
    const items = [...section.items];
    const targetIdx = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    const temp = items[itemIndex];
    items[itemIndex] = items[targetIdx];
    items[targetIdx] = temp;
    
    updated[sectionIndex].items = items;
    setCurriculumSections(updated);
  };

  const handleSaveCurriculum = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.courses.saveCurriculum(activeCurriculumCourse.course_id, curriculumSections);
      if (res.success || res.message === 'Curriculum saved successfully') {
        setSuccess('Curriculum saved successfully.');
        setTimeout(() => {
          setActiveCurriculumCourse(null);
          fetchCourses();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to save curriculum.');
    } finally {
      setSaving(false);
    }
  };

  const renderCurriculumManager = () => {
    return (
      <div>
        <div className="coursemanage-curriculum-header">
          <div className="coursemanage-curriculum-title-box">
            <button 
              onClick={() => setActiveCurriculumCourse(null)} 
              className="btn btn-secondary coursemanage-curriculum-back-btn" 
            >
              <ArrowLeft size={16} />
              <span>Back to Courses</span>
            </button>
            <h1 className="display-title">Curriculum: {activeCurriculumCourse.title}</h1>
            <p className="coursemanage-curriculum-desc">Structure your learning sections, lessons, and exam milestones.</p>
          </div>

          <div>
            <button 
              onClick={handleSaveCurriculum} 
              className="btn btn-primary coursemanage-curriculum-action-btn"
              disabled={saving}
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Curriculum'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger coursemanage-badge-full">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="badge badge-success coursemanage-badge-full">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {curriculumLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="coursemanage-curriculum-container">
            {curriculumSections.length === 0 ? (
              <div className="glass-card coursemanage-curriculum-empty">
                <BookOpen size={48} className="coursemanage-curriculum-empty-icon" />
                <h3>No curriculum defined</h3>
                <p className="coursemanage-curriculum-empty-desc">Start by adding the first learning section for this course track.</p>
                <button onClick={handleAddSection} className="btn btn-primary">
                  <Plus size={16} /> Add Section
                </button>
              </div>
            ) : (
              <>
                {curriculumSections.map((section, sIdx) => (
                  <div key={sIdx} className="glass-card coursemanage-section-card">
                    <div className="coursemanage-section-header">
                      <div className="coursemanage-section-title-wrapper">
                        <span className="coursemanage-section-number">Section {sIdx + 1}:</span>
                        <input
                          type="text"
                          className="form-control coursemanage-section-input"
                          value={section.title}
                          onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                          placeholder="Section Title"
                        />
                      </div>
                      
                      <div className="coursemanage-section-action-group">
                        <button
                          onClick={() => handleMoveSection(sIdx, 'up')}
                          disabled={sIdx === 0}
                          className="btn btn-secondary coursemanage-section-btn"
                          type="button"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveSection(sIdx, 'down')}
                          disabled={sIdx === curriculumSections.length - 1}
                          className="btn btn-secondary coursemanage-section-btn"
                          type="button"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sIdx)}
                          className="btn btn-danger coursemanage-section-delete-btn"
                          type="button"
                        >
                          <Trash2 size={14} />
                          <span className="coursemanage-section-delete-text">Delete Section</span>
                        </button>
                      </div>
                    </div>

                    <div className="coursemanage-items-list">
                      {(section.items || []).length === 0 ? (
                        <p className="coursemanage-section-empty-msg">No lectures or quizzes added yet in this section.</p>
                      ) : (
                        (section.items || []).map((item, itemIdx) => (
                          <div 
                            key={itemIdx} 
                            className="coursemanage-item-row"
                          >
                            <div className="coursemanage-item-content">
                              {item.type === 'article' && <FileText size={16} className="coursemanage-item-icon-article" />}
                              {item.type === 'exam' && <Award size={16} className="coursemanage-item-icon-exam" />}
                              
                              <div className="coursemanage-item-text-box">
                                <span className="coursemanage-item-title">
                                  {item.title}
                                </span>
                                <div className="coursemanage-item-meta">
                                  <span style={{ textTransform: 'capitalize', fontWeight: '500' }} className={`badge ${item.type === 'article' ? 'badge-warning' : 'badge-success'}`}>
                                    {item.type}
                                  </span>
                                  {item.duration && <span>Duration: {item.duration}</span>}
                                  {item.type === 'exam' && (
                                    <span className="coursemanage-item-exam-link">
                                      Linked Quiz ID: {item.exam_id} {allExams.find(e => e.exam_id === item.exam_id)?.title ? `(${allExams.find(e => e.exam_id === item.exam_id).title})` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="coursemanage-item-action-group">
                              <button
                                onClick={() => handleMoveItem(sIdx, itemIdx, 'up')}
                                disabled={itemIdx === 0}
                                className="btn btn-secondary coursemanage-item-btn"
                                type="button"
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button
                                onClick={() => handleMoveItem(sIdx, itemIdx, 'down')}
                                disabled={itemIdx === section.items.length - 1}
                                className="btn btn-secondary coursemanage-item-btn"
                                type="button"
                              >
                                <ChevronDown size={12} />
                              </button>
                              <button
                                onClick={() => handleOpenEditItem(sIdx, itemIdx)}
                                className="btn btn-secondary coursemanage-item-btn-flex"
                                type="button"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(sIdx, itemIdx)}
                                className="btn btn-danger coursemanage-item-btn-flex"
                                type="button"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button 
                      onClick={() => handleOpenAddItem(sIdx)} 
                      className="btn btn-secondary coursemanage-add-item-btn"
                      type="button"
                    >
                      <Plus size={14} />
                      <span>Add Lecture or Quiz</span>
                    </button>
                  </div>
                ))}

                <div className="coursemanage-save-actions-row">
                  <button onClick={handleAddSection} className="btn btn-secondary coursemanage-save-action-btn" type="button">
                    <Plus size={16} /> Add New Section
                  </button>
                  <button onClick={handleSaveCurriculum} className="btn btn-primary coursemanage-save-action-btn" disabled={saving} type="button">
                    <Save size={16} /> {saving ? 'Saving Curriculum...' : 'Save Curriculum Plan'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showItemModal && (
          <div className="modal-overlay">
            <div className="modal-content coursemanage-item-modal-content">
              <div className="modal-header">
                <h3 style={{ color: 'var(--text-bright)' }}>{editingItem ? 'Edit Curriculum Item' : 'Add Curriculum Item'}</h3>
              </div>
              <form onSubmit={handleSaveItem}>
                <div className="modal-body coursemanage-modal-body-left">
                  <div className="form-group">
                    <label className="form-label">Item Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1. Introduction to Relational Databases"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Item Type</label>
                      <select
                        className="form-control coursemanage-modal-select-field"
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                      >
                        <option value="article">Article / Reading Material</option>
                        <option value="exam">Database Quiz Assessment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 10:45 or 15 mins read"
                        value={itemDuration}
                        onChange={(e) => setItemDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  {itemType === 'exam' && (
                    <div className="form-group">
                      <label className="form-label">Link Assessment / Exam</label>
                      <select
                        className="form-control coursemanage-modal-select-field"
                        value={itemExamId}
                        onChange={(e) => setItemExamId(e.target.value)}
                        required={itemType === 'exam'}
                      >
                        <option value="">-- Select Exam --</option>
                        {allExams.map(ex => (
                          <option key={ex.exam_id} value={ex.exam_id}>{ex.title} ({ex.course_title || 'General'})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {itemType === 'article' && (
                    <div className="form-group">
                      <label className="form-label">
                        Reading Content / Notes
                      </label>
                      <textarea
                        className="form-control coursemanage-notes-textarea"
                        placeholder="Write educational text or lesson highlights..."
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        required={itemType === 'article'}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowItemModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Apply Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(courses.length / itemsPerPage);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastCourse = activePage * itemsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - itemsPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);

  if (activeCurriculumCourse) {
    return renderCurriculumManager();
  }

  return (
    <div>
      <div className="coursemanage-header-row">
        <div className="coursemanage-header-title-box">
          <h1 className="display-title coursemanage-header-title">Course Tracks</h1>
          <p style={{ color: 'var(--text-muted)' }}>Publish educational streams and curriculum packages.</p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>New Course</span>
        </button>
      </div>

      {error && (
        <div className="badge badge-danger coursemanage-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success coursemanage-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card coursemanage-courses-empty">
          <BookOpen size={48} className="coursemanage-courses-empty-icon" />
          <h3>No courses created</h3>
          <p>Click "New Course" above to initiate your learning catalog.</p>
        </div>
      ) : (
        <div className="glass-card coursemanage-table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Course Title</th>
                  <th>Duration</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCourses.map(c => (
                  <tr key={c.course_id}>
                    <td>
                      <img 
                        src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=100'} 
                        alt={c.title} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=100';
                        }}
                        className="coursemanage-thumbnail-img"
                      />
                    </td>
                    <td>
                      <span className="coursemanage-course-title">{c.title}</span>
                      <p className="coursemanage-course-desc">
                        {c.description || 'No description.'}
                      </p>
                    </td>
                    <td>{c.duration || 'Self-paced'}</td>
                    <td>
                      <span className="badge badge-primary">{c.category_name || 'Unassigned'}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'draft' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="coursemanage-actions-group">
                        <button
                          onClick={() => handleOpenCurriculum(c)}
                          className="btn btn-primary coursemanage-btn-curriculum"
                          title="Manage Curriculum"
                          type="button"
                        >
                          <BookOpen size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="btn btn-secondary coursemanage-btn-edit"
                          type="button"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.course_id, c.title)}
                          className="btn btn-danger coursemanage-btn-delete"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

      )}

      {/* Course Creator/Editor Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-bright)' }}>{editMode ? 'Edit Course Track' : 'Create Course Track'}</h3>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="modal-body coursemanage-modal-body-left">
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Introduction to React JS"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Write course outline..."
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 6 weeks, 10 hours"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject Category</label>
                    <select
                      className="form-control coursemanage-modal-select-field"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Thumbnail URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://images.unsplash.com/..."
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Publishing Status</label>
                    <select
                      className="form-control coursemanage-modal-select-field"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="draft">Draft Mode</option>
                      <option value="active">Active (Published)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

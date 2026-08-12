import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileSpreadsheet, Plus, Edit3, Trash2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import './ExamManage.css';

export default function ExamManage({ isTestOnly = false }) {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [examId, setExamId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [negativeMarking, setNegativeMarking] = useState('0.00');
  const [instructions, setInstructions] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState([]);

  const [saving, setSaving] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [examsRes, coursesRes] = await Promise.all([
        api.admin.exams.getAll('', '', isTestOnly ? 'true' : 'false'),
        api.admin.courses.getAll() // Load courses for selection
      ]);

      if (examsRes.success) setExams(examsRes.data || []);
      if (coursesRes.success) setCourses(coursesRes.data || []);
    } catch (err) {
      setError(err.message || 'Error loading examinations registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [isTestOnly]);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setExamId(null);
    setTitle('');
    setDescription('');
    setCourseId(isTestOnly ? '' : (courses.length > 0 ? courses[0].course_id : ''));
    setDurationMinutes('60');
    setTotalMarks('100');
    setPassingMarks('40');
    setMaxAttempts('1');
    setNegativeMarking('0.00');
    setInstructions('');
    setRecommendedCourses([]);
    setShowModal(true);
  };

  const handleOpenEditModal = async (exam) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.admin.exams.getById(exam.exam_id);
      if (res.success && res.data) {
        const fullExam = res.data;
        setEditMode(true);
        setExamId(fullExam.exam_id);
        setTitle(fullExam.title || '');
        setDescription(fullExam.description || '');
        setCourseId(fullExam.course_id || '');
        setDurationMinutes(String(fullExam.duration_minutes || '60'));
        setTotalMarks(String(fullExam.total_marks || '100'));
        setPassingMarks(String(fullExam.passing_marks || '40'));
        setMaxAttempts(String(fullExam.max_attempts || '1'));
        setNegativeMarking(String(fullExam.negative_marking || '0.00'));
        setInstructions(fullExam.instructions || '');
        setRecommendedCourses(fullExam.recommended_courses || []);
        setShowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch exam details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!title || (!isTestOnly && !courseId)) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title,
        description: description || null,
        course_id: isTestOnly ? null : parseInt(courseId),
        duration_minutes: parseInt(durationMinutes),
        total_marks: parseInt(totalMarks),
        passing_marks: parseInt(passingMarks),
        max_attempts: parseInt(maxAttempts),
        negative_marking: parseFloat(negativeMarking),
        instructions: instructions || null,
        recommended_courses: recommendedCourses
      };

      if (editMode) {
        const res = await api.admin.exams.update(examId, payload);
        if (res.success) {
          setSuccess(`Exam "${title}" updated successfully.`);
        }
      } else {
        const res = await api.admin.exams.create(payload);
        if (res.success) {
          setSuccess(`Exam "${title}" created successfully.`);
        }
      }

      setShowModal(false);
      fetchExams();
    } catch (err) {
      setError(err.message || 'Failed to save exam configurations');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id, currentTitle) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.exams.togglePublish(id);
      if (res.success) {
        setSuccess(`Toggled publish status for "${currentTitle}".`);
        fetchExams();
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle publish status.');
    }
  };

  const handleDeleteExam = async (id, currentTitle) => {
    if (!confirm(`Are you sure you want to permanently delete exam "${currentTitle}"?`)) return;
    setError('');
    setSuccess('');

    try {
      const res = await api.admin.exams.delete(id);
      if (res.success) {
        setSuccess(`Exam "${currentTitle}" deleted successfully.`);
        fetchExams();
      }
    } catch (err) {
      setError(err.message || 'Error deleting exam track.');
    }
  };

  return (
    <div>
      <div className="exammanage-header-row">
        <div className="exammanage-header-title-box">
          <h1 className="display-title exammanage-header-title">
            {isTestOnly ? 'Mock Tests & Assessments' : 'Exams & Quizzes'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isTestOnly
              ? 'Configure independent mock assessments, logical tests, and general skills tests.'
              : 'Configure course-specific test blueprints, grading guidelines, and time rules.'}
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary" disabled={!isTestOnly && courses.length === 0}>
          <Plus size={18} />
          <span>{isTestOnly ? 'New Mock Test' : 'New Exam Blueprint'}</span>
        </button>
      </div>

      {!isTestOnly && courses.length === 0 && (
        <div className="badge badge-warning exammanage-badge-full">
          <AlertTriangle size={16} />
          <span>No courses are active. Please create a course track first before mapping exams.</span>
        </div>
      )}

      {error && (
        <div className="badge badge-danger exammanage-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success exammanage-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-card exammanage-empty-card">
          <FileSpreadsheet size={48} className="exammanage-empty-icon" />
          <h3>{isTestOnly ? 'No mock tests configured' : 'No exams configured'}</h3>
          <p>
            {isTestOnly
              ? 'Click "New Mock Test" above to define parameters for your independent tests.'
              : 'Click "New Exam Blueprint" above to define parameters for your assessment quizzes.'}
          </p>
        </div>
      ) : (
        <div className="glass-card exammanage-table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{isTestOnly ? 'Test Title' : 'Exam Title'}</th>
                  {!isTestOnly && <th>Course Track</th>}
                  <th>Duration</th>
                  <th>Marks Configuration</th>
                  <th>Passing Benchmark</th>
                  <th>Publish Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.exam_id}>
                    <td>
                      <span className="exammanage-exam-title">{e.title}</span>
                      <p className="exammanage-exam-desc">
                        {e.description || (isTestOnly ? 'General mock test.' : 'General exam track.')}
                      </p>
                    </td>
                    {!isTestOnly && (
                      <td>
                        <span className="badge badge-primary">{e.course_title || e.course_name || 'No Track'}</span>
                      </td>
                    )}
                    <td>{e.duration_minutes} Mins</td>
                    <td>
                      <div className="exammanage-marks-box">
                        <span>Total: <strong>{e.total_marks}</strong></span>
                        {parseFloat(e.negative_marking) > 0 && (
                          <span className="exammanage-neg-text">Neg: <strong>-{e.negative_marking}</strong></span>
                        )}
                      </div>
                    </td>
                    <td>{e.passing_marks} Marks ({Math.round((e.passing_marks / e.total_marks) * 100)}%)</td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(e.exam_id, e.title)}
                        className={`btn ${e.is_published ? 'btn-success' : 'btn-secondary'} exammanage-status-btn`}
                      >
                        {e.is_published ? (
                          <>
                            <Eye size={12} /> <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> <span>Hidden (Draft)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="exammanage-actions-group">
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="btn btn-secondary exammanage-btn-edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(e.exam_id, e.title)}
                          className="btn btn-danger exammanage-btn-delete"
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
        </div>
      )}

      {/* Exam Creator/Editor Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content exammanage-modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-bright)' }}>
                {isTestOnly
                  ? (editMode ? 'Edit Mock Test Blueprint' : 'New Mock Test')
                  : (editMode ? 'Edit Exam Blueprint' : 'New Exam Blueprint')}
              </h3>
            </div>
            <form onSubmit={handleSaveExam}>
              <div className="modal-body exammanage-modal-body">
                <div className="form-group">
                  <label className="form-label">{isTestOnly ? 'Test Title' : 'Exam Title'}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SQL Basics Aggregate Midterm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Exam Description</label>
                  <textarea
                    className="form-control exammanage-textarea-sm"
                    placeholder="Add brief details about the exam format..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className={isTestOnly ? "" : "grid-cols-2 exammanage-grid-cols-2"}>
                  {!isTestOnly && (
                    <div className="form-group">
                      <label className="form-label">Associated Course Track</label>
                      <select
                        className="form-control coursemanage-modal-select-field"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => (
                          <option key={c.course_id} value={c.course_id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 45"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3 exammanage-grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Total Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="100"
                      min="1"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Passing Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="40"
                      min="0"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Negative Marks (MCQ)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      className="form-control"
                      placeholder="0.25"
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2 exammanage-grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Maximum Allowed Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isTestOnly && (
                  <div className="form-group">
                    <label className="form-label">Explicit Course Recommendations</label>
                    <div className="exammanage-recommended-courses-list">
                      {courses.map(c => {
                        const isChecked = recommendedCourses.includes(c.course_id);
                        return (
                          <label key={c.course_id} className="exammanage-checkbox-label">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRecommendedCourses([...recommendedCourses, c.course_id]);
                                } else {
                                  setRecommendedCourses(recommendedCourses.filter(id => id !== c.course_id));
                                }
                              }}
                            />
                            <span>{c.title}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="form-help-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Select specific courses that should be strongly recommended to the user after finishing this test.
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Instructions Booklet</label>
                  <textarea
                    className="form-control exammanage-textarea-sm"
                    placeholder="Attempt all questions. Correct answer is worth..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

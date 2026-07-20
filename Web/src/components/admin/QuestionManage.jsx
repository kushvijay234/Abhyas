import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HelpCircle, Plus, Edit3, Trash2, CheckCircle, AlertTriangle, FileUp, ListFilter } from 'lucide-react';
import './QuestionManage.css';

export default function QuestionManage() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [questionId, setQuestionId] = useState(null);

  // Question Form attributes
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('a');
  const [marks, setMarks] = useState('1');
  const [explanation, setExplanation] = useState('');
  
  // Bulk upload text
  const [bulkJsonText, setBulkJsonText] = useState('');
  
  const [saving, setSaving] = useState(false);

  // Fetch initial exams list
  useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await api.admin.exams.getAll();
        if (res.success) {
          setExams(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedExamId(res.data[0].exam_id);
          }
        }
      } catch (err) {
        setError('Error loading exam filters');
      }
    };
    loadExams();
  }, []);

  // Fetch questions whenever selected exam changes
  const fetchQuestions = async () => {
    if (!selectedExamId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.exams.getQuestions(selectedExamId);
      if (res.success) {
        setQuestions(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading exam questions pool.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedExamId]);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setQuestionId(null);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('a');
    setMarks('1');
    setExplanation('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditMode(true);
    setQuestionId(q.question_id);
    setQuestionText(q.question_text || '');
    setOptionA(q.option_a || '');
    setOptionB(q.option_b || '');
    setOptionC(q.option_c || '');
    setOptionD(q.option_d || '');
    setCorrectOption(q.correct_option || 'a');
    setMarks(String(q.marks || '1'));
    setExplanation(q.explanation || '');
    setShowFormModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText || !optionA || !optionB || !optionC || !optionD) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        exam_id: parseInt(selectedExamId),
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption.toLowerCase(),
        marks: parseInt(marks),
        explanation: explanation || null
      };

      if (editMode) {
        const res = await api.admin.questions.update(questionId, payload);
        if (res.success) {
          setSuccess('Question updated successfully.');
        }
      } else {
        const res = await api.admin.questions.add(payload);
        if (res.success) {
          setSuccess('Question added successfully to the exam pool.');
        }
      }

      setShowFormModal(false);
      fetchQuestions();
    } catch (err) {
      setError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkJsonText) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let parsed;
      try {
        parsed = JSON.parse(bulkJsonText);
      } catch (jsonErr) {
        throw new Error('Invalid JSON format. Please verify formatting.');
      }

      if (!Array.isArray(parsed)) {
        throw new Error('Bulk payload must be a JSON Array of question objects.');
      }

      const processed = parsed.map(q => ({
        ...q,
        exam_id: q.exam_id || parseInt(selectedExamId)
      }));

      const res = await api.admin.questions.bulkUpload(processed);
      if (res.success) {
        setSuccess(`Bulk uploaded ${processed.length} questions successfully.`);
        setShowBulkModal(false);
        setBulkJsonText('');
        fetchQuestions();
      }
    } catch (err) {
      setError(err.message || 'Bulk upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this question from the exam pool?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await api.admin.questions.delete(id);
      if (res.success) {
        setSuccess('Question removed successfully.');
        fetchQuestions();
      }
    } catch (err) {
      setError(err.message || 'Error deleting question.');
    }
  };

  return (
    <div>
      <div className="qmanage-header-row">
        <div className="qmanage-header-title-box">
          <h1 className="display-title qmanage-header-title">Questions Database</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage question templates, choices, correct selections, and explanations.</p>
        </div>

        <div className="qmanage-header-actions">
          <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" disabled={!selectedExamId}>
            <FileUp size={18} />
            <span>Bulk Import</span>
          </button>
          
          <button onClick={handleOpenCreateModal} className="btn btn-primary" disabled={!selectedExamId}>
            <Plus size={18} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      <div className="glass-card qmanage-filter-card">
        <ListFilter size={20} className="qmanage-filter-icon" />
        <div className="qmanage-filter-select-wrapper">
          <select
            className="form-control qmanage-filter-select"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            <option value="">-- Select Exam Blueprint --</option>
            {exams.map(e => (
              <option key={e.exam_id} value={e.exam_id}>{e.title}</option>
            ))}
          </select>
        </div>
        <div className="qmanage-pool-size">
          Questions Pool Size: <strong>{questions.length} Items</strong>
        </div>
      </div>

      {error && (
        <div className="badge badge-danger qmanage-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success qmanage-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card qmanage-empty-card">
          <HelpCircle size={48} className="qmanage-empty-icon" />
          <h3>No questions assigned</h3>
          <p>Choose an exam template or click "Add Question" to begin writing questions.</p>
        </div>
      ) : (
        <div className="qmanage-questions-list">
          {questions.map((q, idx) => (
            <div key={q.question_id} className="glass-card qmanage-question-card">
              <div className="qmanage-question-header">
                <span className="badge badge-primary">Question {idx + 1}</span>
                <div className="qmanage-question-meta-group">
                  <span className="qmanage-weight-text">Weight: <strong>{q.marks} Mark(s)</strong></span>
                  <button onClick={() => handleOpenEditModal(q)} className="btn btn-secondary qmanage-action-btn-sm">
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.question_id)} className="btn btn-danger qmanage-action-btn-sm">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="qmanage-question-prompt">
                {q.question_text}
              </p>

              <div className="qmanage-options-grid">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const optText = q[`option_${opt}`];
                  const isCorrect = q.correct_option === opt;

                  return (
                    <div 
                      key={opt}
                      className={`qmanage-option-card ${isCorrect ? 'correct' : 'incorrect'}`}
                    >
                      <div className={`qmanage-option-letter-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {opt}
                      </div>
                      <span className={`qmanage-option-text ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {optText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="qmanage-explanation-box">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content qmanage-form-modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-bright)' }}>{editMode ? 'Edit MCQ Template' : 'Add MCQ Template'}</h3>
            </div>
            <form onSubmit={handleSaveQuestion}>
              <div className="modal-body qmanage-modal-body">
                <div className="form-group">
                  <label className="form-label">Question Text Prompt</label>
                  <textarea
                    className="form-control qmanage-textarea-sm"
                    placeholder="Enter question text..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-cols-2 qmanage-grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Option A</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Choice text A"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Option B</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Choice text B"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Option C</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Choice text C"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Option D</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Choice text D"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3 qmanage-grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Correct Option</label>
                    <select
                      className="form-control qmanage-modal-select-field"
                      value={correctOption}
                      onChange={(e) => setCorrectOption(e.target.value)}
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marks Weight</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Solution Explanation</label>
                  <textarea
                    className="form-control qmanage-textarea-sm"
                    placeholder="Provide detailed answer logic..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content qmanage-bulk-modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-bright)' }}>Bulk Import MCQ Pool</h3>
            </div>
            <form onSubmit={handleBulkUpload}>
              <div className="modal-body qmanage-modal-body">
                <p className="qmanage-bulk-desc">
                  Provide a raw JSON Array of question objects. Example format:
                </p>
                <pre className="qmanage-bulk-example">
{`[
  {
    "question_text": "What is 2 + 2?",
    "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6",
    "correct_option": "b", "marks": 1, "explanation": "2+2 equals 4"
  }
]`}
                </pre>

                <div className="form-group">
                  <label className="form-label">JSON Text Content</label>
                  <textarea
                    className="form-control qmanage-textarea-lg"
                    placeholder="[{...}]"
                    value={bulkJsonText}
                    onChange={(e) => setBulkJsonText(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Importing...' : 'Bulk Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

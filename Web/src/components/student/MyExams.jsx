import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { FileText, Clock, Award, BookOpen, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import SearchBar from '../common/SearchBar';
import Pagination from '../common/Pagination';
import './MyExams.css';

// Debounce helper: Delays executing search calls while typing
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function MyExams() {
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'taken'
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  
  const navigate = useNavigate();

  const loadData = async (searchTerm = '') => {
    try {
      setLoading(true);
      setError('');
      const [examsRes, historyRes] = await Promise.all([
        api.exams.getAll(searchTerm),
        api.exams.getHistory()
      ]);

      if (examsRes.success) setExams(examsRes.data || []);
      if (historyRes.success) setHistory(historyRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load exams data.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search trigger
  const debouncedFetchExams = useCallback(
    debounce((term) => {
      loadData(term);
    }, 450),
    []
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(search);
  };

  const handleStartExam = async (examId) => {
    const confirmStart = window.confirm(
      "⚠️ DISCLAIMER:\n" +
      "1. Once started, this assessment cannot be paused.\n" +
      "2. The timer will run continuously even if you close the tab.\n" +
      "3. The assessment will be automatically submitted when the duration expires.\n\n" +
      "Do you want to start the exam now?"
    );
    if (!confirmStart) return;

    try {
      setStartingId(examId);
      const res = await api.exams.startAttempt(examId);
      if (res.success && res.attempt_id) {
        navigate(`/exam/${res.attempt_id}`);
      } else {
        alert(res.message || 'Could not start exam attempt');
      }
    } catch (err) {
      alert(err.message || 'Error starting exam');
    } finally {
      setStartingId(null);
    }
  };

  // Pagination for available exams
  const itemsPerPage = 10;
  const totalPages = Math.ceil(exams.length / itemsPerPage);
  const indexOfLastExam = currentPage * itemsPerPage;
  const indexOfFirstExam = indexOfLastExam - itemsPerPage;
  const currentExams = exams.slice(indexOfFirstExam, indexOfLastExam);

  // Pagination for exam history
  const historyItemsPerPage = 10;
  const totalHistoryPages = Math.ceil(history.length / historyItemsPerPage);
  const indexOfLastHistory = historyPage * historyItemsPerPage;
  const indexOfFirstHistory = indexOfLastHistory - historyItemsPerPage;
  const currentHistory = history.slice(indexOfFirstHistory, indexOfLastHistory);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (historyPage > totalHistoryPages && totalHistoryPages > 0) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  return (
    <div>
      {/* Title */}
      <div className="myexams-header-row">
        <div className="myexams-title-container">
          <h1 className="display-title myexams-title">
            General Exam Repository
          </h1>
          <p className="myexams-subtitle">
            Attempt independent assessments and mock exams to test your skills and unlock course recommendations.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="myexams-tabs-bar">
          <button
            onClick={() => setActiveTab('available')}
            className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'} myexams-tab-btn`}
          >
            Browse General Exams
          </button>
          <button
            onClick={() => setActiveTab('taken')}
            className={`btn ${activeTab === 'taken' ? 'btn-primary' : 'btn-secondary'} myexams-tab-btn`}
          >
            Taken & Results
          </button>
        </div>
      </div>

      {/* Available Exams Tab content */}
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : activeTab === 'available' ? (
        <div>
          {/* Search Controls */}
          <div className="myexams-search-container">
            <SearchBar
              placeholder="Search active assessments..."
              value={search}
              onSubmit={handleSearchSubmit}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                debouncedFetchExams(val);
              }}
            />
          </div>

          {exams.length === 0 ? (
            <div className="glass-card myexams-empty-available">
              <FileText size={48} className="myexams-empty-available-icon" />
              <h3>No assessments available</h3>
              <p>There are no active exam blueprints assigned to your tracks matching the search terms.</p>
            </div>
          ) : (
            <div>
              <div className="grid-cols-2 myexams-grid">
                {currentExams.map(exam => (
                  <div key={exam.exam_id} className="glass-card myexams-card">
                    <div>
                      <div className="myexams-card-header">
                        <span className="badge badge-primary">{exam.course_title || 'General / Mock'}</span>
                        <span className="myexams-duration-badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
                          Attempts: {exam.max_attempts}
                        </span>
                        <span className="myexams-duration-badge">
                          <Clock size={12} /> {exam.duration_minutes} Mins
                        </span>
                      </div>
                      
                      <h3 className="myexams-card-title">
                        {exam.title}
                      </h3>
                      
                      <p className="myexams-card-desc">
                        {exam.description || 'No description or instructions provided.'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', marginBottom: '0' }}>
                        <span>⚠️</span> Timer cannot be paused. Will auto-submit on expiry.
                      </p>
                    </div>

                    <div className="myexams-card-footer">
                      <div className="myexams-card-marks">
                        Passing: <strong className="myexams-card-marks-highlight">{exam.passing_marks} / {exam.total_marks} Marks</strong>
                      </div>
                      <button
                        onClick={() => handleStartExam(exam.exam_id)}
                        disabled={startingId === exam.exam_id}
                        className="btn btn-primary myexams-start-btn"
                      >
                        {startingId === exam.exam_id ? 'Loading...' : 'Start Assessment →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      ) : (
        /* Taken Exams / Attempt History Tab content */
        <div>
          <div className="glass-card">
            <h3 className="section-title myexams-history-title">
              <Award size={20} className="myexams-history-title-icon" />
              <span>Assessment History & Reports</span>
            </h3>

            {history.length === 0 ? (
              <div className="myexams-empty-history">
                No past exam records found. Attempt an assessment to populate your reports log.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Status / Grade</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Target Score</th>
                      <th>Completion Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHistory.map(attempt => {
                      const isCompleted = attempt.status === 'completed';
                      const isPass = isCompleted && attempt.percentage >= attempt.passing_marks;

                      return (
                        <tr key={attempt.attempt_id}>
                          <td className="myexams-history-exam-title">{attempt.exam_title}</td>
                          <td>
                            <span className={`badge ${isCompleted ? (isPass ? 'badge-success' : 'badge-danger') : 'badge-warning'} myexams-badge-container`}>
                              {isCompleted ? (isPass ? <CheckCircle2 size={12} /> : <XCircle size={12} />) : <Clock size={12} />}
                              <span className="myexams-badge-text">
                                {isCompleted ? (isPass ? 'PASSED' : 'FAILED') : 'IN PROGRESS'}
                              </span>
                            </span>
                          </td>
                          <td>{isCompleted ? `${attempt.score}/${attempt.total_marks}` : '-'}</td>
                          <td>{isCompleted ? `${attempt.percentage}%` : '-'}</td>
                          <td>{attempt.passing_marks}% Passing</td>
                          <td>{new Date(attempt.started_at).toLocaleDateString()}</td>
                          <td>
                            {isCompleted ? (
                              <Link to={`/results/${attempt.attempt_id}`} className="btn btn-secondary myexams-history-action-btn-secondary">
                                View Report
                              </Link>
                            ) : (
                              <Link to={`/exam/${attempt.attempt_id}`} className="btn btn-primary myexams-history-action-btn-primary">
                                Resume Exam
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Pagination
            currentPage={historyPage}
            totalPages={totalHistoryPages}
            onPageChange={setHistoryPage}
          />
        </div>
      )}

    </div>
  );
}

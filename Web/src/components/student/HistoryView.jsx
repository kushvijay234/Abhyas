import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, Award, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import Pagination from '../common/Pagination';
import './HistoryView.css';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLastAttempt = currentPage * itemsPerPage;
  const indexOfFirstAttempt = indexOfLastAttempt - itemsPerPage;
  const currentHistory = history.slice(indexOfFirstAttempt, indexOfLastAttempt);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.exams.getHistory();
        if (res.success) {
          setHistory(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load exam history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      <div className="history-header-row">
        <h1 className="display-title history-title">Exam History</h1>
        <p className="history-subtitle">Browse your past exam attempts, scores, and completion reports.</p>
      </div>

      <div className="glass-card">
        <h3 className="section-title history-section-title">
          <History size={20} className="history-section-icon" />
          <span>My Performance Logs</span>
        </h3>

        {history.length === 0 ? (
          <div className="history-empty-state">
            No exam history found. Head over to the Course Browser to take your first test!
          </div>
        ) : (
          <>
            <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Exam / Quiz</th>
                  <th>Attempt Status</th>
                  <th>Obtained Marks</th>
                  <th>Grade Percentage</th>
                  <th>Passing Target</th>
                  <th>Attempt Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHistory.map(attempt => {
                  const isCompleted = attempt.status === 'completed';
                  const isPass = isCompleted && attempt.percentage >= attempt.passing_marks;

                  return (
                    <tr key={attempt.attempt_id}>
                      <td className="history-exam-title-cell">{attempt.exam_title}</td>
                      <td>
                        <span className={`badge ${isCompleted ? (isPass ? 'badge-success' : 'badge-danger') : 'badge-warning'} history-badge-container`}>
                          {isCompleted ? (isPass ? <CheckCircle size={12} /> : <XCircle size={12} />) : <Clock size={12} />}
                          <span className="history-badge-text">
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
                          <Link to={`/results/${attempt.attempt_id}`} className="btn btn-secondary history-action-btn-secondary">
                            View Report
                          </Link>
                        ) : (
                          <Link to={`/exam/${attempt.attempt_id}`} className="btn btn-primary history-action-btn-primary">
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      </div>
    </div>
  );
}




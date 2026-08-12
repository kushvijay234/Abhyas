import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  AlertCircle,
  BookOpen,
  Clock
} from 'lucide-react';
import './ExamResultView.css';

export default function ExamResultView() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResultData = async () => {
      try {
        setLoading(true);

        // 1. Attempt overview (score, pass/fail, meta)
        const res = await api.results.getById(attemptId);
        if (!res.success || !res.data) throw new Error('Result not found');
        setResult(res.data);

        // 2. Full answer review — questions + correct answers + student selections
        const reviewRes = await api.results.getAnswerReview(attemptId);
        if (reviewRes.success && reviewRes.data) {
          setReviewItems(reviewRes.data);
        }
      } catch (err) {
        setError(err.message || 'Error loading examination results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [attemptId]);

  const handleEnroll = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.courses.enroll(courseId);
      if (res.success) {
        navigate('/my-courses');
      } else {
        alert(res.message || 'Failed to enroll in course');
      }
    } catch (err) {
      alert(err.message || 'Error enrolling in course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="exam-result-error-container">
        <ErrorMessage message={error} className="exam-result-error-message" />
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  const isPass = result.percentage >= result.passing_marks;

  // Derive summary counts from reviewItems
  const totalQ      = reviewItems.length;
  const answeredQ   = reviewItems.filter(r => r.selected_option).length;
  const correctQ    = reviewItems.filter(r => r.is_correct).length;
  const wrongQ      = answeredQ - correctQ;
  const skippedQ    = totalQ - answeredQ;

  /**
   * Returns the CSS class suffix for each option box:
   *   'correct'   — this IS the correct answer
   *   'wrong'     — student picked this AND it's wrong
   *   ''          — neutral (not selected, not correct)
   */
  const getOptionState = (q, opt) => {
    const isCorrect  = q.correct_option === opt;
    const isSelected = q.selected_option === opt;

    if (isCorrect) return 'correct';          // always highlight correct answer
    if (isSelected && !isCorrect) return 'wrong'; // wrong student choice
    return '';
  };

  return (
    <div>
      <div className="exam-result-header-row">
        <h1 className="display-title exam-result-title">Assessment Report</h1>
        <p className="exam-result-subtitle">Detailed feedback and score card for your completed quiz.</p>
      </div>

      <div className="grid-cols-3 exam-result-grid">
        {/* Main Scorecard */}
        <div className="glass-card exam-result-scorecard">
          <div className={`exam-result-status-circle ${isPass ? 'circle-pass' : 'circle-fail'}`}>
            {isPass ? <CheckCircle size={48} /> : <XCircle size={48} />}
          </div>

          <h2 className="exam-result-status-title">
            {isPass ? 'Congratulations!' : 'Keep Learning'}
          </h2>
          <p className="exam-result-status-desc">
            {isPass
              ? 'You have successfully cleared the passing benchmark.'
              : 'You did not meet the passing grade this time.'}
          </p>

          <div className="exam-result-score-indicator">
            <div className="exam-result-score-pct">{result.percentage}%</div>
            <div className="exam-result-score-details">
              Score: <strong>{result.score}</strong> out of{' '}
              <strong>{result.exam_total_marks || result.total_marks}</strong> marks
            </div>
          </div>

          <div className={`badge ${isPass ? 'badge-success' : 'badge-danger'} exam-result-badge-fill`}>
            {isPass ? 'PASSED' : 'FAILED'}
          </div>
        </div>

        {/* Stats + Actions */}
        <div className="glass-card exam-result-details-card">
          <h3 className="section-title exam-result-section-title">
            <Award size={20} className="exam-result-section-icon" />
            <span>Assessment Summary</span>
          </h3>

          <div className="exam-result-details-grid">
            <div className="exam-result-detail-box">
              <span className="exam-result-detail-label">Exam Title</span>
              <p className="exam-result-detail-val">{result.exam_title}</p>
            </div>
            <div className="exam-result-detail-box">
              <span className="exam-result-detail-label">Date Completed</span>
              <p className="exam-result-detail-val">
                {new Date(result.submitted_at || result.started_at).toLocaleString()}
              </p>
            </div>
            <div className="exam-result-detail-box">
              <span className="exam-result-detail-label">Passing Grade Required</span>
              <p className="exam-result-detail-val">{result.passing_marks}% Benchmark</p>
            </div>
            <div className="exam-result-detail-box">
              <span className="exam-result-detail-label">Total Questions</span>
              <p className="exam-result-detail-val">{totalQ} Items</p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="exam-result-quick-stats">
            <div className="exam-result-stat-pill stat-correct">
              <CheckCircle size={14} />
              <span>{correctQ} Correct</span>
            </div>
            <div className="exam-result-stat-pill stat-wrong">
              <XCircle size={14} />
              <span>{wrongQ} Wrong</span>
            </div>
            <div className="exam-result-stat-pill stat-skipped">
              <AlertCircle size={14} />
              <span>{skippedQ} Skipped</span>
            </div>
          </div>

          <div className="exam-result-actions">
            <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
            <Link to="/courses" className="btn btn-primary">Browse More Courses</Link>
          </div>
        </div>
      </div>

      {/* Recommended Courses section */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="exam-result-recommendations-section">
          <h3 className="section-title exam-result-recommendations-title">
            <BookOpen size={20} className="exam-result-recommendations-icon" />
            <span>Recommended Courses for Your Learning Path</span>
          </h3>
          <p className="exam-result-recommendations-desc">
            Based on your exam performance, we suggest enrolling in these courses to strengthen your knowledge:
          </p>
          <div className="recommendations-grid">
            {result.recommendations.map(course => (
              <div key={course.course_id} className="recommendation-card">
                <div className="course-card-img-wrapper">
                  <img 
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400'} 
                    alt={course.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400';
                    }}
                    className="course-card-img"
                  />
                  {course.is_associated && (
                    <span className="badge course-badge-highlight">
                      Top Match
                    </span>
                  )}
                  <span className="badge course-badge-category">
                    {course.category_name}
                  </span>
                </div>
                <div className="course-card-body">
                  <h4 className="course-card-title">{course.title}</h4>
                  <p className="course-card-desc">{course.description || 'No description provided.'}</p>
                  
                  {course.recommendation_reason && (
                    <div className="recommendation-reason-box">
                      <span className="reason-label">Why this recommendation?</span>
                      <p className="reason-text">{course.recommendation_reason}</p>
                    </div>
                  )}

                  <div className="course-card-footer">
                    <span className="course-card-meta-item">
                      <Clock size={13} /> {course.duration || 'N/A'}
                    </span>
                    <button 
                      onClick={() => handleEnroll(course.course_id)}
                      className="btn course-card-btn-enroll"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Booklet */}
      <div className="exam-result-booklet-header">
        <h3 className="section-title exam-result-booklet-title">
          <HelpCircle size={20} className="exam-result-booklet-icon" />
          <span>Your Answers — Question by Question</span>
        </h3>

        {/* Colour Legend */}
        <div className="exam-result-legend">
          <span className="legend-dot dot-correct"></span><span>Correct Answer</span>
          <span className="legend-dot dot-wrong"></span><span>Your Wrong Choice</span>
          <span className="legend-dot dot-neutral"></span><span>Not Selected</span>
        </div>

        <div className="exam-result-booklet-list">
          {reviewItems.map((q, idx) => {
            const isCorrectAnswer = !!q.is_correct;
            const isSkipped = !q.selected_option;

            return (
              <div
                key={q.question_id}
                className={`glass-card exam-result-question-card ${
                  isSkipped ? 'question-skipped' :
                  isCorrectAnswer ? 'question-correct' : 'question-wrong'
                }`}
              >
                {/* Question header */}
                <div className="exam-result-question-meta">
                  <span className="badge badge-primary">Question {idx + 1}</span>
                  <div className="exam-result-question-status-row">
                    {isSkipped ? (
                      <span className="badge badge-muted">
                        <AlertCircle size={12} /> Skipped
                      </span>
                    ) : isCorrectAnswer ? (
                      <span className="badge badge-success">
                        <CheckCircle size={12} /> Correct
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <XCircle size={12} /> Wrong
                      </span>
                    )}
                    <span className="exam-result-question-marks">+{q.marks} mark(s)</span>
                  </div>
                </div>

                <p className="exam-result-question-text">{q.question_text}</p>

                {/* Options — colour coded */}
                <div className="exam-result-options-grid">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const state = getOptionState(q, opt);
                    const optText = q[`option_${opt}`];
                    const isStudentSel = q.selected_option === opt;

                    return (
                      <div
                        key={opt}
                        className={`exam-result-option-box ${state ? `option-${state}` : ''}`}
                      >
                        <div className={`exam-result-option-letter-box letter-${state || 'neutral'}`}>
                          {opt.toUpperCase()}
                        </div>
                        <span className="exam-result-option-text">
                          {optText}
                        </span>
                        {/* Tag labels */}
                        {state === 'correct' && isStudentSel && (
                          <span className="option-tag tag-correct">✓ Your answer</span>
                        )}
                        {state === 'correct' && !isStudentSel && (
                          <span className="option-tag tag-correct">✓ Correct</span>
                        )}
                        {state === 'wrong' && (
                          <span className="option-tag tag-wrong">✗ Your choice</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

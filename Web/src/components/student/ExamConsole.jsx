import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import { 
  Clock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import './ExamConsole.css';

export default function ExamConsole() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Exam details states
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student answer states (mapped by question_id)
  const [answers, setAnswers] = useState({}); // { question_id: selected_option }
  const [markedReviews, setMarkedReviews] = useState({}); // { question_id: is_marked }

  // Keep a ref in sync with answers so the timer callback always reads the latest value
  const answersRef = useRef({});
  const [visitedQuestions, setVisitedQuestions] = useState({}); // { question_id: true }

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch attempt, questions, and current statuses
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        // 1. Fetch attempt info (includes exam_id and duration)
        const attemptRes = await api.results.getById(attemptId);
        if (!attemptRes.success || !attemptRes.data) {
          throw new Error('Attempt details not found');
        }

        const attemptData = attemptRes.data;
        if (attemptData.status === 'completed') {
          // If already completed, redirect to report card
          navigate(`/results/${attemptId}`);
          return;
        }
        setAttempt(attemptData);

        // 2. Fetch all questions for this exam
        const questionsRes = await api.exams.getQuestions(attemptData.exam_id);
        if (!questionsRes.success) {
          throw new Error('Failed to load exam questions');
        }
        const questionList = questionsRes.data || [];
        setQuestions(questionList);

        // 3. Fetch current status of questions for this attempt
        const statusRes = await api.exams.getAnswerStatus(attemptId);
        if (statusRes.success && statusRes.data) {
          const loadedAnswers = {};
          const loadedReviews = {};
          statusRes.data.forEach(item => {
            if (item.selected_option) {
              loadedAnswers[item.question_id] = item.selected_option;
            }
            if (item.is_marked) {
              loadedReviews[item.question_id] = true;
            }
          });
          setAnswers(loadedAnswers);
          setMarkedReviews(loadedReviews);
        }

        // 4. Calculate remaining time
        // Guard: ensure started_at and duration_minutes are valid before math
        const rawStart = attemptData.started_at;
        const rawDuration = attemptData.duration_minutes;

        if (!rawStart || !rawDuration) {
          console.warn('[ExamConsole] Missing timer fields:', { started_at: rawStart, duration_minutes: rawDuration });
          // Fall back to the exam duration stored on the attempt, or default 60 min
          setTimeLeft((Number(rawDuration) || 60) * 60);
        } else {
          const startTime = new Date(rawStart).getTime();
          const durationMs = Number(rawDuration) * 60 * 1000;
          const endTime = startTime + durationMs;
          const remainingSec = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remainingSec);
        }
        
        // Mark first question as visited
        if (questionList.length > 0) {
          setVisitedQuestions({ [questionList[0].question_id]: true });
        }

      } catch (err) {
        setError(err.message || 'Error configuring exam panel.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [attemptId, navigate]);

  // Keep answersRef in sync so the auto-submit callback never reads a stale closure
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Timer tick — dependency array intentionally excludes timeLeft to avoid
  // creating a new interval every second (which causes drift and double-ticks)
  useEffect(() => {
    if (loading || error || timeLeft <= 0) return;

    const tick = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]); // timeLeft intentionally omitted

  // Auto-submit when countdown hits zero (separate from tick so no side-effects
  // inside a state setter, and no stale closure on answers)
  useEffect(() => {
    if (timeLeft === 0 && !loading && !error) {
      handleAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Format Time representation — guard against NaN or non-finite values
  const formatTime = (secs) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rSecs = secs % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option) => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ.question_id]: option
    }));
  };

  const handleSaveAndNext = async () => {
    const currentQ = questions[currentIndex];
    const selectedOption = answers[currentQ.question_id];

    if (selectedOption) {
      try {
        await api.exams.saveAnswer(attemptId, currentQ.question_id, selectedOption);
      } catch (err) {
        console.error('Failed to auto-save answer:', err);
      }
    }

    // Go to next question or show summary
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextQ = questions[nextIndex];
      setVisitedQuestions(prev => ({ ...prev, [nextQ.question_id]: true }));
    }
  };

  const handleToggleReview = async () => {
    const currentQ = questions[currentIndex];
    const nextMarkedState = !markedReviews[currentQ.question_id];
    
    setMarkedReviews(prev => ({
      ...prev,
      [currentQ.question_id]: nextMarkedState
    }));

    try {
      await api.exams.markReview(attemptId, currentQ.question_id, nextMarkedState);
    } catch (err) {
      console.error('Failed to toggle review flag:', err);
    }
  };

  const handleClearResponse = async () => {
    const currentQ = questions[currentIndex];
    if (!answers[currentQ.question_id]) return;

    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[currentQ.question_id];
      return updated;
    });

    try {
      // Clear in backend by sending null or delete. 
      // The API takes selected_option. Let's see: sending empty option is not allowed. 
      // Usually saving empty requires another service, but we can just clear local state.
      // Wait, we can save empty option or ignore.
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestionSelect = (index) => {
    setCurrentIndex(index);
    const targetQ = questions[index];
    setVisitedQuestions(prev => ({ ...prev, [targetQ.question_id]: true }));
  };

  const handleAutoSubmit = () => {
    alert('Time limit reached! Your exam is being submitted automatically.');
    submitExamWithAnswers(answersRef.current);
  };

  // Core submit — accepts a snapshot of answers so it works both from the modal
  // (live state) and from the auto-submit timer (via answersRef, no stale closure)
  const submitExamWithAnswers = async (answersSnapshot) => {
    setSubmitting(true);
    try {
      const answersArray = Object.keys(answersSnapshot).map(qId => ({
        question_id: parseInt(qId),
        selected_option: answersSnapshot[qId]
      }));

      const res = await api.exams.submitAttempt(attemptId, answersArray);
      if (res.success) {
        navigate(`/results/${attemptId}`);
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      alert(err.message || 'Error submitting answers');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Called from the submit modal button — passes the live answers state
  const submitExam = () => submitExamWithAnswers(answers);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="exam-console-error-container">
        <ErrorMessage message={error} className="exam-console-error-message" />
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      {/* Top Banner */}
      <div className="exam-console-top-banner">
        <div>
          <h3 className="exam-console-title">
            {attempt?.exam_title}
          </h3>
          <p className="exam-console-subtitle">
            Attempt ID: #{attemptId} | Question {currentIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Live Timer */}
        <div className={`exam-console-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
          <Clock size={16} />
          <span className="exam-console-time-text">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="exam-layout">
        {/* Question Pane */}
        <div className="exam-panel">
          {currentQuestion ? (
            <div className="exam-console-question-container">
              <div className="exam-console-question-header">
                <span className="badge badge-primary">
                  Question {currentIndex + 1}
                </span>
                <span className="badge badge-success">
                  {currentQuestion.marks} Mark(s)
                </span>
              </div>

              <h3 className="exam-console-question-text">
                {currentQuestion.question_text}
              </h3>

              {/* Options */}
              <div className="exam-console-options-container">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const optField = `option_${opt}`;
                  const optionText = currentQuestion[optField];
                  const isSelected = answers[currentQuestion.question_id] === opt;

                  return (
                    <div 
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className={`option-box ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="option-letter">{opt}</div>
                      <div className={`exam-console-option-text ${isSelected ? 'option-selected' : ''}`}>{optionText}</div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="exam-console-action-bar">
                <div className="exam-console-button-group">
                  <button 
                    onClick={handleToggleReview}
                    className={`btn ${markedReviews[currentQuestion.question_id] ? 'btn-success' : 'btn-secondary'}`}
                  >
                    <Bookmark size={16} />
                    <span>{markedReviews[currentQuestion.question_id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                  <button 
                    onClick={handleClearResponse}
                    className="btn btn-secondary"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="exam-console-button-group">
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="btn btn-secondary"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  {currentIndex < totalQuestions - 1 ? (
                    <button 
                      onClick={handleSaveAndNext}
                      className="btn btn-primary"
                    >
                      <span>Save & Next</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={async () => {
                        await handleSaveAndNext();
                        setShowSubmitModal(true);
                      }}
                      className="btn btn-success"
                    >
                      <CheckCircle size={16} />
                      <span>Submit Exam</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="exam-console-empty-questions">
              No questions found.
            </div>
          )}
        </div>

        {/* Sidebar Status Monitor */}
        <div className="exam-sidebar">
          <div className="glass-card">
            <h4 className="exam-console-sidebar-title">
              Question Map
            </h4>

            <div className="question-status-grid exam-console-sidebar-grid">
              {questions.map((q, idx) => {
                const qId = q.question_id;
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[qId] !== undefined;
                const isMarked = markedReviews[qId] === true;
                const isVisited = visitedQuestions[qId] === true;

                let statusClass = '';
                if (isAnswered) statusClass = 'answered';
                if (isMarked) statusClass = 'marked';
                if (!isAnswered && !isMarked && isVisited) statusClass = 'visited';
                if (isCurrent) statusClass += ' current';

                return (
                  <button
                    key={qId}
                    onClick={() => handleQuestionSelect(idx)}
                    className={`btn-q-status ${statusClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="exam-console-legend-container">
              <div className="exam-console-legend-item">
                <div className="exam-console-legend-color-success"></div>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="exam-console-legend-item">
                <div className="exam-console-legend-color-warning"></div>
                <span>Marked for Review ({Object.keys(markedReviews).length})</span>
              </div>
              <div className="exam-console-legend-item">
                <div className="exam-console-legend-color-muted"></div>
                <span>Visited but Unanswered</span>
              </div>
              <div className="exam-console-legend-item">
                <div className="exam-console-legend-color-visited"></div>
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-success exam-console-submit-btn"
          >
            Finish & Submit
          </button>
        </div>
      </div>

      {/* Confirmation Submit modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content exam-console-modal-content">
            <div className="modal-header">
              <h3 className="exam-console-modal-title">Confirm Submission</h3>
            </div>
            <div className="modal-body exam-console-modal-body-center">
              <AlertTriangle size={48} className="exam-console-modal-icon" />
              <p className="exam-console-modal-text">
                Are you sure you want to finish the exam?
              </p>
              <div className="exam-console-modal-stats-box">
                <div className="exam-console-modal-stats-row">
                  <span>Total Questions:</span>
                  <span className="exam-console-modal-stat-val-bright">{totalQuestions}</span>
                </div>
                <div className="exam-console-modal-stats-row">
                  <span>Questions Answered:</span>
                  <span className="exam-console-modal-stat-val-success">{answeredCount}</span>
                </div>
                <div className="exam-console-modal-stats-row">
                  <span>Unanswered:</span>
                  <span className="exam-console-modal-stat-val-danger">{totalQuestions - answeredCount}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Go Back
              </button>
              <button 
                onClick={submitExam}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

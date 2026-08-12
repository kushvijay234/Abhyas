import { useState, useEffect } from 'react';
import './Dashboard.css';
import { api } from '../../services/api';
import { 
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load user data from localStorage to display dynamic welcome greeting
  const [user, setUser] = useState(null);
  useEffect(() => {
    const savedUser = localStorage.getItem('abhyas_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch all dashboard summary, charts, tables and leaderboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, perfRes, recentRes, upcomingRes, leaderboardRes, badgesRes] = await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getPerformance(),
          api.dashboard.getRecentExams(),
          api.dashboard.getUpcomingExams(),
          api.leaderboard.getGlobal(3),
          api.auth.getBadges()
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (perfRes.success) setPerformance(perfRes.data || []);
        if (recentRes.success) setRecentExams(recentRes.data || []);
        if (upcomingRes.success) setUpcomingExams(upcomingRes.data || []);
        if (leaderboardRes.success) setToppers(leaderboardRes.data || []);
        if (badgesRes.success) setBadges(badgesRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage message={error} className="dashboard-error" />;
  }

  // Get dynamic dates formatted
  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', options);
    // Format to "Sunday · 1 June 2026"
    const parts = dateStr.split(', ');
    if (parts.length >= 3) {
      return `${parts[0]} · ${parts[1]} ${parts[2]}`;
    }
    return dateStr.replace(',', ' ·');
  };

  // Helper to format dynamic relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Helper to get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Compute stats indicators
  const streakCount = summary?.streak || 0;
  const totalStudents = summary?.total_students || 1842;
  const userRank = summary?.rank ? Math.min(summary.rank, totalStudents) : 14;
  const examsPendingCount = upcomingExams.length;
  
  // Calculate attempts in the last 7 days dynamically
  const attemptsThisWeek = (summary?.attempt_dates || []).filter(dateStr => {
    const attemptDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - attemptDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  // Streak grid array calculation
  const renderStreakCells = () => {
    const today = new Date();
    const cells = [];
    const datesWithAttempts = summary?.attempt_dates || [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hasAttempt = datesWithAttempts.includes(dateStr);
      const cellTitle = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
                        (hasAttempt ? ': Completed quiz!' : ': No activity');
      
      cells.push(
        <div 
          key={i} 
          className="streak-cell" 
          title={cellTitle}
          style={{ 
            background: hasAttempt 
              ? 'linear-gradient(135deg, #F47920, #F9A355)' 
              : '#FFE8D0' 
          }}
        />
      );
    }
    return cells;
  };

  // Helper to parse subject icons
  const getExamIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('web') || lower.includes('html') || lower.includes('css')) return '🌐';
    if (lower.includes('aptitude') || lower.includes('math') || lower.includes('quant')) return '🧮';
    if (lower.includes('java') || lower.includes('programming') || lower.includes('code')) return '☕';
    if (lower.includes('dbms') || lower.includes('sql') || lower.includes('database')) return '🐳';
    if (lower.includes('physics')) return '🪐';
    return '📝';
  };

  // Featured Exam Banner logic
  const featuredExam = upcomingExams.length > 0 ? {
    exam_id: upcomingExams[0].exam_id,
    course_id: upcomingExams[0].course_id,
    title: upcomingExams[0].title,
    course_name: upcomingExams[0].course_name || 'General',
    duration_minutes: upcomingExams[0].duration_minutes,
    total_marks: upcomingExams[0].total_marks,
    passing_marks: upcomingExams[0].passing_marks,
    total_questions: upcomingExams[0].total_questions,
    isMock: false
  } : null;

  // Featured start action
  const handleFeaturedStart = async () => {
    if (!featuredExam) return;
    if (featuredExam.isMock) {
      navigate('/courses');
    } else if (!featuredExam.exam_id) {
      navigate('/exams');
    } else {
      const confirmStart = window.confirm(
        "⚠️ DISCLAIMER:\n" +
        "1. Once started, this assessment cannot be paused.\n" +
        "2. The timer will run continuously even if you close the tab.\n" +
        "3. The assessment will be automatically submitted when the duration expires.\n\n" +
        "Do you want to start the exam now?"
      );
      if (!confirmStart) return;

      try {
        const res = await api.exams.startAttempt(featuredExam.exam_id);
        if (res.success && res.attempt_id) {
          navigate(`/exam/${res.attempt_id}`);
        } else {
          navigate('/exams');
        }
      } catch (err) {
        navigate('/exams');
      }
    }
  };

  // Featured details parameters
  const featuredMeta = featuredExam ? `${featuredExam.course_name} · ${featuredExam.duration_minutes} min · ${featuredExam.total_marks} marks · Active Attempt` : '';

  // Upcoming Exams List mapping
  const examsList = upcomingExams;

  // Action helper for individual exam row
  const handleExamAction = async (exam) => {
    if (exam.isMock) {
      navigate('/courses');
    } else if (!exam.course_id) {
      const confirmStart = window.confirm(
        "⚠️ DISCLAIMER:\n" +
        "1. Once started, this assessment cannot be paused.\n" +
        "2. The timer will run continuously even if you close the tab.\n" +
        "3. The assessment will be automatically submitted when the duration expires.\n\n" +
        "Do you want to start the exam now?"
      );
      if (!confirmStart) return;

      try {
        const res = await api.exams.startAttempt(exam.exam_id);
        if (res.success && res.attempt_id) {
          navigate(`/exam/${res.attempt_id}`);
        } else {
          navigate('/exams');
        }
      } catch (err) {
        navigate('/exams');
      }
    } else {
      navigate(`/courses/${exam.course_id}`);
    }
  };

  // Recent Activity list mapping (only real user activities, no static fallback)
  const activityList = recentExams.map(attempt => {
    const isPass = attempt.percentage >= 40; // Default passing threshold
    return {
      title: attempt.exam_title,
      score: attempt.status === 'completed' ? `${Math.round(attempt.percentage)}%` : 'In Progress',
      time: getRelativeTime(attempt.submitted_at || attempt.started_at),
      color: attempt.status === 'completed' ? (isPass ? '#16A34A' : '#ef4444') : '#F47920'
    };
  });

  // Course Progress mapping (only real course progress, no static fallback)
  const courseProgressList = summary?.course_progress || [];
  const subjectsToShow = courseProgressList;

  const getProgressBarStyles = (index) => {
    const gradients = [
      'linear-gradient(90deg, #F47920, #F9A355)', // orange
      'linear-gradient(90deg, #0284C7, #38BDF8)', // blue
      'linear-gradient(90deg, #16A34A, #22C55E)', // green
      'linear-gradient(90deg, #D97706, #FBBF24)', // amber
      'linear-gradient(90deg, #1A2D6B, #2B44A0)'  // navy
    ];
    const textColors = ['#F47920', '#0284C7', '#16A34A', '#D97706', '#1A2D6B'];
    return {
      fillBg: gradients[index % gradients.length],
      textColor: textColors[index % textColors.length]
    };
  };

  // Top performers toppers list mapping
  const filteredToppers = toppers.filter(t => t.user_id !== user?.user_id).slice(0, 2);
  const toppersList = filteredToppers.length > 0 ? filteredToppers : [
    { user_name: 'Vijay K.', initials: 'VK', avg_score: 98, medal: '🥇', bgGrad: 'linear-gradient(135deg, #D97706, #F47920)' },
    { user_name: 'Anmol M.', initials: 'AM', avg_score: 94, medal: '🥈', bgGrad: 'linear-gradient(135deg, #1A2D6B, #2B44A0)' }
  ];



  return (
    <div className="dash-wrapper">
      
      {/* Top Welcome bar */}
      <div className="top-bar">
        <div>
          <div className="date-label">
            <div className="date-dot"></div>
            <div className="date-text">{getFormattedDate()}</div>
          </div>
          <h1 className="greeting">{getGreeting()},<br /><em>{user?.user_name || 'Student'}!</em></h1>
          <p className="subtitle">
            {examsPendingCount === 0 ? 'All clear!' : `${examsPendingCount} exam(s) pending`} today &nbsp;·&nbsp; 🔥 {streakCount}-day streak &nbsp;·&nbsp; Rank #{userRank}
          </p>
        </div>

      </div>

      {/* Stats strip count indicators */}
      <div className="stats-strip">
        <div className="stat-cell">
          <div className="stat-label">Exams Done</div>
          <div className="stat-val orange">{summary?.total_exams_taken || 0}</div>
          <div className="stat-delta">↑ +{attemptsThisWeek} this week</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Average Score</div>
          <div className="stat-val navy">
            {summary?.avg_score ? `${Math.round(summary.avg_score)}%` : '0%'}
          </div>
          <div className="stat-delta">↑ Overall efficiency</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Study Hours</div>
          <div className="stat-val navy">{summary?.study_hours || 0}h</div>
          <div className="stat-delta">↑ Total duration</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Streak</div>
          <div className="stat-val orange">🔥{streakCount}</div>
          <div className="stat-delta">{streakCount >= 5 ? 'Badge active!' : `${5 - streakCount} more for a badge`}</div>
        </div>
      </div>

      {/* Featured Exam Banner card */}
      {featuredExam && (
        <div className="banner">
          <div className="banner-glow"></div>
          <div className="banner-watermark">अ</div>
          <div className="banner-inner">
            <div>
              <div className="banner-eyebrow">
                Featured Scheduled Test
              </div>
              <div className="banner-title">{featuredExam.title}</div>
              <div className="banner-meta">{featuredMeta}</div>
              <div className="banner-disclaimer" style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', background: 'rgba(239, 68, 68, 0.25)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', margin: '6px 0 10px', fontWeight: 600 }}>
                ⚠️ Timer cannot be paused. Will auto-submit on expiry.
              </div>
              <div className="banner-stats">
                <div>
                  <div className="bstat-val">{featuredExam.total_marks}</div>
                  <div className="bstat-label">Marks</div>
                </div>
                <div>
                  <div className="bstat-val">{featuredExam.duration_minutes}m</div>
                  <div className="bstat-label">Duration</div>
                </div>
                <div>
                  <div className="bstat-val">{featuredExam.total_questions !== undefined ? featuredExam.total_questions : 'Multi'}</div>
                  <div className="bstat-label">Questions</div>
                </div>
              </div>
              <button className="btn btn-primary dashboard-banner-btn" onClick={handleFeaturedStart}>
                Start Now →
              </button>
            </div>
            <div className="dashboard-banner-rank-wrapper">
              <div className="banner-rank-val">#{userRank}</div>
              <div className="banner-rank-label">Your Rank</div>
              <div className="banner-rank-delta">of {totalStudents} students</div>
            </div>
          </div>
        </div>
      )}

      {/* Grid 2 Column: Upcoming Exams & Recent activity log */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Upcoming Exams</div>
            <button className="card-link" onClick={() => navigate('/exams')}>View all →</button>
          </div>
          <div className="list-rows">
            {examsList.length > 0 ? (
              examsList.map((exam, idx) => {
                const showButton = exam.enrollable || !exam.isMock;
                return (
                  <div className="list-row" key={exam.exam_id || idx}>
                    <div className="row-icon" style={{ 
                      background: idx === 0 ? '#EFF6FF' : idx === 1 ? '#ECFDF5' : '#FFF4EB'
                    }}>
                      {getExamIcon(exam.title)}
                    </div>
                    <div className="dashboard-flex-1">
                      <div className="row-title">{exam.title}</div>
                      <div className="row-sub">{exam.course_name}</div>
                    </div>
                    <div className="row-right" style={{ marginRight: showButton ? '8px' : '0' }}>
                      {exam.isMock ? (
                        <>
                          <div><span className={`pill ${idx === 0 ? 'pill-blue' : idx === 1 ? 'pill-green' : 'pill-orange'}`}>{exam.dateLabel}</span></div>
                          {exam.timeLabel && <div className="row-time">{exam.timeLabel}</div>}
                        </>
                      ) : (
                        <>
                          <div><span className="pill pill-blue">Published</span></div>
                          <div className="row-time">Open now</div>
                        </>
                      )}
                    </div>
                    {showButton && (
                      <button className="btn-enroll" onClick={() => handleExamAction(exam)}>
                        {exam.enrollable ? 'Enroll' : 'Start'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No upcoming exams scheduled. Check back later!
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Recent Activity</div>
          </div>
          <div className="list-rows">
            {activityList.length > 0 ? (
              activityList.map((act, idx) => (
                <div className="list-row" key={idx}>
                  <div className="act-dot" style={{ background: act.color }}></div>
                  <div className="recent-activity-title">
                    {act.title}
                  </div>
                  <div className="act-score" style={{ color: act.color }}>
                    {act.score}
                  </div>
                  <div className="act-time">
                    {act.time}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No recent activity. Start an exam to see your history!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid 3 Column: Subject Progress, Global Rank and Streak calendar */}
      <div className="grid-3">
        {/* Course Progress */}
        <div className="card">
          <div className="card-title dashboard-card-title-spaced">Course Progress</div>
          {subjectsToShow.length > 0 ? (
            subjectsToShow.map((subj, idx) => {
              const hasExams = subj.total_exams > 0;
              const pct = hasExams ? Math.round((subj.completed_exams / subj.total_exams) * 100) : 0;
              const styles = getProgressBarStyles(idx);
              
              return (
                <div className="progress-row" key={subj.course_id || idx}>
                  <div className="prog-label" title={subj.course_title}>{subj.course_title}</div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ 
                      width: `${Math.max(5, pct)}%`, 
                      background: styles.fillBg 
                    }} />
                  </div>
                  <div className="prog-pct" style={{ color: styles.textColor }}>
                    {pct}%
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Not enrolled in any courses yet. <Link to="/courses" style={{ color: '#1c2660', fontWeight: 'bold', textDecoration: 'underline' }}>Explore Courses</Link> to begin!
            </div>
          )}
        </div>

        {/* Global Rank Card */}
        <div className="card-navy">
          <div className="card-header">
            <div className="card-title dashboard-card-title-white">🏆 Your Rank</div>
          </div>
          <div className="rank-big">#{userRank}</div>
          <div className="rank-of">of {totalStudents} students</div>
          <div className="rank-delta">Overall Score Average: {summary?.avg_score ? `${Math.round(summary.avg_score)}%` : '0%'}</div>
          
          <div className="rank-mini-grid">
            <div>
              <div className="rank-mini-val">{summary?.total_exams_taken || 0}</div>
              <div className="rank-mini-label">Exams</div>
            </div>
            <div>
              <div className="rank-mini-val gold">
                {summary?.avg_score ? `${Math.round(summary.avg_score)}%` : '0%'}
              </div>
              <div className="rank-mini-label">Avg Score</div>
            </div>
            <div>
              <div className="rank-mini-val">{summary?.study_hours || 0}h</div>
              <div className="rank-mini-label">Hours</div>
            </div>
          </div>
        </div>

        {/* Streak card & toppers details */}
        <div className="card-streak">
          <div className="card-header">
            <div className="card-title dashboard-card-title-primary">🔥 Streak</div>
            <span className="streak-badge">{streakCount} Days</span>
          </div>
          
          {/* Streak Grid 14 cells */}
          <div className="streak-grid">
            {renderStreakCells()}
          </div>
          <div className="streak-hint">Keep practicing to maintain your daily streak!</div>
          
          <div className="toppers-divider">
            <div className="toppers-label">Top Performers</div>
            {toppersList.slice(0, 2).map((topper, idx) => {
              const initials = topper.initials || getInitials(topper.user_name);
              const medal = idx === 0 ? '🥇' : '🥈';
              const bgGrad = topper.bgGrad || (idx === 0 ? 'linear-gradient(135deg, #D97706, #F47920)' : 'linear-gradient(135deg, #1A2D6B, #2B44A0)');
              const displayScore = topper.avg_score ? `${Math.round(topper.avg_score)}%` : '90%';
              return (
                <div className="topper-row" key={idx}>
                  <span className="topper-medal">{medal}</span>
                  <div className="topper-avatar" style={{ background: bgGrad }}>{initials}</div>
                  <div className="topper-name">{topper.user_name}</div>
                  <div className="topper-score topper-score-orange">{displayScore}</div>
                </div>
              );
            })}
            
            {/* User row */}
            <div className="topper-you">
              <span className="topper-rank">#{userRank}</span>
              <div className="topper-avatar">
                {user?.user_name ? getInitials(user.user_name) : 'ST'}
              </div>
              <div className="topper-name">You</div>
              <div className="topper-score">
                {summary?.avg_score ? `${Math.round(summary.avg_score)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Row */}
      <div className="card dashboard-badges-card" style={{ marginTop: '24px' }}>
        <div className="card-header" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
          <div className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#1c2660', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎖️</span> Achievements & Badges
          </div>
        </div>
        
        <div className="table-responsive" style={{ marginTop: '16px', overflowX: 'auto' }}>
          {badges.filter(b => b.isEarned).length > 0 ? (
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: '#1c2660', fontSize: '14px', width: '220px' }}>Badge</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: '#1c2660', fontSize: '14px' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', color: '#1c2660', fontSize: '14px', width: '180px' }}>Date Earned</th>
                </tr>
              </thead>
              <tbody>
                {badges.filter(b => b.isEarned).map(b => (
                  <tr key={b.badge_type} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px' }}>{b.icon}</span>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{b.title}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563' }}>
                      {b.description}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                      {b.earned_at ? new Date(b.earned_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', border: '2px dashed #e5e7eb', borderRadius: '12px', background: '#f9fafb' }}>
              No achievements unlocked yet. Keep learning and completing quizzes to earn badges!
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

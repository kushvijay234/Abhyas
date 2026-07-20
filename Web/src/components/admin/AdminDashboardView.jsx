import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  BookOpen, 
  FileSpreadsheet, 
  HelpCircle, 
  BarChart, 
  Clock, 
  Award, 
  Trophy,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminDashboardView.css';

export default function AdminDashboardView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.admin.dashboard.getSummary();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.message || 'Error loading dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge badge-danger admindash-error-badge">
        {error}
      </div>
    );
  }

  const { overview, top_performing_students = [], recent_activities = [] } = stats || {};

  return (
    <div>
      <div className="admindash-header-row">
        <h1 className="display-title admindash-title">Admin Dashboard</h1>
        <p className="admindash-subtitle">Global overview of the Abhyas E-Learning and examination metrics.</p>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid-cols-4 admindash-overview-grid">
        <div className="glass-card admindash-overview-card">
          <div className="admindash-icon-box students">
            <Users size={24} />
          </div>
          <div className="admindash-card-content">
            <div className="admindash-card-label">Total Students</div>
            <div className="admindash-card-val">{overview?.total_users || 0}</div>
          </div>
        </div>

        <div className="glass-card admindash-overview-card">
          <div className="admindash-icon-box courses">
            <BookOpen size={24} />
          </div>
          <div className="admindash-card-content">
            <div className="admindash-card-label">Active Courses</div>
            <div className="admindash-card-val">{overview?.total_courses || 0}</div>
          </div>
        </div>

        <div className="glass-card admindash-overview-card">
          <div className="admindash-icon-box exams">
            <FileSpreadsheet size={24} />
          </div>
          <div className="admindash-card-content">
            <div className="admindash-card-label">Exams Assigned</div>
            <div className="admindash-card-val">{overview?.total_exams || 0}</div>
          </div>
        </div>

        <div className="glass-card admindash-overview-card">
          <div className="admindash-icon-box attempts">
            <Activity size={24} />
          </div>
          <div className="admindash-card-content">
            <div className="admindash-card-label">Total Attempts</div>
            <div className="admindash-card-val">{overview?.total_attempts || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-3 admindash-layout-grid">
        {/* Top Performing Students */}
        <div className="glass-card admindash-leaderboard-card">
          <h3 className="section-title admindash-section-title">
            <Trophy size={20} className="admindash-section-icon-trophy" />
            <span>Top Performing Students</span>
          </h3>

          <div className="admindash-leaderboard-list">
            {top_performing_students.length === 0 ? (
              <div className="admindash-empty-leaderboard">No student activity recorded.</div>
            ) : (
              top_performing_students.map((student, idx) => (
                <div 
                  key={idx} 
                  className={`admindash-leaderboard-row ${idx < top_performing_students.length - 1 ? 'admindash-leaderboard-row-bordered' : ''}`}
                >
                  <div className="admindash-leaderboard-student-profile">
                    <div className="admindash-leaderboard-rank">{idx + 1}.</div>
                    <div>
                      <div className="admindash-leaderboard-student-name">{student.user_name}</div>
                      <div className="admindash-leaderboard-student-meta">{student.completed_exams} exam(s) passed</div>
                    </div>
                  </div>
                  <div className="badge badge-success admindash-leaderboard-badge">
                    {student.avg_percentage}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Exam Attempts activity log */}
        <div className="glass-card admindash-log-card">
          <h3 className="section-title admindash-section-title">
            <Clock size={20} className="admindash-section-icon-clock" />
            <span>Live Attempt Activity Log</span>
          </h3>

          <div className="table-responsive admindash-table-container">
            {recent_activities.length === 0 ? (
              <div className="admindash-empty-log">No attempts logged yet.</div>
            ) : (
              <table className="custom-table admindash-log-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam / Track</th>
                    <th>Obtained</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Attempt Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_activities.slice(0, 5).map((act, idx) => {
                    const isCompleted = act.status === 'completed';
                    const isPass = isCompleted && act.percentage >= (act.passing_marks || 40);

                    return (
                      <tr key={idx}>
                        <td className="admindash-log-student-name">{act.user_name}</td>
                        <td>{act.exam_title}</td>
                        <td>{isCompleted ? `${act.score}/${act.total_marks}` : '-'}</td>
                        <td className="admindash-log-score">{isCompleted ? `${act.percentage}%` : '-'}</td>
                        <td>
                          <span className={`badge ${isCompleted ? (isPass ? 'badge-success' : 'badge-danger') : 'badge-warning'} admindash-log-badge`}>
                            {act.status}
                          </span>
                        </td>
                        <td>{new Date(act.attempted_at || act.started_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

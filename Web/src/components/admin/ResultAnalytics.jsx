import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart3, Search, Calendar, FileDown, CheckCircle, AlertTriangle } from 'lucide-react';
import './ResultAnalytics.css';

export default function ResultAnalytics() {
  const [report, setReport] = useState([]);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);

  // Filter conditions
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load selection helpers (exams & users list)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [examsRes, usersRes] = await Promise.all([
          api.admin.exams.getAll(),
          api.admin.users.getAll()
        ]);
        if (examsRes.success) setExams(examsRes.data || []);
        if (usersRes.success) setUsers(usersRes.data || []);
      } catch (err) {
        setError('Error loading filters configuration.');
      }
    };
    loadConfig();
  }, []);

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.admin.results.getReport(
        selectedExamId,
        selectedUserId,
        fromDate,
        toDate
      );
      if (res.success) {
        setReport(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error generating report.');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    
    try {
      const blob = await api.admin.results.exportCSV(
        selectedExamId,
        selectedUserId,
        fromDate,
        toDate
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `abhyas_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccess('CSV report downloaded successfully.');
    } catch (err) {
      setError(err.message || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="resanalytics-header-row">
        <div className="resanalytics-header-title-box">
          <h1 className="display-title resanalytics-header-title">Results & Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate customized grade reports and download CSV transcripts.</p>
        </div>

        <button 
          onClick={handleExportCSV} 
          className="btn btn-secondary resanalytics-export-btn" 
          disabled={exporting || report.length === 0}
        >
          <FileDown size={18} />
          <span>{exporting ? 'Exporting...' : 'Export CSV Transcript'}</span>
        </button>
      </div>

      {error && (
        <div className="badge badge-danger resanalytics-badge-full">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="badge badge-success resanalytics-badge-full">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Query Filters Bar */}
      <form onSubmit={handleGenerateReport} className="glass-card resanalytics-filter-form">
        <div className="form-group resanalytics-form-group">
          <label className="form-label">Exam Template</label>
          <select
            className="form-control resanalytics-select-field"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            <option value="">-- All Exams --</option>
            {exams.map(e => (
              <option key={e.exam_id} value={e.exam_id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group resanalytics-form-group">
          <label className="form-label">Student User</label>
          <select
            className="form-control resanalytics-select-field"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">-- All Users --</option>
            {users.map(u => (
              <option key={u.id || u.user_id} value={u.id || u.user_id}>{u.name || u.user_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group resanalytics-form-group">
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-control resanalytics-date-field"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="form-group resanalytics-form-group">
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-control resanalytics-date-field"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary resanalytics-search-btn">
          <span>Search Report</span>
        </button>
      </form>

      {/* Summary statistics about searched report */}
      {report.length > 0 && (
        <div className="grid-cols-3 resanalytics-stats-grid">
          <div className="glass-card resanalytics-stat-card">
            <div className="resanalytics-stat-icon-box searched">
              <BarChart3 size={18} />
            </div>
            <div className="resanalytics-stat-content">
              <span className="resanalytics-stat-label">Searched Records</span>
              <p className="resanalytics-stat-val">{report.length} Attempts</p>
            </div>
          </div>

          <div className="glass-card resanalytics-stat-card">
            <div className="resanalytics-stat-icon-box passrate">
              <CheckCircle size={18} />
            </div>
            <div className="resanalytics-stat-content">
              <span className="resanalytics-stat-label">Average Pass Rate</span>
              <p className="resanalytics-stat-val">
                {Math.round((report.filter(r => r.percentage >= (r.passing_marks || 40)).length / report.length) * 100)}% Passing
              </p>
            </div>
          </div>

          <div className="glass-card resanalytics-stat-card">
            <div className="resanalytics-stat-icon-box avgscore">
              <Calendar size={18} />
            </div>
            <div className="resanalytics-stat-content">
              <span className="resanalytics-stat-label">Avg Score Percentage</span>
              <p className="resanalytics-stat-val">
                {Math.round(report.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / report.length)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : report.length === 0 ? (
        <div className="glass-card resanalytics-empty-card">
          <BarChart3 size={48} className="resanalytics-empty-icon" />
          <h3>No records match filters</h3>
          <p>Try clearing your date selections or changing your student selection filters.</p>
        </div>
      ) : (
        <div className="glass-card resanalytics-table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Attempt ID</th>
                  <th>Student User</th>
                  <th>Exam Title</th>
                  <th>Obtained Marks</th>
                  <th>Grade Percentage</th>
                  <th>Result Status</th>
                  <th>Time Taken</th>
                  <th>Date Finished</th>
                </tr>
              </thead>
              <tbody>
                {report.map(row => {
                  const isCompleted = row.status === 'completed';
                  const isPass = isCompleted && row.percentage >= (row.passing_marks || 40);
                  
                  return (
                    <tr key={row.result_id}>
                      <td>#{row.result_id}</td>
                      <td className="resanalytics-td-student">{row.user_name}</td>
                      <td>{row.exam_title}</td>
                      <td>{isCompleted ? `${row.score}/${row.total_marks}` : '-'}</td>
                      <td className="resanalytics-td-score">{isCompleted ? `${row.percentage}%` : '-'}</td>
                      <td>
                        <span className={`badge ${isCompleted ? (isPass ? 'badge-success' : 'badge-danger') : 'badge-warning'}`}>
                          {isCompleted ? (isPass ? 'PASS' : 'FAIL') : 'IN PROGRESS'}
                        </span>
                      </td>
                      <td>{row.time_taken_minutes || 0} mins</td>
                      <td>{new Date(row.submitted_at || row.started_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

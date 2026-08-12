import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trophy, Award, BookOpen, FileText, Search, User } from 'lucide-react';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import Pagination from '../common/Pagination';
import './LeaderboardView.css';

export default function LeaderboardView() {
  const [activeTab, setActiveTab] = useState('global'); // global, course, exam
  const [rankings, setRankings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  
  // Selection ids
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  // Pagination calculations
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rankings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRankings = rankings.slice(indexOfFirstItem, indexOfLastItem);

  // Load configuration lists (courses & exams)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [coursesRes, examsRes] = await Promise.all([
          api.courses.getAll(),
          api.exams.getAll()
        ]);
        if (coursesRes.success) setCourses(coursesRes.data || []);
        if (examsRes.success) setExams(examsRes.data || []);
      } catch (err) {
        console.error('Error loading config list:', err);
      }
    };
    loadConfig();
  }, []);

  // Fetch rankings whenever filters or tabs change
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        setError('');
        let res;

        if (activeTab === 'global') {
          res = await api.leaderboard.getGlobal(100);
        } else if (activeTab === 'course') {
          if (!selectedCourseId) {
            setRankings([]);
            setLoading(false);
            return;
          }
          res = await api.leaderboard.getByCourse(selectedCourseId, 100);
        } else if (activeTab === 'exam') {
          if (!selectedExamId) {
            setRankings([]);
            setLoading(false);
            return;
          }
          res = await api.leaderboard.getByExam(selectedExamId, 100);
        }

        if (res && res.success) {
          setRankings(res.data || []);
        } else {
          setRankings([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load rankings.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [activeTab, selectedCourseId, selectedExamId]);

  // Reset page when tab/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCourseId, selectedExamId]);

  // Safeguard page bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div>
      <div className="leaderboard-header-row">
        <h1 className="display-title leaderboard-title">Leaderboard</h1>
        <p className="leaderboard-subtitle">Compete with other peers globally, by subject, or in specific exams.</p>
      </div>

      {/* Leaderboard Tabs */}
      <div className="leaderboard-tabs-bar">
        <button
          onClick={() => setActiveTab('global')}
          className={`btn ${activeTab === 'global' ? 'btn-primary' : 'btn-secondary'} leaderboard-tab-btn`}
        >
          <Trophy size={14} />
          <span>Global Ranking</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('course');
            if (courses.length > 0 && !selectedCourseId) {
              setSelectedCourseId(courses[0].course_id);
            }
          }}
          className={`btn ${activeTab === 'course' ? 'btn-primary' : 'btn-secondary'} leaderboard-tab-btn`}
        >
          <BookOpen size={14} />
          <span>By Course</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('exam');
            if (exams.length > 0 && !selectedExamId) {
              setSelectedExamId(exams[0].exam_id);
            }
          }}
          className={`btn ${activeTab === 'exam' ? 'btn-primary' : 'btn-secondary'} leaderboard-tab-btn`}
        >
          <FileText size={14} />
          <span>By Exam</span>
        </button>
      </div>

      {/* Select Filters depending on active tab */}
      {activeTab === 'course' && (
        <div className="leaderboard-filter-container">
          <label className="form-label">Select Course Track</label>
          <select
            className="form-control"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Choose Course --</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'exam' && (
        <div className="leaderboard-filter-container">
          <label className="form-label">Select Examination</label>
          <select
            className="form-control"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            <option value="">-- Choose Exam --</option>
            {exams.map(e => (
              <option key={e.exam_id} value={e.exam_id}>{e.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Leaderboard Table List */}
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : rankings.length === 0 ? (
        <div className="glass-card leaderboard-empty-card">
          <Award size={48} className="leaderboard-empty-icon" />
          <h3>No rankings recorded yet</h3>
          <p>Be the first to attempt exams to top this scoreboard!</p>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="leaderboard-rank-header">Rank</th>
                  <th>Student Name</th>
                  {activeTab === 'global' ? (
                    <>
                      <th>Completed Exams</th>
                      <th>Avg Percentage Score</th>
                    </>
                  ) : (
                    <>
                      <th>Obtained Score</th>
                      <th>Percentage Marks</th>
                      <th>Finished Time</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentRankings.map((student, index) => {
                  const rank = indexOfFirstItem + index + 1;
                  const scorePercentage = activeTab === 'global' ? student.avg_percentage : student.percentage;
                  
                  let medalColor = '';
                  if (rank === 1) medalColor = '#ffd700'; // Gold
                  if (rank === 2) medalColor = '#c0c0c0'; // Silver
                  if (rank === 3) medalColor = '#cd7f32'; // Bronze

                  return (
                    <tr key={student.user_id || index}>
                      <td>
                        {rank <= 3 ? (
                          <div 
                            className="leaderboard-medal-cell"
                            style={{ border: `1px solid ${medalColor}`, color: medalColor }}
                          >
                            {rank}
                          </div>
                        ) : (
                          <span className="leaderboard-rank-cell">{rank}</span>
                        )}
                      </td>
                      <td>
                        <div className="leaderboard-student-profile">
                          <img 
                            src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user_name || 'Student'}`}
                            alt={student.user_name}
                            className="leaderboard-student-avatar"
                          />
                          <span className="leaderboard-student-name">{student.user_name}</span>
                        </div>
                      </td>
                      {activeTab === 'global' ? (
                        <>
                          <td>{student.completed_exams} exams</td>
                          <td className="leaderboard-score-cell">{scorePercentage}%</td>
                        </>
                      ) : (
                        <>
                          <td>{student.score}/{student.total_marks}</td>
                          <td className="leaderboard-score-cell">{scorePercentage}%</td>
                          <td>{new Date(student.submitted_at).toLocaleDateString()}</td>
                        </>
                      )}
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
        </div>
      )}
    </div>
  );
}

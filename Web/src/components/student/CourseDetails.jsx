import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  BookOpen, Clock, Award, FileText, ArrowLeft, Play, 
  AlertCircle, ChevronDown, ChevronUp, Lock, CheckCircle2, 
  Video, MessageSquare, Plus, Check, Star
} from 'lucide-react';
import './CourseDetails.css';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  // Player States (Enrolled Mode)
  const [syllabus, setSyllabus] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'notes' | 'qna'
  
  // Accordion Toggle States
  const [expandedSections, setExpandedSections] = useState({});

  // Notes State
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);

  // Q&A State
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, author: 'Saurabh Kumar', date: '2 days ago', question: 'How is this course syllabus aligned with standard exams?', replies: 1 },
    { id: 2, author: 'Pooja Sharma', date: '5 days ago', question: 'Are there negative markings in the practice quiz?', replies: 0 }
  ]);

  // Load initial notes from localStorage
  useEffect(() => {
    if (course) {
      const storedNotes = localStorage.getItem(`abhyas_notes_${id}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        setNotes([
          { id: 1, timestamp: 'Lecture 1 (02:15)', content: 'Focus on primary keys and relational schema constraints.' },
          { id: 2, timestamp: 'General', content: 'Complete all section quizzes to qualify for final certifications.' }
        ]);
      }
      
      const storedCompletions = localStorage.getItem(`abhyas_completed_${id}`);
      if (storedCompletions) {
        setCompletedItems(new Set(JSON.parse(storedCompletions)));
      }
    }
  }, [course, id]);

  // Fetch Details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [courseRes, examsRes, myCoursesRes] = await Promise.all([
        api.courses.getDetails(id),
        api.exams.getAll('', id),
        api.courses.getMy()
      ]);

      if (courseRes.success) setCourse(courseRes.data);
      if (examsRes.success) setExams(examsRes.data || []);
      
      if (myCoursesRes.success) {
        const enrolledList = myCoursesRes.data || [];
        const enrolled = enrolledList.some(c => String(c.course_id) === String(id));
        setIsEnrolled(enrolled);
      }
    } catch (err) {
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Generate dynamic syllabus when course and exams load
  useEffect(() => {
    if (course) {
      let finalSyllabus = [];

      if (course.curriculum && course.curriculum.length > 0) {
        finalSyllabus = course.curriculum.map((section, sIdx) => ({
          ...section,
          items: (section.items || []).map(item => {
            const itemId = item.type === 'exam' ? `exam-${item.exam_id}` : String(item.curriculum_item_id);
            return {
              ...item,
              id: itemId,
              title: item.title,
              type: item.type,
              duration: item.duration || (item.type === 'exam' && item.examData ? `${item.examData.duration_minutes} min` : ''),
              videoUrl: item.video_url || item.videoUrl,
              notes: item.notes,
              examData: item.type === 'exam' ? item.examData : null
            };
          })
        }));
      } else {
        const dbExams = exams.map((exam, idx) => ({
          id: `exam-${exam.exam_id}`,
          title: `${exam.title}`,
          type: 'exam',
          duration: `${exam.duration_minutes} min`,
          examData: exam
        }));

        finalSyllabus = [
          {
            title: 'Section 1: Course Overview & Fundamentals',
            items: [
              { 
                id: 'sec1-1', 
                title: '1. Welcome & Course Roadmap', 
                type: 'video', 
                duration: '04:12', 
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                notes: 'Welcome! In this lesson we lay out the foundations of the course, discuss the target assessments, and structure of study materials.'
              },
              { 
                id: 'sec1-2', 
                title: '2. Foundational Architecture Guide', 
                type: 'article', 
                duration: '10 min read',
                notes: 'Detailed study resources about core concepts. Review this text outline carefully to prepare for the Section 1 checkpoints.'
              }
            ]
          },
          {
            title: 'Section 2: Deep Dive & Core Operations',
            items: [
              { 
                id: 'sec2-1', 
                title: '3. Core Operations & Performance Factors', 
                type: 'video', 
                duration: '08:45', 
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                notes: 'An in-depth explanation covering logical operations, structures, constraints, and execution flows.'
              },
              { 
                id: 'sec2-2', 
                title: '4. Optimization & Best Practices', 
                type: 'video', 
                duration: '11:20', 
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                notes: 'Learn query optimization strategies, index mechanisms, structural constraints, and how to avoid performance blockers.'
              }
            ]
          },
          {
            title: 'Section 3: Assessments & Practice Quizzes',
            items: dbExams.length > 0 ? dbExams : [
              { 
                id: 'no-exams', 
                title: 'No assessments available yet', 
                type: 'info', 
                duration: 'N/A' 
              }
            ]
          }
        ];
      }

      setSyllabus(finalSyllabus);

      // Default expand all sections
      const defaultExpanded = {};
      finalSyllabus.forEach((_, idx) => {
        defaultExpanded[idx] = true;
      });
      setExpandedSections(defaultExpanded);

      // Set first item as active
      if (finalSyllabus[0] && finalSyllabus[0].items[0]) {
        setActiveItem(finalSyllabus[0].items[0]);
      }
    }
  }, [course, exams]);

  // Handle Enrollment
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const res = await api.courses.enroll(id);
      if (res.success) {
        setIsEnrolled(true);
        // Refresh details to ensure myCourses state is updated in frontend
        await fetchDetails();
      } else {
        alert(res.message || 'Failed to enroll in course');
      }
    } catch (err) {
      alert(err.message || 'Error enrolling in course');
    } finally {
      setEnrolling(false);
    }
  };

  // Start Assessment
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

  // Accordion Toggle
  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle Lecture Complete
  const toggleItemComplete = (itemId, e) => {
    if (e) e.stopPropagation();
    const updated = new Set(completedItems);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setCompletedItems(updated);
    localStorage.setItem(`abhyas_completed_${id}`, JSON.stringify(Array.from(updated)));
  };

  // Add Note
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    let timestamp = 'General';
    if (activeItem && activeItem.type === 'video') {
      timestamp = `Lecture: ${activeItem.title.split('.')[0]}`;
    }

    const note = {
      id: Date.now(),
      timestamp,
      content: newNote.trim()
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    setNewNote('');
    localStorage.setItem(`abhyas_notes_${id}`, JSON.stringify(updatedNotes));
  };

  // Delete Note
  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`abhyas_notes_${id}`, JSON.stringify(updatedNotes));
  };

  // Post Question
  const handlePostQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const question = {
      id: Date.now(),
      author: 'Student User (You)',
      date: 'Just now',
      question: newQuestion.trim(),
      replies: 0
    };

    setQuestions([question, ...questions]);
    setNewQuestion('');
  };

  // Calculate Progress Percentage
  const getProgressPercentage = () => {
    const totalLectures = syllabus.reduce((acc, sec) => {
      const lectures = sec.items.filter(item => item.type === 'video' || item.type === 'article');
      return acc + lectures.length;
    }, 0);
    
    if (totalLectures === 0) return 0;
    
    const completedLectures = Array.from(completedItems).filter(itemId => !itemId.startsWith('exam-')).length;
    return Math.min(Math.round((completedLectures / totalLectures) * 100), 100);
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !course) {
    return (
      <div className="course-details-error-container">
        <AlertCircle size={48} className="course-details-error-icon" />
        <ErrorMessage message={error || 'Course not found'} className="course-details-error-message" />
        <div>
          <Link to="/courses" className="btn btn-secondary">Back to Catalogue</Link>
        </div>
      </div>
    );
  }

  // --- UNENROLLED COURSE VIEW (Udemy Landing Page) ---
  const renderUnenrolledLandingPage = () => {
    return (
      <div className="abhyas-landing">
        
        {/* Back Link */}
        <div className="course-details-back-link-wrapper">
          <Link to="/courses" className="course-details-back-link">
            <ArrowLeft size={16} />
            <span>Back to Course Catalogue</span>
          </Link>
        </div>

        {/* Hero Banner Section */}
        <div className="landing-hero">
          <div className="hero-content">
            <span className="category-badge">{course.category_name}</span>
            <h1>{course.title}</h1>
            <p className="hero-description">{course.description || 'Develop deep expertise with our comprehensive learning track structured with professional assessments.'}</p>
            
            <div className="hero-meta">
              <div className="meta-item rating">
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span className="rating-num">4.8</span>
                <span className="rating-stars">(142 ratings)</span>
              </div>
              <div className="meta-item">
                <span>1,248 students enrolled</span>
              </div>
              <div className="meta-item">
                <span>Last updated: June 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-body">
          {/* Syllabus Outline Column */}
          <div className="syllabus-main-col">
            <div className="what-you-will-learn">
              <h3>What you'll learn</h3>
              <div className="learning-grid">
                <div className="learning-item">
                  <Check size={16} color="var(--success)" />
                  <span>Understand core design principles and syntax constraints.</span>
                </div>
                <div className="learning-item">
                  <Check size={16} color="var(--success)" />
                  <span>Build complete assessments with optimized performance.</span>
                </div>
                <div className="learning-item">
                  <Check size={16} color="var(--success)" />
                  <span>Master practical applications with professional tests.</span>
                </div>
                <div className="learning-item">
                  <Check size={16} color="var(--success)" />
                  <span>Acquire high-demand technical capabilities.</span>
                </div>
              </div>
            </div>

            <div className="course-curriculum-container">
              <h2>Course Content</h2>
              <div className="curriculum-summary">
                <span>{syllabus.length} sections • {syllabus.reduce((acc, sec) => acc + sec.items.length, 0)} lectures • {course.duration || 'Self-paced'} total length</span>
              </div>

              {/* Accordion list */}
              <div className="accordion-list">
                {syllabus.map((section, idx) => (
                  <div key={idx} className="accordion-section">
                    <div className="accordion-header" onClick={() => toggleSection(idx)}>
                      <div className="header-left">
                        {expandedSections[idx] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        <span>{section.title}</span>
                      </div>
                      <div className="header-right">
                        <span>{section.items.length} items</span>
                      </div>
                    </div>

                    {expandedSections[idx] && (
                      <div className="accordion-content">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="accordion-item-row">
                            <div className="item-row-left">
                              {(item.type === 'video' || item.type === 'article') ? <FileText size={16} className="course-details-item-icon-text" /> : <Award size={16} className="course-details-item-icon-success" />}
                              <span>{item.title}</span>
                            </div>
                            <div className="item-row-right">
                              {item.type === 'exam' ? (
                                <span className="badge badge-success course-details-quiz-badge">Quiz</span>
                              ) : (
                                <Lock size={13} className="course-details-lock-icon" />
                              )}
                              <span className="item-duration">{item.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Checkout Sidebar */}
          <div className="sidebar-checkout-col">
            <div className="checkout-card glass-card">
              <div className="checkout-img-container">
                <img 
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400'} 
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400';
                  }}
                />
                <div className="img-overlay">
                  <Play size={44} fill="#fff" color="#fff" />
                  <span>Preview Course</span>
                </div>
              </div>

              <div className="checkout-pricing">
                <span className="price-tag">Free</span>
                <span className="original-price">₹1,999</span>
                <span className="discount-percent">100% OFF</span>
              </div>

              <button 
                onClick={handleEnroll} 
                className="btn btn-checkout-enroll"
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>

              <span className="guarantee-text">Full access to all video lectures & quizzes.</span>

              <div className="course-includes">
                <h4>This course includes:</h4>
                <ul>
                  <li>• Dynamic video learning clips</li>
                  <li>• Comprehensive study guides</li>
                  <li>• Interactive assessments & quizzes</li>
                  <li>• Free certificate of completion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- ENROLLED COURSE VIEW (Udemy Course Player) ---
  const renderEnrolledCoursePlayer = () => {
    const isCompleted = activeItem ? completedItems.has(activeItem.id) : false;
    const progress = getProgressPercentage();

    return (
      <div className="udemy-player">

        {/* Player Topbar */}
        <div className="player-topbar">
          <div className="topbar-left">
            <Link to="/my-courses" className="back-btn">
              <ArrowLeft size={16} />
            </Link>
            <div className="topbar-title-block">
              <h3>{course.title}</h3>
              <span className="category-tag">{course.category_name}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="progress-container-block">
              <div className="progress-text-row">
                <span>Course Progress</span>
                <strong>{progress}% Complete</strong>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dual-Pane Player Grid */}
        <div className="player-grid">
          
          {/* Left Area: content display */}
          <div className="main-content-pane">
            
            {/* Screen Player */}
            {(activeItem?.type === 'article' || activeItem?.type === 'video') && (
              <div className="article-reader-pane">
                <div className="article-header-block">
                  <span className="reading-time">{activeItem.duration}</span>
                  <h2>{activeItem.title}</h2>
                </div>
                <div className="article-body-text course-details-article-body">
                  {activeItem.notes || (
                    <>
                      <p>Welcome to the theoretical study guide of the <strong>{course.title}</strong> module. This guide focuses on core architectural design patterns, schema construction, and execution paradigms.</p>
                      
                      <h3>1. Conceptual Architecture</h3>
                      <p>In standard system designs, we construct abstractions to optimize execution speeds. High-performing database designs rely heavily on structured indexes and localized schemas that group relevant rows sequentially. A well-designed schema minimizes logical scans and disk seeks during high-throughput queries.</p>
                      
                      <blockquote>
                        "System constraints are not limitations; they are structural contracts that guarantee data integrity and validation at scale."
                      </blockquote>

                      <h3>2. Best Practices</h3>
                      <ul>
                        <li>Ensure complete normalization up to Third Normal Form (3NF) to eliminate data redundancy.</li>
                        <li>Use compound indexes strategically on fields frequently queried together.</li>
                        <li>Incorporate transaction rollbacks to prevent inconsistent states.</li>
                      </ul>

                      <p>Review these concepts carefully. Once you have completed the readings, you will be fully prepared to proceed with the assigned exams and practice assessments listed in the final section.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeItem?.type === 'exam' && (
              <div className="exam-start-pane course-details-exam-pane">
                <div className="exam-card-center">
                  <Award size={48} className="exam-icon-accent" />
                  <h2>{activeItem.title}</h2>
                  <p>This assessment is registered in the database. Starting the test will consume one of your allowed attempts.</p>
                  
                  <div className="exam-stats-strip">
                    <div className="e-stat">
                      <span>Duration</span>
                      <strong>{activeItem.examData?.duration_minutes} Mins</strong>
                    </div>
                    <div className="e-stat">
                      <span>Attempts Allowed</span>
                      <strong>{activeItem.examData?.max_attempts || 1}</strong>
                    </div>
                    <div className="e-stat">
                      <span>Total Marks</span>
                      <strong>{activeItem.examData?.total_marks} Marks</strong>
                    </div>
                    <div className="e-stat">
                      <span>Passing Marks</span>
                      <strong>{activeItem.examData?.passing_marks} Marks</strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '14px 0 16px' }}>
                    <span>⚠️</span> Once started, this assessment cannot be paused. It will auto-submit on expiry.
                  </p>

                  <button 
                    onClick={() => handleStartExam(activeItem.examData.exam_id)}
                    className="btn btn-start-assessment"
                    disabled={startingId === activeItem.examData.exam_id}
                  >
                    {startingId === activeItem.examData.exam_id ? 'Consuming Attempt...' : 'Start Assessment Now'}
                  </button>
                </div>
              </div>
            )}

            {/* Complete bar under video/article */}
            {activeItem && activeItem.type !== 'exam' && (
              <div className="completion-action-bar">
                <button 
                  onClick={() => toggleItemComplete(activeItem.id)}
                  className={`btn btn-complete-toggle ${isCompleted ? 'completed' : ''}`}
                >
                  {isCompleted ? <CheckCircle2 size={16} fill="var(--success)" color="#fff" /> : <div className="circle-placeholder"></div>}
                  <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
                </button>
              </div>
            )}

            {/* Lecture Tabs (Overview, Notes, Q&A) */}
            <div className="lecture-tabs-container">
              <div className="tabs-header-row">
                <button 
                  className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveTab('about')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes ({notes.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'qna' ? 'active' : ''}`}
                  onClick={() => setActiveTab('qna')}
                >
                  Q&A Discussion
                </button>
              </div>

              <div className="tabs-content-body">
                {activeTab === 'about' && (
                  <div className="tab-about">
                    <h4>About this Lesson</h4>
                    <p className="course-details-lesson-description">{activeItem?.notes || 'This lecture covers crucial segments of the curriculum, aligning directly with upcoming exam objectives. Take detailed notes and review execution queries to solidify your memory.'}</p>
                    
                    <h4 className="course-details-desc-header">Course Description</h4>
                    <p className="course-details-description-text">{course.description}</p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="tab-notes">
                    <form onSubmit={handleAddNote} className="note-form">
                      <input 
                        type="text" 
                        placeholder="Add a new note for this lesson..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="form-control"
                      />
                      <button type="submit" className="btn btn-primary btn-add-note">
                        <Plus size={16} /> Add Note
                      </button>
                    </form>

                    <div className="notes-list course-details-notes-list">
                      {notes.length === 0 ? (
                        <p className="empty-text">No notes added yet. Save notes to review later!</p>
                      ) : (
                        notes.map(note => (
                          <div key={note.id} className="note-item-card">
                            <div className="note-meta-row">
                              <span className="note-timestamp">{note.timestamp}</span>
                              <button onClick={() => handleDeleteNote(note.id)} className="delete-note-btn">Delete</button>
                            </div>
                            <p className="note-content">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'qna' && (
                  <div className="tab-qna">
                    <form onSubmit={handlePostQuestion} className="qna-form">
                      <div className="course-details-qna-form-row">
                        <input 
                          type="text" 
                          placeholder="Ask a question about this course..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="form-control course-details-qna-input"
                        />
                        <button type="submit" className="btn btn-primary">Post</button>
                      </div>
                    </form>

                    <div className="qna-list course-details-qna-list">
                      {questions.map(q => (
                        <div key={q.id} className="qna-card">
                          <div className="qna-user-row">
                            <strong>{q.author}</strong>
                            <span className="qna-date">• {q.date}</span>
                          </div>
                          <p className="qna-question-text">{q.question}</p>
                          <div className="qna-action-row">
                            <MessageSquare size={13} />
                            <span>{q.replies} replies</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Area: Sidebar curriculum */}
          <div className="curriculum-sidebar">
            <h4 className="curriculum-title">Course Curriculum</h4>
            
            <div className="sidebar-sections-wrapper">
              {syllabus.map((section, idx) => (
                <div key={idx} className="sidebar-section-block">
                  <div className="section-block-header" onClick={() => toggleSection(idx)}>
                    <div className="course-details-curriculum-header-left">
                      {expandedSections[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span className="sec-title-text">{section.title}</span>
                    </div>
                  </div>

                  {expandedSections[idx] && (
                    <div className="section-block-items">
                      {section.items.map((item, itemIdx) => {
                        const active = activeItem?.id === item.id;
                        const itemDone = completedItems.has(item.id);

                        return (
                          <div 
                            key={itemIdx} 
                            onClick={() => item.type !== 'info' && setActiveItem(item)}
                            className={`sidebar-item-row ${active ? 'active' : ''} ${item.type === 'info' ? 'disabled' : ''}`}
                          >
                            <div className="item-left-side">
                              {item.type !== 'exam' && item.type !== 'info' ? (
                                <div 
                                  onClick={(e) => toggleItemComplete(item.id, e)}
                                  className="item-check-wrapper"
                                >
                                  {itemDone ? (
                                    <CheckCircle2 size={16} fill="var(--success)" color="#fff" />
                                  ) : (
                                    <div className="item-checkbox-circle"></div>
                                  )}
                                </div>
                              ) : (
                                <div className="course-details-width-spacer"></div>
                              )}

                              <div className="item-details-text">
                                <span className="item-title">{item.title}</span>
                                <div className="item-meta-info">
                                  {(item.type === 'video' || item.type === 'article') && <FileText size={11} className="course-details-margin-right-sm" />}
                                  {item.type === 'exam' && <Award size={11} className="course-details-margin-right-success" />}
                                  <span>{item.duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return isEnrolled ? renderEnrolledCoursePlayer() : renderUnenrolledLandingPage();
}

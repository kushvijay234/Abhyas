import React, { useState, useEffect, useRef } from 'react';
import './AiTutor.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  Mic,
  Trash2,
  Bookmark,
  BookOpen,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  HelpCircle,
  Plus,
  Search,
  MoreVertical,
  Volume2,
  FileText,
  Languages,
  BookMarked,
  X,
  Menu,
  ChevronRight,
  TrendingUp,
  Brain,
  Map,
  Edit2,
  Info,
  Check,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const getCourseThumb = (title) => {
  if (!title) return 'CO';
  return title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

export default function AiTutor() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active workspace layouts
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Today's goals status
  const [goals, setGoals] = useState([]);

  // Bookmarked Notes
  const [bookmarks, setBookmarks] = useState([]);

  // Course Enrollment Status (Mock)
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Mobile drawer views
  const [mobileActivePanel, setMobileActivePanel] = useState('chat'); // 'history', 'chat', 'insights'
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);



  // Chat message databases
  const [conversations, setConversations] = useState({});

  // Dynamic statistics states
  const [stats, setStats] = useState(null);
  const [recentPerformance, setRecentPerformance] = useState([]);
  const [recommendedCoursesList, setRecommendedCoursesList] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceActive(true);
        setInputVal("Listening... speak now.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsVoiceActive(false);
        setInputVal("");
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch initial data (chats, goals, bookmarks, enrolled courses, stats, recommendations)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Goals
        const goalsRes = await api.tutor.getGoals();
        if (goalsRes.success) setGoals(goalsRes.data);

        // Bookmarks
        const bookmarksRes = await api.tutor.getBookmarks();
        if (bookmarksRes.success) setBookmarks(bookmarksRes.data);

        // Enrolled Courses
        const myCoursesRes = await api.courses.getMy();
        let enrolled = [];
        if (myCoursesRes.success) {
          enrolled = myCoursesRes.data.map(c => c.title);
          setEnrolledCourses(enrolled);
        }

        // Stats & Course Progress
        const statsRes = await api.dashboard.getSummary();
        if (statsRes.success) {
          setStats(statsRes.data);
          setCourseProgress(statsRes.data.course_progress || []);
        }

        // Recent Performance
        const perfRes = await api.dashboard.getPerformance();
        if (perfRes.success) {
          setRecentPerformance(perfRes.data || []);
        }

        // Recommendations
        const coursesRes = await api.courses.getAll();
        if (coursesRes.success) {
          const unenrolled = coursesRes.data.filter(c => !enrolled.includes(c.title));
          setRecommendedCoursesList(unenrolled.slice(0, 3));
        }

        // Chats
        const chatsRes = await api.tutor.getChats();
        if (chatsRes.success) {
          const chatMap = {};
          for (const c of chatsRes.data) {
            chatMap[c.chat_id] = {
              id: c.chat_id,
              title: c.title,
              category: c.category,
              messages: []
            };
          }
          setConversations(chatMap);

          if (chatsRes.data.length > 0) {
            // Find first chat id
            setActiveChatId(chatsRes.data[0].chat_id);
          }
        }
      } catch (err) {
        console.error("Failed to load initial tutor data:", err);
      }
    };

    loadInitialData();
  }, []);

  // Fetch messages dynamically when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        const res = await api.tutor.getMessages(activeChatId);
        if (res.success) {
          setConversations(prev => ({
            ...prev,
            [activeChatId]: {
              ...prev[activeChatId],
              messages: res.data
            }
          }));
        }
      } catch (err) {
        console.error("Failed to fetch messages for active chat:", err);
      }
    };

    loadMessages();
  }, [activeChatId]);

  // Calculate Progress Ring based on goals checked
  const checkedGoalsCount = goals.filter(g => g.checked).length;
  const progressPercentage = goals.length > 0 ? Math.round((checkedGoalsCount / goals.length) * 100) : 0;

  // Stroke calculation for SVG Progress Ring
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Search Filter in History
  const filteredChatHistory = (category) => {
    return Object.values(conversations).filter(chat => {
      const matchesCategory = chat.category === category;
      const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  // Toggle checklist goal
  const handleToggleGoal = async (id) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const nextVal = !goal.checked;
    
    setGoals(prev => prev.map(g => g.id === id ? { ...g, checked: nextVal } : g));
    try {
      await api.tutor.toggleGoal(id, nextVal);
    } catch (err) {
      console.error("Failed to toggle goal state on backend:", err);
    }
  };

  // Select chat handler
  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setSelectedQuizOption(null);
    setQuizScore(null);
    setIsLeftDrawerOpen(false);
  };

  // Create new chat
  const handleCreateNewChat = async () => {
    try {
      const res = await api.tutor.createChat("New Conversation", "today");
      if (res.success) {
        const c = res.data;
        setConversations(prev => ({
          ...prev,
          [c.chat_id]: {
            id: c.chat_id,
            title: c.title,
            category: c.category,
            messages: []
          }
        }));
        setActiveChatId(c.chat_id);
        setIsLeftDrawerOpen(false);
      }
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  // Delete chat
  const handleDeleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      await api.tutor.deleteChat(id);
      const updated = { ...conversations };
      delete updated[id];
      setConversations(updated);
      if (activeChatId === id) {
        const keys = Object.keys(updated);
        if (keys.length > 0) {
          setActiveChatId(keys[0]);
        } else {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Rename chat title
  const handleRenameChat = async (id, e) => {
    e.stopPropagation();
    const newTitle = prompt('Enter new title for the chat:', conversations[id]?.title || 'New Conversation');
    if (newTitle && newTitle.trim()) {
      try {
        await api.tutor.renameChat(id, newTitle.trim());
        setConversations(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            title: newTitle.trim()
          }
        }));
      } catch (err) {
        console.error("Failed to rename conversation:", err);
      }
    }
  };

  // Sending Message with Dynamic API integration
  const handleSendVal = async (value) => {
    if (!value || !value.trim()) return;

    let targetChatId = activeChatId;
    if (!targetChatId) {
      try {
        const titleText = value.length > 25 ? value.substring(0, 25) + "..." : value;
        const res = await api.tutor.createChat(titleText, "today");
        if (res.success) {
          const c = res.data;
          setConversations(prev => ({
            ...prev,
            [c.chat_id]: {
              id: c.chat_id,
              title: c.title,
              category: c.category,
              messages: []
            }
          }));
          targetChatId = c.chat_id;
          setActiveChatId(c.chat_id);
        } else {
          return;
        }
      } catch (err) {
        console.error("Failed to auto-create chat session:", err);
        return;
      }
    }

    // Immediately push user message locally for responsive UX
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: value
    };

    setConversations(prev => ({
      ...prev,
      [targetChatId]: {
        ...prev[targetChatId],
        messages: [...(prev[targetChatId]?.messages || []), userMsg]
      }
    }));

    setInputVal('');
    setIsTyping(true);

    try {
      const res = await api.tutor.sendMessage(targetChatId, value);
      if (res.success) {
        // Sync full message history (assigns correct DB IDs, structuredData templates, confidence, sources)
        const syncRes = await api.tutor.getMessages(targetChatId);
        if (syncRes.success) {
          setConversations(prev => ({
            ...prev,
            [targetChatId]: {
              ...prev[targetChatId],
              // Automatically adjust the title if the user sent their first message
              title: prev[targetChatId].title === "New Conversation" && value.length > 20
                ? value.substring(0, 20) + "..."
                : (prev[targetChatId].title === "New Conversation" ? value : prev[targetChatId].title),
              messages: syncRes.data
            }
          }));
        }
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Attachments trigger
  const handleAttachmentSelect = (type) => {
    setShowAttachmentMenu(false);
    alert(`File attached successfully: Simulated ${type} uploaded to AI context.`);
    setInputVal(prev => prev + ` [Attached ${type}] `);
  };

  // Speech Input toggle action
  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (!isVoiceActive) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Failed to stop speech recognition:", err);
      }
    }
  };

  // Generate Quiz dynamically from backend
  const handleGenerateQuiz = async () => {
    if (!activeChatId) return;
    setIsTyping(true);
    try {
      const res = await api.tutor.generateQuiz(activeChatId);
      if (res.success) {
        setConversations(prev => ({
          ...prev,
          [activeChatId]: {
            ...prev[activeChatId],
            messages: [...(prev[activeChatId]?.messages || []), res.data]
          }
        }));
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Handle quiz option selection persistently
  const handleQuizAnswer = async (msgId, option, idx) => {
    const isCorrect = !!option.isCorrect;

    // Update conversation local React state
    setConversations(prev => {
      const chat = prev[activeChatId];
      if (!chat) return prev;
      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === msgId) {
              return {
                ...m,
                userAnswer: idx,
                quizScore: isCorrect
              };
            }
            return m;
          })
        }
      };
    });

    // Save persistently to database
    try {
      await api.tutor.submitQuizAnswer(msgId, idx, isCorrect);
    } catch (err) {
      console.error("Failed to post quiz answer:", err);
    }
  };

  // Translate active message content (UI-only mockup translation for display)
  const handleTranslateMessage = (msgId) => {
    setConversations(prev => {
      const updatedMessages = prev[activeChatId].messages.map(m => {
        if (m.id === msgId) {
          const isEn = m.language !== 'hi';
          return {
            ...m,
            language: isEn ? 'hi' : 'en',
            text: isEn 
              ? 'बाइनरी ट्री एक पदानुक्रमित डेटा संरचना है जिसमें प्रत्येक नोड में अधिकतम दो बच्चे होते हैं, जिन्हें बाएं और दाएं बच्चे के रूप में जाना जाता है।' 
              : 'A Binary Tree is a hierarchical data structure in which each node has at most two children, referred to as the left child and the right child.'
          };
        }
        return m;
      });
      return {
        ...prev,
        [activeChatId]: {
          ...prev[activeChatId],
          messages: updatedMessages
        }
      };
    });
  };

  // Course Enrollment trigger linked to actual Courses API
  const handleEnrollCourse = async (courseName) => {
    if (enrolledCourses.includes(courseName)) {
      alert(`You are already enrolled in ${courseName}`);
      return;
    }
    
    try {
      // Find course by title to enroll
      const coursesRes = await api.courses.getAll();
      if (coursesRes.success) {
        const targetCourse = coursesRes.data.find(c => c.title === courseName);
        if (targetCourse) {
          await api.courses.enroll(targetCourse.course_id);
          setEnrolledCourses(prev => [...prev, courseName]);
          setRecommendedCoursesList(prev => prev.filter(c => c.title !== courseName));
          alert(`Successfully enrolled in ${courseName}! Head over to the My Courses tab to access chapters.`);
          return;
        }
      }
      // Fallback local enroll if course not found in db yet
      setEnrolledCourses(prev => [...prev, courseName]);
      setRecommendedCoursesList(prev => prev.filter(c => c.title !== courseName));
      alert(`Enrolled locally in ${courseName}`);
    } catch (err) {
      console.error("Failed to enroll course on backend:", err);
      // Fallback
      setEnrolledCourses(prev => [...prev, courseName]);
      setRecommendedCoursesList(prev => prev.filter(c => c.title !== courseName));
    }
  };

  // Add bookmark on database
  const handleAddBookmark = async (title) => {
    if (bookmarks.some(b => b.title === title)) {
      alert('This topic is already bookmarked.');
      return;
    }
    try {
      const res = await api.tutor.addBookmark(title);
      if (res.success) {
        setBookmarks(prev => [...prev, res.data]);
        alert('Added to bookmarked items!');
      }
    } catch (err) {
      console.error("Failed to bookmark note on database:", err);
    }
  };

  // Delete bookmark from database
  const handleDeleteBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      await api.tutor.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Failed to delete note bookmark:", err);
    }
  };

  // Floating button triggers
  const handleFloatingTrigger = (feature) => {
    let promptVal = "";
    if (feature === 'plan') promptVal = "Generate a customized study plan for my weak topics.";
    if (feature === 'test') promptVal = "Start an AI mock test containing 10 questions on DBMS.";
    if (feature === 'cards') promptVal = "Create flashcards for CPU scheduling algorithms.";
    if (feature === 'roadmap') promptVal = "Give me a structured roadmap for mastering Graph Algorithms.";

    setInputVal(promptVal);
    handleSendVal(promptVal);
  };

  const parseBold = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{color: 'var(--ai-text-primary)'}}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatLatexToPlain = (latex) => {
    if (!latex) return "";
    return latex
      .replace(/\\text\s*\{\s*(.*?)\s*\}/g, '$1')
      .replace(/\\times/g, ' × ')
      .replace(/\\approx/g, ' ≈ ')
      .replace(/\\quad/g, '   ')
      .replace(/\\log_2\((.*?)\)/g, 'log₂($1)')
      .replace(/\\frac\s*\{\s*\\sum\s*\((.*?)\)\s*\}\s*\{\s*(.*?)\s*\}/g, 'Σ($1) / $2')
      .replace(/\\frac\s*\{\s*(.*?)\s*\}\s*\{\s*(.*?)\s*\}/g, '$1 / $2')
      .trim();
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;

    let formulaText = "";
    let textToParse = text;

    // Check if there is a math formula at the end or within the text
    const formulaIndex = text.indexOf('\\text{');
    if (formulaIndex !== -1) {
      textToParse = text.substring(0, formulaIndex).trim();
      formulaText = text.substring(formulaIndex).trim();
    }

    const renderFormula = (formula) => {
      if (!formula) return null;
      return (
        <div className="aitutor-math-formula">
          {formatLatexToPlain(formula)}
        </div>
      );
    };

    if (textToParse.includes('4-Week Study Plan') || textToParse.includes('Week 1:')) {
      const titleRegex = /###\s*📅?\s*Personalized\s*4-Week\s*Study\s*Plan\s*/i;
      const cleanText = textToParse.replace(titleRegex, '').trim();

      const weeks = cleanText.split(/####?\s*\*\*Week/i);
      const introText = weeks[0].trim();

      return (
        <div className="aitutor-study-plan-container" style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px'}}>
          {introText && <p style={{fontSize: '0.82rem', color: 'var(--ai-text-secondary)', lineHeight: '1.4', margin: '4px 0 8px 0'}}>{parseBold(introText)}</p>}
          <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
            {weeks.slice(1).map((weekBlock, idx) => {
              const titleMatch = weekBlock.match(/^\s*(.*?)(?=\s*\*?\s*\*\*Goal:|\s*\*?\s*\*\*Topics:|$)/s);
              let titleLine = titleMatch ? titleMatch[1].trim() : `${idx + 1}`;
              titleLine = titleLine.replace(/\*\*|:/g, '').trim();

              const goalMatch = weekBlock.match(/\*\*Goal:\*\*\s*(.*?)(?=\*\*Topics:|\*\*Action Item:|$)/s);
              const topicsMatch = weekBlock.match(/\*\*Topics:\*\*\s*(.*?)(?=\*\*Goal:|\*\*Action Item:|$)/s);
              const actionMatch = weekBlock.match(/\*\*Action Item:\*\*\s*(.*?)(?=\*\*Goal:|\*\*Topics:|$)/s);

              const goal = goalMatch ? goalMatch[1].trim().replace(/\s*\*\s*$/, '') : '';
              const topics = topicsMatch ? topicsMatch[1].trim().replace(/\s*\*\s*$/, '') : '';
              const action = actionMatch ? actionMatch[1].trim().replace(/\s*\*\s*$/, '') : '';

              return (
                <div key={idx} className="aitutor-study-week-card">
                  <div className="aitutor-study-week-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--ai-border)',
                    paddingBottom: '6px',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--ai-primary)'
                    }}>Week {titleLine}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(37,99,235,0.08)',
                      color: 'var(--ai-primary)',
                      fontWeight: 700
                    }}>Syllabus Goal</span>
                  </div>
                  {goal && (
                    <div style={{fontSize: '0.8rem', lineHeight: '1.35'}}>
                      <strong style={{color: 'var(--ai-text-primary)'}}>Goal: </strong>
                      <span style={{color: 'var(--ai-text-secondary)'}}>{parseBold(goal)}</span>
                    </div>
                  )}
                  {topics && (
                    <div style={{fontSize: '0.8rem', lineHeight: '1.35'}}>
                      <strong style={{color: 'var(--ai-text-primary)'}}>Topics: </strong>
                      <span style={{color: 'var(--ai-text-secondary)'}}>{parseBold(topics)}</span>
                    </div>
                  )}
                  {action && (
                    <div style={{
                      fontSize: '0.78rem',
                      marginTop: '4px',
                      padding: '8px 10px',
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px dashed rgba(245,158,11,0.25)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Award size={13} style={{color: '#F59E0B', flexShrink: 0}} />
                      <span style={{lineHeight: '1.3'}}>
                        <strong style={{color: '#B45309'}}>Action Item: </strong>
                        <span style={{color: '#78350F'}}>{parseBold(action)}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {renderFormula(formulaText)}
        </div>
      );
    }

    // Default formatting logic:
    const lines = textToParse.split('\n');
    return (
      <div>
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h3 key={idx} style={{marginTop: '16px', marginBottom: '8px'}}>{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('#### ')) {
            return <h4 key={idx} style={{marginTop: '12px', marginBottom: '6px'}}>{line.replace('#### ', '')}</h4>;
          }
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const cleanLine = line.replace(/^\s*[\*\-]\s+/, '');
            return (
              <li key={idx} style={{marginLeft: '16px', fontSize: '0.8rem', color: 'var(--ai-text-secondary)', marginBottom: '4px'}}>
                {parseBold(cleanLine)}
              </li>
            );
          }
          return (
            <p key={idx} style={{fontSize: '0.8rem', color: 'var(--ai-text-secondary)', margin: '4px 0'}}>
              {parseBold(line)}
            </p>
          );
        })}
        {renderFormula(formulaText)}
      </div>
    );
  };

  // Render message body with Custom Layout components
  const renderMessageContent = (msg) => {
    if (msg.sender === 'user') {
      return <div className="aitutor-msg-bubble-content">{msg.text}</div>;
    }

    // AI message
    return (
      <div className="aitutor-msg-content-wrapper">
        <div className="aitutor-msg-bubble-content">
          <div className="aitutor-msg-markdown-content">
            {renderFormattedContent(msg.text)}
            
            {msg.structuredData && (
              <div className="aitutor-response-card">
                <div className="aitutor-response-tab-header">
                  <div className="aitutor-response-tab active">Core Explanation</div>
                  {msg.structuredData.tableData && <div className="aitutor-response-tab">Comparison Data</div>}
                  <div className="aitutor-response-tab" onClick={() => handleAddBookmark(msg.structuredData.answer)}>Save Notes</div>
                </div>
                <div className="aitutor-response-tab-content">
                  <h4 style={{marginTop: 0}}>Summary Answer</h4>
                  <p>{msg.structuredData.answer}</p>
                  
                  <h4>Detailed Context</h4>
                  {renderFormattedContent(msg.structuredData.explanation)}
                  
                  {msg.structuredData.formula && (
                    <div className="aitutor-math-formula">
                      {formatLatexToPlain(msg.structuredData.formula)}
                    </div>
                  )}

                  {msg.structuredData.example && (
                    <>
                      <h4>Code Example / Case Study</h4>
                      <div className="aitutor-code-block">
                        <div className="aitutor-code-header">
                          <span>Syntax Code Representation</span>
                          <button 
                            className="aitutor-chat-action-btn" 
                            style={{color: '#94A3B8', fontSize: '0.7rem'}} 
                            onClick={() => alert('Code copied to clipboard!')}
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre>{msg.structuredData.example.replace(/```[a-z]*\n|```/g, '')}</pre>
                      </div>
                    </>
                  )}

                  {msg.structuredData.keyPoints && (
                    <>
                      <h4>Key Points Checklist</h4>
                      <ul>
                        {msg.structuredData.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {msg.structuredData.tableData && (
                    <div style={{overflowX: 'auto'}}>
                      <table>
                        <thead>
                          <tr>
                            {msg.structuredData.tableData.headers.map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.structuredData.tableData.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {msg.structuredData.relatedConcepts && (
                    <div style={{marginTop: '16px'}}>
                      <span style={{fontSize: '0.75rem', fontWeight: 800, color: 'var(--ai-text-secondary)', textTransform: 'uppercase'}}>Related Concepts:</span>
                      <div style={{display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap'}}>
                        {msg.structuredData.relatedConcepts.map((c, i) => (
                          <span 
                            key={i} 
                            onClick={() => handleSendVal(`Explain ${c}`)}
                            style={{fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--ai-background)', color: 'var(--ai-primary)', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--ai-border)'}}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Practice Quiz element inside message if available */}
          {msg.quiz && (
            <div className="aitutor-quiz-container">
              <div className="aitutor-quiz-question">{msg.quiz.question}</div>
              <div className="aitutor-quiz-options">
                {msg.quiz.options.map((opt, idx) => {
                  let optClass = 'aitutor-quiz-option';
                  const isAnswered = msg.userAnswer !== undefined && msg.userAnswer !== null;
                  if (isAnswered) {
                    if (opt.isCorrect) {
                      optClass += ' correct';
                    } else if (msg.userAnswer === idx) {
                      optClass += ' wrong';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      className={optClass}
                      disabled={isAnswered}
                      onClick={() => handleQuizAnswer(msg.id, opt, idx)}
                    >
                      <span style={{fontWeight: 800, marginRight: '8px'}}>{opt.key}.</span> {opt.text}
                    </button>
                  );
                })}
              </div>
              {(msg.userAnswer !== undefined && msg.userAnswer !== null) && (
                <div style={{marginTop: '12px', fontSize: '0.8rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '6px', color: msg.quizScore ? 'var(--ai-success)' : '#EF4444'}}>
                  {msg.quizScore ? (
                    <>
                      <CheckCircle2 size={16} /> Correct! +10 Points added to your Abhyas Profile.
                    </>
                  ) : (
                    <>
                      <Info size={16} /> Completed. Review your conceptual topics.
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Response Metadata Bar */}
          {(msg.confidence || msg.difficulty || msg.studyTime) && (
            <div className="aitutor-response-metadata-bar">
              {msg.confidence && (
                <span className="aitutor-meta-pill confidence">
                  <Check size={12} /> {msg.confidence} Confidence Score
                </span>
              )}
              {msg.difficulty && (
                <span className="aitutor-meta-pill difficulty">
                  <Flame size={12} /> {msg.difficulty} Level
                </span>
              )}
              {msg.studyTime && (
                <span className="aitutor-meta-pill">
                  <Clock size={12} /> Est. Study Time: {msg.studyTime}
                </span>
              )}
              {msg.sources && (
                <span className="aitutor-meta-pill" title={msg.sources.join(', ')}>
                  <BookOpen size={12} /> {msg.sources.length} Verified Sources
                </span>
              )}
            </div>
          )}

          {/* Quick Action bar */}
          {!msg.quiz && (
            <div className="aitutor-quick-actions">
              <button className="aitutor-quick-btn" onClick={() => handleSendVal('Explain this in more detail')}>
                Explain More
              </button>
              <button className="aitutor-quick-btn" onClick={handleGenerateQuiz}>
                Generate Quiz
              </button>
              <button className="aitutor-quick-btn" onClick={() => handleAddBookmark(msg.text || 'AI Explanation Note')}>
                Show Notes
              </button>
              <button className="aitutor-quick-btn" onClick={() => handleFloatingTrigger('cards')}>
                Create Flashcards
              </button>
              <button className="aitutor-quick-btn" onClick={() => handleTranslateMessage(msg.id)}>
                <Languages size={12} /> {msg.language === 'hi' ? 'English' : 'Translate'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Selected chat messages
  const activeChat = conversations[activeChatId] || { messages: [] };
  const currentMessages = activeChat.messages || [];
  return (
    <div className="aitutor-workspace">
      
      {/* 1. LEFT SIDEBAR - CHAT HISTORY & BRAND */}
      <aside className="aitutor-sidebar">
        
        {/* Header */}
        <div className="aitutor-sidebar-header">
          <div className="aitutor-logo">
            <Sparkles size={20} />
          </div>
          <div className="aitutor-brand">
            <span className="aitutor-brand-name">ABHYAS AI</span>
            <span className="aitutor-brand-sub">SaaS Learning Engine</span>
          </div>
        </div>

        {/* New Chat Button */}
        <button className="aitutor-new-chat-btn" onClick={handleCreateNewChat}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Search Input */}
        <div className="aitutor-search-wrapper">
          <Search size={16} className="aitutor-search-icon" />
          <input
            type="text"
            className="aitutor-search-input"
            placeholder="Search conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categorized chat list */}
        <div className="aitutor-history-scroll">
          
          {/* Today */}
          {filteredChatHistory('today').length > 0 && (
            <div className="aitutor-history-section">
              <div className="aitutor-history-title">Today</div>
              {filteredChatHistory('today').map((chat) => (
                <div 
                  key={chat.id} 
                  className={`aitutor-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="aitutor-chat-item-text">
                    <BookOpen size={14} />
                    <span>{chat.title}</span>
                  </div>
                  <div className="aitutor-chat-actions">
                    <button className="aitutor-chat-action-btn" onClick={(e) => handleRenameChat(chat.id, e)} title="Rename">
                      <Edit2 size={12} />
                    </button>
                    <button className="aitutor-chat-action-btn" onClick={(e) => handleDeleteChat(chat.id, e)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yesterday */}
          {filteredChatHistory('yesterday').length > 0 && (
            <div className="aitutor-history-section">
              <div className="aitutor-history-title">Yesterday</div>
              {filteredChatHistory('yesterday').map((chat) => (
                <div 
                  key={chat.id} 
                  className={`aitutor-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="aitutor-chat-item-text">
                    <BookOpen size={14} />
                    <span>{chat.title}</span>
                  </div>
                  <div className="aitutor-chat-actions">
                    <button className="aitutor-chat-action-btn" onClick={(e) => handleRenameChat(chat.id, e)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="aitutor-chat-action-btn" onClick={(e) => handleDeleteChat(chat.id, e)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pinned */}
          {filteredChatHistory('pinned').length > 0 && (
            <div className="aitutor-history-section">
              <div className="aitutor-history-title">Pinned Study Maps</div>
              {filteredChatHistory('pinned').map((chat) => (
                <div 
                  key={chat.id} 
                  className={`aitutor-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="aitutor-chat-item-text">
                    <Award size={14} />
                    <span>{chat.title}</span>
                  </div>
                  <div className="aitutor-chat-actions">
                    <button className="aitutor-chat-action-btn" onClick={(e) => handleDeleteChat(chat.id, e)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </aside>


      {/* 2. CENTER PANEL - CHAT VIEWPORT */}
      <section className="aitutor-chat-container">
        
        {/* Chat header */}
        <div className="aitutor-chat-header">
          <div className="aitutor-header-left">
            <span className="aitutor-header-title">
              {activeChat.title === 'New Conversation' ? 'ABHYAS AI Tutor' : activeChat.title}
              <span className="aitutor-meta-pill confidence" style={{fontSize:'0.65rem', padding:'2px 6px'}}>Online</span>
            </span>
            <span className="aitutor-header-subtitle">Your personalized AI learning assistant</span>
          </div>
          
          <div className="aitutor-header-actions">
            {isSearchingInChat ? (
              <div className="aitutor-search-bar-inline">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search in message..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  autoFocus
                />
                <button className="aitutor-chat-action-btn" style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)'}} onClick={() => {setIsSearchingInChat(false); setChatSearchQuery('');}}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button className="aitutor-header-icon-btn" onClick={() => setIsSearchingInChat(true)} title="Search message content">
                <Search size={16} />
              </button>
            )}
            
            <button 
              className="aitutor-header-icon-btn" 
              onClick={() => setIsRightDrawerOpen(true)} 
              title="View Study Goals & Performance Insights"
            >
              <Award size={18} />
            </button>
          </div>
        </div>

        {/* Messages scrolling container */}
        <div className="aitutor-messages-viewport">
          {currentMessages.length === 0 ? (
            
            /* Empty State / Welcome Area */
            <div className="aitutor-empty-state">
              <div className="aitutor-empty-illustration">
                <Brain size={64} style={{color: 'var(--ai-primary)', opacity: 0.85}} />
              </div>
              <h2 className="aitutor-empty-title">Hello, I'm your AI Tutor</h2>
              <p className="aitutor-empty-subtitle">
                I can explain complex algorithm structures, analyze DBMS normalization states, recommendation course maps, check goals achievement and build practice flashcards.
              </p>
              
              <div className="aitutor-prompts-grid">
                <div className="aitutor-prompt-card" onClick={() => handleSendVal('Explain Binary Search Tree (BST) and average complexity')}>
                  <span className="aitutor-prompt-card-text">Explain Binary Search Tree</span>
                  <span className="aitutor-prompt-card-tag"><Brain size={12} /> Theory</span>
                </div>
                <div className="aitutor-prompt-card" onClick={handleGenerateQuiz}>
                  <span className="aitutor-prompt-card-text">Generate Mock Test for CPU Scheduling</span>
                  <span className="aitutor-prompt-card-tag"><Award size={12} /> Quiz</span>
                </div>
                <div className="aitutor-prompt-card" onClick={() => handleFloatingTrigger('plan')}>
                  <span className="aitutor-prompt-card-text">Create 7-Day Study Plan for Trees & Graphs</span>
                  <span className="aitutor-prompt-card-tag"><Map size={12} /> Planner</span>
                </div>
                <div className="aitutor-prompt-card" onClick={() => handleSendVal('Summarize Transaction ACID properties rules')}>
                  <span className="aitutor-prompt-card-text">Summarize Database ACID principles</span>
                  <span className="aitutor-prompt-card-tag"><FileText size={12} /> Revision</span>
                </div>
                <div className="aitutor-prompt-card" onClick={() => handleSendVal('Explain wrong answer related to FCFS convoy effect')}>
                  <span className="aitutor-prompt-card-text">Explain Convoy Effect wrong answers</span>
                  <span className="aitutor-prompt-card-tag"><HelpCircle size={12} /> Doubts</span>
                </div>
                <div className="aitutor-prompt-card" onClick={() => handleSendVal('Give me practice questions for SQL Joins')}>
                  <span className="aitutor-prompt-card-text">Practice Weak Topics: SQL Joins</span>
                  <span className="aitutor-prompt-card-tag"><TrendingUp size={12} /> Practice</span>
                </div>
              </div>
            </div>
          ) : (
            
            /* Render active conversation messages */
            currentMessages
              .filter(m => !chatSearchQuery || m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()))
              .map((msg) => (
                <div key={msg.id} className={`aitutor-msg-row ${msg.sender}`}>
                  <div className="aitutor-message-bubble">
                    <div className="aitutor-msg-avatar">
                      {msg.sender === 'user' ? 'V' : <Sparkles size={16} />}
                    </div>
                    {renderMessageContent(msg)}
                  </div>
                </div>
              ))
          )}

          {/* Typing Indicator simulator */}
          {isTyping && (
            <div className="aitutor-msg-row ai">
              <div className="aitutor-message-bubble">
                <div className="aitutor-msg-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="aitutor-typing-row">
                  <div className="aitutor-typing-indicator">
                    <div className="aitutor-typing-dot"></div>
                    <div className="aitutor-typing-dot"></div>
                    <div className="aitutor-typing-dot"></div>
                  </div>
                  <span style={{fontSize: '0.78rem', color: 'var(--ai-text-secondary)', fontWeight: 550}}>AI is searching in databases...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        <div className="aitutor-input-box-wrapper">
          <div className="aitutor-input-box">
            


            {/* Main Text Input */}
            <input
              type="text"
              className="aitutor-chat-input"
              placeholder={isVoiceActive ? "Listening to your question..." : "Ask your AI Tutor..."}
              value={inputVal}
              disabled={isVoiceActive}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendVal(inputVal);
              }}
            />

            {/* Mic Simulator */}
            <button 
              className={`aitutor-input-action-btn ${isVoiceActive ? 'active' : ''}`}
              onClick={handleToggleVoice}
              style={isVoiceActive ? {color:'var(--ai-primary)', backgroundColor:'rgba(37,99,235,0.1)'} : {}}
              title="Voice Input dictation"
            >
              <Mic size={18} />
            </button>

            {/* Send Button */}
            <button 
              className="aitutor-send-btn" 
              onClick={() => handleSendVal(inputVal)}
              title="Send Message"
            >
              <Send size={16} />
            </button>

          </div>
        </div>

      </section>




      {/* 4. RESPONSIVE MOBILE TAB BAR BAR TRIGGER */}
      <div className="aitutor-mobile-tabs">
        <button 
          className={`aitutor-mobile-tab-btn ${mobileActivePanel === 'history' ? 'active' : ''}`}
          onClick={() => {setMobileActivePanel('history'); setIsLeftDrawerOpen(true);}}
        >
          <Menu size={20} />
          <span>Chat History</span>
        </button>
        <button 
          className={`aitutor-mobile-tab-btn ${mobileActivePanel === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileActivePanel('chat')}
        >
          <Sparkles size={20} />
          <span>Chat Area</span>
        </button>
        <button 
          className={`aitutor-mobile-tab-btn ${mobileActivePanel === 'insights' ? 'active' : ''}`}
          onClick={() => {setMobileActivePanel('insights'); setIsRightDrawerOpen(true);}}
        >
          <Award size={20} />
          <span>Insights</span>
        </button>
      </div>

      {/* Sliding Drawer left (for Chat History on Mobile) */}
      {isLeftDrawerOpen && (
        <div className="aitutor-drawer-overlay" onClick={() => setIsLeftDrawerOpen(false)}>
          <div className="aitutor-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="aitutor-drawer-header">
              <span className="aitutor-drawer-title">Chat Conversations</span>
              <button className="aitutor-logout-btn" onClick={() => setIsLeftDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="aitutor-drawer-body">
              {/* Sidebar items duplicate in drawer */}
              <button 
                className="aitutor-new-chat-btn" 
                onClick={handleCreateNewChat}
                style={{width: '100%', marginBottom: '16px'}}
              >
                <Plus size={18} /> New Chat
              </button>
              
              <div className="aitutor-search-wrapper" style={{marginBottom: '16px'}}>
                <Search size={16} className="aitutor-search-icon" />
                <input
                  type="text"
                  className="aitutor-search-input"
                  placeholder="Search conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredChatHistory('today').length > 0 && (
                <div className="aitutor-history-section">
                  <div className="aitutor-history-title">Today</div>
                  {filteredChatHistory('today').map((chat) => (
                    <div 
                      key={chat.id} 
                      className={`aitutor-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <span className="aitutor-chat-item-text">
                        <BookOpen size={14} /> {chat.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {filteredChatHistory('yesterday').length > 0 && (
                <div className="aitutor-history-section">
                  <div className="aitutor-history-title">Yesterday</div>
                  {filteredChatHistory('yesterday').map((chat) => (
                    <div 
                      key={chat.id} 
                      className={`aitutor-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <span className="aitutor-chat-item-text">
                        <BookOpen size={14} /> {chat.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sliding Drawer right (for Insights on Mobile) */}
      {isRightDrawerOpen && (
        <div className="aitutor-drawer-overlay" onClick={() => setIsRightDrawerOpen(false)}>
          <div className="aitutor-drawer-content right" onClick={(e) => e.stopPropagation()}>
            <div className="aitutor-drawer-header">
              <span className="aitutor-drawer-title">Student Dashboard Insights</span>
              <button className="aitutor-logout-btn" onClick={() => setIsRightDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="aitutor-drawer-body">
              {/* Stats visual duplication */}
              <div className="aitutor-stat-item" style={{marginBottom: '16px', background: 'var(--ai-background)', borderRadius: 'var(--ai-radius-lg)', border: '1px solid var(--ai-border)'}}>
                <div style={{display:'flex', justifyContent:'space-between', padding:'16px', alignItems:'center'}}>
                  <div>
                    <h4 style={{fontSize: '1.05rem', fontWeight: 800, margin: 0}}>Hello {user?.user_name || 'Student'} 👋</h4>
                    <p style={{fontSize: '0.75rem', color: 'var(--ai-text-secondary)', margin: '4px 0 0 0'}}>
                      Streak: {stats?.streak || 0} Days • Avg Score: {stats?.avg_score || 0}%
                    </p>
                  </div>
                  <div style={{fontWeight: 800, fontSize:'1.35rem', color:'var(--ai-primary)'}}>{progressPercentage}%</div>
                </div>
              </div>

              {/* Goals checklist */}
              <div className="aitutor-goals" style={{marginBottom: '20px'}}>
                <div className="aitutor-card-title">
                  <span>Today's Study Goals</span>
                  <span>{checkedGoalsCount}/{goals.length}</span>
                </div>
                {goals.map((g) => (
                  <div key={g.id} className="aitutor-goal-item" onClick={() => handleToggleGoal(g.id)}>
                    <div className={`aitutor-checkbox ${g.checked ? 'checked' : ''}`}>
                      {g.checked && <Check size={12} />}
                    </div>
                    <span className={`aitutor-goal-text ${g.checked ? 'checked' : ''}`}>{g.text}</span>
                  </div>
                ))}
              </div>

              {/* Weak Subjects / Course progress */}
              <div className="aitutor-weak-subjects" style={{marginBottom: '20px'}}>
                <div className="aitutor-card-title">
                  <span>Course Progress & Mastery</span>
                </div>
                {courseProgress.length === 0 ? (
                  <p style={{fontSize: '0.78rem', color: 'var(--ai-text-secondary)', padding: '8px 0'}}>No course progress available.</p>
                ) : (
                  courseProgress.slice(0, 3).map((course, idx) => {
                    const mastery = course.total_exams > 0 ? Math.round((course.completed_exams / course.total_exams) * 100) : 0;
                    let barColor = 'linear-gradient(90deg, #EF4444, #F59E0B)';
                    return (
                      <div key={course.course_id || idx} className="aitutor-subject-bar-row" style={{marginBottom: '8px'}}>
                        <div className="aitutor-subject-meta" style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700}}>
                          <span>{course.course_title}</span>
                          <span>{mastery}% Mastery</span>
                        </div>
                        <div className="aitutor-bar-outer" style={{height: '8px', backgroundColor: 'var(--ai-background)', borderRadius: '4px', overflow: 'hidden'}}>
                          <div className="aitutor-bar-inner" style={{width: `${mastery}%`, height: '100%', background: barColor, borderRadius: '4px'}}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Recommendations */}
              <div className="aitutor-recs" style={{marginBottom: '20px'}}>
                <div className="aitutor-card-title">Recommended Courses</div>
                {recommendedCoursesList.length === 0 ? (
                  <p style={{fontSize: '0.78rem', color: 'var(--ai-text-secondary)', padding: '8px 0'}}>No recommendations available.</p>
                ) : (
                  recommendedCoursesList.map((course, idx) => (
                    <div key={course.course_id || idx} className="aitutor-course-card" style={{display: 'flex', gap: '12px', padding: '10px', borderRadius: 'var(--ai-radius-md)', border: '1px solid var(--ai-border)', marginBottom: '10px'}}>
                      <div className="aitutor-course-thumb" style={{width: '40px', height: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ai-accent-gradient)', color: 'white', fontWeight: 800}}>{getCourseThumb(course.title)}</div>
                      <div className="aitutor-course-info" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                        <span className="aitutor-course-name" style={{fontSize:'0.75rem', fontWeight: 700}}>{course.title}</span>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px'}}>
                          <span style={{fontSize:'0.65rem', color:'var(--ai-text-secondary)'}}>{course.duration || '8 hrs'} • {course.category_name || 'General'}</span>
                          <button 
                            className="aitutor-course-enroll" 
                            style={{background: 'none', border: 'none', color: 'var(--ai-primary)', fontSize: '0.7rem', fontWeight: 850, cursor: 'pointer', padding: 0}}
                            onClick={() => handleEnrollCourse(course.title)}
                          >
                            Enroll
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

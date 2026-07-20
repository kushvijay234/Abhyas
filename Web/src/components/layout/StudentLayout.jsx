import { useState, useEffect, useRef } from 'react';
import './Layout.css';
import './StudentLayout.css';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import abhyasLogo from '../../assets/abhyaslogo.png';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  LogOut,
  Bell,
  Trash2,
  Check,
  UserCheck,
  History,
  Menu,
  X,
  Search,
  ChevronDown,
  BookMarked,
  ClipboardList
} from 'lucide-react';


export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('abhyas_sidebar_collapsed') === 'true';
  });

  const navigate = useNavigate();
  const notifRef = useRef(null);

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('abhyas_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.notifications.getAll();
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount((response.data || []).filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle outside notification click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.notifications.delete(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`layout-shell ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="btn btn-secondary mobile-toggle-btn"
        id="mobile-toggle-btn"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src={abhyasLogo}
            alt="Abhyas Logo"
            className="logo-img student-logo-img"
          />
          {!collapsed && (
            <div className="logo-text">
              <div className="brand">Abhyas</div>
              <div className="tagline">Your Abhyas, Your Success</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard" onClick={() => setMobileMenuOpen(false)}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Browse Courses" onClick={() => setMobileMenuOpen(false)}>
            <BookOpen size={18} />
            <span>Browse Courses</span>
          </NavLink>
          <NavLink to="/my-courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="My Courses" onClick={() => setMobileMenuOpen(false)}>
            <BookMarked size={18} />
            <span>My Courses</span>
          </NavLink>
          <NavLink to="/my-exams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="My Exams" onClick={() => setMobileMenuOpen(false)}>
            <ClipboardList size={18} />
            <span>My Exams</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Exam History" onClick={() => setMobileMenuOpen(false)}>
            <History size={18} />
            <span>Exam History</span>
          </NavLink>

          <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Leaderboard" onClick={() => setMobileMenuOpen(false)}>
            <Award size={18} />
            <span>Leaderboard</span>
          </NavLink>

          <div className="nav-divider"></div>

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="My Profile" onClick={() => setMobileMenuOpen(false)}>
            <User size={18} />
            <span>My Profile</span>
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider"></div>
              <Link to="/admin" className="nav-item student-admin-panel-link" title="Admin Panel">
                <UserCheck size={18} />
                <span>Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-settings">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="btn"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header">
          {/* Collapse/Expand Sidebar Trigger Button */}
          <button
            onClick={toggleSidebar}
            className="icon-btn sidebar-toggle student-sidebar-toggle-btn"
            title={collapsed ? "Expand Side Menu" : "Collapse Side Menu"}
          >
            <Menu size={18} />
          </button>

          {/* Search bar in header */}
          <div className="search-bar">
            <Search size={16} className="student-search-icon" />
            <input type="text" placeholder="Search exams, courses, topics..." />
          </div>

          <div className="student-header-right-container">
            {/* Notification Bell */}
            <div className="student-notif-container" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="icon-btn"
              >
                <Bell size={18} />
                {unreadCount > 0 && <div className="notif-dot"></div>}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="student-notif-header">
                    <span className="student-notif-header-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="btn btn-secondary student-notif-mark-read-btn">
                        <Check size={12} />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                  <div className="student-notif-scroll">
                    {notifications.length === 0 ? (
                      <div className="student-notif-empty">
                        No new updates.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.notification_id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                          <div className="student-notif-item-content">
                            <div className="student-notif-item-header">
                              <span className={n.is_read ? "student-notif-title-read" : "student-notif-title-unread"}>
                                {n.title}
                              </span>
                              <span className="student-notif-date">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="student-notif-message">
                              {n.message}
                            </p>
                            <div className="student-notif-actions">
                              {!n.is_read && (
                                <button onClick={() => handleMarkRead(n.notification_id)} className="student-notif-btn-mark">
                                  Mark as Read
                                </button>
                              )}
                              <button onClick={() => handleDeleteNotif(n.notification_id)} className="student-notif-btn-delete">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Greeting dropdown button */}
            <div className="user-btn">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.user_name || 'User'}`}
                alt="Avatar"
                className="student-avatar"
              />
              <div className="user-name">{user?.user_name}</div>
              <ChevronDown size={11} className="chevron" />
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

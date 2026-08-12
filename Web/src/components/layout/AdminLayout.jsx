import { useState, useEffect } from 'react';
import './Layout.css';
import './AdminLayout.css';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import abhyasLogo from '../../assets/abhyaslogo.png';
import {
  ShieldAlert,
  Users,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  BarChart3,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  ChevronDown,
  Grid,
  ClipboardList
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('abhyas_sidebar_collapsed') === 'true';
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard'); // Kick out if not admin
    }
  }, [user, navigate]);

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('abhyas_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout-shell ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="btn btn-secondary mobile-admin-toggle"
        id="mobile-admin-toggle"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src={abhyasLogo}
            alt="Abhyas Logo"
            className="logo-img admin-logo-img"
          />
          {!collapsed && (
            <div className="logo-text">
              <div className="brand admin-brand-danger">Abhyas</div>
              <div className="tagline admin-tagline-muted">Admin Panel</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Admin Dashboard" onClick={() => setMobileMenuOpen(false)}>
            <ShieldAlert size={17} />
            <span>Admin Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="User Manager" onClick={() => setMobileMenuOpen(false)}>
            <Users size={17} />
            <span>User Manager</span>
          </NavLink>
          <NavLink to="/admin/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Course Manager" onClick={() => setMobileMenuOpen(false)}>
            <BookOpen size={17} />
            <span>Course Manager</span>
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Category Manager" onClick={() => setMobileMenuOpen(false)}>
            <Grid size={17} />
            <span>Category Manager</span>
          </NavLink>
          <NavLink to="/admin/exams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Course Exam Manager" onClick={() => setMobileMenuOpen(false)}>
            <FileSpreadsheet size={17} />
            <span>Course Exam Manager</span>
          </NavLink>
          <NavLink to="/admin/tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Test Manager" onClick={() => setMobileMenuOpen(false)}>
            <ClipboardList size={17} />
            <span>Test Manager</span>
          </NavLink>
          <NavLink to="/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Question Pool" onClick={() => setMobileMenuOpen(false)}>
            <HelpCircle size={17} />
            <span>Question Pool</span>
          </NavLink>
          <NavLink to="/admin/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Results & Analytics" onClick={() => setMobileMenuOpen(false)}>
            <BarChart3 size={17} />
            <span>Results & Analytics</span>
          </NavLink>

          <div className="nav-divider"></div>

          <Link to="/dashboard" className="nav-item admin-student-view-link" title="Student View">
            <ArrowLeft size={17} />
            <span>Student View</span>
          </Link>
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
          <div className="admin-header-left">
            <button
              onClick={toggleSidebar}
              className="icon-btn sidebar-toggle admin-sidebar-toggle-btn"
              title={collapsed ? "Expand Side Menu" : "Collapse Side Menu"}
            >
              <Menu size={18} />
            </button>
            <h2 className="admin-console-title">
              Administration Console
            </h2>
          </div>

          <div className="admin-header-right">
            <div className="badge badge-danger admin-secure-badge">
              SECURE SESSION
            </div>

            {/* Profile Greeting dropdown button */}
            <div className="user-btn">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_name || 'Admin'}`} 
                alt="Avatar" 
                className="admin-avatar"
              />
              <div className="user-name">{user?.user_name}</div>
              <ChevronDown size={11} className="chevron" />
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="page-container admin-page-container">
          <div className="admin-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

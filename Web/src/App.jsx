import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import StudentLayout from "./components/layout/StudentLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';

// Student Pages
const StudentDashboard = lazy(()=>import('./components/student/Dashboard'));
const CourseBrowser = lazy(()=>import('./components/student/CourseBrowser'));
const CourseDetails = lazy(()=>import('./components/student/CourseDetails'));
const ExamConsole = lazy(()=>import('./components/student/ExamConsole'));
const ExamResultView = lazy(()=>import('./components/student/ExamResultView'));
const HistoryView = lazy(()=>import('./components/student/HistoryView'));
const LeaderboardView = lazy(()=>import('./components/student/LeaderboardView'));
const ProfileView = lazy(()=>import('./components/student/ProfileView'));
const MyExams = lazy(()=>import('./components/student/MyExams'));
const AiTutor = lazy(()=>import('./components/student/AiTutor'));

// Admin Pages
const AdminDashboardView = lazy(()=>import('./components/admin/AdminDashboardView'));
const UserManage = lazy(()=>import('./components/admin/UserManage'));
const CourseManage = lazy(()=>import('./components/admin/CourseManage'));
const CategoryManage = lazy(()=>import('./components/admin/CategoryManage'));
const ExamManage = lazy(()=>import('./components/admin/ExamManage'));
const QuestionManage = lazy(()=>import('./components/admin/QuestionManage'));
const ResultAnalytics = lazy(()=>import('./components/admin/ResultAnalytics'));

// Route Guards
function RequireAuth({ children, allowedRole }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    if (user.role !== allowedRole) {
      if (allowedRole === "admin") {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}

function PublicOnly({ children }) {
  const { user, token } = useAuth();

  if (token && user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnly>
                  <Register />
                </PublicOnly>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicOnly>
                  <ResetPassword />
                </PublicOnly>
              }
            />

            {/* Student Private Routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <StudentLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="ai-tutor" element={<AiTutor />} />
              <Route path="courses" element={<CourseBrowser />} />
              <Route
                path="my-courses"
                element={<CourseBrowser onlyEnrolled={true} />}
              />
              <Route path="exams" element={<MyExams />} />
              <Route path="my-exams" element={<MyExams />} />
              <Route path="courses/:id" element={<CourseDetails />} />
              <Route path="exam/:attemptId" element={<ExamConsole />} />
              <Route path="results/:attemptId" element={<ExamResultView />} />
              <Route path="history" element={<HistoryView />} />

              <Route path="leaderboard" element={<LeaderboardView />} />
              <Route path="profile" element={<ProfileView />} />
            </Route>

            {/* Admin Private Routes */}
            <Route
              path="/admin"
              element={
                <RequireAuth allowedRole="admin">
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboardView />} />
              <Route path="users" element={<UserManage />} />
              <Route path="courses" element={<CourseManage />} />
              <Route path="categories" element={<CategoryManage />} />
              <Route path="exams" element={<ExamManage isTestOnly={false} />} />
              <Route path="tests" element={<ExamManage isTestOnly={true} />} />
              <Route path="questions" element={<QuestionManage />} />
              <Route path="results" element={<ResultAnalytics />} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

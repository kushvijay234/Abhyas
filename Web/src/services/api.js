import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('abhyas_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors and clean up responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('abhyas_token');
      localStorage.removeItem('abhyas_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?expired=true';
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Authentication & Profile
  auth: {
    login: async (email, password) => {
      return axiosInstance.post('/users/login', { email, password });
    },
    register: async (username, email, password, role = 'student') => {
      return axiosInstance.post('/users/register', { user_name: username, email, password, role });
    },
    forgotPassword: async (email) => {
      return axiosInstance.post('/users/forgot-password', { email });
    },
    resetPassword: async (email, otp, newPassword) => {
      return axiosInstance.put('/users/reset-password', { email, otp, password: newPassword });
    },
    getProfile: async () => {
      return axiosInstance.get('/users/profile');
    },
    updateProfile: async (data) => {
      return axiosInstance.put('/users/profile', data);
    },
    changePassword: async (currentPassword, newPassword) => {
      return axiosInstance.put('/users/profile/change-password', { currentPassword, newPassword });
    },
    deleteAccount: async () => {
      return axiosInstance.delete('/users/profile');
    },
    getBadges: async () => {
      return axiosInstance.get('/users/badges');
    },
  },

  // Courses
  courses: {
    getAll: async (search = '', categoryId = '') => {
      return axiosInstance.get(`/users/courses?search=${encodeURIComponent(search)}&category_id=${categoryId}`);
    },
    getCategories: async () => {
      return axiosInstance.get('/users/courses/categories');
    },
    getMy: async () => {
      return axiosInstance.get('/users/courses/my');
    },
    getDetails: async (id) => {
      return axiosInstance.get(`/users/courses/${id}`);
    },
    enroll: async (id) => {
      return axiosInstance.post(`/users/courses/${id}/enroll`);
    },
  },

  // Exams & Attempts
  exams: {
    getAll: async (search = '', courseId = '') => {
      return axiosInstance.get(`/users/exams?search=${encodeURIComponent(search)}&course_id=${courseId}`);
    },
    getHistory: async () => {
      return axiosInstance.get('/users/exams/history');
    },
    startAttempt: async (examId) => {
      return axiosInstance.post(`/users/exams/${examId}/start`);
    },
    getQuestions: async (examId) => {
      return axiosInstance.get(`/users/questions?exam_id=${examId}`);
    },
    saveAnswer: async (attemptId, questionId, selectedOption) => {
      return axiosInstance.post('/users/questions/answer', { attempt_id: attemptId, question_id: questionId, selected_option: selectedOption });
    },
    markReview: async (attemptId, questionId, isMarked) => {
      return axiosInstance.post('/users/questions/review', { attempt_id: attemptId, question_id: questionId, is_marked: isMarked });
    },
    getAnswerStatus: async (attemptId) => {
      return axiosInstance.get(`/users/questions/${attemptId}/status`);
    },
    submitAttempt: async (attemptId, answers) => {
      return axiosInstance.post(`/users/exams/${attemptId}/submit`, { answers });
    },
    viewResult: async (attemptId) => {
      return axiosInstance.get(`/users/exams/${attemptId}/result`);
    },
  },

  // Results & Analytics
  results: {
    getMyResults: async () => {
      return axiosInstance.get('/users/results');
    },
    getAnalytics: async () => {
      return axiosInstance.get('/users/results/analytics');
    },
    getById: async (attemptId) => {
      return axiosInstance.get(`/users/results/${attemptId}`);
    },
    getAnswerReview: async (attemptId) => {
      return axiosInstance.get(`/users/results/${attemptId}/review`);
    },
  },

  // Student Dashboard
  dashboard: {
    getSummary: async () => {
      return axiosInstance.get('/users/dashboard/summary');
    },
    getPerformance: async () => {
      return axiosInstance.get('/users/dashboard/performance');
    },
    getRecentExams: async () => {
      return axiosInstance.get('/users/dashboard/recent-exams');
    },
    getUpcomingExams: async () => {
      return axiosInstance.get('/users/dashboard/upcoming-exams');
    },
  },

  // Leaderboard
  leaderboard: {
    getGlobal: async (limit = 10) => {
      return axiosInstance.get(`/users/leaderboard/global?limit=${limit}`);
    },
    getByExam: async (examId, limit = 10) => {
      return axiosInstance.get(`/users/leaderboard/exam/${examId}?limit=${limit}`);
    },
    getByCourse: async (courseId, limit = 10) => {
      return axiosInstance.get(`/users/leaderboard/course/${courseId}?limit=${limit}`);
    },
  },

  // Notifications
  notifications: {
    getAll: async () => {
      return axiosInstance.get('/users/notifications');
    },
    markAllRead: async () => {
      return axiosInstance.patch('/users/notifications/read-all');
    },
    markRead: async (id) => {
      return axiosInstance.patch(`/users/notifications/${id}/read`);
    },
    delete: async (id) => {
      return axiosInstance.delete(`/users/notifications/${id}`);
    },
  },

  // AI Tutor & RAG Endpoints
  tutor: {
    getChats: async () => {
      return axiosInstance.get('/ai/chats');
    },
    createChat: async (title, category) => {
      return axiosInstance.post('/ai/chats', { title, category });
    },
    renameChat: async (id, title) => {
      return axiosInstance.put(`/ai/chats/${id}`, { title });
    },
    deleteChat: async (id) => {
      return axiosInstance.delete(`/ai/chats/${id}`);
    },
    getMessages: async (id) => {
      return axiosInstance.get(`/ai/chats/${id}/messages`);
    },
    sendMessage: async (id, text) => {
      return axiosInstance.post(`/ai/chats/${id}/messages`, { text });
    },
    generateQuiz: async (id) => {
      return axiosInstance.post(`/ai/chats/${id}/quiz`);
    },
    submitQuizAnswer: async (messageId, answerIdx, isCorrect) => {
      return axiosInstance.post(`/ai/messages/${messageId}/answer`, { answerIdx, isCorrect });
    },
    getGoals: async () => {
      return axiosInstance.get('/ai/goals');
    },
    createGoal: async (text) => {
      return axiosInstance.post('/ai/goals', { text });
    },
    toggleGoal: async (id, isChecked) => {
      return axiosInstance.patch(`/ai/goals/${id}`, { isChecked });
    },
    deleteGoal: async (id) => {
      return axiosInstance.delete(`/ai/goals/${id}`);
    },
    getBookmarks: async () => {
      return axiosInstance.get('/ai/bookmarks');
    },
    addBookmark: async (title) => {
      return axiosInstance.post('/ai/bookmarks', { title });
    },
    deleteBookmark: async (id) => {
      return axiosInstance.delete(`/ai/bookmarks/${id}`);
    },
  },

  // Admin Panels
  admin: {
    // User management
    users: {
      getAll: async (search = '', status = '') => {
        return axiosInstance.get(`/admin/users?search=${encodeURIComponent(search)}&status=${status}`);
      },
      getById: async (id) => {
        return axiosInstance.get(`/admin/users/${id}`);
      },
      delete: async (id) => {
        return axiosInstance.delete(`/admin/users/${id}`);
      },
      updateStatus: async (id, status) => {
        return axiosInstance.patch(`/admin/users/${id}/status`, { status });
      },
      getBadges: async (id) => {
        return axiosInstance.get(`/users/badges/admin/${id}`);
      },
      awardBadge: async (id, badgeType) => {
        return axiosInstance.post(`/users/badges/admin/${id}`, { badge_type: badgeType });
      },
      revokeBadge: async (id, badgeType) => {
        return axiosInstance.delete(`/users/badges/admin/${id}/${badgeType}`);
      },
    },
    // Course management
    courses: {
      create: async (data) => {
        return axiosInstance.post('/admin/courses', data);
      },
      getAll: async () => {
        return axiosInstance.get('/admin/courses');
      },
      getById: async (id) => {
        return axiosInstance.get(`/admin/courses/${id}`);
      },
      update: async (id, data) => {
        return axiosInstance.put(`/admin/courses/${id}`, data);
      },
      delete: async (id) => {
        return axiosInstance.delete(`/admin/courses/${id}`);
      },
      assignCategory: async (id, categoryId) => {
        return axiosInstance.put(`/admin/courses/${id}/categories`, { category_id: categoryId });
      },
      getCurriculum: async (id) => {
        return axiosInstance.get(`/admin/courses/${id}/curriculum`);
      },
      saveCurriculum: async (id, sections) => {
        return axiosInstance.put(`/admin/courses/${id}/curriculum`, { sections });
      },
    },
    // Category management
    categories: {
      getAll: async () => {
        return axiosInstance.get('/admin/categories');
      },
      create: async (name) => {
        return axiosInstance.post('/admin/categories', { name });
      },
      update: async (id, name) => {
        return axiosInstance.put(`/admin/categories/${id}`, { name });
      },
      delete: async (id) => {
        return axiosInstance.delete(`/admin/categories/${id}`);
      },
    },
    // Exam management
    exams: {
      create: async (data) => {
        return axiosInstance.post('/admin/exams', data);
      },
      getAll: async (search = '', isPublished = '', isIndependent = '') => {
        return axiosInstance.get(`/admin/exams?search=${encodeURIComponent(search)}&is_published=${isPublished}&is_independent=${isIndependent}`);
      },
      getById: async (id) => {
        return axiosInstance.get(`/admin/exams/${id}`);
      },
      update: async (id, data) => {
        return axiosInstance.put(`/admin/exams/${id}`, data);
      },
      delete: async (id) => {
        return axiosInstance.delete(`/admin/exams/${id}`);
      },
      togglePublish: async (id) => {
        return axiosInstance.patch(`/admin/exams/${id}/publish`);
      },
      setSettings: async (id, settings) => {
        return axiosInstance.put(`/admin/exams/${id}/settings`, settings);
      },
    },
    // Question management
    questions: {
      add: async (data) => {
        return axiosInstance.post('/admin/questions', data);
      },
      bulkUpload: async (questions) => {
        return axiosInstance.post('/admin/questions/bulk', { questions });
      },
      assignToExam: async (examId, questionIds) => {
        return axiosInstance.post('/admin/questions/assign', { exam_id: examId, question_ids: questionIds });
      },
      update: async (id, data) => {
        return axiosInstance.put(`/admin/questions/${id}`, data);
      },
      delete: async (id) => {
        return axiosInstance.delete(`/admin/questions/${id}`);
      },
    },
    // Dashboard summary
    dashboard: {
      getSummary: async () => {
        return axiosInstance.get('/admin/dashboard');
      },
    },
    // Results & Analytics
    results: {
      getReport: async (examId = '', userId = '', fromDate = '', toDate = '') => {
        return axiosInstance.get(`/admin/results/report?exam_id=${examId}&user_id=${userId}&from_date=${fromDate}&to_date=${toDate}`);
      },
      exportCSV: async (examId = '', userId = '', fromDate = '', toDate = '') => {
        return axiosInstance.get(`/admin/results/export?format=csv&exam_id=${examId}&user_id=${userId}&from_date=${fromDate}&to_date=${toDate}`, {
          responseType: 'blob',
        });
      }
    }
  },
};

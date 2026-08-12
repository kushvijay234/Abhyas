import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let defaultURL = 'http://10.0.2.2:5000/api'; // Android Emulator default. For iOS, use http://localhost:5000/api. For physical, use host local IP.

const axiosInstance = axios.create({
  baseURL: defaultURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set base URL dynamically
export const setBaseURL = (newURL) => {
  axiosInstance.defaults.baseURL = newURL;
};

// Load base URL from storage
AsyncStorage.getItem('abhyas_api_url').then((url) => {
  if (url) {
    setBaseURL(url);
  }
});

// Request Interceptor: Attach token if available
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('abhyas_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('abhyas_token');
      await AsyncStorage.removeItem('abhyas_user');
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
    resetPassword: async (email, newPassword) => {
      return axiosInstance.put('/users/reset-password', { email, password: newPassword });
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
};

export default axiosInstance;

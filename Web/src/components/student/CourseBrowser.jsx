import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { Search, BookOpen, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import Pagination from '../common/Pagination';
import SearchBar from '../common/SearchBar';
import './CourseBrowser.css';

// Debounce helper: Delays executing the function until after 'delay' ms have elapsed since typing stopped
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Throttle helper: Limits the execution of the function to once every 'limit' ms (for button clicks)
const throttle = (func, limit) => {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export default function CourseBrowser({ onlyEnrolled = false }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const handleEnroll = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.courses.enroll(courseId);
      if (res.success) {
        navigate('/my-courses');
      } else {
        alert(res.message || 'Failed to enroll in course');
      }
    } catch (err) {
      alert(err.message || 'Error enrolling in course');
    } finally {
      setLoading(false);
    }
  };

  // Separate metadata loading (categories and enrolled list) from course listings
  const loadMetadata = async () => {
    try {
      if (onlyEnrolled) setLoading(true);
      setError('');
      const [categoriesRes, myCoursesRes] = await Promise.all([
        api.courses.getCategories(),
        api.courses.getMy()
      ]);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (myCoursesRes.success) setMyCourses(myCoursesRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load course metadata');
    } finally {
      if (onlyEnrolled) setLoading(false);
    }
  };

  // Main fetch function for the catalogue courses
  const fetchCourses = async (searchTerm, categoryId) => {
    try {
      setLoading(true);
      setError('');
      setCurrentPage(1);
      const res = await api.courses.getAll(searchTerm, categoryId);
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Debounced course fetch to limit API calls while typing in search box
  const debouncedFetchCourses = useCallback(
    debounce((searchTerm, categoryId) => {
      fetchCourses(searchTerm, categoryId);
    }, 450),
    []
  );

  // Throttled handler for category switching to prevent rapid button clicks
  const throttledSetCategory = useCallback(
    throttle((catId) => {
      setSelectedCategory(catId);
    }, 600),
    []
  );

  // Reset page, category, and search text when switching between "All" and "Enrolled" tabs
  useEffect(() => {
    setSearch('');
    setSelectedCategory('');
    setCurrentPage(1);
    loadMetadata();
  }, [onlyEnrolled]);

  // Refetch courses immediately (no typing delay) when the category changes
  useEffect(() => {
    if (!onlyEnrolled) {
      fetchCourses(search, selectedCategory);
    }
  }, [selectedCategory, onlyEnrolled]);

  // Form submit handles immediate search on Enter or click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!onlyEnrolled) {
      fetchCourses(search, selectedCategory);
    }
  };

  const isEnrolled = (courseId) => {
    return myCourses.some(c => c.course_id === courseId);
  };

  const getFilteredCourses = () => {
    if (onlyEnrolled) {
      return myCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
                              (course.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === '' || String(course.category_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
      });
    }
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const indexOfLastCourse = currentPage * itemsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - itemsPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  return (
    <div>
      <div className="course-header-row">
        <div>
          <h1 className="display-title course-header-title">
            {onlyEnrolled ? 'My Enrolled Courses' : 'Course Catalogue'}
          </h1>
          <p className="course-header-subtitle">
            {onlyEnrolled ? 'View and launch assessments in your enrolled courses.' : 'Browse available tracks, view syllabus, and enroll in assessments.'}
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder="Search courses..."
          value={search}
          onSubmit={handleSearchSubmit}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (!onlyEnrolled) {
              debouncedFetchCourses(val, selectedCategory);
            }
          }}
        />

      </div>

      {/* Category Tabs */}
      <div className="course-category-scroll">
        <button
          onClick={() => throttledSetCategory('')}
          className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'} course-category-btn`}
        >
          All Subjects
        </button>
        {categories.map(cat => (
          <button
            key={cat.category_id}
            onClick={() => throttledSetCategory(cat.category_id)}
            className={`btn ${selectedCategory === cat.category_id ? 'btn-primary' : 'btn-secondary'} course-category-btn`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : filteredCourses.length === 0 ? (
        <div className="glass-card course-empty-card">
          <BookOpen size={48} className="course-empty-icon" />
          <h3>No courses found</h3>
          <p>Try refining your search terms or choosing another category.</p>
        </div>
      ) : (
        <div>
          <div className="grid-cols-4">
            {currentCourses.map(course => (
              <div 
                key={course.course_id} 
                className="glass-card course-card" 
                onClick={() => navigate(`/courses/${course.course_id}`)}
              >
                {/* Thumbnail */}
                <div className="course-card-img-wrapper">
                  <img 
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400'} 
                    alt={course.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400';
                    }}
                    className="course-card-img"
                  />
                  {isEnrolled(course.course_id) && (
                    <span className="badge course-badge-enrolled">
                      <CheckCircle size={11} /> Enrolled
                    </span>
                  )}
                  <span className="badge course-badge-category">
                    {course.category_name}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="course-card-body">
                  <h3 className="course-card-title">
                    {course.title}
                  </h3>
                  <p className="course-card-desc">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="course-card-footer">
                    <div className="course-card-meta">
                      <span className="course-card-meta-item">
                        <Clock size={13} /> {course.duration || 'N/A'}
                      </span>
                    </div>

                    {isEnrolled(course.course_id) ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.course_id}`);
                        }}
                        className="btn course-card-btn-view"
                      >
                        View Course
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course.course_id);
                        }}
                        className="btn course-card-btn-enroll"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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

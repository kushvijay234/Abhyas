import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { BookOpen, Clock, CheckCircle } from 'lucide-react-native';

export default function CourseBrowserScreen({ navigation, route }) {
  // Check if screen is for enrolled courses only
  const onlyEnrolled = route?.params?.onlyEnrolled || false;

  const [viewMode, setViewMode] = useState(onlyEnrolled ? 'enrolled' : 'catalogue'); // 'catalogue' or 'enrolled'
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async (searchTerm = '', catId = '') => {
    try {
      setError('');
      const [coursesRes, catRes, myRes] = await Promise.all([
        api.courses.getAll(searchTerm, catId),
        api.courses.getCategories(),
        api.courses.getMy()
      ]);

      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      if (myRes.success) setMyCourses(myRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch courses catalogue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setViewMode(onlyEnrolled ? 'enrolled' : 'catalogue');
    loadData();
  }, [onlyEnrolled]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(search, selectedCategory);
  };

  const handleEnroll = async (courseId, title) => {
    try {
      setLoading(true);
      const res = await api.courses.enroll(courseId);
      if (res.success) {
        Alert.alert('Success', `Successfully enrolled in "${title}"!`);
        loadData(search, selectedCategory);
      } else {
        Alert.alert('Error', res.message || 'Enrollment failed.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error occurred during enrollment.');
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId) => {
    return myCourses.some(c => c.course_id === courseId);
  };

  const getFilteredCourses = () => {
    const listToFilter = viewMode === 'enrolled' ? myCourses : courses;
    return listToFilter.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
                            (course.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === '' || String(course.category_id) === String(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  };

  const filteredCourses = getFilteredCourses();
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const displayedCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchSubmit = () => {
    loadData(search, selectedCategory);
    setCurrentPage(1);
  };

  const selectCategoryFilter = (catId) => {
    setSelectedCategory(catId);
    loadData(search, catId);
    setCurrentPage(1);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Courses Catalogue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable list of category filters, search input, and grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={styles.title}>{viewMode === 'enrolled' ? 'My Enrolled Courses' : 'Course Catalogue'}</Text>
        <Text style={styles.subtitle}>
          {viewMode === 'enrolled' 
            ? 'View and launch learning modules in your active courses.' 
            : 'Browse subjects, details, and enroll in syllabus plans.'
          }
        </Text>

        {/* View Mode Toggle Switch */}
        <View style={styles.toggleBar}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'catalogue' ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => setViewMode('catalogue')}
          >
            <Text style={[styles.toggleText, viewMode === 'catalogue' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              All Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'enrolled' ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => setViewMode('enrolled')}
          >
            <Text style={[styles.toggleText, viewMode === 'enrolled' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              My Courses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <SearchBar
          placeholder="Search courses..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
        />

        {/* Categories Tab Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={styles.categoriesInner}>
          <TouchableOpacity
            style={[styles.categoryTab, selectedCategory === '' ? styles.categoryTabActive : styles.categoryTabInactive]}
            onPress={() => selectCategoryFilter('')}
          >
            <Text style={[styles.categoryTabText, selectedCategory === '' ? styles.categoryTabTextActive : styles.categoryTabTextInactive]}>
              All Subjects
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.category_id}
              style={[styles.categoryTab, selectedCategory === cat.category_id ? styles.categoryTabActive : styles.categoryTabInactive]}
              onPress={() => selectCategoryFilter(cat.category_id)}
            >
              <Text style={[styles.categoryTabText, selectedCategory === cat.category_id ? styles.categoryTabTextActive : styles.categoryTabTextInactive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Error message */}
        {error ? (
          <View style={{ backgroundColor: colors.dangerLight, padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        {/* Course items */}
        {displayedCourses.length === 0 ? (
          <View style={styles.emptyCard}>
            <BookOpen size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySub}>Try adjusting your keywords or filtering another subject category.</Text>
          </View>
        ) : (
          displayedCourses.map(course => {
            const enrolled = isEnrolled(course.course_id);
            return (
              <View key={course.course_id} style={styles.courseCard}>
                {/* Thumbnail image placeholder */}
                <Image
                  source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                
                {/* Badges */}
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.badgeText}>{course.category_name}</Text>
                  </View>
                  {enrolled && (
                    <View style={[styles.badge, { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
                      <CheckCircle size={10} color="#ffffff" />
                      <Text style={styles.badgeText}>Enrolled</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.detailsBlock}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDesc} numberOfLines={3}>
                    {course.description || 'No description provided.'}
                  </Text>

                  <View style={styles.footerRow}>
                    <View style={styles.durationBlock}>
                      <Clock size={14} color={colors.textMuted} />
                      <Text style={styles.durationText}>{course.duration || 'N/A'}</Text>
                    </View>

                    {enrolled ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnView]}
                        onPress={() => navigation.navigate('CourseDetails', { id: course.course_id })}
                      >
                        <Text style={styles.actionBtnText}>View Course</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnEnroll]}
                        onPress={() => handleEnroll(course.course_id, course.title)}
                      >
                        <Text style={styles.actionBtnText}>Enroll Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 16,
    textAlign: 'left',
  },
  categoriesRow: {
    marginBottom: 16,
    height: 36,
  },
  categoriesInner: {
    gap: 8,
    paddingRight: 16,
  },
  categoryTab: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#ffffff',
  },
  categoryTabTextInactive: {
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsBlock: {
    padding: 16,
    textAlign: 'left',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,45,107,0.06)',
    paddingTop: 12,
  },
  durationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionBtn: {
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnView: {
    backgroundColor: colors.primary,
  },
  btnEnroll: {
    backgroundColor: colors.warning,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleInactive: {
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  toggleTextInactive: {
    color: colors.primary,
  },
});

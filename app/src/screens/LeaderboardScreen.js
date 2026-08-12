import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import { Trophy, Award, BookOpen, FileText } from 'lucide-react-native';
import Pagination from '../components/Pagination';

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState('global'); // global, course, exam
  const [rankings, setRankings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculations
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rankings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRankings = rankings.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch course and exam configurations on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [coursesRes, examsRes] = await Promise.all([
          api.courses.getAll(),
          api.exams.getAll()
        ]);
        if (coursesRes.success) {
          const cData = coursesRes.data || [];
          setCourses(cData);
          if (cData.length > 0) setSelectedCourseId(cData[0].course_id);
        }
        if (examsRes.success) {
          const eData = examsRes.data || [];
          setExams(eData);
          if (eData.length > 0) setSelectedExamId(eData[0].exam_id);
        }
      } catch (err) {
        console.error('Error loading config list:', err);
      }
    };
    loadConfig();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
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
      Alert.alert('Error', err.message || 'Failed to fetch rankings scoreboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [activeTab, selectedCourseId, selectedExamId]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCourseId, selectedExamId]);

  // Safeguard page boundary limits
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRankings();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Fetching Leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Compete with other student peers globally and check status updates.</Text>

        {/* Tab row */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'global' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('global')}
          >
            <Trophy size={14} color={activeTab === 'global' ? '#ffffff' : colors.primary} />
            <Text style={[styles.tabText, activeTab === 'global' ? styles.tabTextActive : styles.tabTextInactive]}>
              Global
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'course' ? styles.tabActive : styles.tabInactive]}
            onPress={() => {
              setActiveTab('course');
              if (courses.length > 0 && !selectedCourseId) {
                setSelectedCourseId(courses[0].course_id);
              }
            }}
          >
            <BookOpen size={14} color={activeTab === 'course' ? '#ffffff' : colors.primary} />
            <Text style={[styles.tabText, activeTab === 'course' ? styles.tabTextActive : styles.tabTextInactive]}>
              By Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'exam' ? styles.tabActive : styles.tabInactive]}
            onPress={() => {
              setActiveTab('exam');
              if (exams.length > 0 && !selectedExamId) {
                setSelectedExamId(exams[0].exam_id);
              }
            }}
          >
            <FileText size={14} color={activeTab === 'exam' ? '#ffffff' : colors.primary} />
            <Text style={[styles.tabText, activeTab === 'exam' ? styles.tabTextActive : styles.tabTextInactive]}>
              By Exam
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter selectors inside horizontal scroll */}
        {activeTab === 'course' && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Select Course Track:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollInner}>
              {courses.map(c => {
                const isSelected = String(c.course_id) === String(selectedCourseId);
                return (
                  <TouchableOpacity
                    key={c.course_id}
                    style={[styles.filterTab, isSelected ? styles.filterTabActive : styles.filterTabInactive]}
                    onPress={() => setSelectedCourseId(c.course_id)}
                  >
                    <Text style={[styles.filterTabText, isSelected ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {activeTab === 'exam' && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Select Examination:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollInner}>
              {exams.map(e => {
                const isSelected = String(e.exam_id) === String(selectedExamId);
                return (
                  <TouchableOpacity
                    key={e.exam_id}
                    style={[styles.filterTab, isSelected ? styles.filterTabActive : styles.filterTabInactive]}
                    onPress={() => setSelectedExamId(e.exam_id)}
                  >
                    <Text style={[styles.filterTabText, isSelected ? styles.filterTabTextActive : styles.filterTabTextInactive]}>
                      {e.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {currentRankings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Award size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No scoreboard entries</Text>
            <Text style={styles.emptySub}>Attempt exams and quizzes to top this leaderboard log.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.boardCard}>
              {currentRankings.map((student, index) => {
                const rank = indexOfFirstItem + index + 1;
                const isTop3 = rank <= 3;
                
                let medalColor = '';
                if (rank === 1) medalColor = '#ffd700'; // Gold
                if (rank === 2) medalColor = '#c0c0c0'; // Silver
                if (rank === 3) medalColor = '#cd7f32'; // Bronze

                return (
                  <View key={`${student.user_id || ''}-${student.attempt_id || ''}-${index}`} style={styles.rankRow}>
                    {/* Rank identifier */}
                    <View style={styles.rankIndexCol}>
                      {isTop3 ? (
                        <View style={[styles.medalContainer, { borderColor: medalColor }]}>
                          <Text style={[styles.medalText, { color: medalColor }]}>{rank}</Text>
                        </View>
                      ) : (
                        <Text style={styles.normalRankText}>{rank}</Text>
                      )}
                    </View>

                    {/* Student details */}
                    <Image
                      source={{ uri: student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user_name || 'Student'}` }}
                      style={styles.avatar}
                    />

                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                      <Text style={styles.studentName}>{student.user_name}</Text>
                      {activeTab === 'global' ? (
                        <Text style={styles.studentExamsCount}>{student.completed_exams} exams completed</Text>
                      ) : (
                        <Text style={styles.studentExamsCount}>Score: {student.score}/{student.total_marks} · {new Date(student.submitted_at).toLocaleDateString()}</Text>
                      )}
                    </View>

                    {/* Score */}
                    <Text style={styles.scoreText}>
                      {Math.round(activeTab === 'global' ? student.avg_percentage : student.percentage)}%
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </View>
        )}
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactive: {
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
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
  boardCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,107,0.04)',
  },
  rankIndexCol: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  medalContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  medalText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  normalRankText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    paddingLeft: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBright,
  },
  studentExamsCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryHover,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'left',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterScrollInner: {
    gap: 8,
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabInactive: {
    backgroundColor: '#ffffff',
    borderColor: colors.border,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterTabTextInactive: {
    color: colors.primary,
  },
});

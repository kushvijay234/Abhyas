import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { FileText, Clock, Award, CheckCircle2, XCircle } from 'lucide-react-native';

export default function MyExamsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('available');
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const itemsPerPage = 6;

  const loadData = async (searchTerm = '') => {
    try {
      const [examsRes, historyRes] = await Promise.all([
        api.exams.getAll(searchTerm),
        api.exams.getHistory()
      ]);
      if (examsRes.success) setExams(examsRes.data || []);
      if (historyRes.success) setHistory(historyRes.data || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch assessment lists.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(search);
  };

  const handleSearchSubmit = () => {
    loadData(search);
    setCurrentPage(1);
  };

  const handleStartExam = async (examId) => {
    try {
      setStartingId(examId);
      const res = await api.exams.startAttempt(examId);
      if (res.success && res.attempt_id) {
        navigation.navigate('ExamConsole', { attemptId: res.attempt_id });
      } else {
        Alert.alert('Error', res.message || 'Could not start exam attempt.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error starting exam.');
    } finally {
      setStartingId(null);
    }
  };

  const activeExamsCount = exams.length;
  const historyCount = history.length;

  const displayedExams = exams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const displayedHistory = history.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Fetching Exams...</Text>
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
        <Text style={styles.title}>My Exams & Quizzes</Text>
        <Text style={styles.subtitle}>Attempt active exams, review history logs, and unlock AI course suggestions.</Text>

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'available' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' ? styles.tabTextActive : styles.tabTextInactive]}>
              Available ({activeExamsCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'taken' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('taken')}
          >
            <Text style={[styles.tabText, activeTab === 'taken' ? styles.tabTextActive : styles.tabTextInactive]}>
              Attempts ({historyCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available assessments */}
        {activeTab === 'available' ? (
          <View>
            <SearchBar
              placeholder="Search active assessments..."
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
            />

            {displayedExams.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No active exams</Text>
                <Text style={styles.emptySub}>There are no active exam blueprints assigned to your tracks.</Text>
              </View>
            ) : (
              displayedExams.map(exam => (
                <View key={exam.exam_id} style={styles.examItem}>
                  <View style={styles.examHeader}>
                    <Text style={styles.examCourseTag}>{exam.course_title || 'General / Mock'}</Text>
                    <View style={styles.examDurationBlock}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.examDurationText}>{exam.duration_minutes}m</Text>
                    </View>
                  </View>

                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examDesc}>{exam.description || 'No description provided.'}</Text>

                  <View style={styles.examFooter}>
                    <Text style={styles.examMarksText}>
                      Passing: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{exam.passing_marks} / {exam.total_marks}</Text>
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.examStartBtn}
                      onPress={() => handleStartExam(exam.exam_id)}
                      disabled={startingId === exam.exam_id}
                    >
                      <Text style={styles.examStartBtnText}>
                        {startingId === exam.exam_id ? 'Loading...' : 'Start Assessment'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(activeExamsCount / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </View>
        ) : (
          // Attempts tab list
          <View>
            {displayedHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Award size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No history logged</Text>
                <Text style={styles.emptySub}>You have not finished any exam checkpoints yet.</Text>
              </View>
            ) : (
              displayedHistory.map(attempt => {
                const isCompleted = attempt.status === 'completed';
                const isPass = isCompleted && attempt.percentage >= attempt.passing_marks;
                const statusColor = isCompleted ? (isPass ? colors.success : colors.danger) : colors.warning;
                const statusText = isCompleted ? (isPass ? 'Passed' : 'Failed') : 'In Progress';
                
                return (
                  <View key={attempt.attempt_id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyTitle}>{attempt.exam_title}</Text>
                      <View style={[styles.historyBadge, { backgroundColor: statusColor + '15' }]}>
                        <Text style={[styles.historyBadgeText, { color: statusColor }]}>{statusText}</Text>
                      </View>
                    </View>

                    <View style={styles.historyStatsRow}>
                      <Text style={styles.historyStatText}>
                        Score: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{isCompleted ? `${attempt.score}/${attempt.total_marks}` : '-'}</Text>
                      </Text>
                      <Text style={styles.historyStatText}>
                        Efficiency: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{isCompleted ? `${attempt.percentage}%` : '-'}</Text>
                      </Text>
                      <Text style={styles.historyStatText}>
                        Date: <Text style={{ color: colors.primary }}>{new Date(attempt.started_at).toLocaleDateString()}</Text>
                      </Text>
                    </View>

                    {isCompleted ? (
                      <TouchableOpacity
                        style={styles.historyBtnReport}
                        onPress={() => navigation.navigate('ExamResult', { attemptId: attempt.attempt_id })}
                      >
                        <Text style={styles.historyBtnText}>View Report</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.historyBtnResume}
                        onPress={() => navigation.navigate('ExamConsole', { attemptId: attempt.attempt_id })}
                      >
                        <Text style={styles.historyBtnText}>Resume Attempt</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}

            <Pagination
              currentPage={historyPage}
              totalPages={Math.ceil(historyCount / itemsPerPage)}
              onPageChange={setHistoryPage}
            />
          </View>
        )}

        {/* AI Recommendations */}
        <View style={styles.aiRecommendCard}>
          <Text style={styles.aiTextEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCardHeader}>AI Course Suggestion Engine</Text>
            <Text style={styles.aiCardBody}>
              Once you log multiple exam records, our machine-learning model will classify deficits and suggest courses automatically. Attempt quizzes to unlock predictions!
            </Text>
          </View>
        </View>
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
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  examItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    alignItems: 'flex-start',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  examCourseTag: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  examDurationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examDurationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  examTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  examDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 16,
    textAlign: 'left',
  },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,45,107,0.06)',
    paddingTop: 12,
  },
  examMarksText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  examStartBtn: {
    backgroundColor: colors.primary,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  examStartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textBright,
    flex: 1,
    textAlign: 'left',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  historyStatText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  historyBtnReport: {
    borderWidth: 1,
    borderColor: colors.border,
    height: 32,
    borderRadius: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  historyBtnResume: {
    backgroundColor: colors.warning,
    height: 32,
    borderRadius: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  aiRecommendCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderHover,
    borderRadius: 12,
    backgroundColor: 'rgba(26,45,107,0.01)',
    marginTop: 20,
  },
  aiTextEmoji: {
    fontSize: 20,
  },
  aiCardHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  aiCardBody: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    textAlign: 'left',
  },
});

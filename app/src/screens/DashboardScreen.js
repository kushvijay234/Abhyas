import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import colors from '../theme/colors';
import { Calendar, Award, BookOpen, Clock, Activity, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [sumRes, perfRes, recentRes, upcomingRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getPerformance(),
        api.dashboard.getRecentExams(),
        api.dashboard.getUpcomingExams(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (perfRes.success) setPerformance(perfRes.data || []);
      if (recentRes.success) setRecentExams(recentRes.data || []);
      if (upcomingRes.success) setUpcomingExams(upcomingRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard logs.');
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
    loadData();
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const streakCount = summary?.streak || 0;
  const userRank = summary?.rank || 1;
  const totalExams = summary?.total_exams_taken || 0;
  const avgScore = summary?.avg_score ? Math.round(summary.avg_score) : 0;
  const studyHours = summary?.study_hours || 0;

  const progressList = summary?.course_progress || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.username}>{user?.user_name || 'Student'}!</Text>
        <Text style={styles.subtitle}>
          🔥 {streakCount}-day streak  ·  Rank #{userRank}
        </Text>
      </View>

      {/* Metrics Row Grid */}
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Exams Done</Text>
          <Text style={[styles.metricVal, { color: colors.warning }]}>{totalExams}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Score</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>{avgScore}%</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Study Hours</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>{studyHours}h</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Streak</Text>
          <Text style={[styles.metricVal, { color: colors.warning }]}>🔥 {streakCount}</Text>
        </View>
      </View>

      {/* AI Recommendation Promotion Card */}
      <View style={styles.aiCard}>
        <Text style={styles.aiEyebrow}>✨ AI Path Suggestion Preview</Text>
        <Text style={styles.aiTitle}>Custom learning vectors mapping</Text>
        <Text style={styles.aiBody}>
          Complete your scheduled assessments to map your strengths. Our neural agent will predict course deficits and suggest targeted tracks.
        </Text>
      </View>

      {/* Upcoming Exams */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📅 Upcoming Assessments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyExamsTab')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listCard}>
        {upcomingExams.length === 0 ? (
          <Text style={styles.emptyText}>No exams scheduled today. All clear!</Text>
        ) : (
          upcomingExams.slice(0, 3).map((exam, idx) => (
            <View key={exam.exam_id || idx} style={styles.listItem}>
              <View style={styles.listItemIconWrapper}>
                <BookOpen size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemTitle}>{exam.title}</Text>
                <Text style={styles.listItemSub}>{exam.course_name} · {exam.duration_minutes}m</Text>
              </View>
              <TouchableOpacity
                style={styles.listItemBtn}
                onPress={() => navigation.navigate('MyExamsTab')}
              >
                <Text style={styles.listItemBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Recent Activities */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Recent Attempts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
          <Text style={styles.seeAll}>View logs</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listCard}>
        {recentExams.length === 0 ? (
          <Text style={styles.emptyText}>No recent exam attempts recorded yet.</Text>
        ) : (
          recentExams.slice(0, 4).map((attempt, idx) => {
            const isPass = attempt.percentage >= 40;
            const scoreColor = isPass ? colors.success : colors.danger;
            return (
              <View key={attempt.attempt_id || idx} style={styles.listItem}>
                <View style={[styles.statusDot, { backgroundColor: scoreColor }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.listItemTitle}>{attempt.exam_title}</Text>
                  <Text style={styles.listItemSub}>{getRelativeTime(attempt.submitted_at || attempt.started_at)}</Text>
                </View>
                <Text style={[styles.listItemScore, { color: scoreColor }]}>
                  {attempt.status === 'completed' ? `${Math.round(attempt.percentage)}%` : 'In Progress'}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Course Progress */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📈 Subject Progress</Text>
      </View>
      <View style={styles.listCard}>
        {progressList.length === 0 ? (
          <Text style={styles.emptyText}>Enroll in course tracks to trace your subject progress.</Text>
        ) : (
          progressList.slice(0, 4).map((prog, idx) => {
            const total = prog.total_exams || 1;
            const done = prog.completed_exams || 0;
            const pct = Math.round((done / total) * 100);
            return (
              <View key={idx} style={styles.progressRow}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>{prog.course_title}</Text>
                  <Text style={styles.progressPctText}>{pct}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  aiEyebrow: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 4,
  },
  aiBody: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,107,0.06)',
  },
  listItemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 45, 107, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBright,
  },
  listItemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  listItemBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
  },
  listItemBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listItemScore: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressRow: {
    paddingVertical: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textBright,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import Pagination from '../components/Pagination';
import { Award, Clock, CheckCircle2, XCircle } from 'lucide-react-native';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 8;

  const fetchHistory = async () => {
    try {
      const res = await api.exams.getHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch exam history logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const displayedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Fetching History...</Text>
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
        <Text style={styles.title}>Exam History</Text>
        <Text style={styles.subtitle}>Browse and review your past exam attempt results, scores, and efficiency reports.</Text>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Award size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No history logged</Text>
            <Text style={styles.emptySub}>You have not attempted any assessment quizzes yet.</Text>
          </View>
        ) : (
          displayedHistory.map(attempt => {
            const isCompleted = attempt.status === 'completed';
            const isPass = isCompleted && attempt.percentage >= attempt.passing_marks;
            const statusColor = isCompleted ? (isPass ? colors.success : colors.danger) : colors.warning;
            const statusText = isCompleted ? (isPass ? 'Passed' : 'Failed') : 'In Progress';

            return (
              <View key={attempt.attempt_id} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.examTitle}>{attempt.exam_title}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    Obtained: <Text style={styles.detailVal}>{isCompleted ? `${attempt.score}/${attempt.total_marks}` : '-'}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    Efficiency: <Text style={styles.detailVal}>{isCompleted ? `${attempt.percentage}%` : '-'}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    Date: <Text style={styles.detailVal}>{new Date(attempt.started_at).toLocaleDateString()}</Text>
                  </Text>
                </View>

                {isCompleted ? (
                  <TouchableOpacity
                    style={styles.actionBtnReport}
                    onPress={() => navigation.navigate('ExamResult', { attemptId: attempt.attempt_id })}
                  >
                    <Text style={styles.actionBtnTextReport}>View Report</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtnResume}
                    onPress={() => navigation.navigate('ExamConsole', { attemptId: attempt.attempt_id })}
                  >
                    <Text style={styles.actionBtnTextResume}>Resume Attempt</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

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
  historyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textBright,
    flex: 1,
    textAlign: 'left',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  detailText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailVal: {
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnReport: {
    borderWidth: 1,
    borderColor: colors.border,
    height: 32,
    borderRadius: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  actionBtnResume: {
    backgroundColor: colors.warning,
    height: 32,
    borderRadius: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextReport: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  actionBtnTextResume: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});

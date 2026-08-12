import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import { Award, CheckCircle2, XCircle, ChevronLeft, BookOpen, Clock, AlertTriangle } from 'lucide-react-native';

export default function ExamResultScreen({ navigation, route }) {
  const { attemptId } = route.params;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [myCourseIds, setMyCourseIds] = useState(new Set());
  const [enrollingId, setEnrollingId] = useState(null);

  const fetchResultData = async () => {
    try {
      setLoading(true);
      const [res, reviewRes, myCoursesRes] = await Promise.all([
        api.results.getById(attemptId),
        api.results.getAnswerReview(attemptId),
        api.courses.getMy()
      ]);

      if (res.success && res.data) {
        setResult(res.data);
      }

      if (reviewRes.success) {
        setReviewItems(reviewRes.data || []);
      }

      if (myCoursesRes.success) {
        setMyCourseIds(new Set((myCoursesRes.data || []).map(c => String(c.course_id))));
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch result details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId, title) => {
    try {
      setEnrollingId(courseId);
      const res = await api.courses.enroll(courseId);
      if (res.success) {
        Alert.alert('Success', `Successfully enrolled in "${title}"!`);
        setMyCourseIds(prev => {
          const next = new Set(prev);
          next.add(String(courseId));
          return next;
        });
      } else {
        Alert.alert('Error', res.message || 'Enrollment failed.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error occurred during enrollment.');
    } finally {
      setEnrollingId(null);
    }
  };

  useEffect(() => {
    fetchResultData();
  }, [attemptId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Assessment Report...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No result record found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = result.status === 'completed';
  const isPass = isCompleted && result.percentage >= result.passing_marks;
  const statusColor = isCompleted ? (isPass ? colors.success : colors.danger) : colors.warning;
  const statusLabel = isCompleted ? (isPass ? 'PASSED' : 'FAILED') : 'IN PROGRESS';

  // Stats calculation
  const totalQ      = reviewItems.length;
  const answeredQ   = reviewItems.filter(r => r.selected_option).length;
  const correctQ    = reviewItems.filter(r => {
    const selected = (r.selected_option || '').toLowerCase();
    const correct = (r.correct_option || '').toLowerCase();
    return r.is_correct === 1 || (selected && selected === correct);
  }).length;
  const wrongQ      = answeredQ - correctQ;
  const skippedQ    = totalQ - answeredQ;

  return (
    <View style={styles.container}>
      {/* Header toolbar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Result Sheet</Text>
      </View>

      <ScrollView style={styles.contentPane} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Score banner card */}
        <View style={[styles.resultCard, { borderLeftColor: statusColor }]}>
          <View style={styles.resultCardHeader}>
            <Award size={36} color={statusColor} />
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.examTitle}>{result.exam_title || result.examData?.title}</Text>
          
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Obtained Score</Text>
              <Text style={styles.scoreValue}>
                {isCompleted ? `${result.score} / ${result.total_marks}` : '-'}
              </Text>
            </View>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Percentage</Text>
              <Text style={[styles.scoreValue, { color: colors.warning }]}>
                {isCompleted ? `${result.percentage}%` : '-'}
              </Text>
            </View>
          </View>

          <Text style={styles.passingTargetText}>
            Target Passing Score: {result.passing_marks}%
          </Text>

          {isCompleted && (
            <>
              <View style={styles.statsDivider} />
              
              <View style={styles.quickStatsRow}>
                <View style={[styles.statPill, { backgroundColor: colors.successLight }]}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={[styles.statText, { color: colors.success }]}>{correctQ} Correct</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.dangerLight }]}>
                  <XCircle size={12} color={colors.danger} />
                  <Text style={[styles.statText, { color: colors.danger }]}>{wrongQ} Wrong</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.warningLight }]}>
                  <AlertTriangle size={12} color={colors.warning} />
                  <Text style={[styles.statText, { color: colors.warning }]}>{skippedQ} Skipped</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Recommended Courses Section */}
        {result.recommendations && result.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <View style={styles.sectionHeaderRow}>
              <BookOpen size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recommended Courses</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Based on your exam performance, we suggest enrolling in these courses to strengthen your knowledge:
            </Text>

            {result.recommendations.map(course => {
              const enrolled = myCourseIds.has(String(course.course_id));
              const enrolling = enrollingId === course.course_id;

              return (
                <View key={course.course_id} style={styles.recCard}>
                  <View style={styles.recImageWrapper}>
                    <Image
                      source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' }}
                      style={styles.recThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.recBadgeContainer}>
                      <View style={[styles.recBadge, { backgroundColor: colors.warning }]}>
                        <Text style={styles.recBadgeText}>{course.category_name || 'General'}</Text>
                      </View>
                      {course.is_associated && (
                        <View style={[styles.recBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.recBadgeText}>Top Match</Text>
                        </View>
                      )}
                      {enrolled && (
                        <View style={[styles.recBadge, { backgroundColor: colors.success }]}>
                          <Text style={styles.recBadgeText}>Enrolled</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.recDetails}>
                    <Text style={styles.recTitle}>{course.title}</Text>
                    <Text style={styles.recDesc} numberOfLines={2}>
                      {course.description || 'No description provided.'}
                    </Text>

                    {course.recommendation_reason && (
                      <View style={styles.reasonBox}>
                        <Text style={styles.reasonHeader}>Why this recommendation?</Text>
                        <Text style={styles.reasonText}>{course.recommendation_reason}</Text>
                      </View>
                    )}

                    <View style={styles.recFooter}>
                      <View style={styles.recDurationBlock}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={styles.recDurationText}>{course.duration || 'N/A'}</Text>
                      </View>

                      {enrolled ? (
                        <TouchableOpacity
                          style={[styles.recActionBtn, styles.recBtnView]}
                          onPress={() => navigation.navigate('CourseDetails', { id: course.course_id })}
                        >
                          <Text style={styles.recActionBtnText}>View Course</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.recActionBtn, styles.recBtnEnroll]}
                          onPress={() => handleEnroll(course.course_id, course.title)}
                          disabled={enrolling}
                        >
                          <Text style={styles.recActionBtnText}>
                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Answer key header */}
        <Text style={styles.answerKeyTitle}>Question Breakdown & Keys</Text>

        {/* Question breakdown logs */}
        {reviewItems.map((q, idx) => {
          const selected = (q.selected_option || '').toLowerCase();
          const correct = (q.correct_option || '').toLowerCase();
          const isCorrect = q.is_correct === 1 || selected === correct;

          return (
            <View key={q.question_id} style={styles.questionCard}>
              <View style={styles.qHeaderRow}>
                <Text style={styles.qIndexText}>Question {idx + 1}</Text>
                {selected ? (
                  isCorrect ? (
                    <View style={styles.resultIndicator}>
                      <CheckCircle2 size={16} color={colors.success} />
                      <Text style={[styles.resultIndicatorText, { color: colors.success }]}>Correct</Text>
                    </View>
                  ) : (
                    <View style={styles.resultIndicator}>
                      <XCircle size={16} color={colors.danger} />
                      <Text style={[styles.resultIndicatorText, { color: colors.danger }]}>Incorrect</Text>
                    </View>
                  )
                ) : (
                  <Text style={styles.unansweredText}>Unanswered</Text>
                )}
              </View>

              <Text style={styles.qPromptText}>{q.question_text}</Text>

              {/* Options breakdown */}
              {['a', 'b', 'c', 'd'].map(opt => {
                const isSelected = selected === opt;
                const isCorrectOpt = correct === opt;

                let rowBorder = colors.border;
                let rowBg = '#ffffff';

                if (isCorrectOpt) {
                  rowBorder = colors.success;
                  rowBg = colors.successLight;
                } else if (isSelected) {
                  rowBorder = colors.danger;
                  rowBg = colors.dangerLight;
                }

                return (
                  <View key={opt} style={[styles.optRow, { borderColor: rowBorder, backgroundColor: rowBg }]}>
                    <Text style={styles.optLabel}>{opt.toUpperCase()}.</Text>
                    <Text style={styles.optText}>{q[`option_${opt}`]}</Text>
                    {isCorrectOpt && (
                      <Text style={{ fontSize: 10, color: colors.success, fontWeight: '700', marginLeft: 'auto' }}>✓ Correct</Text>
                    )}
                    {isSelected && !isCorrectOpt && (
                      <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700', marginLeft: 'auto' }}>✗ Your Choice</Text>
                    )}
                  </View>
                );
              })}

              {q.explanation && (
                <View style={styles.explanationBlock}>
                  <Text style={styles.explanationTitle}>Explanation Notes:</Text>
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    height: 52,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  contentPane: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'left',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  scoreBox: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  passingTargetText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  answerKeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'left',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  qHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  qIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  unansweredText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: 'bold',
  },
  qPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'left',
  },
  optRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    width: '100%',
    marginBottom: 8,
  },
  optLabel: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 13,
  },
  optText: {
    color: colors.textMain,
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
  },
  explanationBlock: {
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  explanationText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    textAlign: 'left',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(26,45,107,0.06)',
    width: '100%',
    marginVertical: 14,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recommendationsContainer: {
    marginBottom: 28,
    alignItems: 'flex-start',
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 16,
    textAlign: 'left',
  },
  recCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  recImageWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  recThumbnail: {
    height: '100%',
    width: '100%',
  },
  recBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  recDetails: {
    padding: 16,
    alignItems: 'flex-start',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  recDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
    textAlign: 'left',
  },
  reasonBox: {
    backgroundColor: 'rgba(244,121,32,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
    width: '100%',
    alignItems: 'flex-start',
  },
  reasonHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 11,
    color: colors.primary,
    lineHeight: 15,
    textAlign: 'left',
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,45,107,0.06)',
    paddingTop: 12,
  },
  recDurationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recDurationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  recActionBtn: {
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  recBtnView: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recBtnEnroll: {
    backgroundColor: colors.primary,
  },
  recActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

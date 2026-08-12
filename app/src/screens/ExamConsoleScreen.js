import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import { Clock, AlertTriangle, CheckSquare, Bookmark } from 'lucide-react-native';

export default function ExamConsoleScreen({ navigation, route }) {
  const { attemptId } = route.params;

  // States
  const [questions, setQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [reviewList, setReviewList] = useState(new Set());
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  
  const timerRef = useRef(null);
  const answersRef = useRef({});

  // Sync answersRef with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      // Get answer statuses first to set initial selected answers & reviews
      const [statusRes, detailsRes] = await Promise.all([
        api.exams.getAnswerStatus(attemptId),
        api.exams.viewResult(attemptId) // Used to get exam constraints/duration
      ]);

      if (detailsRes.success && detailsRes.data) {
        setExamInfo(detailsRes.data.examData || detailsRes.data);
        
        // Setup initial timer: calculate time elapsed since started_at
        const examObj = detailsRes.data.examData || detailsRes.data;
        const durationSec = examObj.duration_minutes * 60;
        const startedTime = new Date(detailsRes.data.started_at).getTime();
        const nowTime = new Date().getTime();
        const elapsedSec = Math.floor((nowTime - startedTime) / 1000);
        const remaining = Math.max(0, durationSec - elapsedSec);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          Alert.alert('Timeout', 'The exam time has already expired. Submitting now...', [
            { text: 'OK', onPress: () => handleSubmitExamWithAnswers(answersRef.current) }
          ]);
        }
      }

      // Fetch exam questions
      const examId = detailsRes.data.examData?.exam_id || detailsRes.data.exam_id;
      const questionsRes = await api.exams.getQuestions(examId);
      if (questionsRes.success) {
        setQuestions(questionsRes.data || []);
      }

      // Populate saved answers
      if (statusRes.success && statusRes.data) {
        const savedAns = {};
        const savedReviews = new Set();
        statusRes.data.forEach(item => {
          if (item.selected_option) {
            savedAns[item.question_id] = item.selected_option.toLowerCase();
          }
          if (item.is_marked) {
            savedReviews.add(item.question_id);
          }
        });
        setAnswers(savedAns);
        setReviewList(savedReviews);
      }

    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to initialize exam console.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId]);

  // Start timer count down (excl. timeLeft from deps to avoid drift)
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  // Auto-submit triggers when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && !loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      Alert.alert('Timeout', 'Time is up! Submitting exam automatically.', [
        { text: 'OK', onPress: () => handleSubmitExamWithAnswers(answersRef.current) }
      ]);
    }
  }, [timeLeft, loading]);

  const handleSelectOption = async (option) => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;

    const opt = option.toLowerCase();
    
    // Optimistic state update
    const updated = { ...answers, [activeQ.question_id]: opt };
    setAnswers(updated);

    try {
      await api.exams.saveAnswer(attemptId, activeQ.question_id, opt);
    } catch (err) {
      console.warn('Sync failed:', err.message);
    }
  };

  const handleToggleReview = async () => {
    const activeQ = questions[currentIndex];
    if (!activeQ) return;

    const qId = activeQ.question_id;
    const updated = new Set(reviewList);
    let markState = false;

    if (updated.has(qId)) {
      updated.delete(qId);
      markState = false;
    } else {
      updated.add(qId);
      markState = true;
    }
    setReviewList(updated);

    try {
      await api.exams.markReview(attemptId, qId, markState ? 1 : 0);
    } catch (err) {
      console.warn('Review sync failed:', err.message);
    }
  };

  const handleSubmitExam = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    let promptText = 'Are you sure you want to finish and submit your exam attempt?';
    if (unanswered > 0) {
      promptText += ` You have ${unanswered} unanswered question(s).`;
    }
    
    Alert.alert('Submit Exam', promptText, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => handleSubmitExamWithAnswers(answers) }
    ]);
  };

  const handleSubmitExamWithAnswers = async (answersSnapshot) => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Structure answers list as array matching API expectations
      const payload = Object.keys(answersSnapshot).map(qId => ({
        question_id: parseInt(qId),
        selected_option: answersSnapshot[qId]
      }));

      const res = await api.exams.submitAttempt(attemptId, payload);
      if (res.success) {
        Alert.alert('Assessment Submitted', 'Your test was recorded successfully!', [
          { text: 'View Report', onPress: () => navigation.replace('ExamResult', { attemptId }) }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Submission failed.');
      }
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    
    const minStr = mins < 10 ? `0${mins}` : mins;
    const secStr = secs < 10 ? `0${secs}` : secs;

    if (hours > 0) {
      return `${hours}:${minStr}:${secStr}`;
    }
    return `${minStr}:${secStr}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading exam questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color={colors.danger} />
        <Text style={styles.errorText}>No questions found in this assessment pool.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Exit Console</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeQ = questions[currentIndex];
  const selectedOpt = answers[activeQ.question_id] || '';
  const isMarkedReview = reviewList.has(activeQ.question_id);

  return (
    <View style={styles.container}>
      {/* Timer Bar */}
      <View style={styles.timerBar}>
        <View style={styles.timerTextContainer}>
          <Clock size={16} color={timeLeft < 60 ? colors.danger : colors.primary} />
          <Text style={[styles.timerVal, { color: timeLeft < 60 ? colors.danger : colors.primary }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmitExam(false)} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>

      {/* Questions dots list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.numbersBar} contentContainerStyle={styles.numbersInner}>
        {questions.map((q, idx) => {
          const isAnswered = answers[q.question_id] !== undefined;
          const isReview = reviewList.has(q.question_id);
          const isCurrent = idx === currentIndex;

          let btnBg = '#ffffff';
          let borderCol = colors.border;
          let textCol = colors.primary;

          if (isCurrent) {
            btnBg = colors.primary;
            borderCol = colors.primary;
            textCol = '#ffffff';
          } else if (isReview) {
            btnBg = colors.warningLight;
            borderCol = colors.warning;
            textCol = colors.warning;
          } else if (isAnswered) {
            btnBg = colors.successLight;
            borderCol = colors.success;
            textCol = colors.success;
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentIndex(idx)}
              style={[styles.numberCircle, { backgroundColor: btnBg, borderColor: borderCol }]}
            >
              <Text style={[styles.numberCircleText, { color: textCol }]}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main question pane */}
      <ScrollView style={styles.questionPane} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.questionHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Question {currentIndex + 1} of {questions.length}</Text>
          </View>
          <Text style={styles.marksText}>Weight: {activeQ.marks} Marks</Text>
        </View>

        <Text style={styles.questionText}>{activeQ.question_text}</Text>

        {/* Options */}
        {['a', 'b', 'c', 'd'].map(opt => {
          const key = `option_${opt}`;
          const text = activeQ[key];
          const isSelected = selectedOpt === opt;

          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionRow,
                isSelected ? styles.optionRowActive : styles.optionRowInactive
              ]}
              onPress={() => handleSelectOption(opt)}
            >
              <View style={[
                styles.optionCircle,
                isSelected ? styles.optionCircleActive : styles.optionCircleInactive
              ]}>
                <Text style={[
                  styles.optionLabel,
                  isSelected ? styles.optionLabelActive : styles.optionLabelInactive
                ]}>
                  {opt.toUpperCase()}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                isSelected ? styles.optionTextActive : styles.optionTextInactive
              ]}>
                {text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Control Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, styles.btnPrev]}
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
        >
          <Text style={styles.footerBtnText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.btnReview, isMarkedReview && styles.btnReviewActive]}
          onPress={handleToggleReview}
        >
          <Bookmark size={14} color={isMarkedReview ? '#ffffff' : colors.warning} />
          <Text style={[styles.btnReviewText, isMarkedReview && styles.btnReviewTextActive]}>
            {isMarkedReview ? 'Reviewing' : 'Mark Review'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.btnNext]}
          disabled={currentIndex === questions.length - 1}
          onPress={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
        >
          <Text style={styles.footerBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 18,
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
  timerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: colors.danger,
    height: 32,
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  numbersBar: {
    maxHeight: 52,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  numbersInner: {
    gap: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  numberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberCircleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionPane: {
    flex: 1,
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  marksText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'left',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionRowInactive: {
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleActive: {
    backgroundColor: colors.primary,
  },
  optionCircleInactive: {
    backgroundColor: '#f1f5f9',
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionLabelActive: {
    color: '#ffffff',
  },
  optionLabelInactive: {
    color: colors.textMuted,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionTextInactive: {
    color: colors.textMain,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrev: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnReview: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.warning,
    flexDirection: 'row',
    gap: 4,
  },
  btnReviewActive: {
    backgroundColor: colors.warning,
  },
  btnReviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  btnReviewTextActive: {
    color: '#ffffff',
  },
  btnNext: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
});

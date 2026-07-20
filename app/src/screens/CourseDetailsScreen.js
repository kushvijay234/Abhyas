import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import colors from '../theme/colors';
import { ArrowLeft, BookOpen, Clock, Award, FileText, CheckCircle2, Lock, Star, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react-native';

export default function CourseDetailsScreen({ navigation, route }) {
  const { id } = route.params;

  // Data States
  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  // Player States (Enrolled Mode)
  const [syllabus, setSyllabus] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'notes' | 'qna'
  
  // Accordion Toggle States
  const [expandedSections, setExpandedSections] = useState({});

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);

  // Fetch details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [courseRes, examsRes, myCoursesRes] = await Promise.all([
        api.courses.getDetails(id),
        api.exams.getAll('', id),
        api.courses.getMy()
      ]);

      if (courseRes.success) setCourse(courseRes.data);
      if (examsRes.success) setExams(examsRes.data || []);
      
      if (myCoursesRes.success) {
        const enrolledList = myCoursesRes.data || [];
        const enrolled = enrolledList.some(c => String(c.course_id) === String(id));
        setIsEnrolled(enrolled);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Load notes and checklist progress from AsyncStorage
  useEffect(() => {
    if (course) {
      AsyncStorage.getItem(`abhyas_notes_${id}`).then((stored) => {
        if (stored) {
          setNotes(JSON.parse(stored));
        } else {
          setNotes([
            { id: 1, timestamp: 'General Notes', content: 'Make sure to complete all section quizzes to unlock certificates.' }
          ]);
        }
      });

      AsyncStorage.getItem(`abhyas_completed_${id}`).then((stored) => {
        if (stored) {
          setCompletedItems(new Set(JSON.parse(stored)));
        }
      });
    }
  }, [course]);

  // Generate syllabus list
  useEffect(() => {
    if (course) {
      let finalSyllabus = [];

      if (course.curriculum && course.curriculum.length > 0) {
        finalSyllabus = course.curriculum.map((section, sIdx) => ({
          ...section,
          items: (section.items || []).map(item => {
            const itemId = item.type === 'exam' ? `exam-${item.exam_id}` : String(item.curriculum_item_id);
            return {
              ...item,
              id: itemId,
              title: item.title,
              type: item.type,
              duration: item.duration || (item.type === 'exam' && item.examData ? `${item.examData.duration_minutes} min` : ''),
              notes: item.notes,
              examData: item.type === 'exam' ? item.examData : null
            };
          })
        }));
      } else {
        const dbExams = exams.map((exam) => ({
          id: `exam-${exam.exam_id}`,
          title: `${exam.title}`,
          type: 'exam',
          duration: `${exam.duration_minutes} min`,
          examData: exam
        }));

        finalSyllabus = [
          {
            title: 'Section 1: Course Fundamentals',
            items: [
              { id: 'sec1-1', title: '1. Welcome & Course Outline', type: 'article', duration: '5 min read', notes: 'Welcome! In this lesson we review database conceptual designs, schema structures, and targeted assessments.' }
            ]
          },
          {
            title: 'Section 2: Practice Assessments',
            items: dbExams.length > 0 ? dbExams : [{ id: 'no-exams', title: 'No assessments available', type: 'info', duration: 'N/A' }]
          }
        ];
      }

      setSyllabus(finalSyllabus);

      const defaultExpanded = {};
      finalSyllabus.forEach((_, idx) => {
        defaultExpanded[idx] = true;
      });
      setExpandedSections(defaultExpanded);

      if (finalSyllabus[0] && finalSyllabus[0].items[0]) {
        setActiveItem(finalSyllabus[0].items[0]);
      }
    }
  }, [course, exams]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const res = await api.courses.enroll(id);
      if (res.success) {
        setIsEnrolled(true);
        await fetchDetails();
      } else {
        Alert.alert('Error', res.message || 'Failed to enroll.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error occurred during enrollment.');
    } finally {
      setEnrolling(false);
    }
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

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleItemComplete = async (itemId) => {
    const updated = new Set(completedItems);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setCompletedItems(updated);
    await AsyncStorage.setItem(`abhyas_completed_${id}`, JSON.stringify(Array.from(updated)));
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      timestamp: activeItem ? activeItem.title : 'General',
      content: newNote.trim()
    };

    const updated = [note, ...notes];
    setNotes(updated);
    setNewNote('');
    await AsyncStorage.setItem(`abhyas_notes_${id}`, JSON.stringify(updated));
  };

  const handleDeleteNote = async (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    await AsyncStorage.setItem(`abhyas_notes_${id}`, JSON.stringify(updated));
  };

  const getProgressPercentage = () => {
    const lectures = syllabus.reduce((acc, sec) => {
      const items = sec.items.filter(item => item.type === 'video' || item.type === 'article');
      return acc + items.length;
    }, 0);
    if (lectures === 0) return 0;
    const completedLectures = Array.from(completedItems).filter(itemId => !itemId.startsWith('exam-')).length;
    return Math.min(Math.round((completedLectures / lectures) * 100), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Details...</Text>
      </View>
    );
  }

  // --- UNENROLLED COURSE DETAILS VIEW ---
  const renderUnenrolledView = () => {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <Image
          source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.heroTextContainer}>
          <Text style={styles.categoryBadge}>{course.category_name}</Text>
          <Text style={styles.courseTitleBig}>{course.title}</Text>
          
          <View style={styles.ratingRow}>
            <Star size={14} fill="var(--warning)" color={colors.warning} />
            <Text style={styles.ratingText}>4.8  ·  142 ratings  ·  Free access</Text>
          </View>
        </View>

        {/* Action Checkout Card */}
        <View style={styles.card}>
          <Text style={styles.priceText}>Free <Text style={styles.originalPrice}>₹1,999</Text></Text>
          <Text style={styles.cardSub}>Unlimited lifetime access, interactive quizzes, syllabus notes.</Text>

          <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll} disabled={enrolling}>
            <Text style={styles.enrollBtnText}>{enrolling ? 'Enrolling...' : 'Enroll in course'}</Text>
          </TouchableOpacity>
        </View>

        {/* Learning items list */}
        <View style={styles.learnCard}>
          <Text style={styles.learnTitle}>What you will learn</Text>
          <Text style={styles.learnItem}>✓ Core architecture designs and structures.</Text>
          <Text style={styles.learnItem}>✓ Custom assessment optimization steps.</Text>
          <Text style={styles.learnItem}>✓ Practice MCQ exam templates and analysis.</Text>
        </View>

        {/* Syllabus list */}
        <Text style={styles.sectionHeaderTitle}>Course Content</Text>
        {syllabus.map((section, idx) => (
          <View key={idx} style={styles.accordionContainer}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection(idx)}>
              <Text style={styles.accordionTitle}>{section.title}</Text>
              {expandedSections[idx] ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}
            </TouchableOpacity>
            
            {expandedSections[idx] && (
              <View style={styles.accordionContent}>
                {section.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.accordionItemRow}>
                    <View style={styles.itemRowLeft}>
                      {item.type === 'exam' ? <Award size={14} color={colors.success} /> : <FileText size={14} color={colors.textMuted} />}
                      <Text style={styles.itemTitleText}>{item.title}</Text>
                    </View>
                    <View style={styles.itemRowRight}>
                      {item.type === 'exam' ? (
                        <Text style={styles.badgeLabel}>Quiz</Text>
                      ) : (
                        <Lock size={12} color={colors.textMuted} />
                      )}
                      <Text style={styles.itemDuration}>{item.duration}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  // --- ENROLLED COURSE PLAYER VIEW ---
  const renderEnrolledView = () => {
    const isCompleted = activeItem ? completedItems.has(activeItem.id) : false;
    const progress = getProgressPercentage();

    return (
      <View style={styles.playerWrapper}>
        {/* Progress header banner */}
        <View style={styles.playerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerTitle} numberOfLines={1}>{course.title}</Text>
            <Text style={styles.playerProgressSub}>{progress}% Complete</Text>
          </View>
          <View style={styles.trackProgressOuter}>
            <View style={[styles.trackProgressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Content pane */}
        <ScrollView style={styles.playerContentPane} contentContainerStyle={{ paddingBottom: 24 }}>
          {activeItem?.type === 'article' || activeItem?.type === 'video' ? (
            <View style={styles.articleCard}>
              <Text style={styles.articleMeta}>{activeItem.duration}</Text>
              <Text style={styles.articleTitle}>{activeItem.title}</Text>
              <Text style={styles.articleText}>
                {activeItem.notes || (
                  `Welcome to the theoretical study guide of ${course.title}.\n\nReview this text syllabus section carefully. Once finished, mark it complete using the check box below to register your progress logs.\n\nYou are then fully prepared to attempt the practice assessment exams located in the final modules.`
                )}
              </Text>

              {/* Complete toggler */}
              <TouchableOpacity
                style={[styles.completeToggleBtn, isCompleted ? styles.completeToggleBtnActive : styles.completeToggleBtnInactive]}
                onPress={() => toggleItemComplete(activeItem.id)}
              >
                <CheckCircle2 size={16} color={isCompleted ? '#ffffff' : colors.primary} />
                <Text style={[styles.completeToggleBtnText, { color: isCompleted ? '#ffffff' : colors.primary }]}>
                  {isCompleted ? 'Completed' : 'Mark as Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {activeItem?.type === 'exam' ? (
            <View style={styles.examCard}>
              <Award size={48} color={colors.warning} style={styles.examCardIcon} />
              <Text style={styles.examCardTitle}>{activeItem.title}</Text>
              <Text style={styles.examCardSub}>
                This quiz is registered in the syllabus. Starting will allocate one examination attempt log.
              </Text>

              <View style={styles.examStatsRow}>
                <View style={styles.examStatBox}>
                  <Text style={styles.examStatLabel}>Duration</Text>
                  <Text style={styles.examStatVal}>{activeItem.examData?.duration_minutes}m</Text>
                </View>
                <View style={styles.examStatBox}>
                  <Text style={styles.examStatLabel}>Marks</Text>
                  <Text style={styles.examStatVal}>{activeItem.examData?.total_marks}</Text>
                </View>
                <View style={styles.examStatBox}>
                  <Text style={styles.examStatLabel}>Passing</Text>
                  <Text style={styles.examStatVal}>{activeItem.examData?.passing_marks}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startExamBtn}
                onPress={() => handleStartExam(activeItem.examData.exam_id)}
                disabled={startingId === activeItem.examData.exam_id}
              >
                <Text style={styles.startExamBtnText}>
                  {startingId === activeItem.examData.exam_id ? 'Loading Exam...' : 'Start Assessment Now'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Sub-tabs under player */}
          <View style={styles.tabsHeader}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]} onPress={() => setActiveTab('about')}>
              <Text style={[styles.tabButtonText, activeTab === 'about' && styles.tabButtonTextActive]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'notes' && styles.tabButtonActive]} onPress={() => setActiveTab('notes')}>
              <Text style={[styles.tabButtonText, activeTab === 'notes' && styles.tabButtonTextActive]}>Notes ({notes.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContentCard}>
            {activeTab === 'about' && (
              <View>
                <Text style={styles.overviewHeader}>About this Lesson</Text>
                <Text style={styles.overviewBody}>
                  {activeItem?.notes || 'Complete readings and tutorials to establish fundamental concepts before launching final checkpoints.'}
                </Text>
              </View>
            )}

            {activeTab === 'notes' && (
              <View>
                <View style={styles.addNoteForm}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Write a study highlight note..."
                    placeholderTextColor={colors.textMuted}
                    value={newNote}
                    onChangeText={setNewNote}
                  />
                  <TouchableOpacity style={styles.addNoteBtn} onPress={handleAddNote}>
                    <Plus size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {notes.map(n => (
                  <View key={n.id} style={styles.noteItem}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteSub}>{n.timestamp}</Text>
                      <TouchableOpacity onPress={() => handleDeleteNote(n.id)}>
                        <Trash2 size={14} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.noteText}>{n.content}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Curriculum syllabus player sidebar outline */}
          <Text style={styles.curriculumSidebarTitle}>Curriculum Layout</Text>
          {syllabus.map((section, idx) => (
            <View key={idx} style={styles.sidebarSection}>
              <TouchableOpacity style={styles.sidebarHeader} onPress={() => toggleSection(idx)}>
                <Text style={styles.sidebarHeaderTitle} numberOfLines={1}>{section.title}</Text>
                {expandedSections[idx] ? <ChevronUp size={14} color={colors.primary} /> : <ChevronDown size={14} color={colors.primary} />}
              </TouchableOpacity>

              {expandedSections[idx] && (
                <View style={styles.sidebarItemsBlock}>
                  {section.items.map((item, itemIdx) => {
                    const active = activeItem?.id === item.id;
                    const done = completedItems.has(item.id);
                    return (
                      <TouchableOpacity
                        key={itemIdx}
                        style={[styles.sidebarItemRow, active && styles.sidebarItemRowActive]}
                        onPress={() => item.type !== 'info' && setActiveItem(item)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          {item.type !== 'exam' && item.type !== 'info' ? (
                            <TouchableOpacity onPress={() => toggleItemComplete(item.id)}>
                              {done ? (
                                <CheckCircle2 size={16} color={colors.success} />
                              ) : (
                                <View style={styles.checkCirclePlaceholder} />
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: 16 }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.sidebarItemTitle, active && styles.sidebarItemTitleActive]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.sidebarItemMeta}>{item.duration}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return isEnrolled ? renderEnrolledView() : renderUnenrolledView();
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
    gap: 8,
  },
  loadingText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  heroTextContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  courseTitleBig: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 26,
    textAlign: 'left',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'left',
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: 'normal',
  },
  cardSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'left',
  },
  enrollBtn: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  learnCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  learnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  learnItem: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
    textAlign: 'left',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'left',
  },
  accordionContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAF9F6',
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  accordionContent: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  accordionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,107,0.04)',
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  itemRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.success,
    backgroundColor: colors.successLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemDuration: {
    fontSize: 11,
    color: colors.textMuted,
  },
  // --- PLAYER VIEW STYLES ---
  playerWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  playerHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  playerProgressSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  trackProgressOuter: {
    width: 80,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  playerContentPane: {
    flex: 1,
  },
  articleCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'flex-start',
  },
  articleMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'left',
  },
  articleText: {
    fontSize: 14,
    color: '#6B6555',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'left',
  },
  completeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  completeToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  completeToggleBtnInactive: {
    backgroundColor: '#ffffff',
  },
  completeToggleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  examCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'center',
  },
  examCardIcon: {
    marginBottom: 12,
  },
  examCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  examCardSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  examStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  examStatBox: {
    alignItems: 'center',
    width: 70,
  },
  examStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  examStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  startExamBtn: {
    backgroundColor: colors.warning,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  startExamBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.warning,
  },
  tabButtonText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.warning,
  },
  tabContentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'flex-start',
  },
  overviewHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  overviewBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'left',
  },
  addNoteForm: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  noteInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.primary,
  },
  addNoteBtn: {
    width: 38,
    height: 38,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteItem: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,107,0.06)',
    alignItems: 'flex-start',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  noteSub: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 13,
    color: colors.textMain,
    lineHeight: 18,
    textAlign: 'left',
  },
  curriculumSidebarTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    textAlign: 'left',
  },
  sidebarSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fcfbf9',
  },
  sidebarHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    textAlign: 'left',
  },
  sidebarItemsBlock: {
    padding: 4,
  },
  sidebarItemRow: {
    padding: 8,
    borderRadius: 4,
  },
  sidebarItemRowActive: {
    backgroundColor: 'rgba(26,45,107,0.04)',
  },
  sidebarItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMain,
    textAlign: 'left',
  },
  sidebarItemTitleActive: {
    color: colors.warning,
  },
  sidebarItemMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'left',
  },
  checkCirclePlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});

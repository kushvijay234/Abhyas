import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Clipboard,
  Alert,
  ScrollView,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { api } from '../services/api';
import colors from '../theme/colors';
import {
  Send,
  Mic,
  Brain,
  Award,
  Clock,
  Flame,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  X,
  Bookmark,
} from 'lucide-react-native';

export default function AiTutorChatScreen({ route, navigation }) {
  const { chatId, chatTitle } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice simulation state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voicePulse] = useState(new Animated.Value(1));

  const flatListRef = useRef(null);

  const loadMessages = async () => {
    try {
      const res = await api.tutor.getMessages(chatId);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  // Voice wave animation
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(voicePulse, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(voicePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      voicePulse.setValue(1);
    }
  }, [isVoiceActive]);

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.tutor.sendMessage(chatId, textToSend.trim());
      if (res.success) {
        // Sync full message history (loads database items with structured data, etc.)
        const syncRes = await api.tutor.getMessages(chatId);
        if (syncRes.success) {
          setMessages(syncRes.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to generate AI response. Make sure server is running.');
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsTyping(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await api.tutor.generateQuiz(chatId);
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleQuizAnswer = async (msgId, option, idx) => {
    const isCorrect = !!option.isCorrect;

    // Update locally for instant response
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            userAnswer: idx,
            quizScore: isCorrect,
          };
        }
        return m;
      })
    );

    try {
      await api.tutor.submitQuizAnswer(msgId, idx, isCorrect);
    } catch (err) {
      console.error('Failed to save quiz answer:', err);
    }
  };

  const handleAddBookmark = async (title) => {
    try {
      const res = await api.tutor.addBookmark(title);
      if (res.success) {
        Alert.alert('Success', 'Concept saved to your Revision Notes!');
      }
    } catch (err) {
      console.error('Failed to add bookmark:', err);
      Alert.alert('Error', 'Could not save revision note.');
    }
  };

  const handleCopyCode = (code) => {
    Clipboard.setString(code.replace(/```[a-z]*\n|```/g, ''));
    Alert.alert('Copied', 'Code copied to clipboard!');
  };

  const startVoiceInput = () => {
    setIsVoiceActive(true);
  };

  const stopVoiceInput = (sendSimulatedText = false) => {
    setIsVoiceActive(false);
    if (sendSimulatedText) {
      const phrases = [
        'Explain binary tree nodes and how search works in a BST.',
        'Give me a comparison between TCP and UDP protocols.',
        'Explain normalization in databases with 3NF examples.',
        'Provide a visual representation of quicksort complexity.',
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setInputText(randomPhrase);
    }
  };

  // Helper formatting functions
  const formatLatexToPlain = (latex) => {
    if (!latex) return '';
    return latex
      .replace(/\\text\s*\{\s*(.*?)\s*\}/g, '$1')
      .replace(/\\times/g, ' × ')
      .replace(/\\approx/g, ' ≈ ')
      .replace(/\\quad/g, '   ')
      .replace(/\\log_2\((.*?)\)/g, 'log₂($1)')
      .replace(/\\frac\s*\{\s*\\sum\s*\((.*?)\)\s*\}\s*\{\s*(.*?)\s*\}/g, 'Σ($1) / $2')
      .replace(/\\frac\s*\{\s*(.*?)\s*\}\s*\{\s*(.*?)\s*\}/g, '$1 / $2')
      .trim();
  };

  const renderTextWithBold = (text, customStyle = {}) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text style={[styles.messageText, customStyle]}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={idx} style={{ fontWeight: 'bold', color: colors.primary }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;

    let formulaText = '';
    let textToParse = text;

    const formulaIndex = text.indexOf('\\text{');
    if (formulaIndex !== -1) {
      textToParse = text.substring(0, formulaIndex).trim();
      formulaText = text.substring(formulaIndex).trim();
    }

    // Study Plan parsing logic
    if (textToParse.includes('4-Week Study Plan') || textToParse.includes('Week 1:')) {
      const titleRegex = /###\s*📅?\s*Personalized\s*4-Week\s*Study\s*Plan\s*/i;
      const cleanText = textToParse.replace(titleRegex, '').trim();
      const weeks = cleanText.split(/####?\s*\*\*Week/i);
      const introText = weeks[0].trim();

      return (
        <View style={styles.studyPlanContainer}>
          {introText ? renderTextWithBold(introText, { marginBottom: 10 }) : null}
          {weeks.slice(1).map((weekBlock, idx) => {
            const titleMatch = weekBlock.match(/^\s*(.*?)(?=\s*\*?\s*\*\*Goal:|\s*\*?\s*\*\*Topics:|$)/s);
            let titleLine = titleMatch ? titleMatch[1].trim() : `${idx + 1}`;
            titleLine = titleLine.replace(/\*\*|:/g, '').trim();

            const goalMatch = weekBlock.match(/\*\*Goal:\*\*\s*(.*?)(?=\*\*Topics:|\*\*Action Item:|$)/s);
            const topicsMatch = weekBlock.match(/\*\*Topics:\*\*\s*(.*?)(?=\*\*Goal:|\*\*Action Item:|$)/s);
            const actionMatch = weekBlock.match(/\*\*Action Item:\*\*\s*(.*?)(?=\*\*Goal:|\*\*Topics:|$)/s);

            const goal = goalMatch ? goalMatch[1].trim().replace(/\s*\*\s*$/, '') : '';
            const topics = topicsMatch ? topicsMatch[1].trim().replace(/\s*\*\s*$/, '') : '';
            const action = actionMatch ? actionMatch[1].trim().replace(/\s*\*\s*$/, '') : '';

            return (
              <View key={idx} style={styles.studyWeekCard}>
                <View style={styles.studyWeekHeader}>
                  <Text style={styles.studyWeekTitle}>Week {titleLine}</Text>
                  <View style={styles.studyBadge}>
                    <Text style={styles.studyBadgeText}>Syllabus Goal</Text>
                  </View>
                </View>
                {goal ? (
                  <Text style={styles.studyField}>
                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>Goal: </Text>
                    {goal}
                  </Text>
                ) : null}
                {topics ? (
                  <Text style={styles.studyField}>
                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>Topics: </Text>
                    {topics}
                  </Text>
                ) : null}
                {action ? (
                  <View style={styles.studyActionContainer}>
                    <Award size={13} color="#F59E0B" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={styles.studyActionText}>
                      <Text style={{ fontWeight: 'bold', color: '#B45309' }}>Action Item: </Text>
                      {action}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          {formulaText ? (
            <View style={styles.mathFormula}>
              <Text style={styles.mathFormulaText}>{formatLatexToPlain(formulaText)}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    // Default formatting lines
    const lines = textToParse.split('\n');
    return (
      <View>
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <Text key={idx} style={styles.heading3}>
                {line.replace('### ', '')}
              </Text>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <Text key={idx} style={styles.heading4}>
                {line.replace('#### ', '')}
              </Text>
            );
          }
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const cleanLine = line.replace(/^\s*[\*\-]\s+/, '');
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <View style={{ flex: 1 }}>{renderTextWithBold(cleanLine)}</View>
              </View>
            );
          }
          return <View key={idx} style={{ marginVertical: 2 }}>{renderTextWithBold(line)}</View>;
        })}
        {formulaText ? (
          <View style={styles.mathFormula}>
            <Text style={styles.mathFormulaText}>{formatLatexToPlain(formulaText)}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const handleShortcutPress = (promptText) => {
    setInputText(promptText);
    handleSend(promptText);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatTitle || 'AI Learning Session'}
          </Text>
          <Text style={styles.headerSubtitle}>Powered by Abhyas AI Engine</Text>
        </View>
        <TouchableOpacity style={styles.quizBtn} onPress={handleGenerateQuiz}>
          <Award size={18} color={colors.warning} />
          <Text style={styles.quizBtnText}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Message feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.warning} />
          <Text style={styles.loadingText}>Syncing chat log...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.feedContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
                {!isUser && (
                  <View style={styles.tutorAvatar}>
                    <Brain size={15} color="#fff" />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                  {/* Bubble Text */}
                  {isUser ? (
                    <Text style={styles.userMessageText}>{item.text}</Text>
                  ) : (
                    <View>
                      {renderFormattedContent(item.text)}

                      {/* Structured Data explanation card */}
                      {item.structuredData && (
                        <View style={styles.structuredCard}>
                          <Text style={styles.structuredHeading}>Core Explanation</Text>
                          {renderTextWithBold(item.structuredData.explanation || item.structuredData.answer)}

                          {item.structuredData.example && (
                            <View style={styles.codeBlock}>
                              <View style={styles.codeHeader}>
                                <Text style={styles.codeHeaderText}>Code Snippet</Text>
                                <TouchableOpacity onPress={() => handleCopyCode(item.structuredData.example)}>
                                  <Text style={styles.copyCodeBtn}>Copy Code</Text>
                                </TouchableOpacity>
                              </View>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Text style={styles.codeText}>
                                  {item.structuredData.example.replace(/```[a-z]*\n|```/g, '')}
                                </Text>
                              </ScrollView>
                            </View>
                          )}

                          {item.structuredData.tableData && (
                            <View style={styles.tableCard}>
                              <Text style={styles.tableHeading}>Comparison Matrix</Text>
                              <View style={styles.tableHeader}>
                                {item.structuredData.tableData.headers.map((h, i) => (
                                  <Text key={i} style={styles.tableHeaderCell}>
                                    {h}
                                  </Text>
                                ))}
                              </View>
                              {item.structuredData.tableData.rows.map((row, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.tableRow,
                                    i % 2 === 1 && { backgroundColor: '#F8F9FA' },
                                  ]}
                                >
                                  {row.map((cell, j) => (
                                    <Text key={j} style={styles.tableCell}>
                                      {cell}
                                    </Text>
                                  ))}
                                </View>
                              ))}
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.bookmarkBtn}
                            onPress={() =>
                              handleAddBookmark(
                                item.structuredData.explanation || item.structuredData.answer
                              )
                            }
                          >
                            <Bookmark size={12} color={colors.warning} style={{ marginRight: 6 }} />
                            <Text style={styles.bookmarkBtnText}>Save Key Concepts</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Embedded Interactive Practice Quiz */}
                      {item.quiz && (
                        <View style={styles.quizCard}>
                          <View style={styles.quizTag}>
                            <Award size={13} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.quizTagText}>Conceptual Mini-Quiz</Text>
                          </View>
                          <Text style={styles.quizQuestion}>{item.quiz.question}</Text>
                          <View style={styles.quizOptions}>
                            {item.quiz.options.map((opt, idx) => {
                              const isAnswered = item.userAnswer !== undefined && item.userAnswer !== null;
                              let optionBtnStyle = [styles.quizOptionBtn];
                              let optionTextStyle = [styles.quizOptionText];

                              if (isAnswered) {
                                if (opt.isCorrect) {
                                  optionBtnStyle.push(styles.quizOptionBtnCorrect);
                                  optionTextStyle.push(styles.quizOptionTextCorrect);
                                } else if (item.userAnswer === idx) {
                                  optionBtnStyle.push(styles.quizOptionBtnWrong);
                                  optionTextStyle.push(styles.quizOptionTextWrong);
                                }
                              }

                              return (
                                <TouchableOpacity
                                  key={idx}
                                  style={optionBtnStyle}
                                  disabled={isAnswered}
                                  onPress={() => handleQuizAnswer(item.id, opt, idx)}
                                >
                                  <Text style={styles.quizOptionKey}>{opt.key}.</Text>
                                  <Text style={optionTextStyle}>{opt.text}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {item.userAnswer !== undefined && item.userAnswer !== null && (
                            <View style={styles.quizFeedbackWrapper}>
                              <CheckCircle2
                                size={14}
                                color={item.quizScore ? colors.success : colors.danger}
                              />
                              <Text
                                style={[
                                  styles.quizFeedbackText,
                                  { color: item.quizScore ? colors.success : colors.danger },
                                ]}
                              >
                                {item.quizScore
                                  ? 'Correct Answer! +10 Points loaded.'
                                  : 'Completed. Conceptual review recommended.'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Response Metadata Bar */}
                      {(item.confidence || item.difficulty || item.studyTime || (item.sources && item.sources.length > 0)) && (
                        <View style={styles.metadataBar}>
                          {item.confidence ? (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaText}>✓ {item.confidence} Accuracy</Text>
                            </View>
                          ) : null}
                          {item.difficulty ? (
                            <View style={styles.metaPill}>
                              <Flame size={10} color={colors.warning} style={{ marginRight: 3 }} />
                              <Text style={styles.metaText}>{item.difficulty}</Text>
                            </View>
                          ) : null}
                          {item.studyTime ? (
                            <View style={styles.metaPill}>
                              <Clock size={10} color={colors.primary} style={{ marginRight: 3 }} />
                              <Text style={styles.metaText}>{item.studyTime} read</Text>
                            </View>
                          ) : null}
                          {item.sources && item.sources.length > 0 ? (
                            <View style={styles.metaPill}>
                              <BookOpen size={10} color={colors.primary} style={{ marginRight: 3 }} />
                              <Text style={styles.metaText}>{item.sources.length} sources</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Typing loader */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Brain size={14} color={colors.warning} style={styles.typingIcon} />
          <Text style={styles.typingText}>AI Tutor is writing...</Text>
        </View>
      )}

      {/* Keyboard and input controls */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Shortcuts slider */}
        <View style={styles.shortcutsArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsScroll}>
            <TouchableOpacity
              style={styles.shortcutItem}
              onPress={() => handleShortcutPress('Generate a customized study plan for my weak topics.')}
            >
              <Text style={styles.shortcutText}>📅 Study Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutItem}
              onPress={() => handleShortcutPress('Give me a structured roadmap for mastering Graph Algorithms.')}
            >
              <Text style={styles.shortcutText}>🚀 Master Roadmap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutItem}
              onPress={() => handleShortcutPress('Create flashcards for CPU scheduling algorithms.')}
            >
              <Text style={styles.shortcutText}>💡 Flashcards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutItem}
              onPress={() => handleShortcutPress('Start an AI mock test containing 10 questions on DBMS.')}
            >
              <Text style={styles.shortcutText}>📝 DBMS Mock Test</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Input box row */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.voiceBtn} onPress={startVoiceInput}>
            <Mic size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            placeholder="Ask AI Tutor your conceptual question..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            onPress={() => handleSend()}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Overlay Modal */}
      {isVoiceActive && (
        <View style={styles.voiceOverlayBg}>
          <Animated.View
            style={[
              styles.voiceWaveRing,
              {
                transform: [{ scale: voicePulse }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.voiceTapTarget}
              onPress={() => stopVoiceInput(true)}
            >
              <Mic size={40} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.voiceOverlayTitle}>Listening to your Voice...</Text>
          <Text style={styles.voiceOverlaySubtitle}>
            Speak clearly. Tap the microphone icon when finished.
          </Text>
          <TouchableOpacity style={styles.voiceCancelBtn} onPress={() => stopVoiceInput(false)}>
            <X size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    height: Platform.OS === 'android' ? 56 + StatusBar.currentHeight : 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  quizBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  tutorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userMessageText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  messageText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 19,
  },
  heading3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
    marginBottom: 6,
  },
  heading4: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bulletDot: {
    width: 14,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 19,
  },
  mathFormula: {
    backgroundColor: '#FFF4EB',
    borderWidth: 1,
    borderColor: 'rgba(244,121,32,0.2)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  mathFormulaText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.warning,
    fontWeight: '700',
  },
  studyPlanContainer: {
    marginTop: 8,
  },
  studyWeekCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  studyWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    paddingBottom: 6,
    marginBottom: 8,
  },
  studyWeekTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  studyBadge: {
    backgroundColor: 'rgba(26,45,107,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  studyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  studyField: {
    fontSize: 12,
    color: colors.primary,
    lineHeight: 16,
    marginBottom: 4,
  },
  studyActionContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  studyActionText: {
    fontSize: 11,
    color: '#78350F',
    flex: 1,
    lineHeight: 15,
  },
  structuredCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  structuredHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginVertical: 10,
    padding: 10,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
    marginBottom: 8,
  },
  codeHeaderText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  copyCodeBtn: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: 'bold',
  },
  codeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  tableHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    padding: 8,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: colors.primary,
    padding: 8,
    textAlign: 'center',
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  bookmarkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  quizCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  quizTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quizTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  quizQuestion: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 12,
  },
  quizOptions: {
    gap: 8,
  },
  quizOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
  },
  quizOptionBtnCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  quizOptionBtnWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  quizOptionKey: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 6,
  },
  quizOptionText: {
    fontSize: 12,
    color: colors.primary,
  },
  quizOptionTextCorrect: {
    color: '#065F46',
    fontWeight: 'bold',
  },
  quizOptionTextWrong: {
    color: '#991B1B',
  },
  quizFeedbackWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  quizFeedbackText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metadataBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '700',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  typingIcon: {
    marginRight: 6,
  },
  typingText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  shortcutsArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  shortcutsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  shortcutItem: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  voiceBtn: {
    padding: 8,
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 38,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 13,
    color: colors.primary,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  voiceOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,45,107,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 24,
  },
  voiceWaveRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244,121,32,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  voiceTapTarget: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceOverlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  voiceOverlaySubtitle: {
    fontSize: 12,
    color: '#B0A898',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 40,
  },
  voiceCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import colors from '../theme/colors';
import {
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  Bookmark,
  CheckCircle2,
  Circle,
  Search,
  Edit2,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

export default function AiTutorScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'goals', 'bookmarks'
  const [chats, setChats] = useState([]);
  const [goals, setGoals] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGoalText, setNewGoalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Chat Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState('');

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [chatsRes, goalsRes, bookmarksRes] = await Promise.all([
        api.tutor.getChats(),
        api.tutor.getGoals(),
        api.tutor.getBookmarks(),
      ]);

      if (chatsRes.success) setChats(chatsRes.data || []);
      if (goalsRes.success) setGoals(goalsRes.data || []);
      if (bookmarksRes.success) setBookmarks(bookmarksRes.data || []);
    } catch (err) {
      console.error('Failed to load AI Tutor data:', err);
      Alert.alert('Error', 'Unable to fetch tutor items. Make sure your server is online.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data every time the screen is focused (active tab, back from chat detail)
  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Chat Actions
  const handleCreateChat = async () => {
    try {
      const res = await api.tutor.createChat('New Conversation', 'today');
      if (res.success) {
        const newChat = res.data;
        // Pre-insert in state
        setChats((prev) => [newChat, ...prev]);
        navigation.navigate('AiTutorChat', {
          chatId: newChat.chat_id,
          chatTitle: newChat.title,
        });
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
      Alert.alert('Error', 'Could not start new chat session.');
    }
  };

  const handleOpenRename = (chatId, title) => {
    setSelectedChatId(chatId);
    setEditChatTitle(title);
    setIsEditModalOpen(true);
  };

  const handleRenameChat = async () => {
    if (!editChatTitle.trim()) return;
    try {
      const res = await api.tutor.renameChat(selectedChatId, editChatTitle.trim());
      if (res.success) {
        setChats((prev) =>
          prev.map((c) => (c.chat_id === selectedChatId ? { ...c, title: editChatTitle.trim() } : c))
        );
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
      Alert.alert('Error', 'Failed to rename conversation.');
    }
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this chat history? This action is permanent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.tutor.deleteChat(chatId);
              if (res.success) {
                setChats((prev) => prev.filter((c) => c.chat_id !== chatId));
              }
            } catch (err) {
              console.error('Failed to delete chat:', err);
              Alert.alert('Error', 'Could not delete conversation.');
            }
          },
        },
      ]
    );
  };

  // Goal Actions
  const handleToggleGoal = async (id, currentVal) => {
    const nextVal = !currentVal;
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, checked: nextVal } : g))
    );
    try {
      await api.tutor.toggleGoal(id, nextVal);
    } catch (err) {
      console.error('Failed to toggle goal:', err);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalText.trim()) return;
    try {
      const res = await api.tutor.createGoal(newGoalText.trim());
      if (res.success) {
        setGoals((prev) => [...prev, res.data]);
        setNewGoalText('');
      }
    } catch (err) {
      console.error('Failed to create goal:', err);
      Alert.alert('Error', 'Failed to add study checklist item.');
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await api.tutor.deleteGoal(id);
      if (res.success) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Bookmark Actions
  const handleDeleteBookmark = async (id) => {
    try {
      const res = await api.tutor.deleteBookmark(id);
      if (res.success) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  // Calculation for progress circle
  const checkedGoals = goals.filter((g) => g.checked).length;
  const progressPct = goals.length > 0 ? Math.round((checkedGoals / goals.length) * 100) : 0;

  // SVG Progress Ring calculations
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  // Filtered Chats list
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.warning} />
        <Text style={styles.loadingText}>Connecting to AI Tutor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chats' && styles.activeTabButton]}
          onPress={() => setActiveTab('chats')}
        >
          <MessageSquare size={16} color={activeTab === 'chats' ? colors.warning : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>Conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'goals' && styles.activeTabButton]}
          onPress={() => setActiveTab('goals')}
        >
          <CheckCircle2 size={16} color={activeTab === 'goals' ? colors.warning : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Study Checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bookmarks' && styles.activeTabButton]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Bookmark size={16} color={activeTab === 'bookmarks' ? colors.warning : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>Saved Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'chats' && (
          <View style={{ flex: 1 }}>
            {/* Search and Start Row */}
            <View style={styles.actionHeader}>
              <View style={styles.searchWrapper}>
                <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search chats..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.newChatBtn} onPress={handleCreateChat}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {filteredChats.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Brain size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySubtitle}>Start a chat session with the AI Tutor to clear your concepts, plan syllabus, or run customized flashcard quizzes.</Text>
                <TouchableOpacity style={styles.startSessionBtn} onPress={handleCreateChat}>
                  <Sparkles size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.startSessionBtnText}>Start Learning Session</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredChats}
                keyExtractor={(item) => item.chat_id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.warning]} />
                }
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.chatCard}
                    onPress={() =>
                      navigation.navigate('AiTutorChat', {
                        chatId: item.chat_id,
                        chatTitle: item.title,
                      })
                    }
                  >
                    <View style={styles.chatAvatar}>
                      <Sparkles size={18} color={colors.warning} />
                    </View>
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.chatMeta}>
                        Session · {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.chatActions}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handleOpenRename(item.chat_id, item.title)}
                      >
                        <Edit2 size={15} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handleDeleteChat(item.chat_id)}
                      >
                        <Trash2 size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={{ flex: 1 }}>
            {/* Progress Header widget */}
            <View style={styles.progressCard}>
              <View style={styles.progressRingWrapper}>
                <Svg width="76" height="76" viewBox="0 0 76 76">
                  {/* Background Circle */}
                  <SvgCircle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="transparent"
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                  />
                  {/* Active Progress Circle */}
                  <SvgCircle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="transparent"
                    stroke={colors.warning}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 38 38)"
                  />
                </Svg>
                <View style={styles.progressRingTextWrapper}>
                  <Text style={styles.progressPct}>{progressPct}%</Text>
                </View>
              </View>

              <View style={styles.progressMeta}>
                <Text style={styles.progressTitle}>Daily Study Goals</Text>
                <Text style={styles.progressDesc}>
                  {checkedGoals} of {goals.length} checklist items completed today
                </Text>
              </View>
            </View>

            {/* Goal Input form */}
            <View style={styles.goalInputRow}>
              <TextInput
                placeholder="Add a new checklist goal..."
                placeholderTextColor={colors.textMuted}
                style={styles.goalInput}
                value={newGoalText}
                onChangeText={setNewGoalText}
              />
              <TouchableOpacity style={styles.addGoalBtn} onPress={handleCreateGoal}>
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CheckCircle2 size={44} color={colors.border} />
                <Text style={styles.emptyTitle}>Checklist is empty</Text>
                <Text style={styles.emptySubtitle}>Write down key topics you plan to master today. The AI Tutor helps track your focus.</Text>
              </View>
            ) : (
              <FlatList
                data={goals}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.warning]} />
                }
                renderItem={({ item }) => (
                  <View style={styles.goalRow}>
                    <TouchableOpacity
                      onPress={() => handleToggleGoal(item.id, item.checked)}
                      style={styles.goalCheckArea}
                    >
                      {item.checked ? (
                        <CheckCircle2 size={20} color={colors.success} />
                      ) : (
                        <Circle size={20} color={colors.textMuted} />
                      )}
                      <Text style={[styles.goalText, item.checked && styles.goalTextCompleted]}>
                        {item.text}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(item.id)}
                      style={styles.goalDeleteBtn}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'bookmarks' && (
          <View style={{ flex: 1 }}>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bookmark size={44} color={colors.border} />
                <Text style={styles.emptyTitle}>No saved notes yet</Text>
                <Text style={styles.emptySubtitle}>Save key summary notes during active chat sessions with the tutor. Saved notes appear here for easy revision.</Text>
              </View>
            ) : (
              <FlatList
                data={bookmarks}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.warning]} />
                }
                renderItem={({ item }) => (
                  <View style={styles.bookmarkCard}>
                    <View style={styles.bookmarkHeader}>
                      <Bookmark size={16} color={colors.warning} />
                      <Text style={styles.bookmarkDate}>
                        Saved {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.bookmarkText}>{item.title}</Text>
                    <View style={styles.bookmarkFooter}>
                      <TouchableOpacity
                        style={styles.bookmarkDeleteBtn}
                        onPress={() => handleDeleteBookmark(item.id)}
                      >
                        <Trash2 size={14} color={colors.danger} style={{ marginRight: 4 }} />
                        <Text style={styles.bookmarkDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>

      {/* Edit Chat Title Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Conversation</Text>
            <TextInput
              style={styles.modalInput}
              value={editChatTitle}
              onChangeText={setEditChatTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleRenameChat}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.warning,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: colors.primary,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.warning,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  startSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  startSessionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  chatMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  progressRingWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressRingTextWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressMeta: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  goalInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  goalInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.primary,
  },
  addGoalBtn: {
    width: 42,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  goalCheckArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  goalText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  goalTextCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  goalDeleteBtn: {
    padding: 6,
  },
  bookmarkCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  bookmarkDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  bookmarkText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  bookmarkFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
    marginTop: 12,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  bookmarkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  bookmarkDeleteText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
  },
  modalCancelText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  modalSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.warning,
  },
  modalSaveText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
});

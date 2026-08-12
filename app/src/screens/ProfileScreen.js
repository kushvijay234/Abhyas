import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { api, setBaseURL } from '../services/api';
import colors from '../theme/colors';
import { User, Shield, Globe, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const { logout, updateProfileState } = useAuth();
  
  // Profile update form states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  
  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // API URL state
  const [apiUrl, setApiUrl] = useState('http://10.0.2.2:5000/api');
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await api.auth.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setUsername(res.data.user_name || '');
        setPhone(res.data.phone || '');
        setBio(res.data.bio || '');
      }
      
      const storedUrl = await AsyncStorage.getItem('abhyas_api_url');
      if (storedUrl) setApiUrl(storedUrl);
    } catch (err) {
      console.warn('Profile fetch failed:', err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!username) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.updateProfile({
        user_name: username,
        phone: phone || null,
        bio: bio || null
      });

      if (res.success && res.data) {
        await updateProfileState(res.data);
        Alert.alert('Success', 'Profile updated successfully!');
        fetchProfile();
      } else {
        Alert.alert('Failed', res.message || 'Update failed.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        Alert.alert('Success', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        Alert.alert('Failed', res.message || 'Password update failed.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAPI = async () => {
    try {
      await AsyncStorage.setItem('abhyas_api_url', apiUrl);
      setBaseURL(apiUrl);
      Alert.alert('Success', 'API base URL updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save configuration.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Header Profile card */}
      <View style={styles.avatarCard}>
        <Image
          source={{ uri: profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username || 'Student'}` }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.user_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Edit Profile Form */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Account Settings</Text>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Doe"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 9876543210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Bio / Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write a brief profile description..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.actionBtn} onPress={handleUpdateProfile} disabled={loading}>
          <Text style={styles.actionBtnText}>Update Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Password Form */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Security & Privacy</Text>
        </View>

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning }]} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.actionBtnText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* API Endpoint configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Globe size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>API Host Settings</Text>
        </View>

        <Text style={styles.label}>Backend Endpoint URL</Text>
        <TextInput
          style={styles.input}
          placeholder="http://192.168.1.X:5000/api"
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
        />

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.textMuted }]} onPress={handleUpdateAPI} disabled={loading}>
          <Text style={styles.actionBtnText}>Update API Endpoint</Text>
        </TouchableOpacity>
      </View>

      {/* Log out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={18} color="#ffffff" />
        <Text style={styles.logoutBtnText}>Sign Out Account</Text>
      </TouchableOpacity>
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
  avatarCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 10,
  },
  roleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
  },
  card: {
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,107,0.06)',
    paddingBottom: 8,
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.primary,
    backgroundColor: '#fafbfe',
  },
  textArea: {
    height: 60,
    paddingVertical: 8,
    textAlignVertical: 'top', // Android behavior for top text input alignment
  },
  actionBtn: {
    backgroundColor: colors.primary,
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

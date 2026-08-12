import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { setBaseURL } from '../services/api';
import colors from '../theme/colors';
import { Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getDynamicHost = () => {
    if (__DEV__) {
      const scriptURL = NativeModules.SourceCode?.scriptURL || '';
      const match = scriptURL.match(/^https?:\/\/([^:/]+)(:\d+)?/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:5000/api`;
      }
      return 'http://10.0.2.2:5000/api';
    }
    return 'https://abhyas-backend-g8pp.onrender.com/api';
  };

  const [apiUrl, setApiUrl] = useState(getDynamicHost());
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    // Load stored API URL if exists
    AsyncStorage.getItem('abhyas_api_url').then((val) => {
      if (val) {
        setApiUrl(val);
      } else {
        // Fallback to dynamic host
        setApiUrl(getDynamicHost());
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(false);
      // Save current API URL configuration
      await AsyncStorage.setItem('abhyas_api_url', apiUrl);
      setBaseURL(apiUrl);

      setLoading(true);
      const res = await login(email, password);
      if (res.success) {
        // Success: Context handles redirection by updating state, which changes navigator
      } else {
        Alert.alert('Login Failed', res.message || 'Check credentials.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>Abhyas</Text>
          <Text style={styles.tagline}>Your Abhyas, Your Success</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Student Portal Sign In</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="student@abhyas.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeBtn} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textMuted} />
              ) : (
                <Eye size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  tagline: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fbff',
    borderWidth: 2,
    borderColor: '#e6edf8',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    color: colors.primary,
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: 'bold',
  },
  configToggle: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  configToggleText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  configCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  configInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.primary,
  },
  configHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fbff',
    borderWidth: 2,
    borderColor: '#e6edf8',
    borderRadius: 10,
    height: 48,
    paddingRight: 14,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: colors.primary,
    fontSize: 14,
  },
  eyeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
});

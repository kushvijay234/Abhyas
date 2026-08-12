import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(username, email, password);
      if (res.success) {
        Alert.alert('Success', 'Registration completed successfully! Please sign in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Registration Failed', res.message || 'Error occurred.');
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
          <Text style={styles.tagline}>Create Your Account</Text>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Student Registration</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create password"
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

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            <Text style={styles.registerBtnText}>{loading ? 'Registering...' : 'Register'}</Text>
          </TouchableOpacity>

          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
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
  registerBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerBtnText: {
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

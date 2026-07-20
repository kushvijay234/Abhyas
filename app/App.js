import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import colors from './src/theme/colors';

// Icons
import { LayoutDashboard, BookOpen, ClipboardList, History, Trophy, User } from 'lucide-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CourseBrowserScreen from './src/screens/CourseBrowserScreen';
import CourseDetailsScreen from './src/screens/CourseDetailsScreen';
import MyExamsScreen from './src/screens/MyExamsScreen';
import ExamConsoleScreen from './src/screens/ExamConsoleScreen';
import ExamResultScreen from './src/screens/ExamResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'DashboardTab') {
            return <LayoutDashboard size={size} color={color} />;
          } else if (route.name === 'CoursesTab') {
            return <BookOpen size={size} color={color} />;
          } else if (route.name === 'MyExamsTab') {
            return <ClipboardList size={size} color={color} />;
          } else if (route.name === 'HistoryTab') {
            return <History size={size} color={color} />;
          } else if (route.name === 'LeaderboardTab') {
            return <Trophy size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <User size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: colors.warning,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.primary,
          fontSize: 16,
        },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard', headerTitle: 'Abhyas Dashboard' }} 
      />
      <Tab.Screen 
        name="CoursesTab" 
        component={CourseBrowserScreen} 
        options={{ title: 'Courses', headerTitle: 'Course Catalogue' }} 
      />
      <Tab.Screen 
        name="MyExamsTab" 
        component={MyExamsScreen} 
        options={{ title: 'Exams', headerTitle: 'My Exams' }} 
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={HistoryScreen} 
        options={{ title: 'History', headerTitle: 'Attempt History' }} 
      />
      <Tab.Screen 
        name="LeaderboardTab" 
        component={LeaderboardScreen} 
        options={{ title: 'Leaderboard', headerTitle: 'Scoreboard' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ title: 'Profile', headerTitle: 'My Profile' }} 
      />
    </Tab.Navigator>
  );
}

// App routing controller based on auth state
function NavigationController() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing Abhyas...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token === null ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Authenticated Stack
          <>
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen 
              name="CourseDetails" 
              component={CourseDetailsScreen} 
              options={{ 
                headerShown: true, 
                title: 'Course Details',
                headerTitleStyle: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
                headerTitleAlign: 'center',
                headerTintColor: colors.primary,
                headerStyle: { borderBottomWidth: 1, borderBottomColor: colors.border }
              }} 
            />
            <Stack.Screen name="ExamConsole" component={ExamConsoleScreen} />
            <Stack.Screen name="ExamResult" component={ExamResultScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <NavigationController />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
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
});

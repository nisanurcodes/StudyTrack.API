import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import DashboardScreen from '../screens/DashboardScreen'
import TasksScreen from '../screens/TasksScreen'
import ProfileScreen from '../screens/ProfileScreen'
import Colors from '../constants/colors'

// ── Auth Stack (Login / Register) ──────────────────────────────────────────
const AuthStack = createNativeStackNavigator()

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

// ── Tab icon ───────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator()

function TabIcon({ emoji, focused }) {
  return (
    <View style={[tabIconStyles.container, focused && tabIconStyles.focused]}>
      <Text style={tabIconStyles.emoji}>{emoji}</Text>
    </View>
  )
}

const tabIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Dokunma hedefini genişlet — minimum 44×44 pt (Apple HIG / Material)
    minWidth: 44,
    minHeight: 44,
  },
  focused: {
    // İkon arka planı isteğe bağlı olarak eklenebilir
  },
  emoji: {
    fontSize: 22,
  },
})

// ── Main Tab Navigator ─────────────────────────────────────────────────────
function MainNavigator() {
  const insets    = useSafeAreaInsets()
  const { theme } = useTheme()

  const TAB_CONTENT_HEIGHT = 56
  const bottomPad  = Math.max(insets.bottom, 4)
  const tabBarHeight = TAB_CONTENT_HEIGHT + bottomPad

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopWidth: 2,
          borderTopColor: theme.soft100,
          // Sabit height yerine dinamik: görsel yükseklik + cihaz bottom inset
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomPad,
          // Gölge
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
          // zIndex: tab bar üstteki hiçbir içeriğe göre daha üstte değil,
          // sadece kendi ekranından yüksek
          position: 'relative',
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: '#bbb',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        // Ekran içeriği tab bar'ın altında kaybolmasın
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '🏠' : '🏡'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Görevler',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '✅' : '📝'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '🌸' : '👤'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// ── Loading ekranı ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.emoji}>📚</Text>
      <Text style={loadingStyles.title}>StudyTrack</Text>
      <ActivityIndicator
        color={Colors.primary}
        size="large"
        style={{ marginTop: 16 }}
      />
    </View>
  )
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.primaryDark },
})

// ── Ana navigatör — auth durumuna göre dal ─────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}

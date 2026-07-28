import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Innovator Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import InnovatorDashboard from './src/screens/InnovatorDashboard';
import MyProjectsScreen from './src/screens/MyProjectsScreen';
import BrowseOpportunitiesScreen from './src/screens/BrowseOpportunitiesScreen';
import MyApplicationsScreen from './src/screens/MyApplicationsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Funder Screens
import FunderDashboard from './src/screens/FunderDashboard';
import PostOpportunity from './src/screens/PostOpportunity';
import MyOpportunities from './src/screens/MyOpportunities';
import ReceivedApplications from './src/screens/ReceivedApplications';

// Club Screens (real) — kept here but not part of the auth-gated
// stack. Per the Phase 1 implementation plan, Club integration is
// deferred; the source files remain untouched for a later phase.
import ClubRegistrationScreen from './src/screens/club/ClubRegistrationScreen';
import ClubMembershipScreen from './src/screens/club/ClubMembershipScreen';
import ClubDashboardScreen from './src/screens/club/ClubDashboardScreen';
import ClubActivitiesScreen from './src/screens/club/ClubActivitiesScreen';
import ActivityDetailScreen from './src/screens/club/ActivityDetailScreen';
import MyActivitiesScreen from './src/screens/club/MyActivitiesScreen';
import ClubLeadershipScreen from './src/screens/club/ClubLeadershipScreen';
import ApplyLeadershipScreen from './src/screens/club/ApplyLeadershipScreen';
import ClubCreateProject from './src/screens/club/ClubCreateProject';
import ClubProjectDetailScreen from './src/screens/club/ClubProjectDetailScreen';
import MeetingDetailScreen from './src/screens/club/MeetingDetailScreen';
import ClubResourcesScreen from './src/screens/club/ClubResourcesScreen';

const Stack = createStackNavigator();

// Public stack — visible to anyone (signed out OR signed in, since
// LandingScreen offers a sign-out affordance).
const PublicStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Innovator stack — gated to role === 'innovator' (or any non-funder).
const InnovatorStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={InnovatorDashboard} />
    <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
    <Stack.Screen name="BrowseOpportunities" component={BrowseOpportunitiesScreen} />
    <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
    <Stack.Screen name="Messages" component={MessagesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// Funder stack — gated to role === 'funder'.
const FunderStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FunderDashboard" component={FunderDashboard} />
    <Stack.Screen name="PostOpportunity" component={PostOpportunity} />
    <Stack.Screen name="MyOpportunities" component={MyOpportunities} />
    <Stack.Screen name="ReceivedApplications" component={ReceivedApplications} />
    <Stack.Screen name="Messages" component={MessagesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

/**
 * Root navigator. Renders one of three stacks based on the auth
 * context:
 *   - not hydrated → splash spinner
 *   - hydrated, !user → PublicStack
 *   - role === 'funder' → FunderStack
 *   - anything else   → InnovatorStack
 *
 * Club screens are intentionally NOT registered here. They live in
 * their own tab/menu and the Club integration is deferred; we keep
 * the source files around (Phase 0 promise) but do not put them in
 * the gated auth flow.
 */
function RootNavigator() {
  const { hydrated, user, role } = useAuth();

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.splashText}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <PublicStack />
      </NavigationContainer>
    );
  }

  if (role === 'funder') {
    return (
      <NavigationContainer>
        <FunderStack />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <InnovatorStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
        </SafeAreaView>
      </AuthProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
});
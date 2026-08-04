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

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { linking } from './src/navigation/linking';

// Innovator Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import InnovatorDashboard from './src/screens/InnovatorDashboard';
import MyProjectsScreen from './src/screens/MyProjectsScreen';
import InnovationProjectCreateScreen from './src/screens/InnovationProjectCreateScreen';
import InnovationProjectDetailScreen from './src/screens/InnovationProjectDetailScreen';
import BrowseOpportunitiesScreen from './src/screens/BrowseOpportunitiesScreen';
import MyApplicationsScreen from './src/screens/MyApplicationsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Funder Screens
import FunderDashboard from './src/screens/FunderDashboard';
import PostOpportunity from './src/screens/PostOpportunity';
import MyOpportunities from './src/screens/MyOpportunities';
import ReceivedApplications from './src/screens/ReceivedApplications';

// Phase 2 — verification + password recovery
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import CheckEmailScreen from './src/screens/CheckEmailScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createStackNavigator();

/**
 * Single NavigationContainer. The `linking` prop (see
 * src/navigation/linking.js) maps the `innovationmobile://verify?token=…`
 * and `innovationmobile://reset-password?token=…` URLs to the screens
 * below. Both routes are included in every group — public, innovator,
 * funder — so a deep link arrives whether the user is signed in or not.
 *
 * The splash overlay sits *above* the container and is gated on the
 * auth hydration flag. Once hydrated, the splash unmounts and the
 * container takes over without remounting (which would re-read
 * Linking.getInitialURL and double-consume the verify token).
 */
function RootNavigator() {
  const { hydrated, user, role } = useAuth();
  const isFunder = role === 'funder';

  return (
    <View style={{ flex: 1 }}>
      {!hydrated && (
        <View style={styles.splash} pointerEvents="none">
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.splashText}>Loading…</Text>
        </View>
      )}

      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // Public group — visible to anyone signed out.
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          ) : isFunder ? (
            // Funder group.
            <>
              <Stack.Screen name="FunderDashboard" component={FunderDashboard} />
              <Stack.Screen name="PostOpportunity" component={PostOpportunity} />
              <Stack.Screen name="MyOpportunities" component={MyOpportunities} />
              <Stack.Screen
                name="ReceivedApplications"
                component={ReceivedApplications}
              />
              <Stack.Screen name="Messages" component={MessagesScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              {/* Deep-link routes must remain reachable while signed in so
                  a verify-link tap on a signed-in device refreshes in place. */}
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              {/* Sign-out affordance / cross-link to auth from any role screen. */}
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Landing" component={LandingScreen} />
            </>
          ) : (
            // Innovator group (and any other non-funder role).
            <>
              <Stack.Screen name="Dashboard" component={InnovatorDashboard} />
              <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
              <Stack.Screen
                name="InnovationProjectCreate"
                component={InnovationProjectCreateScreen}
              />
              <Stack.Screen
                name="InnovationProjectDetail"
                component={InnovationProjectDetailScreen}
              />
              <Stack.Screen
                name="BrowseOpportunities"
                component={BrowseOpportunitiesScreen}
              />
              <Stack.Screen
                name="MyApplications"
                component={MyApplicationsScreen}
              />
              <Stack.Screen name="Messages" component={MessagesScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Landing" component={LandingScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splashText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
});

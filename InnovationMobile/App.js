import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, StatusBar } from 'react-native';

import { AppProvider } from './src/context/AppContext';

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

// Club Screens (real)
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

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Auth Screens */}
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* Innovator Screens */}
            <Stack.Screen name="Dashboard" component={InnovatorDashboard} />
            <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
            <Stack.Screen name="BrowseOpportunities" component={BrowseOpportunitiesScreen} />
            <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />

            {/* Funder Screens */}
            <Stack.Screen name="FunderDashboard" component={FunderDashboard} />
            <Stack.Screen name="PostOpportunity" component={PostOpportunity} />
            <Stack.Screen name="MyOpportunities" component={MyOpportunities} />
            <Stack.Screen name="ReceivedApplications" component={ReceivedApplications} />

            {/* Club Member Screens */}
            <Stack.Screen name="ClubRegistration" component={ClubRegistrationScreen} />
            <Stack.Screen name="ClubMembership" component={ClubMembershipScreen} />
            <Stack.Screen name="ClubDashboard" component={ClubDashboardScreen} />
            <Stack.Screen name="ClubActivities" component={ClubActivitiesScreen} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
            <Stack.Screen name="MyActivities" component={MyActivitiesScreen} />
            <Stack.Screen name="ClubLeadership" component={ClubLeadershipScreen} />
            <Stack.Screen name="ApplyLeadership" component={ApplyLeadershipScreen} />
            <Stack.Screen name="ClubCreateProject" component={ClubCreateProject} />
            <Stack.Screen name="ClubProjectDetail" component={ClubProjectDetailScreen} />
            <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} />
            <Stack.Screen name="ClubResources" component={ClubResourcesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </AppProvider>
  );
}

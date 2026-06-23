import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, StatusBar } from 'react-native';

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

const Stack = createStackNavigator();

export default function App() {
  return (
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

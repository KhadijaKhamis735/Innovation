import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

const innovatorMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', screen: 'Dashboard' },
  { id: 'projects', label: 'My Projects', icon: '📁', screen: 'MyProjects' },
  { id: 'opportunities', label: 'Browse Opportunities', icon: '🔍', screen: 'BrowseOpportunities' },
  { id: 'applications', label: 'My Applications', icon: '📝', screen: 'MyApplications' },
  { id: 'messages', label: 'Messages', icon: '💬', screen: 'Messages' },
  { id: 'settings', label: 'Settings', icon: '⚙️', screen: 'Settings' },
];

const funderMenuItems = [
  { id: 'funderDashboard', label: 'Dashboard', icon: '📊', screen: 'FunderDashboard' },
  { id: 'postOpportunity', label: 'Post Opportunity', icon: '➕', screen: 'PostOpportunity' },
  { id: 'myOpportunities', label: 'My Opportunities', icon: '📢', screen: 'MyOpportunities' },
  { id: 'receivedApps', label: 'Applications', icon: '📋', screen: 'ReceivedApplications' },
  { id: 'messages', label: 'Messages', icon: '💬', screen: 'Messages' },
  { id: 'settings', label: 'Settings', icon: '⚙️', screen: 'Settings' },
];

// Club Member menu — uses the same component shape as the other two
// menus. Section dividers (object with type:'divider') render as a thin
// horizontal rule so the user can see where Innovation ends and Club
// begins when they have both roles.
const clubMenuItems = [
  { id: 'clubDashboard', label: 'Club Dashboard', icon: '🎓', screen: 'ClubDashboard' },
  { id: 'clubMembership', label: 'Membership', icon: '✅', screen: 'ClubMembership' },
  { id: 'clubActivities', label: 'Club Activities', icon: '🎯', screen: 'ClubActivities' },
  { id: 'myActivities', label: 'My Activities', icon: '📅', screen: 'MyActivities' },
  { id: 'clubLeadership', label: 'Leadership & Meetings', icon: '👥', screen: 'ClubLeadership' },
  { id: 'applyLeadership', label: 'Apply for Leadership', icon: '🏅', screen: 'ApplyLeadership' },
  { id: 'clubResources', label: 'Club Resources', icon: '📚', screen: 'ClubResources' },
  { type: 'divider' },
  { id: 'innovatorDashboard', label: 'Innovation Dashboard', icon: '📊', screen: 'Dashboard' },
  { id: 'myProjects', label: 'My Projects', icon: '📁', screen: 'MyProjects' },
  { id: 'browseOpportunities', label: 'Browse Opportunities', icon: '🔍', screen: 'BrowseOpportunities' },
  { id: 'myApplications', label: 'My Applications', icon: '📝', screen: 'MyApplications' },
  { id: 'settings', label: 'Settings', icon: '⚙️', screen: 'Settings' },
];

export default function Sidebar({ activeScreen, onNavigate, onClose, navigation, userType = 'innovator', isClubMember = false }) {
  // If the user has joined the club, always show the club menu — even
  // when the screen that opened the Sidebar was the Innovator Dashboard.
  // This is what makes a single login serve both modules.
  const menuItems =
    userType === 'funder' ? funderMenuItems :
    (userType === 'clubMember' || isClubMember) ? clubMenuItems :
    innovatorMenuItems;

  const handlePress = (item) => {
    onNavigate(item.id);
    onClose();
    if (navigation && item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const performLogout = () => {
    // Reset the stack so the user can't navigate back to authenticated screens.
    // The user has already tapped the explicit Logout button, so no second
    // confirmation is needed.
    try {
      if (navigation && typeof navigation.dispatch === 'function') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          }),
        );
        return;
      }
      if (navigation && typeof navigation.reset === 'function') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
        return;
      }
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Landing');
      }
    } catch (err) {
      // Last-ditch fallback so the user is never stranded.
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Landing');
      }
    }
  };

  const handleLogout = () => {
    onClose();
    performLogout();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sidebar}>
        {/* Header - Fixed at top */}
        <LinearGradient
          colors={['#0a1f3c', '#0e4d8c']}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>ZSA</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>Innovation Hub</Text>
              <Text style={styles.logoSubtitle}>
                {userType === 'funder' ? 'Funder Portal'
                  : (userType === 'clubMember' || isClubMember) ? 'Club Member Portal'
                  : 'Innovator Portal'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu Items - Scrollable */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {menuItems.map((item, idx) => {
            if (item.type === 'divider') {
              return <View key={`div-${idx}`} style={styles.menuDivider} />;
            }
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  activeScreen === item.id && styles.menuItemActive,
                ]}
                onPress={() => handlePress(item)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.menuLabel,
                    activeScreen === item.id && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>FH</Text>
            </View>
            <View>
              <Text style={styles.userName}>Fatma Hassan</Text>
              <Text style={styles.userEmail}>fatma@example.com</Text>
            </View>
          </View>
          
          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.white,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  logoSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.white,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 20,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
  },
  menuLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexShrink: 0,
    backgroundColor: colors.white,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});

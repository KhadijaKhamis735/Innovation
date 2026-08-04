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
import { useAuth } from '../context/AuthContext';

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

export default function Sidebar({ activeScreen, onNavigate, onClose, navigation, userType = 'innovator' }) {
  const { user, signOut } = useAuth();

  // Two menus: innovator and funder. Club members/leaders authenticate
  // through the same register/login screen but route to a separate stack
  // (Phase 7 — wired later), so the Sidebar doesn't render a club menu.
  const menuItems =
    userType === 'funder' ? funderMenuItems : innovatorMenuItems;

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

  const handleLogout = async () => {
    onClose();
    // Phase 1: clear server-side refresh + local tokens, then reset the stack.
    try { await signOut(); } catch { /* best-effort */ }
    performLogout();
  };

  // Identity shown in the footer — sourced from the authenticated user.
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Signed out';
  const displayEmail = user?.email || '';
  const initials = (() => {
    if (!user) return '··';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    const combined = `${first}${last}`.trim();
    return combined || (user.email?.[0] || '?').toUpperCase();
  })();

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
                {userType === 'funder' ? 'Funder Portal' : 'Innovator Portal'}
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
          {menuItems.map((item) => (
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
          ))}
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{displayEmail}</Text>
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

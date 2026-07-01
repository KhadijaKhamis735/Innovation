import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useApp } from '../context/AppContext';

// Mirrors web `InnovatorDashboard` data
const stats = [
  { label: 'Active Projects', value: '3', icon: '📁', color: 'blue' },
  { label: 'Applications Sent', value: '5', icon: '📤', color: 'orange' },
  { label: 'In Review', value: '2', icon: '⏰', color: 'purple' },
  { label: 'Successful', value: '1', icon: '✅', color: 'green' },
];

const recentApplications = [
  { id: 1, title: 'Innovation Grant 2026', org: 'UNDP Tanzania', status: 'Under Review', date: 'May 15, 2026' },
  { id: 2, title: 'Youth Innovation Challenge', org: 'UNESCO', status: 'Submitted', date: 'May 12, 2026' },
  { id: 3, title: 'Tech Startup Fund', org: 'AfricArena', status: 'Accepted', date: 'May 5, 2026' },
];

const notifications = [
  { id: 1, title: 'Application Under Review', message: 'Your application for Innovation Grant 2026 is being reviewed', time: '2 hours ago', unread: true },
  { id: 2, title: 'New Opportunity Available', message: 'New funding opportunity from Gates Foundation', time: '1 day ago', unread: true },
  { id: 3, title: 'Project Milestone Completed', message: 'Your project Smart Water Monitor reached Prototype phase', time: '3 days ago', unread: false },
];

const quickActions = [
  { label: 'Browse Opportunities', icon: '🔍', screen: 'BrowseOpportunities', color: 'primary' },
  { label: 'My Applications', icon: '📄', screen: 'MyApplications', color: 'secondary' },
  { label: 'View Projects', icon: '📁', screen: 'MyProjects', color: 'secondary' },
];

// Mirrors the web's AuthContext.opportunities
const opportunities = [
  { id: 1, title: 'Innovation Grant 2026', org: 'UNDP Tanzania', type: 'Grant', amount: '$5,000', deadline: '2026-06-10' },
  { id: 2, title: 'Youth Innovation Challenge', org: 'UNESCO', type: 'Challenge', amount: '$3,000', deadline: '2026-07-01' },
  { id: 3, title: 'Tech Startup Fund', org: 'AfricArena', type: 'Acceleration', amount: '$25,000', deadline: '2026-08-15' },
];

const helpItems = [
  { title: 'My Projects', desc: 'Track your project milestones', icon: '📁', screen: 'MyProjects' },
  { title: 'Browse Opportunities', desc: 'Find funding for your innovation', icon: '🔍', screen: 'BrowseOpportunities' },
  { title: 'Settings', desc: 'Manage your account', icon: '⚙️', screen: 'Settings' },
];

const formatDeadline = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusPalette = (status) => {
  switch (status) {
    case 'Under Review': return { bg: colors.statusReviewBg, text: colors.statusReviewText };
    case 'Submitted':   return { bg: colors.statusSubmittedBg, text: colors.statusSubmittedText };
    case 'Accepted':    return { bg: colors.statusAcceptedBg, text: colors.statusAcceptedText };
    case 'Rejected':    return { bg: colors.statusRejectedBg, text: colors.statusRejectedText };
    default:            return { bg: colors.border, text: colors.textSecondary };
  }
};

const getStatPalette = (color) => {
  switch (color) {
    case 'blue':   return { bg: colors.blueLight, fg: colors.blue };
    case 'orange': return { bg: colors.primaryLight, fg: colors.primary };
    case 'purple': return { bg: colors.purpleLight, fg: colors.purple };
    case 'green':  return { bg: colors.greenLight, fg: colors.green };
    default:       return { bg: colors.primaryLight, fg: colors.primary };
  }
};

export default function InnovatorDashboard({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('dashboard');

  // Pull user + club status from context so the Sidebar and Quick
  // Actions can react to the user's role(s).
  const { user: appUser, isClubMember } = useApp();

  // Mirrors the web's `user?.firstName`
  const user = { firstName: appUser.firstName || 'Innovator', lastName: appUser.lastName || '' };

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const unreadCount = notifications.filter((n) => n.unread).length;
  const userInitials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`;

  return (
    <View style={styles.root}>
      {/* Sidebar drawer (overlays everything) */}
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          isClubMember={isClubMember}
        />
      )}

      {/* Top bar — mirrors web .top-bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Welcome back, {user.firstName}!
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setNotifOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.iconBtnText}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>
      </View>

      {/* Scrollable dashboard body */}
      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        alwaysBounceVertical={true}
        bounces={true}
      >
        {/* Stats grid — 2 cols on mobile (4 on web) */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => {
            const palette = getStatPalette(stat.color);
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.statIconText, { color: palette.fg }]}>
                    {stat.icon}
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Applications — full-width card, vertical list */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyApplications')}>
              <Text style={styles.cardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appsList}>
            {recentApplications.map((app) => {
              const palette = getStatusPalette(app.status);
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.appCard}
                  onPress={() => navigation.navigate('MyApplications')}
                  activeOpacity={0.7}
                >
                  <View style={styles.appCardHeader}>
                    <Text style={styles.appTitle} numberOfLines={1}>{app.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: palette.text }]}>
                        {app.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.appOrg}>{app.org}</Text>
                  <Text style={styles.appDate}>{app.date}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => {
              const isPrimary = action.color === 'primary';
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.quickActionBtn,
                    isPrimary ? styles.quickActionPrimary : styles.quickActionSecondary,
                  ]}
                  onPress={() => navigation.navigate(action.screen)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      isPrimary ? styles.quickActionIconPrimary : styles.quickActionIconSecondary,
                    ]}
                  >
                    <Text style={styles.quickActionIconText}>{action.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.quickActionLabel,
                      isPrimary && styles.quickActionLabelPrimary,
                    ]}
                  >
                    {action.label}
                  </Text>
                  <Text
                    style={[
                      styles.quickActionArrow,
                      isPrimary && styles.quickActionArrowPrimary,
                    ]}
                  >
                    →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Latest Opportunities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Latest Opportunities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BrowseOpportunities')}>
              <Text style={styles.cardLink}>Browse All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.oppList}>
            {opportunities.map((opp) => (
              <TouchableOpacity
                key={opp.id}
                style={styles.oppItem}
                onPress={() => navigation.navigate('BrowseOpportunities')}
                activeOpacity={0.7}
              >
                <View style={styles.oppHeader}>
                  <Text style={styles.oppTitle} numberOfLines={1}>{opp.title}</Text>
                  <View style={styles.oppTypeBadge}>
                    <Text style={styles.oppTypeBadgeText}>{opp.type}</Text>
                  </View>
                </View>
                <Text style={styles.oppOrg}>{opp.org}</Text>
                <View style={styles.oppMeta}>
                  <Text style={styles.oppAmount}>{opp.amount}</Text>
                  <Text style={styles.oppDeadline}>📅 {formatDeadline(opp.deadline)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Club — surfaces the club module from the innovator side */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Club</Text>
              <Text style={styles.cardSubtitle}>
                {isClubMember
                  ? 'You\'re a member. Access club activities, leadership, and your shared projects.'
                  : 'Join the club to unlock activities, leadership, and shared projects.'}
              </Text>
            </View>
          </View>

          <View style={styles.clubRow}>
            <View style={[styles.clubBadge, isClubMember ? styles.clubBadgeActive : styles.clubBadgeInactive]}>
              <Text style={styles.clubBadgeIcon}>{isClubMember ? '🎓' : '✚'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clubLabel}>
                {isClubMember ? 'Club membership' : 'Become a club member'}
              </Text>
              <Text style={styles.clubMeta}>
                {isClubMember
                  ? `Status: ${appUser.membershipStatus}`
                  : 'Pick your university + reg number'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.clubBtn, isClubMember ? styles.clubBtnSecondary : styles.clubBtnPrimary]}
              onPress={() =>
                navigation.navigate(isClubMember ? 'ClubDashboard' : 'ClubRegistration')
              }
            >
              <Text style={[styles.clubBtnText, isClubMember ? styles.clubBtnTextSecondary : styles.clubBtnTextPrimary]}>
                {isClubMember ? 'Open →' : 'Join →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Resources */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Help & Resources</Text>
          </View>

          <View style={styles.helpList}>
            {helpItems.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.helpItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.helpIcon}>
                  <Text style={styles.helpIconText}>{item.icon}</Text>
                </View>
                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>{item.title}</Text>
                  <Text style={styles.helpDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Notifications modal — replaces the web dropdown */}
      <Modal
        visible={notifOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNotifOpen(false)}
      >
        <Pressable style={styles.notifOverlay} onPress={() => setNotifOpen(false)}>
          <Pressable style={styles.notifSheet} onPress={() => {}}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifOpen(false)}>
                <Text style={styles.notifClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notifList}>
              {notifications.map((n) => (
                <View
                  key={n.id}
                  style={[styles.notifItem, n.unread && styles.notifItemUnread]}
                >
                  <View style={styles.notifDotCol}>
                    {n.unread && <View style={styles.notifDot} />}
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifItemTitle}>{n.title}</Text>
                    <Text style={styles.notifItemMessage}>{n.message}</Text>
                    <Text style={styles.notifItemTime}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Top bar — mirrors web .top-bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  topBarCenter: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: {
    fontSize: 18,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Body */
  body: {
    // flex intentionally not set — explicit pixel height applied via inline style
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bottomPad: {
    height: 24,
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 20,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Recent applications — vertical stack */
  appsList: {
    gap: 10,
  },
  appCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  appTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  appDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  /* Quick actions */
  quickActions: {
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  quickActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  quickActionSecondary: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickActionIconSecondary: {
    backgroundColor: colors.primaryLight,
  },
  quickActionIconText: {
    fontSize: 16,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickActionLabelPrimary: {
    color: colors.white,
  },
  quickActionArrow: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
  quickActionArrowPrimary: {
    color: colors.white,
  },

  /* Opportunities */
  oppList: {
    gap: 10,
  },
  oppItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  oppTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  oppTypeBadge: {
    backgroundColor: colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  oppTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.blue,
  },
  oppOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  oppMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  oppAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
  },
  oppDeadline: {
    fontSize: 11,
    color: colors.textMuted,
  },

  /* Help */
  helpList: {
    gap: 10,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 12,
  },

  /* Club card on Innovator Dashboard */
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  clubBadge: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  clubBadgeActive:   { backgroundColor: colors.greenLight },
  clubBadgeInactive: { backgroundColor: colors.primaryLight },
  clubBadgeIcon: { fontSize: 22 },
  clubLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  clubMeta:  { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  clubBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clubBtnPrimary:   { backgroundColor: colors.primary },
  clubBtnSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  clubBtnText: { fontSize: 13, fontWeight: '700' },
  clubBtnTextPrimary:   { color: colors.white },
  clubBtnTextSecondary: { color: colors.textPrimary },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIconText: {
    fontSize: 18,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  helpDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  /* Notifications modal */
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  notifSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifClose: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: 6,
  },
  notifList: {
    paddingHorizontal: 4,
  },
  notifItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifItemUnread: {
    backgroundColor: colors.primaryLight,
  },
  notifDotCol: {
    width: 14,
    alignItems: 'center',
    paddingTop: 6,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifBody: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  notifItemMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifItemTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
});

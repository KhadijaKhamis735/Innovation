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

// Mirrors web `OrganizationDashboard` data
const stats = [
  { label: 'Active Opportunities', value: '3', icon: '📂', color: 'blue' },
  { label: 'Total Applications', value: '104', icon: '📝', color: 'orange' },
  { label: 'Under Review', value: '12', icon: '⏰', color: 'purple' },
  { label: 'Funded Projects', value: '8', icon: '✅', color: 'green' },
];

const phases = [
  { id: 'idea', label: 'Idea', color: '#0284c7' },
  { id: 'proposal', label: 'Proposal', color: '#d97706' },
  { id: 'prototype', label: 'Prototype', color: '#7c3aed' },
  { id: 'mvp', label: 'MVP', color: '#16a34a' },
  { id: 'scaling', label: 'Scaling', color: '#ea580c' },
];

const mockProjects = [
  {
    id: 1,
    name: 'Smart Water Monitor',
    innovator: 'Alex Johnson',
    category: 'IoT / Environment',
    phase: 'prototype',
    progress: 60,
    completedMilestones: ['idea-1', 'idea-2', 'idea-3', 'proposal-1', 'proposal-2', 'proposal-3', 'prototype-1'],
    description: 'IoT-based water quality monitoring system for rural communities.',
  },
  {
    id: 2,
    name: 'AI Crop Disease Detector',
    innovator: 'Fatima Hassan',
    category: 'AgriTech',
    phase: 'proposal',
    progress: 40,
    completedMilestones: ['idea-1', 'idea-2', 'idea-3'],
    description: 'Machine learning model to detect crop diseases from smartphone photos.',
  },
  {
    id: 3,
    name: 'Health Tracking App',
    innovator: 'Priya Mwangi',
    category: 'HealthTech',
    phase: 'mvp',
    progress: 80,
    completedMilestones: ['idea-1', 'idea-2', 'idea-3', 'proposal-1', 'proposal-2', 'proposal-3', 'prototype-1', 'prototype-2', 'prototype-3', 'mvp-1', 'mvp-2'],
    description: 'Mobile app for personal health monitoring.',
  },
];

const recentApplications = [
  { project: 'Smart Water Monitor', innovator: 'Alex Johnson', status: 'Under Review', date: 'May 18, 2026' },
  { project: 'AI Crop Detector', innovator: 'Fatima Hassan', status: 'Shortlisted', date: 'May 16, 2026' },
  { project: 'EduBot Platform', innovator: 'Priya Mwangi', status: 'Accepted', date: 'May 12, 2026' },
];

const activities = [
  { icon: 'apply', text: 'Alex Johnson applied to Green Tech Grant', time: '2 hours ago' },
  { icon: 'accept', text: 'Fatima Hassan was shortlisted', time: '5 hours ago' },
  { icon: 'post', text: 'You posted Women in STEM Accelerator', time: 'Yesterday' },
  { icon: 'reject', text: "James Odhiambo's application was rejected", time: '2 days ago' },
];

const statusConfig = {
  'Under Review': { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' },
  'Shortlisted': { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' },
  'Accepted': { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  'Rejected': { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' },
};

const phaseColors = {
  idea: { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' },
  proposal: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706' },
  prototype: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' },
  mvp: { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' },
  scaling: { bg: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' },
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

const getActivityPalette = (icon) => {
  switch (icon) {
    case 'apply':  return { bg: 'rgba(59, 130, 246, 0.12)', fg: '#0284c7' };
    case 'accept': return { bg: 'rgba(34, 197, 94, 0.12)', fg: '#16a34a' };
    case 'reject': return { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' };
    case 'post':   return { bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed' };
    default:       return { bg: colors.primaryLight, fg: colors.primary };
  }
};

export default function FunderDashboard({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('funderDashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  // Mirrors the web's `user?.name`
  const user = { firstName: 'Organization', lastName: '' };

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const userInitials = `${user.firstName?.[0] || 'O'}${user.lastName?.[0] || ''}`;

  return (
    <View style={styles.root}>
      {/* Sidebar drawer (overlays everything) */}
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="funder"
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
          <Text style={styles.pageTitle}>Funder Dashboard</Text>
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
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
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

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('PostOpportunity')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>➕</Text>
              </View>
              <Text style={styles.quickActionLabel}>Post New Opportunity</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('ReceivedApplications')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>📋</Text>
              </View>
              <Text style={styles.quickActionLabel}>Review Applications</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('MyOpportunities')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>📢</Text>
              </View>
              <Text style={styles.quickActionLabel}>Manage Opportunities</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Funded Projects */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Funded Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReceivedApplications')}>
              <Text style={styles.cardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.projectsList}>
            {mockProjects.map((project) => {
              const phase = phaseColors[project.phase] || { bg: colors.primaryLight, color: colors.primary };
              return (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => setSelectedProject(project)}
                  activeOpacity={0.7}
                >
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    <View style={[styles.phaseBadge, { backgroundColor: phase.bg }]}>
                      <Text style={[styles.phaseBadgeText, { color: phase.color }]}>
                        {project.phase.charAt(0).toUpperCase() + project.phase.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.projectMeta}>{project.innovator} • {project.category}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{project.progress}%</Text>
                  </View>
                  <View style={styles.phaseTimeline}>
                    {phases.map((p) => {
                      const completed = project.completedMilestones.some(m => m.startsWith(p.id));
                      return (
                        <View key={p.id} style={[styles.timelinePhase, completed && styles.timelinePhaseCompleted]}>
                          <View style={[styles.phaseDot, { backgroundColor: p.color }]} />
                          <Text style={styles.phaseLabel}>{p.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Applications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReceivedApplications')}>
              <Text style={styles.cardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appsList}>
            {recentApplications.map((app, index) => {
              const palette = statusConfig[app.status] || { bg: colors.border, color: colors.textSecondary };
              return (
                <View key={index} style={styles.appItem}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appTitle} numberOfLines={1}>{app.project}</Text>
                    <Text style={styles.appOrg}>{app.innovator}</Text>
                    <Text style={styles.appDate}>{app.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: palette.color }]}>
                      {app.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>

          <View style={styles.activityList}>
            {activities.map((activity, index) => {
              const palette = getActivityPalette(activity.icon);
              return (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.activityIconText, { color: palette.fg }]}>
                      {activity.icon === 'apply' && '📄'}
                      {activity.icon === 'accept' && '✓'}
                      {activity.icon === 'reject' && '✕'}
                      {activity.icon === 'post' && '➕'}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText} numberOfLines={2}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Project detail modal — mirrors web .modal-overlay */}
      <Modal
        visible={!!selectedProject}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedProject(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedProject(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProject?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedProject(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Innovator</Text>
                <Text style={styles.modalValue}>{selectedProject?.innovator}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Category</Text>
                <Text style={styles.modalValue}>{selectedProject?.category}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Current Phase</Text>
                {selectedProject && (() => {
                  const phase = phaseColors[selectedProject.phase] || { bg: colors.primaryLight, color: colors.primary };
                  return (
                    <View style={[styles.phaseBadge, { backgroundColor: phase.bg, alignSelf: 'flex-start', marginTop: 4 }]}>
                      <Text style={[styles.phaseBadgeText, { color: phase.color }]}>
                        {selectedProject.phase.charAt(0).toUpperCase() + selectedProject.phase.slice(1)}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Description</Text>
                <Text style={styles.modalValue}>{selectedProject?.description}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Progress</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${selectedProject?.progress || 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{selectedProject?.progress || 0}%</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Completed Milestones</Text>
                <View style={styles.milestonesList}>
                  {selectedProject?.completedMilestones.map((milestone) => (
                    <View key={milestone} style={styles.milestoneTag}>
                      <Text style={styles.milestoneTagText}>
                        {milestone.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
              <View style={[styles.notifItem, styles.notifItemUnread]}>
                <View style={styles.notifDotCol}>
                  <View style={styles.notifDot} />
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifItemTitle}>New Application</Text>
                  <Text style={styles.notifItemMessage}>Alex Johnson applied to Green Tech Grant</Text>
                  <Text style={styles.notifItemTime}>2 hours ago</Text>
                </View>
              </View>
              <View style={[styles.notifItem, styles.notifItemUnread]}>
                <View style={styles.notifDotCol}>
                  <View style={styles.notifDot} />
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifItemTitle}>Application Shortlisted</Text>
                  <Text style={styles.notifItemMessage}>Fatima Hassan was shortlisted for review</Text>
                  <Text style={styles.notifItemTime}>5 hours ago</Text>
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifDotCol} />
                <View style={styles.notifBody}>
                  <Text style={styles.notifItemTitle}>Opportunity Posted</Text>
                  <Text style={styles.notifItemMessage}>Women in STEM Accelerator is now live</Text>
                  <Text style={styles.notifItemTime}>Yesterday</Text>
                </View>
              </View>
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
  quickActionArrow: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },

  /* Projects list — mirrors web .projects-list */
  projectsList: {
    gap: 12,
  },
  projectItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  projectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  projectMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 32,
  },
  phaseTimeline: {
    flexDirection: 'row',
    gap: 4,
  },
  timelinePhase: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    opacity: 0.3,
  },
  timelinePhaseCompleted: {
    opacity: 1,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },

  /* Recent applications — mirrors web .applications-list */
  appsList: {
    gap: 10,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    gap: 10,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  /* Activity feed — mirrors web .activity-feed */
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    gap: 10,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Project detail modal — mirrors web .modal-overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: 18,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  milestonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  milestoneTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  milestoneTagText: {
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

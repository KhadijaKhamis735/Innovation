import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';

export default function FunderDashboard({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName] = useState('Sarah');

  const stats = [
    { value: '3', label: 'Active Opportunities', icon: '📢', color: '#0e4d8c' },
    { value: '104', label: 'Total Applications', icon: '📝', color: '#e07b2a' },
    { value: '12', label: 'Under Review', icon: '⏳', color: '#7c3aed' },
    { value: '8', label: 'Funded Projects', icon: '✅', color: '#10b981' },
  ];

  const fundedProjects = [
    { id: 1, name: 'Smart Water Monitor', innovator: 'Alex Johnson', phase: 'Prototype', progress: 60 },
    { id: 2, name: 'AI Crop Disease Detector', innovator: 'Fatima Hassan', phase: 'Proposal', progress: 40 },
    { id: 3, name: 'Health Tracking App', innovator: 'Priya Mwangi', phase: 'MVP', progress: 80 },
  ];

  const recentApplications = [
    { id: 1, project: 'Smart Water Monitor', innovator: 'Alex Johnson', status: 'Under Review', date: 'May 18, 2026' },
    { id: 2, project: 'AI Crop Detector', innovator: 'Fatima Hassan', status: 'Shortlisted', date: 'May 16, 2026' },
    { id: 3, project: 'EduBot Platform', innovator: 'Priya Mwangi', status: 'Accepted', date: 'May 12, 2026' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Under Review': return '#f59e0b';
      case 'Shortlisted': return '#7c3aed';
      case 'Accepted': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return colors.textMuted;
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Under Review': return '#fef3e8';
      case 'Shortlisted': return '#f3e8ff';
      case 'Accepted': return '#d1fae5';
      case 'Rejected': return '#fee2e2';
      default: return colors.border;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen="funder"
          onNavigate={() => {}}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="funder"
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0a1f3c', '#0e4d8c']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Funder Dashboard</Text>
            <TouchableOpacity style={styles.logoutButton}>
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeText}>Welcome back, {userName}! 👋</Text>
          <Text style={styles.headerSubtitle}>Manage opportunities and review applications</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('PostOpportunity')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.actionIconText}>➕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Post New Opportunity</Text>
              <Text style={styles.actionDesc}>Create a grant, accelerator, or challenge</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReceivedApplications')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eaf0fb' }]}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Review Applications</Text>
              <Text style={styles.actionDesc}>Assess and respond to submissions</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyOpportunities')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3e8' }]}>
              <Text style={styles.actionIconText}>📢</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Opportunities</Text>
              <Text style={styles.actionDesc}>View and edit your postings</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Funded Projects */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Funded Projects</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ReceivedApplications')}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {fundedProjects.map((project) => (
          <View key={project.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={[styles.phaseBadge, { backgroundColor: '#fef3e8' }]}>
                <Text style={[styles.phaseText, { color: '#e07b2a' }]}>{project.phase}</Text>
              </View>
            </View>
            <Text style={styles.projectInnovator}>👤 {project.innovator}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{project.progress}%</Text>
            </View>
          </View>
        ))}

        {/* Recent Applications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ReceivedApplications')}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentApplications.map((app) => (
          <View key={app.id} style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
              <Text style={styles.applicationTitle}>{app.project}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(app.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                  {app.status}
                </Text>
              </View>
            </View>
            <Text style={styles.applicationInnovator}>👤 {app.innovator}</Text>
            <Text style={styles.applicationDate}>📅 {app.date}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  menuButton: { padding: 8 },
  menuIcon: { fontSize: 24, color: colors.white },
  logoutButton: { padding: 8 },
  logoutText: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: colors.white, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.white, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statIconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  viewAllLink: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  actionsContainer: { paddingHorizontal: 20, gap: 12 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionIconText: { fontSize: 24 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  actionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  actionArrow: { fontSize: 18, color: colors.textMuted },
  projectCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  phaseText: { fontSize: 12, fontWeight: '600' },
  projectInnovator: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textMuted, minWidth: 35 },
  applicationCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  applicationTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  applicationInnovator: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  applicationDate: { fontSize: 12, color: colors.textMuted },
});

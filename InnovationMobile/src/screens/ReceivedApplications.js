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

const mockApplications = [
  { id: 1, project: 'Smart Water Monitor', innovator: 'Alex Johnson', stage: 'Under Review', date: 'May 18, 2026' },
  { id: 2, project: 'AI Crop Detector', innovator: 'Fatima Hassan', stage: 'Shortlisted', date: 'May 16, 2026' },
  { id: 3, project: 'P2P Microfinance', innovator: 'James Odhiambo', stage: 'Rejected', date: 'May 14, 2026' },
  { id: 4, project: 'EduBot Platform', innovator: 'Priya Mwangi', stage: 'Accepted', date: 'May 12, 2026' },
  { id: 5, project: 'Drone Delivery System', innovator: 'David Kimani', stage: 'Under Review', date: 'May 20, 2026' },
  { id: 6, project: 'Solar Food Preserver', innovator: 'Sarah Wanjiku', stage: 'Interview', date: 'May 19, 2026' },
  { id: 7, project: 'Telehealth Platform', innovator: 'Michael Otieno', stage: 'Pitch', date: 'May 21, 2026' },
];

const stageConfig = {
  'Under Review': { color: '#f59e0b', bg: '#fef3e8' },
  'Shortlisted': { color: '#7c3aed', bg: '#f3e8ff' },
  'Interview': { color: '#3b82f6', bg: '#dbeafe' },
  'Pitch': { color: '#8b5cf6', bg: '#f3e8ff' },
  'Accepted': { color: '#10b981', bg: '#d1fae5' },
  'Rejected': { color: '#ef4444', bg: '#fee2e2' },
};

export default function ReceivedApplications({ navigation }) {
  const [filterStage, setFilterStage] = useState('All');

  const stages = ['All', 'Under Review', 'Shortlisted', 'Interview', 'Pitch', 'Accepted', 'Rejected'];
  
  const filteredApps = filterStage === 'All' 
    ? mockApplications 
    : mockApplications.filter(a => a.stage === filterStage);

  const stats = {
    total: mockApplications.length,
    underReview: mockApplications.filter(a => a.stage === 'Under Review').length,
    shortlisted: mockApplications.filter(a => a.stage === 'Shortlisted').length,
    accepted: mockApplications.filter(a => a.stage === 'Accepted').length,
  };

  const handleStageChange = (app, newStage) => {
    Alert.alert('Update Stage', `Move "${app.project}" to ${newStage}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', `Application moved to ${newStage}`) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a1f3c', '#0e4d8c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applications Received</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Review and manage applications</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.underReview}</Text>
          <Text style={styles.statLabel}>Under Review</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#7c3aed' }]}>{stats.shortlisted}</Text>
          <Text style={styles.statLabel}>Shortlisted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      {/* Stage Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {stages.map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.filterChip, filterStage === stage && styles.filterChipActive]}
            onPress={() => setFilterStage(stage)}
          >
            <Text style={[styles.filterText, filterStage === stage && styles.filterTextActive]}>{stage}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications List */}
      <ScrollView style={styles.applicationsContainer}>
        {filteredApps.map(app => (
          <View key={app.id} style={styles.applicationCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.projectName}>{app.project}</Text>
                <Text style={styles.innovatorName}>by {app.innovator}</Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: stageConfig[app.stage]?.bg }]}>
                <Text style={[styles.stageText, { color: stageConfig[app.stage]?.color }]}>{app.stage}</Text>
              </View>
            </View>
            <Text style={styles.applicationDate}>Submitted: {app.date}</Text>
            
            <View style={styles.buttonRow}>
              {app.stage !== 'Accepted' && app.stage !== 'Rejected' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#fef3e8' }]}
                    onPress={() => handleStageChange(app, 'Interview')}
                  >
                    <Text style={[styles.actionText, { color: '#f59e0b' }]}>Interview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#f3e8ff' }]}
                    onPress={() => handleStageChange(app, 'Pitch')}
                  >
                    <Text style={[styles.actionText, { color: '#7c3aed' }]}>Pitch</Text>
                  </TouchableOpacity>
                </>
              )}
              {app.stage !== 'Accepted' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#d1fae5' }]}
                  onPress={() => handleStageChange(app, 'Accepted')}
                >
                  <Text style={[styles.actionText, { color: '#10b981' }]}>Accept</Text>
                </TouchableOpacity>
              )}
              {app.stage !== 'Rejected' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                  onPress={() => handleStageChange(app, 'Rejected')}
                >
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Reject</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: colors.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', margin: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.white, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  filterContainer: { paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  applicationsContainer: { padding: 20, gap: 16 },
  applicationCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  projectName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  innovatorName: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageText: { fontSize: 11, fontWeight: '600' },
  applicationDate: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '500' },
});

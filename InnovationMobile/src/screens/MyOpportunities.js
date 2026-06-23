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

const mockOpportunities = [
  {
    id: 1,
    title: 'Green Tech Innovation Grant',
    type: 'Grant',
    description: 'Supporting innovative solutions for environmental sustainability.',
    amount: '$25,000',
    deadline: 'Jun 30, 2026',
    location: 'Remote',
    applicants: 18,
    status: 'Open',
  },
  {
    id: 2,
    title: 'Women in STEM Accelerator',
    type: 'Accelerator',
    description: '6-month intensive program supporting women-led tech startups.',
    amount: 'Mentorship + $15,000',
    deadline: 'Jul 15, 2026',
    location: 'Zanzibar',
    applicants: 34,
    status: 'Open',
  },
  {
    id: 3,
    title: 'Digital Health Hackathon',
    type: 'Challenge',
    description: '48-hour hackathon focused on healthcare innovation.',
    amount: '$5,000',
    deadline: 'May 20, 2026',
    location: 'Virtual',
    applicants: 52,
    status: 'Closed',
  },
];

export default function MyOpportunities({ navigation }) {
  const [filter, setFilter] = useState('All');

  const filteredOpps = filter === 'All' 
    ? mockOpportunities 
    : mockOpportunities.filter(o => o.status === filter);

  const stats = {
    total: mockOpportunities.length,
    open: mockOpportunities.filter(o => o.status === 'Open').length,
    totalApplicants: mockOpportunities.reduce((sum, o) => sum + o.applicants, 0),
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a1f3c', '#0e4d8c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Opportunities</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Manage your posted opportunities</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.open}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#e07b2a' }]}>{stats.totalApplicants}</Text>
          <Text style={styles.statLabel}>Applicants</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'All' && styles.filterChipActive]}
          onPress={() => setFilter('All')}
        >
          <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'Open' && styles.filterChipActive]}
          onPress={() => setFilter('Open')}
        >
          <Text style={[styles.filterText, filter === 'Open' && styles.filterTextActive]}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'Closed' && styles.filterChipActive]}
          onPress={() => setFilter('Closed')}
        >
          <Text style={[styles.filterText, filter === 'Closed' && styles.filterTextActive]}>Closed</Text>
        </TouchableOpacity>
      </View>

      {/* Opportunities List */}
      <ScrollView style={styles.opportunitiesContainer}>
        {filteredOpps.map(opp => (
          <TouchableOpacity
            key={opp.id}
            style={styles.opportunityCard}
            onPress={() => Alert.alert(opp.title, `Applicants: ${opp.applicants}\nDeadline: ${opp.deadline}`)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.typeText, { color: '#0284c7' }]}>{opp.type}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: opp.status === 'Open' ? '#d1fae5' : '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: opp.status === 'Open' ? '#10b981' : '#ef4444' }]}>
                  {opp.status}
                </Text>
              </View>
            </View>
            <Text style={styles.oppTitle}>{opp.title}</Text>
            <Text style={styles.oppDescription} numberOfLines={2}>{opp.description}</Text>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.footerLabel}>Award</Text>
                <Text style={styles.footerValue}>{opp.amount}</Text>
              </View>
              <View>
                <Text style={styles.footerLabel}>Applicants</Text>
                <Text style={styles.footerValue}>{opp.applicants}</Text>
              </View>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>View Details →</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.postButton}
        onPress={() => navigation.navigate('PostOpportunity')}
      >
        <Text style={styles.postButtonText}>+ Post New Opportunity</Text>
      </TouchableOpacity>
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
  statBox: { flex: 1, backgroundColor: colors.white, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 14, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  opportunitiesContainer: { padding: 20, gap: 16 },
  opportunityCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  oppTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  oppDescription: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  footerLabel: { fontSize: 10, color: colors.textMuted },
  footerValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  detailsButton: { paddingHorizontal: 12, paddingVertical: 6 },
  detailsButtonText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  postButton: { margin: 20, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' },
  postButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
});

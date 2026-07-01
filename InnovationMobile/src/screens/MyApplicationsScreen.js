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
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useApp } from '../context/AppContext';

const mockApplications = [
  {
    id: 1,
    opportunity: 'Blue Economy Innovation Grant',
    organization: 'Zanzibar Investment Authority',
    status: 'Under Review',
    submittedDate: 'May 10, 2026',
    amount: '$25,000',
  },
  {
    id: 2,
    opportunity: 'Tech Startup Acceleration Program',
    organization: 'ZSA Innovation Hub',
    status: 'Accepted',
    submittedDate: 'Apr 25, 2026',
    amount: 'Equity-free',
  },
  {
    id: 3,
    opportunity: 'Digital Skills Bootcamp',
    organization: 'UNICEF',
    status: 'Rejected',
    submittedDate: 'Apr 1, 2026',
    amount: 'Free',
  },
];

export default function MyApplicationsScreen({ navigation }) {
  const { isClubMember } = useApp();
  const [activeTab, setActiveTab] = useState('pending');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('applications');

  const getStatusColor = (status) => {
    switch(status) {
      case 'Under Review': return '#f59e0b';
      case 'Accepted': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return colors.textMuted;
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Under Review': return '#fef3e8';
      case 'Accepted': return '#d1fae5';
      case 'Rejected': return '#fee2e2';
      default: return colors.border;
    }
  };

  const pendingApps = mockApplications.filter(a => a.status === 'Under Review');
  const pastApps = mockApplications.filter(a => a.status !== 'Under Review');

  const displayedApps = activeTab === 'pending' ? pendingApps : pastApps;

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="innovator"
          isClubMember={isClubMember}
        />
      )}

      {/* Top bar — replaces gradient header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>My Applications</Text>
          <Text style={styles.pageSubtitle}>Track your funding applications</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        alwaysBounceVertical={true}
        bounces={true}
      >

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending ({pendingApps.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past Results ({pastApps.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Applications List */}
        <View style={styles.applicationsContainer}>
          {displayedApps.map(app => (
            <View key={app.id} style={styles.applicationCard}>
              <View style={styles.appHeader}>
                <View style={styles.appAvatar}>
                  <Text style={styles.appAvatarText}>{app.organization.charAt(0)}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appTitle}>{app.opportunity}</Text>
                  <Text style={styles.appOrganization}>{app.organization}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(app.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status}</Text>
                </View>
              </View>
              
              <View style={styles.appDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{app.amount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>{app.submittedDate}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },

  /* Top bar — replaces gradient header */
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
    fontSize: 17,
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
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  applicationsContainer: {
    padding: 20,
    gap: 16,
  },
  applicationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appOrganization: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  viewButton: {
    alignItems: 'flex-end',
  },
  viewButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
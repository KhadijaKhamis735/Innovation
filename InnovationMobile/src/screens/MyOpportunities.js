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

const typeConfig = {
  Grant: { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' },
  Accelerator: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' },
  Challenge: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706' },
  Fellowship: { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' },
};

const mockOpportunities = [
  {
    id: 1,
    title: 'Green Tech Innovation Grant',
    type: 'Grant',
    description: 'Supporting innovative solutions for environmental sustainability and climate action.',
    amount: '$25,000',
    deadline: 'Jun 30, 2026',
    location: 'Remote',
    applicants: 18,
    tags: ['Environment', 'Technology', 'Sustainability'],
    status: 'Open',
  },
  {
    id: 2,
    title: 'Women in STEM Accelerator',
    type: 'Accelerator',
    description: 'A 6-month intensive program supporting women-led tech startups.',
    amount: 'Mentorship + $15,000',
    deadline: 'Jul 15, 2026',
    location: 'Zanzibar',
    applicants: 34,
    tags: ['Women', 'STEM', 'Accelerator'],
    status: 'Open',
  },
  {
    id: 3,
    title: 'Digital Health Hackathon',
    type: 'Challenge',
    description: '48-hour hackathon focused on healthcare innovation in developing regions.',
    amount: '$5,000',
    deadline: 'May 20, 2026',
    location: 'Virtual',
    applicants: 52,
    tags: ['HealthTech', 'Hackathon', 'Innovation'],
    status: 'Closed',
  },
];

const mockApplicants = [
  { initials: 'AM', name: 'Amara Mensah', role: 'Tech Innovator, Ghana', status: 'Under Review', palette: { bg: 'rgba(245, 158, 11, 0.18)', color: '#d97706' } },
  { initials: 'KO', name: 'Kwame Osei', role: 'Product Designer, Kenya', status: 'Shortlisted', palette: { bg: 'rgba(124, 58, 237, 0.18)', color: '#7c3aed' } },
  { initials: 'LN', name: 'Lena Nkosi', role: 'Software Engineer, South Africa', status: 'Interview', palette: { bg: 'rgba(59, 130, 246, 0.18)', color: '#3b82f6' } },
  { initials: 'JM', name: 'James Mwangi', role: 'Finance Expert, Uganda', status: 'Pitch', palette: { bg: 'rgba(139, 92, 246, 0.18)', color: '#8b5cf6' } },
  { initials: 'AW', name: 'Amina Wanjiku', role: 'Marketing Specialist, Tanzania', status: 'Accepted', palette: { bg: 'rgba(34, 197, 94, 0.18)', color: '#16a34a' } },
];

export default function MyOpportunities({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('myOpportunities');
  const [filter, setFilter] = useState('All');
  const [selectedOpp, setSelectedOpp] = useState(null);

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const myOpportunities = mockOpportunities;
  const filteredOpps = filter === 'All'
    ? myOpportunities
    : myOpportunities.filter((o) => o.type === filter);

  const stats = {
    total: myOpportunities.length,
    open: myOpportunities.filter((o) => o.status === 'Open').length,
    totalApplicants: myOpportunities.reduce((sum, o) => sum + o.applicants, 0),
  };

  return (
    <View style={styles.root}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="funder"
        />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Posted Opportunities</Text>
          <Text style={styles.pageSubtitle}>{stats.total} opportunities posted</Text>
        </View>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('PostOpportunity')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>+ Post New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Stats — 3 cards (web uses grid-template-columns: repeat(3, 1fr)) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.statIconText, { color: colors.blue }]}>📂</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Opportunities</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.greenLight }]}>
              <Text style={[styles.statIconText, { color: colors.green }]}>⏰</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.open}</Text>
              <Text style={styles.statLabel}>Currently Open</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.statIconText, { color: colors.primary }]}>👥</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.totalApplicants}</Text>
              <Text style={styles.statLabel}>Total Applicants</Text>
            </View>
          </View>
        </View>

        {/* Filter bar — mirrors web .filter-bar */}
        <View style={styles.filterBar}>
          {['All', 'Grant', 'Accelerator', 'Challenge'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filterBtn, filter === t && styles.filterBtnActive]}
              onPress={() => setFilter(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, filter === t && styles.filterTextActive]}>
                {t === 'All' ? 'All' : t === 'Grant' ? 'Grants' : t === 'Accelerator' ? 'Accelerators' : 'Challenges'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Opportunities grid — mirrors web .opp-cards-grid */}
        {filteredOpps.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📂</Text>
            </View>
            <Text style={styles.emptyTitle}>No opportunities found</Text>
            <Text style={styles.emptyDesc}>Post your first opportunity to start receiving applications.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('PostOpportunity')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Post New Opportunity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.oppCardsGrid}>
            {filteredOpps.map((opp) => {
              const typePalette = typeConfig[opp.type] || { bg: colors.primaryLight, color: colors.primary };
              const isOpen = opp.status === 'Open';
              return (
                <TouchableOpacity
                  key={opp.id}
                  style={styles.oppCard}
                  onPress={() => setSelectedOpp(opp)}
                  activeOpacity={0.85}
                >
                  <View style={styles.oppCardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: typePalette.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: typePalette.color }]}>{opp.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isOpen ? colors.greenLight : 'rgba(100, 116, 139, 0.12)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isOpen ? colors.green : colors.textSecondary },
                        ]}
                      >
                        {opp.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.oppCardTitle} numberOfLines={2}>{opp.title}</Text>
                  <Text style={styles.oppCardDesc} numberOfLines={3}>{opp.description}</Text>

                  <View style={styles.oppCardMeta}>
                    {!!opp.amount && (
                      <View style={styles.oppMetaItem}>
                        <Text style={styles.oppMetaIcon}>💲</Text>
                        <Text style={styles.oppMetaText}>{opp.amount}</Text>
                      </View>
                    )}
                    <View style={styles.oppMetaItem}>
                      <Text style={styles.oppMetaIcon}>📅</Text>
                      <Text style={styles.oppMetaText}>Deadline: {opp.deadline}</Text>
                    </View>
                    {!!opp.location && (
                      <View style={styles.oppMetaItem}>
                        <Text style={styles.oppMetaIcon}>📍</Text>
                        <Text style={styles.oppMetaText}>{opp.location}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.oppCardTags}>
                    {opp.tags.map((tag) => (
                      <View key={tag} style={styles.oppTag}>
                        <Text style={styles.oppTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.oppCardFooter}>
                    <Text style={styles.applicantCount}>
                      {opp.applicants} applicant{opp.applicants !== 1 ? 's' : ''} applied
                    </Text>
                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setSelectedOpp(opp);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnOutlineText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Opportunity detail modal — mirrors web .modal-overlay + .detail-modal */}
      <Modal
        visible={!!selectedOpp}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedOpp(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedOpp(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              {selectedOpp && (() => {
                const palette = typeConfig[selectedOpp.type] || { bg: colors.primaryLight, color: colors.primary };
                const isOpen = selectedOpp.status === 'Open';
                return (
                  <View style={styles.modalHeaderBadges}>
                    <View style={[styles.typeBadge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: palette.color }]}>{selectedOpp.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isOpen ? colors.greenLight : 'rgba(100, 116, 139, 0.12)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isOpen ? colors.green : colors.textSecondary },
                        ]}
                      >
                        {selectedOpp.status}
                      </Text>
                    </View>
                  </View>
                );
              })()}
              <TouchableOpacity onPress={() => setSelectedOpp(null)} style={styles.modalClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedOpp && (
                <>
                  <Text style={styles.modalTitle}>{selectedOpp.title}</Text>
                  <Text style={styles.modalPosted}>Posted on Innovation Hub</Text>

                  <View style={styles.modalMetaRow}>
                    {!!selectedOpp.amount && (
                      <View style={styles.modalMetaBox}>
                        <Text style={styles.modalMetaLabel}>Award</Text>
                        <Text style={styles.modalMetaValue}>{selectedOpp.amount}</Text>
                      </View>
                    )}
                    <View style={styles.modalMetaBox}>
                      <Text style={styles.modalMetaLabel}>Deadline</Text>
                      <Text style={styles.modalMetaValue}>{selectedOpp.deadline}</Text>
                    </View>
                    {!!selectedOpp.location && (
                      <View style={styles.modalMetaBox}>
                        <Text style={styles.modalMetaLabel}>Pitch Location</Text>
                        <Text style={styles.modalMetaValue}>{selectedOpp.location}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalSectionText}>{selectedOpp.description}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Tags</Text>
                    <View style={styles.oppCardTags}>
                      {selectedOpp.tags.map((tag) => (
                        <View key={tag} style={styles.oppTag}>
                          <Text style={styles.oppTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Applicants ({selectedOpp.applicants})</Text>
                    <View style={styles.applicantsList}>
                      {mockApplicants.map((a) => (
                        <View key={a.initials} style={styles.applicantItem}>
                          <View style={styles.applicantLeft}>
                            <View style={[styles.applicantAvatar, { backgroundColor: a.palette.bg }]}>
                              <Text style={[styles.applicantAvatarText, { color: a.palette.color }]}>{a.initials}</Text>
                            </View>
                            <View style={styles.applicantInfo}>
                              <Text style={styles.applicantName}>{a.name}</Text>
                              <Text style={styles.applicantRole}>{a.role}</Text>
                            </View>
                          </View>
                          <View style={[styles.applicantStatus, { backgroundColor: a.palette.bg }]}>
                            <Text style={[styles.applicantStatusText, { color: a.palette.color }]}>{a.status}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} activeOpacity={0.85}>
                      <Text style={styles.btnOutlineText}>Edit Opportunity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnOutline, { flex: 1, borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.btnOutlineText, { color: '#dc2626' }]}>Close Opportunity</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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

  /* Top bar */
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

  /* Stats — mirrors web .stats-grid (3 cols) */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 18,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* Filter bar — mirrors web .filter-bar */
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },

  /* Cards grid — mirrors web .opp-cards-grid */
  oppCardsGrid: {
    gap: 14,
  },
  oppCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  oppCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  oppCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  oppCardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  oppCardMeta: {
    marginBottom: 12,
  },
  oppMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  oppMetaIcon: {
    fontSize: 13,
    color: colors.textMuted,
  },
  oppMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  oppCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  oppTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  oppTagText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  oppCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    gap: 10,
  },
  applicantCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },

  /* Buttons */
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.background,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Detail modal */
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
  modalHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalPosted: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 18,
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  modalMetaBox: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: '30%',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  modalMetaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  modalMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalSection: {
    marginBottom: 18,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  applicantsList: {
    gap: 8,
  },
  applicantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
    gap: 10,
  },
  applicantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  applicantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  applicantRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  applicantStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  applicantStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});

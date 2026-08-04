import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useAuth, verificationRequired } from '../context/AuthContext';
import { opportunitiesApi, classifyApplyError } from '../api/opportunities';
import { useFocusEffect } from '@react-navigation/native';

// All canonical types the backend accepts (matches OpportunityType enum +
// the visual chip set the old mock used). `All` is a UI-only sentinel;
// the backend treats a missing/empty `type` query param as "no filter".
const TYPE_CHIPS = [
  'All',
  'Grant',
  'Accelerator',
  'Challenge',
  'Fellowship',
  'Equity Funding',
  'Seed Funding',
  'Prize',
];

// Map a UI chip label back to the backend enum value (lowercase, underscores).
const TYPE_CHIP_TO_API = {
  Grant: 'grant',
  Accelerator: 'accelerator',
  Challenge: 'challenge',
  Fellowship: 'fellowship',
  'Equity Funding': 'equity_funding',
  'Seed Funding': 'seed_funding',
  Prize: 'prize',
};

const parseAmount = (amount) => {
  // Backend stores amount as free-form text ("$50,000", "Equity-free",
  // "Free"). Return as-is unless it parses as a number, then format
  // with a currency style. Keeps the legacy "$-prefix" output.
  if (typeof amount !== 'string' || amount.length === 0) return amount;
  return amount;
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

export default function BrowseOpportunitiesScreen({ navigation }) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('opportunities');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Apply modal local state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    problemStatement: '',
    solution: '',
    budget: '',
  });

  // ── Load opportunities + my-applications (parallel) ────────────
  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    setLoadError(null);
    try {
      const [feed, mine] = await Promise.all([
        opportunitiesApi.list({ status: 'open' }).catch((e) => {
          throw e;
        }),
        // listMine requires an INNOVATOR role; ignore role failures so a
        // signed-in-but-not-innovator user still sees the feed.
        opportunitiesApi.listMine().catch(() => []),
      ]);
      // Mounted guard — drop the result if the user navigated away.
      if (!mountedRef.current) return;
      setOpportunities(Array.isArray(feed) ? feed : []);
      setAppliedIds(
        new Set(Array.isArray(mine) ? mine.map((m) => m.opportunityId) : []),
      );
    } catch (e) {
      if (!mountedRef.current) return;
      setLoadError(e?.message ?? 'Unable to load opportunities');
    } finally {
      if (!mountedRef.current) return;
      if (mode === 'refresh') setRefreshing(false); else setLoading(false);
    }
  }, []);

  // Mounted guard — prevents state writes after the screen unmounts.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { load('initial'); }, [load]);

  // Phase 7 — refresh on focus so a newly-posted opportunity shows up
  // when the user returns to the browse screen.
  useFocusEffect(useCallback(() => { load('refresh'); }, [load]));

  // Filtering stays client-side: the backend's filter is now `type=`,
  // but mobile searches over title + organisation for free-form input.
  const filteredOpportunities = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    return opportunities.filter((opp) => {
      const matchesSearch =
        !lower ||
        (opp.title ?? '').toLowerCase().includes(lower) ||
        (opp.funderName ?? '').toLowerCase().includes(lower) ||
        (opp.funderOrganizationName ?? '').toLowerCase().includes(lower);
      const matchesType =
        selectedType === 'All' ||
        (opp.type ?? '').toLowerCase() === (TYPE_CHIP_TO_API[selectedType] ?? '').toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [opportunities, searchQuery, selectedType]);

  const openApply = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormData({ projectName: '', problemStatement: '', solution: '', budget: '' });
    setSubmitError(null);
    setSubmitSuccess(false);
    setShowApplyModal(true);
  };

  const closeApply = () => {
    if (submitting) return;
    setShowApplyModal(false);
    setSelectedOpportunity(null);
  };

  const handleSubmitApplication = async () => {
    if (!formData.projectName.trim() || !formData.problemStatement.trim() || !formData.solution.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ideaTitle: formData.projectName.trim(),
        problemStatement: formData.problemStatement.trim(),
        proposedSolution: formData.solution.trim(),
      };
      const budgetRaw = formData.budget.toString().trim();
      if (budgetRaw) {
        const num = Number(budgetRaw.replace(/[^0-9.]/g, ''));
        if (!Number.isFinite(num) || num <= 0) {
          setSubmitError('Estimated budget must be a positive number');
          setSubmitting(false);
          return;
        }
        payload.estimatedBudget = num;
      }

      const created = await opportunitiesApi.apply(selectedOpportunity.id, payload);
      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.add(selectedOpportunity.id);
        return next;
      });
      setSubmitSuccess(true);
      // Refresh the dashboard-equivalent totals on next mount.
      setOpportunities((prev) => prev); // trigger re-render for "Applied" pill
      // Friendly success: don't leave the user wondering what to do next.
      setTimeout(() => {
        closeApply();
        Alert.alert(
          'Application submitted',
          `Your application to "${selectedOpportunity.title}" was submitted. Track its status in "My Applications".`,
        );
      }, 600);
      // Return the created application id so callers (not used here) can chain.
      return created;
    } catch (e) {
      const info = classifyApplyError(e);
      if (info.kind === 'verification') {
        setSubmitError('Please verify your email before applying.');
        return;
      }
      if (info.kind === 'duplicate') {
        setSubmitError('You have already applied to this opportunity.');
        return;
      }
      if (info.kind === 'closed') {
        setSubmitError(info.message || 'This opportunity is no longer accepting applications.');
        return;
      }
      if (info.kind === 'network') {
        setSubmitError('Network error — please try again.');
        return;
      }
      setSubmitError(info.message || 'Unable to submit the application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="innovator"
        />
      )}

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Browse Opportunities</Text>
          <Text style={styles.pageSubtitle}>
            {opportunities.length} open funding opportunities
          </Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        scrollEnabled
        alwaysBounceVertical
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        {/* Empty loading skeleton */}
        {loading && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading opportunities…</Text>
          </View>
        )}

        {/* Error retry */}
        {!loading && loadError && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorTitle}>We couldn't load opportunities</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => load('initial')}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search + filters only render once initial load finishes */}
        {!loading && !loadError && (
          <>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search opportunities..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterContainer}>
              {TYPE_CHIPS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredOpportunities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No opportunities match</Text>
                <Text style={styles.emptyStateText}>
                  Try clearing search or selecting a different type.
                </Text>
              </View>
            ) : (
              <View style={styles.opportunitiesContainer}>
                {filteredOpportunities.map((opp) => {
                  const daysLeft = daysUntil(opp.deadline);
                  const alreadyApplied = appliedIds.has(opp.id);
                  return (
                    <View key={opp.id} style={styles.opportunityCard}>
                      <View style={styles.oppHeader}>
                        <View style={[styles.typeBadge, { backgroundColor: '#e0f2fe' }]}>
                          <Text style={[styles.typeBadgeText, { color: '#0284c7' }]}>
                            {(opp.type ?? 'opportunity').toString()}
                          </Text>
                        </View>
                        {alreadyApplied && (
                          <View style={styles.appliedPill}>
                            <Text style={styles.appliedPillText}>Applied</Text>
                          </View>
                        )}
                        {daysLeft != null && (
                          <Text style={[styles.deadlineText, daysLeft <= 14 && styles.deadlineUrgent]}>
                            {daysLeft >= 0 ? `${daysLeft} days left` : 'Past deadline'}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.oppTitle}>{opp.title}</Text>
                      <Text style={styles.oppOrganization}>
                        {opp.funderOrganizationName || opp.funderName || '—'}
                      </Text>
                      <Text style={styles.oppDescription} numberOfLines={2}>
                        {opp.description}
                      </Text>
                      <View style={styles.oppFooter}>
                        <Text style={styles.oppAmount}>
                          {parseAmount(opp.amount) || 'Equity-free'}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.applyButton,
                            alreadyApplied && styles.applyButtonDisabled,
                          ]}
                          disabled={alreadyApplied}
                          onPress={() => !alreadyApplied && openApply(opp)}
                        >
                          <Text style={styles.applyButtonText}>
                            {alreadyApplied ? 'Applied ✓' : 'Apply Now →'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent
        onRequestClose={closeApply}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for</Text>
              <Text style={styles.modalOpportunityTitle}>{selectedOpportunity?.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeApply}
                disabled={submitting}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {submitSuccess ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Application Submitted!</Text>
                <Text style={styles.successText}>
                  You can track its status in "My Applications".
                </Text>
                <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Project / Idea Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Give your idea a clear title"
                    value={formData.projectName}
                    onChangeText={(t) => setFormData({ ...formData, projectName: t })}
                    editable={!submitting}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Problem Statement *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="What problem are you solving?"
                    multiline
                    numberOfLines={3}
                    value={formData.problemStatement}
                    onChangeText={(t) => setFormData({ ...formData, problemStatement: t })}
                    editable={!submitting}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Proposed Solution *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="How does your idea solve this problem?"
                    multiline
                    numberOfLines={3}
                    value={formData.solution}
                    onChangeText={(t) => setFormData({ ...formData, solution: t })}
                    editable={!submitting}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Estimated Budget (USD)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="How much funding do you need?"
                    keyboardType="numeric"
                    value={formData.budget}
                    onChangeText={(t) => setFormData({ ...formData, budget: t })}
                    editable={!submitting}
                  />
                </View>

                {submitError && (
                  <View style={styles.submitErrorBlock}>
                    <Text style={styles.submitErrorText}>{submitError}</Text>
                  </View>
                )}

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeApply}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmitApplication}
                    disabled={submitting}
                  >
                    {submitting
                      ? <ActivityIndicator color={colors.white} />
                      : <Text style={styles.submitButtonText}>Submit Application</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Verification gating helper — exported for tests / future reuse.
export const _internal = { verificationRequired };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

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
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  menuIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Loading + error
  loadingBlock: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },
  errorBlock: {
    margin: 20, padding: 16, borderRadius: 12,
    backgroundColor: '#fee2e2',
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: '#7f1d1d', marginBottom: 4 },
  errorText: { fontSize: 13, color: '#991b1b', marginBottom: 12 },
  retryButton: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#7f1d1d',
  },
  retryButtonText: { color: colors.white, fontSize: 13, fontWeight: '600' },

  // Empty
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  emptyStateText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Search + filters
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 20, paddingHorizontal: 16, backgroundColor: colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  filterContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginHorizontal: 20, marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, marginRight: 4, marginBottom: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 13, color: colors.textSecondary },
  typeTextActive: { color: colors.white },

  // Cards
  opportunitiesContainer: { paddingHorizontal: 20, gap: 16 },
  opportunityCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  oppHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, gap: 8,
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  appliedPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: colors.statusAcceptedBg,
  },
  appliedPillText: { fontSize: 11, fontWeight: '700', color: colors.statusAcceptedText },
  deadlineText: { fontSize: 12, color: colors.textMuted },
  deadlineUrgent: { color: '#ef4444', fontWeight: '600' },
  oppTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  oppOrganization: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  oppDescription: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  oppFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  oppAmount: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  applyButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 8 },
  applyButtonDisabled: { backgroundColor: colors.statusAcceptedBg },
  applyButtonText: { fontSize: 14, color: colors.white, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    width: '90%', maxHeight: '80%', backgroundColor: colors.white,
    borderRadius: 20, overflow: 'hidden',
  },
  modalHeader: {
    padding: 20, backgroundColor: colors.primary, alignItems: 'center',
  },
  modalTitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  modalOpportunityTitle: { fontSize: 17, fontWeight: 'bold', color: colors.white, marginTop: 4, textAlign: 'center' },
  modalCloseButton: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalCloseText: { fontSize: 18, color: colors.white },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  formInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: colors.white,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitErrorBlock: {
    backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 10, marginVertical: 8,
  },
  submitErrorText: { color: '#7f1d1d', fontSize: 13 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  cancelButton: {
    flex: 1, paddingVertical: 12, backgroundColor: colors.border,
    borderRadius: 10, alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  submitButton: {
    flex: 1, paddingVertical: 12, backgroundColor: colors.primary,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: colors.white },
  successContainer: { padding: 40, alignItems: 'center' },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  successText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

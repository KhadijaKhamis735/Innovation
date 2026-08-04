import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { opportunitiesApi } from '../api/opportunities';

// Full backend enum → palette. Includes the three new types (Equity Funding,
// Seed Funding, Prize) that the legacy mock truncated.
const typeConfig = {
  Grant: { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' },
  Accelerator: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' },
  Challenge: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706' },
  Fellowship: { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' },
  'Equity Funding': { bg: 'rgba(190, 24, 93, 0.12)', color: '#be185d' },
  'Seed Funding': { bg: 'rgba(29, 78, 216, 0.12)', color: '#1d4ed8' },
  Prize: { bg: 'rgba(185, 28, 28, 0.12)', color: '#b91c1c' },
};
// Lookup keyed by lowercase backend enum value, so we can find the right
// palette even if the API sends back "grant" / "equity_funding" / etc.
const typePaletteByLower = Object.fromEntries(
  Object.entries(typeConfig).map(([k, v]) => [k.toLowerCase().replace(/ /g, '_'), v])
);

// Backend enum ("grant", "equity_funding") → UI Title Case ("Grant", "Equity Funding")
const displayType = (raw) =>
  String(raw || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Filter chips stay in Title Case. We map each label back to the lowercase
// backend form before comparing with rows.
const FILTER_OPTIONS = [
  { label: 'All',          match: null },
  { label: 'Grants',       match: 'grant' },
  { label: 'Accelerators', match: 'accelerator' },
  { label: 'Challenges',   match: 'challenge' },
  { label: 'Fellowships',  match: 'fellowship' },
];

// UI Title Case → backend enum.
const toBackendType = (label) =>
  String(label || '').toUpperCase().replace(/ /g, '_');

// Backend error → toast copy. Mirrors PostOpportunity.errorMessageFor but
// here the failure is most often the status PATCH / DELETE, not create.
function errorMessageFor(err, fallback) {
  const status = err?.status;
  const msg = err?.message ?? '';
  if (status === 0) return 'Network error — check your connection and retry';
  if (status === 403 && msg.startsWith('Please verify your email'))
    return 'Please verify your email before managing opportunities';
  if (status === 401) return 'Your session expired — sign in again';
  return msg || fallback;
}

export default function MyOpportunities({ navigation }) {
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('myOpportunities');
  const [filter, setFilter] = useState('All');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [acting, setActing] = useState(false);

  // ── Local edit form state — populated when the modal opens. ────────
  const [editForm, setEditForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const showToast = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // ── Load ──────────────────────────────────────────────────────────
  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    try {
      const data = await opportunitiesApi.listMine();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(errorMessageFor(err, 'Could not load opportunities'));
      setOpportunities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load('initial'); }, [load]);

  // ── Derived data ──────────────────────────────────────────────────
  const myOpportunities = useMemo(
    () => opportunities.filter((o) => !authUser || !o.funderId || o.funderId === authUser.id),
    [opportunities, authUser]
  );

  const activeFilter = FILTER_OPTIONS.find((f) => f.label === filter) ?? FILTER_OPTIONS[0];
  const filteredOpps = activeFilter.match === null
    ? myOpportunities
    : myOpportunities.filter((o) => String(o.type || '').toLowerCase() === activeFilter.match);

  const stats = {
    total: myOpportunities.length,
    open: myOpportunities.filter((o) => String(o.status || '').toLowerCase() === 'open').length,
    totalApplicants: myOpportunities.reduce((sum, o) => sum + (Number(o.applicantCount) || 0), 0),
  };

  // ── Modal handlers ────────────────────────────────────────────────
  const openDetails = (opp) => {
    setSelectedOpp(opp);
    setEditForm(null);
    setConfirmDelete(false);
  };

  const closeDetails = () => {
    setSelectedOpp(null);
    setEditForm(null);
    setConfirmDelete(false);
  };

  const beginEdit = () => {
    if (!selectedOpp) return;
    setEditForm({
      title: selectedOpp.title || '',
      description: selectedOpp.description || '',
      type: displayType(selectedOpp.type),
      amount: selectedOpp.amount || '',
      deadline: selectedOpp.deadline || '',
      location: selectedOpp.location || '',
      requirements: selectedOpp.requirements || '',
      tags: Array.isArray(selectedOpp.tags) ? selectedOpp.tags.join(', ') : '',
    });
    setConfirmDelete(false);
  };

  const cancelEdit = () => setEditForm(null);

  const saveEdit = async () => {
    if (!selectedOpp || !editForm) return;
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.deadline) {
      showToast('Title, description and deadline are required');
      return;
    }
    setActing(true);
    try {
      const tags = String(editForm.tags || '')
        .split(',').map((t) => t.trim()).filter(Boolean);
      const updated = await opportunitiesApi.update(selectedOpp.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        type: toBackendType(editForm.type),
        amount: editForm.amount.trim() || null,
        deadline: editForm.deadline || null,
        location: editForm.location.trim() || null,
        requirements: editForm.requirements.trim() || null,
        tags,
      });
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOpp(updated);
      setEditForm(null);
      showToast('✓ Opportunity updated');
    } catch (err) {
      showToast(errorMessageFor(err, 'Could not update opportunity'));
    } finally {
      setActing(false);
    }
  };

  const toggleStatus = async (newStatus) => {
    if (!selectedOpp) return;
    setActing(true);
    try {
      const updated = await opportunitiesApi.updateStatus(selectedOpp.id, newStatus);
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOpp(updated);
      showToast(newStatus === 'closed' ? '✓ Opportunity closed' : '✓ Opportunity reopened');
    } catch (err) {
      showToast(errorMessageFor(err, 'Could not change status'));
    } finally {
      setActing(false);
    }
  };

  const deleteOpp = async () => {
    if (!selectedOpp) return;
    setActing(true);
    try {
      await opportunitiesApi.remove(selectedOpp.id);
      setOpportunities((prev) => prev.filter((o) => o.id !== selectedOpp.id));
      showToast('✓ Opportunity deleted');
      closeDetails();
    } catch (err) {
      showToast(errorMessageFor(err, 'Could not delete opportunity'));
    } finally {
      setActing(false);
    }
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />
        }
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

        {/* Filter bar */}
        <View style={styles.filterBar}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.filterBtn, filter === opt.label && styles.filterBtnActive]}
              onPress={() => setFilter(opt.label)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, filter === opt.label && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading state — preserves layout so it doesn't flash */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyDesc}>Loading your opportunities…</Text>
          </View>
        ) : filteredOpps.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📂</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {myOpportunities.length === 0
                ? 'No opportunities yet'
                : 'No opportunities match this filter'}
            </Text>
            <Text style={styles.emptyDesc}>
              {myOpportunities.length === 0
                ? 'Post your first opportunity to start receiving applications.'
                : 'Try a different filter or post a new opportunity.'}
            </Text>
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
              const typePalette =
                typePaletteByLower[String(opp.type || '').toLowerCase()] ||
                { bg: colors.primaryLight, color: colors.primary };
              const isOpen = String(opp.status || '').toLowerCase() === 'open';
              const applicants = Number(opp.applicantCount) || 0;
              const tags = Array.isArray(opp.tags) ? opp.tags : [];
              const typeLabel = displayType(opp.type);
              return (
                <TouchableOpacity
                  key={opp.id}
                  style={styles.oppCard}
                  onPress={() => openDetails(opp)}
                  activeOpacity={0.85}
                >
                  <View style={styles.oppCardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: typePalette.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: typePalette.color }]}>{typeLabel}</Text>
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
                        {displayType(opp.status)}
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
                      <Text style={styles.oppMetaText}>Deadline: {opp.deadline || '—'}</Text>
                    </View>
                    {!!opp.location && (
                      <View style={styles.oppMetaItem}>
                        <Text style={styles.oppMetaIcon}>📍</Text>
                        <Text style={styles.oppMetaText}>{opp.location}</Text>
                      </View>
                    )}
                  </View>

                  {tags.length > 0 && (
                    <View style={styles.oppCardTags}>
                      {tags.map((tag) => (
                        <View key={tag} style={styles.oppTag}>
                          <Text style={styles.oppTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.oppCardFooter}>
                    <Text style={styles.applicantCount}>
                      {applicants} applicant{applicants !== 1 ? 's' : ''} applied
                    </Text>
                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={() => openDetails(opp)}
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
        onRequestClose={closeDetails}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDetails}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              {selectedOpp && (() => {
                const palette =
                  typePaletteByLower[String(selectedOpp.type || '').toLowerCase()] ||
                  { bg: colors.primaryLight, color: colors.primary };
                const isOpen = String(selectedOpp.status || '').toLowerCase() === 'open';
                return (
                  <View style={styles.modalHeaderBadges}>
                    <View style={[styles.typeBadge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: palette.color }]}>{displayType(selectedOpp.type)}</Text>
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
                        {displayType(selectedOpp.status)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
              <TouchableOpacity onPress={closeDetails} style={styles.modalClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedOpp && !editForm && (
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
                      <Text style={styles.modalMetaValue}>{selectedOpp.deadline || '—'}</Text>
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

                  {!!selectedOpp.requirements && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Requirements</Text>
                      <Text style={styles.modalSectionText}>{selectedOpp.requirements}</Text>
                    </View>
                  )}

                  {Array.isArray(selectedOpp.tags) && selectedOpp.tags.length > 0 && (
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
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Applicants ({Number(selectedOpp.applicantCount) || 0})
                    </Text>
                    <Text style={styles.modalSectionText}>
                      Manage applicant stages in Received Applications.
                    </Text>
                  </View>

                  {confirmDelete ? (
                    <View style={styles.deleteConfirmBox}>
                      <Text style={styles.deleteConfirmText}>
                        Delete this opportunity? This cannot be undone.
                      </Text>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.btnOutline, { flex: 1 }]}
                          onPress={() => setConfirmDelete(false)}
                          disabled={acting}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.btnOutlineText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnDanger, { flex: 1 }]}
                          onPress={deleteOpp}
                          disabled={acting}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.btnDangerText}>
                            {acting ? 'Deleting…' : 'Yes, delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.btnOutline, { flex: 1 }]}
                        onPress={beginEdit}
                        disabled={acting}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnOutlineText}>Edit</Text>
                      </TouchableOpacity>
                      {String(selectedOpp.status || '').toLowerCase() === 'open' ? (
                        <TouchableOpacity
                          style={[styles.btnOutline, { flex: 1, borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                          onPress={() => toggleStatus('closed')}
                          disabled={acting}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.btnOutlineText, { color: '#dc2626' }]}>
                            {acting ? '…' : 'Close'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.btnOutline, { flex: 1, borderColor: colors.green }]}
                          onPress={() => toggleStatus('open')}
                          disabled={acting}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.btnOutlineText, { color: colors.green }]}>
                            {acting ? '…' : 'Reopen'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.btnOutline, { flex: 1, borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                        onPress={() => setConfirmDelete(true)}
                        disabled={acting}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.btnOutlineText, { color: '#dc2626' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Edit form (replaces the read-only view while active) */}
              {selectedOpp && editForm && (
                <View>
                  <Text style={styles.modalTitle}>Edit Opportunity</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editForm.title}
                      onChangeText={(t) => setEditForm({ ...editForm, title: t })}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Type</Text>
                    <View style={styles.typeChips}>
                      {Object.keys(typeConfig).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typeChip,
                            editForm.type === t && styles.typeChipActive,
                          ]}
                          onPress={() => setEditForm({ ...editForm, type: t })}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.typeChipText,
                              editForm.type === t && styles.typeChipTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description *</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      value={editForm.description}
                      onChangeText={(t) => setEditForm({ ...editForm, description: t })}
                      multiline
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Requirements</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      value={editForm.requirements}
                      onChangeText={(t) => setEditForm({ ...editForm, requirements: t })}
                      multiline
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Award</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.amount}
                        onChangeText={(t) => setEditForm({ ...editForm, amount: t })}
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Deadline *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.deadline}
                        onChangeText={(t) => setEditForm({ ...editForm, deadline: t })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Location</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.location}
                        onChangeText={(t) => setEditForm({ ...editForm, location: t })}
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Tags (comma-separated)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editForm.tags}
                      onChangeText={(t) => setEditForm({ ...editForm, tags: t })}
                      placeholder="Technology, Health, Youth"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.btnOutline, { flex: 1 }]}
                      onPress={cancelEdit}
                      disabled={acting}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnOutlineText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { flex: 1 }]}
                      onPress={saveEdit}
                      disabled={acting}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnPrimaryText}>
                        {acting ? 'Saving…' : 'Save Changes'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast */}
      {!!errorMsg && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{errorMsg}</Text>
          </View>
        </View>
      )}
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

  /* Edit form (inside the detail modal) */
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  formTextarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  /* Delete confirm + danger button */
  deleteConfirmBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  deleteConfirmText: {
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 10,
    fontWeight: '500',
  },
  btnDanger: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDangerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Toast — mirrors web .toast */
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
  },
});

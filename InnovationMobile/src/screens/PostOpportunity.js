import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';

const opportunityTypes = [
  { value: 'Grant', desc: 'Funding for specific projects or research' },
  { value: 'Accelerator', desc: 'Mentorship and resources for growth' },
  { value: 'Challenge', desc: 'Competition with prizes for solutions' },
  { value: 'Fellowship', desc: 'Structured program for skill development' },
];

const typeColors = {
  Grant: { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' },
  Accelerator: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' },
  Challenge: { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706' },
  Fellowship: { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' },
};

export default function PostOpportunity({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('postOpportunity');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '',
    type: 'Grant',
    description: '',
    amount: '',
    deadline: '',
    location: '',
    requirements: '',
    tags: '',
  });
  const [step, setStep] = useState(1);

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.deadline) {
      showToast('Please fill in all required fields');
      return;
    }
    showToast('Opportunity posted successfully!');
    setTimeout(() => navigation.navigate('MyOpportunities'), 1500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Accepts both YYYY-MM-DD and free text; tries Date parse as best-effort.
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

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
          <Text style={styles.pageTitle}>Post New Opportunity</Text>
          <Text style={styles.pageSubtitle}>Create an opportunity for innovators to apply</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>O</Text>
        </View>
      </View>

      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Step tabs — mirrors web .tabs-container */}
        <View style={styles.tabsContainer}>
          {[1, 2, 3].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.tabBtn, step === n && styles.tabActive]}
              onPress={() => setStep(n)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, step === n && styles.tabTextActive]}>
                {n}. {n === 1 ? 'Basic Info' : n === 2 ? 'Details' : 'Review'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form card — mirrors web .form-card */}
        <View style={styles.formCard}>
          {step === 1 && (
            <View>
              <Text style={styles.formSectionTitle}>Basic Information</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Opportunity Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Green Tech Innovation Grant 2026"
                  placeholderTextColor={colors.textMuted}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeGrid}>
                  {opportunityTypes.map((type) => {
                    const palette = typeColors[type.value] || { bg: colors.primaryLight, color: colors.primary };
                    const isActive = form.type === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.typeCard,
                          isActive && {
                            borderColor: colors.primary,
                            backgroundColor: palette.bg,
                          },
                        ]}
                        onPress={() => setForm({ ...form, type: type.value })}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.typeTitle, isActive && { color: palette.color }]}>
                          {type.value}
                        </Text>
                        <Text style={styles.typeDesc}>{type.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Award / Value</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. $10,000 or Mentorship"
                    placeholderTextColor={colors.textMuted}
                    value={form.amount}
                    onChangeText={(text) => setForm({ ...form, amount: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Application Deadline *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={form.deadline}
                    onChangeText={(text) => setForm({ ...form, deadline: text })}
                  />
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.formSectionTitle}>Opportunity Details</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Describe what this opportunity offers, who should apply..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Requirements</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="List eligibility criteria, qualifications..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={form.requirements}
                  onChangeText={(text) => setForm({ ...form, requirements: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Pitch Location</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Zanzibar or Remote"
                    placeholderTextColor={colors.textMuted}
                    value={form.location}
                    onChangeText={(text) => setForm({ ...form, location: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Tags (comma-separated)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Technology, Health, Youth"
                    placeholderTextColor={colors.textMuted}
                    value={form.tags}
                    onChangeText={(text) => setForm({ ...form, tags: text })}
                  />
                </View>
              </View>
            </View>
          )}

          {step === 3 && (() => {
            const palette = typeColors[form.type] || { bg: colors.primaryLight, color: colors.primary };
            return (
              <View>
                <Text style={styles.formSectionTitle}>Review Your Opportunity</Text>

                <View style={styles.reviewBox}>
                  <View style={[styles.reviewTypeBadge, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.reviewTypeText, { color: palette.color }]}>{form.type}</Text>
                  </View>
                  <Text style={styles.reviewTitle}>
                    {form.title || 'Untitled Opportunity'}
                  </Text>

                  <View style={styles.reviewRow}>
                    {!!form.amount && (
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Award</Text>
                        <Text style={styles.reviewValue}>{form.amount}</Text>
                      </View>
                    )}
                    {!!form.deadline && (
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Deadline</Text>
                        <Text style={styles.reviewValue}>{formatDate(form.deadline)}</Text>
                      </View>
                    )}
                    {!!form.location && (
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Pitch Location</Text>
                        <Text style={styles.reviewValue}>{form.location}</Text>
                      </View>
                    )}
                  </View>

                  {!!form.description && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>Description</Text>
                      <Text style={styles.reviewText}>{form.description}</Text>
                    </View>
                  )}

                  {!!form.requirements && (
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>Requirements</Text>
                      <Text style={styles.reviewText}>{form.requirements}</Text>
                    </View>
                  )}

                  {!!form.tags && (
                    <View style={styles.tagsRow}>
                      {form.tags.split(',').map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{tag.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

          {/* Form actions — mirrors web .form-actions */}
          <View style={styles.formActions}>
            {step > 1 && (
              <TouchableOpacity style={styles.btnOutline} onPress={prevStep} activeOpacity={0.85}>
                <Text style={styles.btnOutlineText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => navigation.navigate('MyOpportunities')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
            {step < 3 ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={nextStep} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>Post Opportunity ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Toast — mirrors web .toast */}
      {!!toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
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

  /* Tabs — mirrors web .tabs-container */
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.background,
    padding: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },

  /* Form card — mirrors web .form-card */
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  formTextarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: '47%',
    padding: 14,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  typeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },

  /* Review block — mirrors web step 3 panel */
  reviewBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 18,
  },
  reviewTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  reviewItem: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: '30%',
  },
  reviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewSection: {
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  /* Form actions — mirrors web .form-actions */
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  btnOutline: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';

// Mirrors web defaultStages
const defaultStages = [
  { id: 'under_review', name: 'Under Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'interview', name: 'Interview', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'pitch', name: 'Pitch', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'shortlisted', name: 'Shortlisted', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)' },
  { id: 'accepted', name: 'Accepted', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.15)' },
  { id: 'rejected', name: 'Rejected', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.15)' },
];

// Mirrors web defaultEmailTemplates
const defaultEmailTemplates = {
  interview: {
    subject: 'Invitation to Interview - {opportunity}',
    body: `Dear {name},

Congratulations! You have been selected for the interview stage for {opportunity}.

Our team was impressed by your application and would like to learn more about your project.

We will be in touch shortly with scheduling details.

Best regards,
{funder} Team`,
  },
  pitch: {
    subject: 'Invitation to Pitch - {opportunity}',
    body: `Dear {name},

Great news! You have been invited to the pitch stage for {opportunity}.

This is an exciting opportunity to present your project to our panel of experts.

We will share more details about the pitch format and schedule soon.

Best regards,
{funder} Team`,
  },
  shortlisted: {
    subject: "You've Been Shortlisted - {opportunity}",
    body: `Dear {name},

We are pleased to inform you that your application to {opportunity} has been shortlisted!

This is a significant achievement, and we look forward to learning more about your work.

Best regards,
{funder} Team`,
  },
  accepted: {
    subject: "Congratulations! You've Been Accepted - {opportunity}",
    body: `Dear {name},

We are thrilled to inform you that your application to {opportunity} has been accepted!

Congratulations on this achievement. Our team will be in touch with next steps shortly.

Welcome to the program!

Best regards,
{funder} Team`,
  },
  rejected: {
    subject: 'Update on Your Application - {opportunity}',
    body: `Dear {name},

Thank you for your interest in {opportunity} and for taking the time to submit your application.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

We encourage you to apply for future opportunities.

Best regards,
{funder} Team`,
  },
};

const mockApplications = [
  {
    id: 1,
    innovatorId: 1,
    innovatorName: 'Alex Johnson',
    innovatorEmail: 'alex.j@email.com',
    projectName: 'Smart Water Monitor',
    opportunity: 'Green Tech Innovation Grant',
    opportunityId: 1,
    motivation: 'I am passionate about environmental sustainability and believe this project can make a real impact in rural communities.',
    experience: '5+ years in IoT development, previously built similar monitoring systems.',
    stage: 'under_review',
    date: 'May 18, 2026',
    tags: ['IoT', 'Environment'],
  },
  {
    id: 2,
    innovatorId: 2,
    innovatorName: 'Fatima Hassan',
    innovatorEmail: 'fatima.h@email.com',
    projectName: 'AI Crop Disease Detector',
    opportunity: 'Green Tech Innovation Grant',
    opportunityId: 1,
    motivation: 'Agriculture is the backbone of our economy. This AI solution can help farmers detect diseases early and increase yield.',
    experience: 'MSc in Computer Science, experience with ML models for agriculture.',
    stage: 'shortlisted',
    date: 'May 16, 2026',
    tags: ['AI', 'Agriculture'],
  },
  {
    id: 3,
    innovatorId: 3,
    innovatorName: 'James Odhiambo',
    innovatorEmail: 'james.o@email.com',
    projectName: 'P2P Microfinance',
    opportunity: 'Women in STEM Accelerator',
    opportunityId: 2,
    motivation: 'I want to bridge the financial gap for women entrepreneurs in underserved areas.',
    experience: 'Former fintech developer, MBA in Finance.',
    stage: 'rejected',
    date: 'May 14, 2026',
    tags: ['FinTech', 'Social Impact'],
  },
  {
    id: 4,
    innovatorId: 4,
    innovatorName: 'Priya Mwangi',
    innovatorEmail: 'priya.m@email.com',
    projectName: 'EduBot Platform',
    opportunity: 'Women in STEM Accelerator',
    opportunityId: 2,
    motivation: 'EdTech is my passion. I believe AI-powered tutoring can democratize education.',
    experience: 'Former teacher, self-taught developer, launched MVP last year.',
    stage: 'accepted',
    date: 'May 12, 2026',
    tags: ['EdTech', 'AI'],
  },
  {
    id: 5,
    innovatorId: 5,
    innovatorName: 'David Kimani',
    innovatorEmail: 'david.k@email.com',
    projectName: 'Drone Delivery System',
    opportunity: 'Digital Health Hackathon',
    opportunityId: 3,
    motivation: 'Medical supply delivery in hard-to-reach areas is critical for healthcare access.',
    experience: 'Aerospace engineering background, built drone prototypes.',
    stage: 'under_review',
    date: 'May 20, 2026',
    tags: ['Drones', 'HealthTech'],
  },
  {
    id: 6,
    innovatorId: 6,
    innovatorName: 'Sarah Wanjiku',
    innovatorEmail: 'sarah.w@email.com',
    projectName: 'Solar Food Preserver',
    opportunity: 'Green Tech Innovation Grant',
    opportunityId: 1,
    motivation: 'Post-harvest losses are a major problem. My solar-powered solution can help reduce food waste.',
    experience: 'Mechanical engineer with 8 years in sustainable tech.',
    stage: 'interview',
    date: 'May 19, 2026',
    tags: ['Solar', 'AgriTech'],
  },
  {
    id: 7,
    innovatorId: 7,
    innovatorName: 'Michael Otieno',
    innovatorEmail: 'michael.o@email.com',
    projectName: 'Telehealth Platform',
    opportunity: 'Digital Health Hackathon',
    opportunityId: 3,
    motivation: 'Healthcare access in rural areas is limited. Telehealth can bridge this gap effectively.',
    experience: 'Healthcare IT specialist, built telehealth solutions for NGOs.',
    stage: 'pitch',
    date: 'May 21, 2026',
    tags: ['Telehealth', 'Rural Tech'],
  },
];

const opportunityOptions = ['All', 'Green Tech Innovation Grant', 'Women in STEM Accelerator', 'Digital Health Hackathon'];

export default function ReceivedApplications({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('receivedApps');
  const [filterOpp, setFilterOpp] = useState('All');
  const [filterStage, setFilterStage] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState(defaultEmailTemplates);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const applications = mockApplications;

  const filteredApps = applications.filter((a) => {
    const matchesOpp = filterOpp === 'All' || a.opportunity === filterOpp;
    const matchesStage = filterStage === 'All' || a.stage === filterStage;
    return matchesOpp && matchesStage;
  });

  const stageById = (stageId) =>
    defaultStages.find((s) => s.id === stageId) ||
    { name: stageId, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };

  const stats = {
    total: applications.length,
    underReview: applications.filter((a) => a.stage === 'under_review').length,
    interview: applications.filter((a) => a.stage === 'interview').length,
    pitch: applications.filter((a) => a.stage === 'pitch').length,
    shortlisted: applications.filter((a) => a.stage === 'shortlisted').length,
    accepted: applications.filter((a) => a.stage === 'accepted').length,
  };

  const toggleSelectApp = (appId) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filteredApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApps.map((a) => a.id));
    }
  };

  const handleStageChange = (appId, newStage, sendEmail = true) => {
    const stageName = stageById(newStage).name;
    showToast(
      `Application moved to ${stageName}${sendEmail ? ' - Email sent' : ''}`,
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, stage: newStage });
    }
    setShowStageModal(false);
    setPendingStageChange(null);
  };

  const handleBulkStageChange = (newStage, sendEmail = true) => {
    const stageName = stageById(newStage).name;
    showToast(
      `${selectedApps.length} applications moved to ${stageName}${sendEmail ? ' - Emails sent' : ''}`,
    );
    setSelectedApps([]);
    setShowStageModal(false);
  };

  const openStageModal = (appId = null) => {
    setPendingStageChange({ appId });
    setShowStageModal(true);
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
          <Text style={styles.pageTitle}>Applications Received</Text>
          <Text style={styles.pageSubtitle}>
            {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => setShowSettingsModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>⚙ Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Bulk action bar (web renders inline in top-bar; mobile renders above stats) */}
        {selectedApps.length > 0 && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedApps.length} selected</Text>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => openStageModal()}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Move to Stage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => setSelectedApps([])}
              activeOpacity={0.85}
            >
              <Text style={styles.btnOutlineText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats — 6 cards (web uses grid-template-columns: repeat(6, 1fr)) */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.statIconText, { color: colors.blue }]}>📄</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.statIconText, { color: '#d97706' }]}>⏰</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.underReview}</Text>
              <Text style={styles.statLabel}>Under Review</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.statIconText, { color: '#3b82f6' }]}>👥</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.interview}</Text>
              <Text style={styles.statLabel}>Interview</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.purpleLight }]}>
              <Text style={[styles.statIconText, { color: colors.purple }]}>★</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.pitch}</Text>
              <Text style={styles.statLabel}>Pitch</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <Text style={[styles.statIconText, { color: '#7c3aed' }]}>✓</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.shortlisted}</Text>
              <Text style={styles.statLabel}>Shortlisted</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.greenLight }]}>
              <Text style={[styles.statIconText, { color: colors.green }]}>✅</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.accepted}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
          </View>
        </View>

        {/* Filters — mirrors web's two filter rows */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Opportunity:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {opportunityOptions.map((opp) => (
              <TouchableOpacity
                key={opp}
                style={[styles.filterBtn, filterOpp === opp && styles.filterBtnActive]}
                onPress={() => setFilterOpp(opp)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.filterText, filterOpp === opp && styles.filterTextActive]}
                  numberOfLines={1}
                >
                  {opp === 'All' ? 'All' : opp.length > 20 ? opp.slice(0, 20) + '...' : opp}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Stage:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {['All', 'under_review', 'interview', 'pitch', 'shortlisted', 'accepted', 'rejected'].map((stage) => {
              const stagePalette = stageById(stage);
              const isActive = filterStage === stage;
              const useStageColor = isActive && stage !== 'All';
              return (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.filterBtn,
                    isActive && !useStageColor && styles.filterBtnActive,
                    useStageColor && {
                      backgroundColor: stagePalette.bg,
                      borderColor: stagePalette.color,
                    },
                  ]}
                  onPress={() => setFilterStage(stage)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && !useStageColor && styles.filterTextActive,
                      useStageColor && { color: stagePalette.color, fontWeight: '600' },
                    ]}
                  >
                    {stage === 'All' ? 'All' : stagePalette.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Applications list — mirrors web's checkbox table */}
        {filteredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📄</Text>
            </View>
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your filters or wait for new submissions.
            </Text>
          </View>
        ) : (
          <View>
            {/* Header row */}
            <View style={styles.listHeader}>
              <TouchableOpacity
                style={styles.checkboxWrap}
                onPress={toggleSelectAll}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedApps.length === filteredApps.length && filteredApps.length > 0
                      ? styles.checkboxChecked
                      : null,
                  ]}
                >
                  {selectedApps.length === filteredApps.length && filteredApps.length > 0 && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.listHeaderLabel}>Select All</Text>
              <Text style={[styles.listHeaderLabel, { width: 100, textAlign: 'center' }]}>Stage</Text>
              <Text style={[styles.listHeaderLabel, { width: 150, textAlign: 'right' }]}>Actions</Text>
            </View>

            {filteredApps.map((app) => {
              const stage = stageById(app.stage);
              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appRow}>
                    <TouchableOpacity
                      style={styles.checkboxWrap}
                      onPress={() => toggleSelectApp(app.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedApps.includes(app.id) && styles.checkboxChecked,
                        ]}
                      >
                        {selectedApps.includes(app.id) && (
                          <Text style={styles.checkboxTick}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    <View style={[styles.appAvatar, { backgroundColor: stage.bg }]}>
                      <Text style={[styles.appAvatarText, { color: stage.color }]}>
                        {app.innovatorName.charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {app.projectName}
                      </Text>
                      <Text style={styles.appSubtitle} numberOfLines={1}>
                        by {app.innovatorName} • {app.opportunity}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appStageRow}>
                    <View style={[styles.stageBadge, { backgroundColor: stage.bg }]}>
                      <Text style={[styles.stageBadgeText, { color: stage.color }]}>{stage.name}</Text>
                    </View>
                    <View style={styles.appActions}>
                      <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => setSelectedApp(app)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnOutlineText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => openStageModal(app.id)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnOutlineText}>Move ▾</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Application detail modal — mirrors web */}
      <Modal
        visible={!!selectedApp}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedApp(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedApp(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedApp?.projectName}</Text>
                <Text style={styles.modalSubtitle}>
                  by {selectedApp?.innovatorName} • {selectedApp?.date}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedApp(null)}
                style={styles.modalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedApp && (() => {
                const stage = stageById(selectedApp.stage);
                return (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Current Stage</Text>
                      <View style={styles.modalStageRow}>
                        <View style={[styles.stageBadge, styles.stageBadgeLarge, { backgroundColor: stage.bg }]}>
                          <Text style={[styles.stageBadgeText, { color: stage.color, fontSize: 13 }]}>
                            {stage.name}
                          </Text>
                        </View>
                        <Text style={styles.modalAppliedTo}>
                          Applied to: {selectedApp.opportunity}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Innovator Information</Text>
                      <View style={styles.innovatorInfoRow}>
                        <View style={[styles.innovatorAvatar, { backgroundColor: stage.bg }]}>
                          <Text style={[styles.innovatorAvatarText, { color: stage.color }]}>
                            {selectedApp.innovatorName.charAt(0)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.innovatorName}>{selectedApp.innovatorName}</Text>
                          <Text style={styles.innovatorEmail}>{selectedApp.innovatorEmail}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Motivation</Text>
                      <Text style={styles.modalSectionText}>{selectedApp.motivation}</Text>
                    </View>

                    {!!selectedApp.experience && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Relevant Experience</Text>
                        <Text style={styles.modalSectionText}>{selectedApp.experience}</Text>
                      </View>
                    )}

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Project Tags</Text>
                      <View style={styles.tagsRow}>
                        {selectedApp.tags.map((tag) => (
                          <View key={tag} style={styles.oppTag}>
                            <Text style={styles.oppTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Quick actions — mirrors web's 4-button row */}
                    <View style={styles.quickActionsBox}>
                      <TouchableOpacity
                        style={[styles.qaBtn, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                        onPress={() => handleStageChange(selectedApp.id, 'rejected')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.qaBtnText, { color: '#dc2626' }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.qaBtn, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}
                        onPress={() => handleStageChange(selectedApp.id, 'interview')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.qaBtnText, { color: '#3b82f6' }]}>Interview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.qaBtn, { borderColor: 'rgba(139, 92, 246, 0.4)' }]}
                        onPress={() => handleStageChange(selectedApp.id, 'pitch')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.qaBtnText, { color: '#8b5cf6' }]}>Pitch</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.qaBtn, styles.qaBtnPrimary]}
                        onPress={() => handleStageChange(selectedApp.id, 'accepted')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.qaBtnText, { color: colors.white }]}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Move to Stage modal — mirrors web */}
      <Modal
        visible={showStageModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowStageModal(false);
          setPendingStageChange(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowStageModal(false);
            setPendingStageChange(null);
          }}
        >
          <Pressable style={[styles.modalContent, { maxWidth: 480 }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move to Stage</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowStageModal(false);
                  setPendingStageChange(null);
                }}
                style={styles.modalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.stageModalDesc}>
                {pendingStageChange?.appId
                  ? 'Moving 1 application to:'
                  : `Moving ${selectedApps.length} application${selectedApps.length !== 1 ? 's' : ''} to:`}
              </Text>
              <View style={styles.stageList}>
                {defaultStages
                  .filter((s) => s.id !== 'under_review')
                  .map((stage) => (
                    <TouchableOpacity
                      key={stage.id}
                      style={styles.stageListItem}
                      onPress={() => {
                        if (pendingStageChange?.appId) {
                          handleStageChange(pendingStageChange.appId, stage.id);
                        } else {
                          handleBulkStageChange(stage.id);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.stageDot,
                          { backgroundColor: stage.bg, borderColor: stage.color },
                        ]}
                      />
                      <Text style={styles.stageListName}>{stage.name}</Text>
                      <Text style={[styles.stageListTick, { color: colors.green }]}>✓</Text>
                    </TouchableOpacity>
                  ))}
              </View>
              <Text style={styles.stageModalNote}>
                Email notification will be sent automatically to applicant(s)
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Settings modal — mirrors web */}
      <Modal
        visible={showSettingsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSettingsModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stage & Email Settings</Text>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Email Templates</Text>
              <View style={styles.templateList}>
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <View key={key} style={styles.templateItem}>
                    <View style={styles.templateItemHeader}>
                      <Text style={styles.templateItemName}>{key} Email</Text>
                      <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => setEditingTemplate(key)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnOutlineText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.templateSubject} numberOfLines={2}>
                      Subject: {template.subject}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit template modal — mirrors web */}
      <Modal
        visible={!!editingTemplate}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingTemplate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingTemplate(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingTemplate} Email Template
              </Text>
              <TouchableOpacity
                onPress={() => setEditingTemplate(null)}
                style={styles.modalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {editingTemplate && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Subject Line</Text>
                    <TextInput
                      style={styles.formInput}
                      value={emailTemplates[editingTemplate].subject}
                      onChangeText={(text) =>
                        setEmailTemplates({
                          ...emailTemplates,
                          [editingTemplate]: {
                            ...emailTemplates[editingTemplate],
                            subject: text,
                          },
                        })
                      }
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Email Body</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      multiline
                      value={emailTemplates[editingTemplate].body}
                      onChangeText={(text) =>
                        setEmailTemplates({
                          ...emailTemplates,
                          [editingTemplate]: {
                            ...emailTemplates[editingTemplate],
                            body: text,
                          },
                        })
                      }
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <Text style={styles.templateVars}>
                    Available variables: {'{name}'}, {'{opportunity}'}, {'{funder}'}
                  </Text>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={() => setEditingTemplate(null)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnOutlineText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnPrimary}
                      onPress={() => {
                        showToast('Email template saved');
                        setEditingTemplate(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnPrimaryText}>Save Template</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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

  /* Bulk action bar */
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bulkText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  /* Stats — 6 cards (mobile wraps onto 2 rows of 3) */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 14,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* Filter groups */
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 90,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },

  /* List header */
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  listHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },

  /* Application row */
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxWrap: {
    padding: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  appAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  stageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stageBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appActions: {
    flexDirection: 'row',
    gap: 8,
  },

  /* Buttons */
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    paddingVertical: 8,
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
    backgroundColor: colors.white,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  modalStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalAppliedTo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  innovatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  innovatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innovatorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  innovatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  innovatorEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  quickActionsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  qaBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: '47%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  qaBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qaBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Stage change modal */
  stageModalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  stageList: {
    gap: 8,
    marginBottom: 14,
  },
  stageListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  stageListName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  stageListTick: {
    fontSize: 14,
    fontWeight: '700',
  },
  stageModalNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },

  /* Settings modal */
  templateList: {
    gap: 10,
  },
  templateItem: {
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  templateItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  templateItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  templateSubject: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  /* Edit template */
  formGroup: {
    marginBottom: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  formTextarea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  templateVars: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 14,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },

  /* Toast */
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

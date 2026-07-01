import React, { useState } from 'react';
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
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useApp } from '../context/AppContext';

const mockOpportunities = [
  {
    id: 1,
    title: 'Climate Tech Innovation Fund',
    organization: 'Zanzibar Green Initiative',
    type: 'Grant',
    category: 'Environment',
    fundingAmount: 50000,
    deadline: '2026-06-15',
    description: 'Supporting innovative solutions to climate challenges in East Africa.',
    status: 'Open',
    tags: ['Environment', 'Technology', 'Climate'],
  },
  {
    id: 2,
    title: 'Women Entrepreneur Accelerator',
    organization: 'SheForward Foundation',
    type: 'Accelerator',
    category: 'Social Impact',
    fundingAmount: 25000,
    deadline: '2026-06-30',
    description: 'Accelerator program for women-led startups.',
    status: 'Open',
    tags: ['Women', 'Leadership', 'Business'],
  },
  {
    id: 3,
    title: 'AgriTech Development Grant',
    organization: 'Ministry of Agriculture Zanzibar',
    type: 'Grant',
    category: 'Agriculture',
    fundingAmount: 30000,
    deadline: '2026-07-20',
    description: 'Technology solutions for agricultural challenges.',
    status: 'Open',
    tags: ['Agriculture', 'Technology', 'Food Security'],
  },
];

export default function BrowseOpportunitiesScreen({ navigation }) {
  const { isClubMember } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('opportunities');
  const [formData, setFormData] = useState({
    projectName: '',
    problemStatement: '',
    solution: '',
    budget: '',
  });

  const types = ['All', 'Grant', 'Accelerator', 'Challenge', 'Fellowship'];

  const filteredOpportunities = mockOpportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || opp.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApplyPress = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = () => {
    if (!formData.projectName || !formData.problemStatement || !formData.solution) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setApplicationSubmitted(true);
    setTimeout(() => {
      setShowApplyModal(false);
      setApplicationSubmitted(false);
      setFormData({
        projectName: '',
        problemStatement: '',
        solution: '',
        budget: '',
      });
      Alert.alert('Success', 'Application submitted successfully!');
    }, 2000);
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
          <Text style={styles.pageTitle}>Browse Opportunities</Text>
          <Text style={styles.pageSubtitle}>Discover funding opportunities from organizations</Text>
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Type Filters — wrapping row (no nested ScrollView) */}
        <View style={styles.filterContainer}>
          {types.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Opportunities List */}
        <View style={styles.opportunitiesContainer}>
          {filteredOpportunities.map(opp => {
            const daysLeft = getDaysRemaining(opp.deadline);
            return (
              <View key={opp.id} style={styles.opportunityCard}>
                <View style={styles.oppHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#0284c7' }]}>{opp.type}</Text>
                  </View>
                  <Text style={[styles.deadlineText, daysLeft <= 14 ? styles.deadlineUrgent : {}]}>
                    {daysLeft} days left
                  </Text>
                </View>
                <Text style={styles.oppTitle}>{opp.title}</Text>
                <Text style={styles.oppOrganization}>{opp.organization}</Text>
                <Text style={styles.oppDescription} numberOfLines={2}>{opp.description}</Text>
                <View style={styles.oppFooter}>
                  <Text style={styles.oppAmount}>{formatCurrency(opp.fundingAmount)}</Text>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={() => handleApplyPress(opp)}
                  >
                    <Text style={styles.applyButtonText}>Apply Now →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Application Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}
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
                onPress={() => setShowApplyModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {applicationSubmitted ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Application Submitted!</Text>
                <Text style={styles.successText}>You can track its status in "My Applications".</Text>
                <TouchableOpacity 
                  style={styles.successButton}
                  onPress={() => {
                    setShowApplyModal(false);
                    setApplicationSubmitted(false);
                  }}
                >
                  <Text style={styles.successButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Project / Idea Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Give your idea a clear title"
                    value={formData.projectName}
                    onChangeText={(text) => setFormData({...formData, projectName: text})}
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
                    onChangeText={(text) => setFormData({...formData, problemStatement: text})}
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
                    onChangeText={(text) => setFormData({...formData, solution: text})}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Estimated Budget (USD)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="How much funding do you need?"
                    keyboardType="numeric"
                    value={formData.budget}
                    onChangeText={(text) => setFormData({...formData, budget: text})}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowApplyModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleSubmitApplication}
                  >
                    <Text style={styles.submitButtonText}>Submit Application</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.white,
  },
  opportunitiesContainer: {
    padding: 20,
    gap: 16,
  },
  opportunityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deadlineUrgent: {
    color: '#ef4444',
    fontWeight: '600',
  },
  oppTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  oppOrganization: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  oppDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  oppFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  oppAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  modalOpportunityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.white,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  successContainer: {
    padding: 40,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  successButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

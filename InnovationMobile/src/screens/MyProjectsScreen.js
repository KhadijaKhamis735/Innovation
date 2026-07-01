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

const phases = [
  { id: 'idea', label: 'Idea', desc: 'Concept development', color: '#0284c7', bg: '#e0f2fe' },
  { id: 'proposal', label: 'Proposal', desc: 'Planning & pitching', color: '#d97706', bg: '#fef3c7' },
  { id: 'prototype', label: 'Prototype', desc: 'Building & testing', color: '#7c3aed', bg: '#f3e8ff' },
  { id: 'mvp', label: 'MVP', desc: 'Minimum viable product', color: '#16a34a', bg: '#dcfce7' },
  { id: 'scaling', label: 'Scaling', desc: 'Growth & expansion', color: '#ea580c', bg: '#ffedd5' },
];

const milestones = {
  idea: [
    { id: 'idea-1', label: 'Problem statement', desc: 'Define the problem you\'re solving' },
    { id: 'idea-2', label: 'Initial concept', desc: 'Describe your core idea' },
    { id: 'idea-3', label: 'Target audience', desc: 'Identify your target users' },
  ],
  proposal: [
    { id: 'proposal-1', label: 'Business plan', desc: 'Create a detailed business plan' },
    { id: 'proposal-2', label: 'Budget outline', desc: 'Define your budget and funding needs' },
    { id: 'proposal-3', label: 'Team composition', desc: 'List your team members and roles' },
  ],
  prototype: [
    { id: 'prototype-1', label: 'Working prototype', desc: 'Build a functional prototype' },
    { id: 'prototype-2', label: 'Testing results', desc: 'Document testing outcomes' },
    { id: 'prototype-3', label: 'User feedback', desc: 'Collect feedback from users' },
  ],
  mvp: [
    { id: 'mvp-1', label: 'Core features ready', desc: 'Implement essential features' },
    { id: 'mvp-2', label: 'Beta testing complete', desc: 'Run beta testing phase' },
    { id: 'mvp-3', label: 'Market validation', desc: 'Validate market demand' },
  ],
  scaling: [
    { id: 'scaling-1', label: 'Revenue model', desc: 'Define your revenue strategy' },
    { id: 'scaling-2', label: 'Growth strategy', desc: 'Plan your growth path' },
    { id: 'scaling-3', label: 'Team expansion', desc: 'Expand your team capacity' },
  ],
};

const initialProjects = [
  {
    id: 1,
    zsaId: 'ZSA-INV-2025-001',
    name: 'Smart Water Monitor',
    category: 'IoT / Environment',
    phase: 'prototype',
    date: 'Mar 2025',
    description: 'IoT-based water quality monitoring system for rural communities.',
    completedMilestones: ['idea-1', 'idea-2', 'idea-3', 'proposal-1', 'proposal-2', 'proposal-3', 'prototype-1'],
  },
  {
    id: 2,
    zsaId: 'ZSA-INV-2025-002',
    name: 'AI Crop Disease Detector',
    category: 'AgriTech',
    phase: 'proposal',
    date: 'Jan 2025',
    description: 'Machine learning model to detect crop diseases from smartphone photos.',
    completedMilestones: ['idea-1', 'idea-2', 'idea-3'],
  },
  {
    id: 3,
    zsaId: 'ZSA-INV-2026-001',
    name: 'E-Commerce Platform',
    category: 'FinTech',
    phase: 'idea',
    date: 'May 2026',
    description: 'Peer-to-peer marketplace for local artisans.',
    completedMilestones: ['idea-1'],
  },
];

export default function MyProjectsScreen({ navigation }) {
  // Read shared projects from AppContext instead of holding local state.
  // This is what makes the Club → Innovation integration work: a project
  // created inside the Club flow lands in the same list as the user's
  // existing innovation projects.
  const { projects, isClubMember } = useApp();
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('projects');

  const getPhaseInfo = (phaseId) => phases.find(p => p.id === phaseId);

  const getPhaseProgress = (project, phaseId) => {
    const phaseMilestones = milestones[phaseId] || [];
    if (phaseMilestones.length === 0) return 0;
    const completed = phaseMilestones.filter(m => project.completedMilestones.includes(m.id)).length;
    return Math.round((completed / phaseMilestones.length) * 100);
  };

  const getOverallProgress = (project) => {
    let completed = 0;
    let total = 0;
    phases.forEach(phase => {
      const phaseMilestones = milestones[phase.id] || [];
      total += phaseMilestones.length;
      completed += phaseMilestones.filter(m => project.completedMilestones.includes(m.id)).length;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const filteredProjects = selectedPhase === 'all' 
    ? projects 
    : projects.filter(p => p.phase === selectedPhase);

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
          <Text style={styles.pageTitle}>My Projects</Text>
          <Text style={styles.pageSubtitle}>Track your innovation journey through each phase</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('ClubCreateProject')}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        alwaysBounceVertical={true}
        bounces={true}
      >

        {/* Phase Filter — wrapping row (no nested ScrollView) */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPhase === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedPhase('all')}
          >
            <Text style={[styles.filterText, selectedPhase === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {phases.map(phase => (
            <TouchableOpacity
              key={phase.id}
              style={[styles.filterChip, selectedPhase === phase.id && styles.filterChipActive]}
              onPress={() => setSelectedPhase(phase.id)}
            >
              <Text style={[styles.filterText, selectedPhase === phase.id && styles.filterTextActive]}>{phase.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Projects List */}
        <View style={styles.projectsContainer}>
          {filteredProjects.map(project => {
            const phaseInfo = getPhaseInfo(project.phase);
            const phaseProgress = getPhaseProgress(project, project.phase);
            const overallProgress = getOverallProgress(project);
            
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => navigation.navigate('ClubProjectDetail', { projectId: project.id })}
              >
                <View style={styles.projectHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectZsaId}>{project.zsaId}</Text>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.source === 'club' && (
                      <View style={styles.clubTag}>
                        <Text style={styles.clubTagText}>🎓 Club project</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.phaseBadge, { backgroundColor: phaseInfo?.bg }]}>
                    <Text style={[styles.phaseText, { color: phaseInfo?.color }]}>{phaseInfo?.label}</Text>
                  </View>
                </View>
                
                <Text style={styles.projectCategory}>{project.category}</Text>
                <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Overall Progress</Text>
                    <Text style={styles.progressValue}>{overallProgress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
                  </View>
                </View>

                {/* Phase Progress */}
                <View style={styles.phaseProgress}>
                  <Text style={styles.phaseProgressLabel}>Current Phase Progress</Text>
                  <View style={styles.phaseProgressBar}>
                    <View style={[styles.phaseProgressFill, { width: `${phaseProgress}%`, backgroundColor: phaseInfo?.color }]} />
                  </View>
                  <Text style={[styles.phaseProgressText, { color: phaseInfo?.color }]}>{phaseProgress}%</Text>
                </View>

                <View style={styles.projectFooter}>
                  <Text style={styles.projectDate}>Started: {project.date}</Text>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Details →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Create New Project Button */}
        <TouchableOpacity style={styles.createButton} onPress={() => Alert.alert('Create Project', 'Project creation form coming soon!')}>
          <Text style={styles.createButtonIcon}>➕</Text>
          <Text style={styles.createButtonText}>Create New Project</Text>
        </TouchableOpacity>
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
  createBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
    minHeight: 36,
    justifyContent: 'center',
  },
  createBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  clubTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clubTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  projectsContainer: {
    padding: 20,
    gap: 16,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectZsaId: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  projectDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  phaseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  phaseProgressLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  phaseProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  phaseProgressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  projectDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  createButtonIcon: {
    fontSize: 18,
    color: colors.white,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

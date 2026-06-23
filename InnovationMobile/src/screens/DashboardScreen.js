import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

export default function DashboardScreen() {
  const stats = [
    { value: '3', label: 'Active Projects' },
    { value: '5', label: 'Applications' },
    { value: '2', label: 'In Review' },
  ];

  const projects = [
    { id: 1, name: 'Smart Water Monitor', stage: 'Prototype', progress: 60 },
    { id: 2, name: 'AI Crop Detector', stage: 'Proposal', progress: 40 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back, Innovator! 👋</Text>
        <Text style={styles.subtitle}>Track your innovation journey</Text>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.actionCard}>
        <Text style={styles.actionText}>➕ Create New Project</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard}>
        <Text style={styles.actionText}>🔍 Browse Opportunities</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Projects</Text>
      {projects.map((project) => (
        <View key={project.id} style={styles.projectCard}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectStage}>{project.stage}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{project.progress}% Complete</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  welcome: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  actionCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  actionText: { fontSize: 16, color: colors.textPrimary },
  projectCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  projectName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  projectStage: { fontSize: 12, color: colors.primary, marginTop: 4 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
});

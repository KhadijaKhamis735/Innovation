import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

const opportunityTypes = [
  { value: 'Grant', desc: 'Funding for specific projects or research' },
  { value: 'Accelerator', desc: 'Mentorship and resources for growth' },
  { value: 'Challenge', desc: 'Competition with prizes for solutions' },
  { value: 'Fellowship', desc: 'Structured program for skill development' },
];

export default function PostOpportunity({ navigation }) {
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

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Opportunity posted successfully!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a1f3c', '#0e4d8c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Opportunity</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Create an opportunity for innovators to apply</Text>
      </LinearGradient>

      <ScrollView style={styles.formContainer}>
        {/* Step indicator */}
        <View style={styles.stepsContainer}>
          <View style={[styles.step, step >= 1 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
            <Text style={styles.stepLabel}>Basic Info</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.step, step >= 2 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
            <Text style={styles.stepLabel}>Details</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.step, step >= 3 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
            <Text style={styles.stepLabel}>Review</Text>
          </View>
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            
            <Text style={styles.label}>Opportunity Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Green Tech Innovation Grant 2026"
              value={form.title}
              onChangeText={(text) => setForm({...form, title: text})}
            />

            <Text style={styles.label}>Type *</Text>
            <View style={styles.typeGrid}>
              {opportunityTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeCard, form.type === type.value && styles.typeCardActive]}
                  onPress={() => setForm({...form, type: type.value})}
                >
                  <Text style={[styles.typeTitle, form.type === type.value && styles.typeTitleActive]}>
                    {type.value}
                  </Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Award / Value</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., $10,000 or Mentorship"
              value={form.amount}
              onChangeText={(text) => setForm({...form, amount: text})}
            />

            <Text style={styles.label}>Application Deadline *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={form.deadline}
              onChangeText={(text) => setForm({...form, deadline: text})}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Opportunity Details</Text>

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what this opportunity offers, who should apply..."
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(text) => setForm({...form, description: text})}
            />

            <Text style={styles.label}>Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List eligibility criteria, qualifications..."
              multiline
              numberOfLines={3}
              value={form.requirements}
              onChangeText={(text) => setForm({...form, requirements: text})}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Zanzibar, Tanzania or Remote"
              value={form.location}
              onChangeText={(text) => setForm({...form, location: text})}
            />

            <Text style={styles.label}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Technology, Health, Youth"
              value={form.tags}
              onChangeText={(text) => setForm({...form, tags: text})}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review Your Opportunity</Text>
            <View style={styles.reviewContainer}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewType, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.reviewTypeText, { color: '#0284c7' }]}>{form.type}</Text>
                </View>
                <Text style={styles.reviewTitle}>{form.title || 'Untitled Opportunity'}</Text>
              </View>

              <View style={styles.reviewRow}>
                {form.amount && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Award</Text>
                    <Text style={styles.reviewValue}>{form.amount}</Text>
                  </View>
                )}
                {form.deadline && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Deadline</Text>
                    <Text style={styles.reviewValue}>{form.deadline}</Text>
                  </View>
                )}
                {form.location && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Location</Text>
                    <Text style={styles.reviewValue}>{form.location}</Text>
                  </View>
                )}
              </View>

              {form.description && (
                <View>
                  <Text style={styles.reviewLabel}>Description</Text>
                  <Text style={styles.reviewText}>{form.description}</Text>
                </View>
              )}

              {form.requirements && (
                <View>
                  <Text style={styles.reviewLabel}>Requirements</Text>
                  <Text style={styles.reviewText}>{form.requirements}</Text>
                </View>
              )}

              {form.tags && (
                <View style={styles.tagsContainer}>
                  {form.tags.split(',').map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.primaryButton, step === 1 && { flex: 1 }]} 
            onPress={() => step < 3 ? setStep(step + 1) : handleSubmit()}
          >
            <Text style={styles.primaryButtonText}>
              {step < 3 ? 'Continue' : 'Post Opportunity'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  formContainer: { padding: 20 },
  stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  step: { alignItems: 'center' },
  stepActive: { opacity: 1 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, textAlign: 'center', lineHeight: 32, fontSize: 14, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  stepNumberActive: { backgroundColor: colors.primary, color: colors.white },
  stepLabel: { fontSize: 11, color: colors.textMuted },
  stepLine: { width: 40, height: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  typeCard: { flex: 1, minWidth: '45%', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.white },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  typeTitleActive: { color: colors.primary },
  typeDesc: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 30 },
  primaryButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: colors.border, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  reviewContainer: { gap: 16 },
  reviewHeader: { alignItems: 'center' },
  reviewType: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  reviewTypeText: { fontSize: 11, fontWeight: '600' },
  reviewTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: colors.background, borderRadius: 10 },
  reviewItem: { alignItems: 'center' },
  reviewLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  reviewValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  reviewText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.primaryLight, borderRadius: 20 },
  tagText: { fontSize: 12, color: colors.primary },
});

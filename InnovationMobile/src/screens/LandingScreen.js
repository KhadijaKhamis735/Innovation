import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

const features = [
  {
    icon: '🚀',
    title: 'Launch Your Ideas',
    desc: 'Create and manage innovation projects with structured tools. Track stages from Idea to MVP.',
  },
  {
    icon: '🤝',
    title: 'Connect with Funders',
    desc: 'Find partners, funding, and mentorship from approved funders.',
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    desc: 'Monitor applications, projects, and opportunities in a unified dashboard.',
  },
  {
    icon: '🎯',
    title: 'Smart Matching',
    desc: 'Our system helps connect your projects with the right opportunities.',
  },
];

const steps = [
  { num: '1', title: 'Create Account', desc: 'Sign up as Innovator or Funder' },
  { num: '2', title: 'Build Profile', desc: 'Add your projects or funding needs' },
  { num: '3', title: 'Apply / Post', desc: 'Submit for funding or post opportunities' },
  { num: '4', title: 'Grow Together', desc: 'Track funding and achieve goals' },
];

const stats = [
  { value: '1,200+', label: 'Innovators' },
  { value: '340+', label: 'Funders' },
  { value: '850+', label: 'Projects' },
  { value: '96%', label: 'Match Rate' },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#fff8f0', '#ffffff', '#fff5eb']}
          style={styles.hero}
        >
          {/* Decorative blobs */}
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.heroBadgeText}>Innovation Management System</Text>
            </View>

            <Text style={styles.heroTitle}>
              Where Ideas Meet{' '}
              <Text style={styles.heroGradient}>Opportunity</Text>
            </Text>

            <Text style={styles.heroDesc}>
              The unified platform bridging innovators and funders submit projects, discover funding opportunities, and track every step of your innovation journey.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('Register', { role: 'innovator' })}
              >
                <Text style={styles.btnPrimaryText}>Join as Innovator</Text>
                <Text style={styles.btnPrimaryArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('Register', { role: 'funder' })}
              >
                <Text style={styles.btnSecondaryText}>Register as Funder</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroNote}>
              Funders require <Text style={styles.heroNoteHighlight}>admin approval</Text> before posting funding opportunities
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <LinearGradient
          colors={['#1a1a2e', '#2d1f0f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBar}
        >
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>Features</Text>
          </View>
          <Text style={styles.sectionTitle}>Everything You Need</Text>
          <Text style={styles.sectionSub}>
            Built for innovators and funders to collaborate seamlessly
          </Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff8f0', '#fff5eb']}
                  style={styles.featureIcon}
                >
                  <Text style={styles.featureIconText}>{feature.icon}</Text>
                </LinearGradient>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <LinearGradient
          colors={['#fff8f0', '#ffffff']}
          style={styles.howItWorksContainer}
        >
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>Process</Text>
          </View>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSub}>Get started in four simple steps</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={step.num} style={styles.stepCard}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{step.num}</Text>
                </LinearGradient>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
                {index < steps.length - 1 && (
                  <Text style={styles.stepArrow}>→</Text>
                )}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* CTA Section */}
        <View style={styles.ctaContainer}>
          <LinearGradient
            colors={['#1a1a2e', '#2d1f0f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaTitle}>
              Ready to <Text style={styles.ctaHighlight}>Transform</Text> Your Ideas?
            </Text>
            <Text style={styles.ctaSub}>
              Join hundreds of innovators and funders already making an impact.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.ctaBtnText}>Create Free Account</Text>
              <Text style={styles.ctaBtnArrow}>→</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.footerLogoIcon}
            >
              <Text style={styles.footerLogoIconText}>⚡</Text>
            </LinearGradient>
            <Text style={styles.footerLogoName}>Innovation Management System</Text>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            © 2025 Innovation Management System — Final Year Project
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* Hero */
  hero: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 250,
    opacity: 0.6,
  },
  blob1: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    top: -80,
    right: -100,
  },
  blob2: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    bottom: -50,
    left: -80,
  },
  blob3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    top: '40%',
    left: '10%',
  },
  heroContent: {
    maxWidth: 360,
    alignItems: 'center',
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: 20,
    lineHeight: 42,
  },
  heroGradient: {
    color: colors.primary,
  },
  heroDesc: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 36,
    maxWidth: 320,
  },
  heroButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  btnPrimaryArrow: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  heroNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  heroNoteHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },

  /* Stats */
  statsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Section shared */
  sectionTag: {
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  sectionTagText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 16,
    lineHeight: 22,
  },

  /* Features */
  featuresContainer: {
    paddingVertical: 64,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: 20,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  /* How It Works */
  howItWorksContainer: {
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  stepArrow: {
    position: 'absolute',
    top: 12,
    right: -14,
    color: colors.primary,
    fontSize: 18,
    opacity: 0.5,
  },

  /* CTA */
  ctaContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  ctaGradient: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  ctaHighlight: {
    color: colors.primary,
  },
  ctaSub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 320,
    lineHeight: 22,
  },
  ctaBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 4,
  },
  ctaBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
  },
  ctaBtnArrow: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerLogoIconText: {
    color: colors.white,
    fontSize: 18,
  },
  footerLogoName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  footerLink: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
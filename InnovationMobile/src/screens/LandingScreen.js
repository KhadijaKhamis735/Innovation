import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

const partners = ['Zanzibar Innovation Hub'];

const features = [
  {
    icon: '🚀',
    title: 'Launch Your Ideas',
    desc: 'Create and manage innovation projects with structured tools. Track stages from Idea to MVP.',
    accent: '#f97316',
  },
  {
    icon: '🤝',
    title: 'Connect with Funders',
    desc: 'Find partners, funding, and mentorship from approved funders.',
    accent: '#7c3aed',
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    desc: 'Monitor applications, projects, and opportunities in a unified dashboard.',
    accent: '#10b981',
  },
  {
    icon: '🎯',
    title: 'Smart Matching',
    desc: 'Our system helps connect your projects with the right opportunities.',
    accent: '#0284c7',
  },
];

const steps = [
  { num: '1', title: 'Create Account', desc: 'Pick your role from the dropdown — innovator, funder, club member, or club leader' },
  { num: '2', title: 'Build Profile', desc: 'Add your projects or funding needs' },
  { num: '3', title: 'Apply / Post', desc: 'Submit for funding or post opportunities' },
  { num: '4', title: 'Grow Together', desc: 'Track funding and achieve goals' },
];

const whyItems = [
  {
    title: 'One account, every role.',
    desc: 'Innovator, Funder, Club Member, or Club Leader — pick yours on the next screen.',
  },
  {
    title: 'Real matching, not magic.',
    desc: 'Our match engine looks at sector, stage, and funding size.',
  },
  {
    title: 'Constitution grade clubs.',
    desc: 'Treasury, IP, discipline, and elections all by the book.',
  },
];

const bentoCards = [
  {
    icon: '🚀',
    title: 'From idea to MVP',
    desc: '5-stage project tracker with milestones, deliverables and feedback loops.',
    variant: 'orange',
  },
  {
    icon: '🪙',
    title: 'Funding clarity',
    desc: 'See every active call, deadline, and applicant in one tidy dashboard.',
    variant: 'purple',
  },
  {
    icon: '🏛️',
    title: 'Real clubs',
    desc: 'Run elections, meetings, treasury and discipline constitutionally.',
    variant: 'green',
  },
  {
    icon: '✨',
    title: 'AI grant writer',
    desc: 'Draft winning applications in minutes, tailored to each call.',
    variant: 'dark',
    badge: 'Coming soon',
  },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff8f0" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* ============ HERO ============ */}
        <View style={styles.hero}>
          {/* Decorative blobs */}
          <View pointerEvents="none" style={[styles.heroBlob, styles.heroBlob1]} />
          <View pointerEvents="none" style={[styles.heroBlob, styles.heroBlob2]} />
          <View pointerEvents="none" style={[styles.heroBlob, styles.heroBlob3]} />

          <View style={styles.heroInner}>
            <View style={styles.heroText}>
              <View style={styles.heroBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.heroBadgeText}>Innovation Management System</Text>
              </View>

              <Text style={styles.heroTitle}>
                Where Ideas Meet{' '}
                <Text style={styles.heroGradient}>Opportunity</Text>
              </Text>

              <Text style={styles.heroDesc}>
                The unified platform bridging innovators, funders, and student-led
                innovation clubs. Submit projects, discover funding opportunities,
                run your club, and grow your innovation journey — all in one place.
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

                <TouchableOpacity
                  style={[styles.btnSecondary, styles.btnSecondaryClub]}
                  onPress={() => navigation.navigate('Register', { role: 'club_member' })}
                >
                  <Text style={styles.btnSecondaryText}>Join as Club Member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSecondary, styles.btnSecondaryClub]}
                  onPress={() => navigation.navigate('Register', { role: 'club_leader' })}
                >
                  <Text style={styles.btnSecondaryText}>Register as Club Leader</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroNote}>
                One account, every role — pick yours on the next screen.
              </Text>
            </View>

            {/* Visual showcase */}
            <View pointerEvents="box-none" style={styles.heroVisual}>
              <View style={styles.heroVisualMain}>
                <LinearGradient
                  colors={['#fff8f0', '#fff5eb']}
                  style={styles.heroVisualPanel}
                >
                  <Text style={styles.heroVisualEmoji}>⚡</Text>
                  <Text style={styles.heroVisualTitle}>Innovation</Text>
                  <Text style={styles.heroVisualSub}>Management System</Text>
                </LinearGradient>
              </View>

              <View style={[styles.heroFloat, styles.heroFloat1]}>
                <View style={[styles.heroFloatIcon, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={{ fontSize: 18 }}>🎓</Text>
                </View>
                <View>
                  <Text style={styles.heroFloatTitle}>New Grant</Text>
                  <Text style={styles.heroFloatSub}>UNDP Tanzania · $5,000</Text>
                </View>
              </View>

              <View style={[styles.heroFloat, styles.heroFloat2]}>
                <View style={[styles.heroFloatIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={{ fontSize: 18 }}>🤝</Text>
                </View>
                <View>
                  <Text style={styles.heroFloatTitle}>+12 Innovators</Text>
                  <Text style={styles.heroFloatSub}>joined this week</Text>
                </View>
              </View>

              <View style={[styles.heroFloat, styles.heroFloat3]}>
                <View style={[styles.heroFloatIcon, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.heroFloatTick, { color: '#16a34a' }]}>✓</Text>
                </View>
                <View>
                  <Text style={styles.heroFloatTitle}>Application sent</Text>
                  <Text style={styles.heroFloatSub}>Blue Economy Fund</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============ PARTNERS STRIP ============ */}
        <View style={styles.partnersStrip}>
          <Text style={styles.partnersLabel}>
            Trusted by leading organizations across East Africa
          </Text>
          <View style={styles.partnersTrack}>
            {partners.map((p, i) => (
              <Text key={i} style={styles.partnersChip}>
                {p}
              </Text>
            ))}
          </View>
        </View>

        {/* ============ STATS BAR ============ */}
        <LinearGradient
          colors={['#1a1a2e', '#2d1f0f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBar}
        >
          <Text style={styles.statsMessage}>
            Real numbers — coming once your community grows
          </Text>
        </LinearGradient>

        {/* ============ FEATURES ============ */}
        <View style={styles.features}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>Features</Text>
          </View>
          <Text style={styles.sectionTitle}>Everything You Need</Text>
          <Text style={styles.sectionSub}>
            Built for innovators, funders, and student innovation clubs to collaborate
            seamlessly
          </Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIconWrap,
                    { backgroundColor: hexWithAlpha(feature.accent, 0.12) },
                  ]}
                >
                  <Text style={styles.featureIconText}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
                <Text
                  style={[styles.featureArrow, { color: feature.accent }]}
                >
                  Learn more →
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ============ WHY US (BENTO) ============ */}
        <LinearGradient
          colors={['#fff8f0', '#ffffff']}
          style={styles.whySection}
        >
          <View style={styles.whyInner}>
            <View style={styles.whyText}>
              <View style={[styles.sectionTag, styles.sectionTagLight]}>
                <Text style={[styles.sectionTagText, styles.sectionTagTextLight]}>
                  Why Choose Us
                </Text>
              </View>
              <Text style={styles.whyTitle}>
                Built for the way{' '}
                <Text style={styles.whyTitleAccent}>innovation actually works</Text>
              </Text>
              <Text style={styles.whyDesc}>
                We didn't build another generic project board. We built it for the
                way real innovators move from idea to funded MVP with a club backbone
                that keeps student teams accountable.
              </Text>

              <View style={styles.whyList}>
                {whyItems.map((item, index) => (
                  <View key={index} style={styles.whyListItem}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.whyCheck}
                    >
                      <Text style={styles.whyCheckText}>✓</Text>
                    </LinearGradient>
                    <View style={styles.whyListText}>
                      <Text style={styles.whyListTitle}>{item.title}</Text>
                      <Text style={styles.whyListSub}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.whyBento}>
              {bentoCards.map((card, index) => (
                <View
                  key={index}
                  style={[
                    styles.bentoCard,
                    card.variant === 'orange' && styles.bentoCardOrange,
                    card.variant === 'purple' && styles.bentoCardPurple,
                    card.variant === 'green' && styles.bentoCardGreen,
                    card.variant === 'dark' && styles.bentoCardDark,
                  ]}
                >
                  {card.badge && (
                    <View style={styles.bentoCardTag}>
                      <Text style={styles.bentoCardTagText}>{card.badge}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bentoCardIcon,
                      card.variant === 'orange' && styles.bentoCardIconOrange,
                      card.variant === 'purple' && styles.bentoCardIconPurple,
                      card.variant === 'green' && styles.bentoCardIconGreen,
                      card.variant === 'dark' && styles.bentoCardIconDark,
                    ]}
                  >
                    <Text style={styles.bentoCardIconText}>{card.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.bentoCardTitle,
                      card.variant === 'dark' && styles.bentoCardTitleDark,
                    ]}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={[
                      styles.bentoCardDesc,
                      card.variant === 'dark' && styles.bentoCardDescDark,
                    ]}
                  >
                    {card.desc}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* ============ HOW IT WORKS ============ */}
        <LinearGradient
          colors={['#ffffff', '#fff8f0']}
          style={styles.howItWorks}
        >
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>Process</Text>
          </View>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSub}>Get started in four simple steps</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step) => (
              <View key={step.num} style={styles.stepCard}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{step.num}</Text>
                </LinearGradient>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ============ CTA ============ */}
        <View style={styles.cta}>
          <LinearGradient
            colors={['#1a1a2e', '#2d1f0f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            {/* Decorative shapes */}
            <View pointerEvents="none" style={[styles.ctaShape, styles.ctaShape1]} />
            <View pointerEvents="none" style={[styles.ctaShape, styles.ctaShape2]} />

            <View style={styles.ctaContent}>
              <Text style={styles.ctaEyebrow}>Ready when you are</Text>
              <Text style={styles.ctaTitle}>
                Ready to <Text style={styles.ctaHighlight}>Transform</Text> Your Ideas?
              </Text>
              <Text style={styles.ctaSub}>
                Sign up to start posting projects or funding opportunities.
              </Text>
              <View style={styles.ctaButtons}>
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.ctaBtnText}>Create Free Account</Text>
                  <Text style={styles.ctaBtnArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ctaBtnGhost}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.ctaBtnGhostText}>Browse Opportunities</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ============ FOOTER ============ */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.footerLogoIcon}
            >
              <Text style={styles.footerLogoIconText}>⚡</Text>
            </LinearGradient>
            <View>
              <Text style={styles.footerBrandTitle}>Innovation Management System</Text>
              <Text style={styles.footerBrandSub}>
                Empowering the next generation of innovators.
              </Text>
            </View>
          </View>

          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Platform</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>How It Works</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Account</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>
            © 2025 Innovation Management System — Final Year Project
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Tiny helper: turn "#f97316" into "rgba(249, 115, 22, 0.12)" without pulling
   in a color library — used for translucent feature-icon backgrounds. */
function hexWithAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* ===== Hero ===== */
  hero: {
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 20,
    backgroundColor: '#fff8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 260,
    opacity: 0.6,
  },
  heroBlob1: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    top: -100,
    right: -100,
  },
  heroBlob2: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    bottom: -80,
    left: -80,
  },
  heroBlob3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
    top: '45%',
    left: '5%',
  },
  heroInner: {
    position: 'relative',
    zIndex: 1,
  },
  heroText: {
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.20)',
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
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 20,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heroGradient: {
    color: colors.primary,
  },
  heroDesc: {
    fontSize: 15,
    textAlign: 'center',
    color: '#475569',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 360,
  },
  heroButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
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
    shadowOffset: { width: 0, height: 6 },
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
    borderColor: 'rgba(249, 115, 22, 0.30)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondaryClub: {
    borderColor: 'rgba(124, 58, 237, 0.30)',
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
  },
  heroNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  /* Hero visual showcase */
  heroVisual: {
    marginTop: 40,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroVisualMain: {
    width: 220,
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.20,
    shadowRadius: 30,
    elevation: 6,
  },
  heroVisualPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroVisualEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroVisualTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  heroVisualSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  heroFloat: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  heroFloatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  heroFloatTick: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroFloatTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  heroFloatSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  heroFloat1: {
    top: 8,
    left: 8,
  },
  heroFloat2: {
    top: 60,
    right: 0,
  },
  heroFloat3: {
    bottom: 12,
    left: 16,
  },

  /* ===== Partners strip ===== */
  partnersStrip: {
    backgroundColor: colors.white,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  partnersLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  partnersTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  partnersChip: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    opacity: 0.7,
  },

  /* ===== Stats Bar ===== */
  statsBar: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statsMessage: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  /* ===== Section Tags & Titles ===== */
  sectionTag: {
    alignSelf: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
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
  sectionTagLight: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249, 115, 22, 0.20)',
  },
  sectionTagTextLight: {
    color: '#fdba74',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  sectionSub: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 16,
    lineHeight: 22,
  },

  /* ===== Features ===== */
  features: {
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
    padding: 18,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 10,
  },
  featureArrow: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* ===== Why section ===== */
  whySection: {
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  whyInner: {
    width: '100%',
  },
  whyText: {
    marginBottom: 32,
  },
  whyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  whyTitleAccent: {
    color: colors.primary,
  },
  whyDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 23,
    marginBottom: 22,
  },
  whyList: {
    gap: 16,
  },
  whyListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  whyCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  whyCheckText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  whyListText: {
    flex: 1,
  },
  whyListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  whyListSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 17,
  },
  whyBento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bentoCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    minHeight: 150,
    justifyContent: 'flex-start',
  },
  bentoCardOrange: {
    backgroundColor: '#fff8f0',
    borderColor: 'rgba(249, 115, 22, 0.15)',
  },
  bentoCardPurple: {
    backgroundColor: '#faf5ff',
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  bentoCardGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  bentoCardDark: {
    backgroundColor: '#0f172a',
    borderColor: 'transparent',
  },
  bentoCardTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249, 115, 22, 0.20)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  bentoCardTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#fb923c',
  },
  bentoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bentoCardIconOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  bentoCardIconPurple: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  bentoCardIconGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  bentoCardIconDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bentoCardIconText: {
    fontSize: 18,
  },
  bentoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  bentoCardTitleDark: {
    color: colors.white,
  },
  bentoCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  bentoCardDescDark: {
    color: '#94a3b8',
  },

  /* ===== How it works ===== */
  howItWorks: {
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stepCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: 18,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 4,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
  },

  /* ===== CTA ===== */
  cta: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  ctaGradient: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ctaShape: {
    position: 'absolute',
    borderRadius: 200,
  },
  ctaShape1: {
    width: 240,
    height: 240,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    top: -60,
    left: -60,
  },
  ctaShape2: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    bottom: -50,
    right: -40,
  },
  ctaContent: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  ctaEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: '#fb923c',
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  ctaHighlight: {
    color: colors.primary,
  },
  ctaSub: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 320,
    lineHeight: 21,
  },
  ctaButtons: {
    width: '100%',
    gap: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  ctaBtnArrow: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  ctaBtnGhost: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaBtnGhostText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  /* ===== Footer ===== */
  footer: {
    backgroundColor: '#0a0f1c',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
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
    fontSize: 16,
  },
  footerBrandTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footerBrandSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 220,
  },
  footerCols: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 28,
  },
  footerCol: {
    gap: 8,
  },
  footerColTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  footerLink: {
    color: '#94a3b8',
    fontSize: 13,
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
});
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/Sidebar';

// ClubResourcesScreen
// --------------------
// Two tabs: Learning Materials | Announcements.
// All data is read from context, so updates from an admin dashboard
// show up immediately. Materials include an "Open" CTA that uses
// Linking to open the URL in the device browser.

const TYPE_COLORS = {
  PDF:     { bg: colors.statusReviewBg,   fg: colors.statusReviewText },
  Slides:  { bg: colors.primaryLight,     fg: colors.primaryDark },
  Video:   { bg: colors.blueLight,        fg: colors.blue },
  Article: { bg: colors.greenLight,       fg: colors.statusAcceptedText },
};

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ClubResourcesScreen({ navigation }) {
  const { materials, announcements } = useApp();
  const [tab, setTab] = useState('materials');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubResources');

  // Pinned announcements first, then the rest by date desc.
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.postedAt) - new Date(a.postedAt);
    });
  }, [announcements]);

  const handleOpen = async (url, title) => {
    if (!url) {
      Alert.alert('No link', 'This material has no link attached.');
      return;
    }
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Cannot open', url);
    } catch {
      Alert.alert('Error', `Could not open "${title}".`);
    }
  };

  return (
    <View style={styles.root}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="clubMember"
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
          <Text style={styles.pageTitle}>Club Resources</Text>
          <Text style={styles.pageSubtitle}>
            {materials.length} materials · {announcements.length} announcements
          </Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'materials',     label: 'Materials',     icon: '📚' },
          { id: 'announcements', label: 'Announcements', icon: '📣' },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'materials' ? (
          <>
            {materials.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>No materials posted yet.</Text>
              </View>
            ) : (
              materials.map((m) => {
                const palette = TYPE_COLORS[m.type] || { bg: colors.border, fg: colors.textSecondary };
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.materialCard}
                    onPress={() => handleOpen(m.url, m.title)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.materialHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: palette.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: palette.fg }]}>{m.type}</Text>
                      </View>
                      <Text style={styles.openLink}>Open ↗</Text>
                    </View>
                    <Text style={styles.materialTitle}>{m.title}</Text>
                    <Text style={styles.materialDesc} numberOfLines={3}>{m.description}</Text>
                    <Text style={styles.materialUrl} numberOfLines={1}>{m.url}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          <>
            {sortedAnnouncements.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📣</Text>
                <Text style={styles.emptyText}>No announcements yet.</Text>
              </View>
            ) : (
              sortedAnnouncements.map((a) => (
                <View key={a.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle} numberOfLines={2}>{a.title}</Text>
                    {a.pinned && (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedBadgeText}>📌 Pinned</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.announcementBody}>{a.body}</Text>
                  <View style={styles.announcementMeta}>
                    <Text style={styles.announcementAuthor}>{a.author}</Text>
                    <Text style={styles.announcementDate}>{formatDateLong(a.postedAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  menuIcon: { fontSize: 24, color: colors.textSecondary, marginTop: -2 },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  topBarRight: { width: 40 },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tabLabelActive: { color: colors.white },

  body: { padding: 16 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 13, color: colors.textSecondary },

  /* Materials */
  materialCard: {
    backgroundColor: colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  materialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  openLink: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  materialTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  materialDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  materialUrl: { fontSize: 11, color: colors.textMuted },

  /* Announcements */
  announcementCard: {
    backgroundColor: colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  announcementTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  pinnedBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pinnedBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primaryDark },
  announcementBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 19, marginBottom: 10 },
  announcementMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  announcementAuthor: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  announcementDate: { fontSize: 11, color: colors.textMuted },
});
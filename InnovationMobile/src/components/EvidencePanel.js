// ─────────────────────────────────────────────────────────────
// components/EvidencePanel
// ─────────────────────────────────────────────────────────────
// Project evidence picker + uploader + lister + downloader/sharer.
// Lives inside `InnovationProjectDetailScreen` and owns nothing
// other than the project's attachments state.
//
// Backend contract (Phase 4 + link evidence):
//   GET    /api/projects/{id}/attachments          → list
//   POST   /api/projects/{id}/attachments          → multipart upload
//   POST   /api/projects/{id}/attachments/link     → JSON link evidence
//   GET    /api/projects/{id}/attachments/{attId}  → binary download
//   DELETE /api/projects/{id}/attachments/{attId}  → remove
//
// Limits (enforced both client-side as UX guard and server-side):
//   - 10 MB per file
//   - 5 attachments per project (links + files share the cap)
//
// The two `+ Upload` and `+ Add link` buttons are mutually exclusive — both
// kinds of evidence satisfy the PROTOTYPE / MVP gate.
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from '../styles/colors';
import { projectsApi, classifyProjectError } from '../api/projects';
import { apiDownload, ApiError } from '../api/client';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PER_PROJECT = 5;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Best-effort formatter for backend timestamps.
const formatUploadedAt = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

export default function EvidencePanel({ projectId, attachments, onChange }) {
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCaption, setLinkCaption] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState({}); // { [attachmentId]: 'downloading' | 'deleting' }

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await projectsApi.listAttachments(projectId);
      onChange?.(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load attachments.');
    } finally {
      setLoading(false);
    }
  }, [projectId, onChange]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Pick + upload ──────────────────────────────────────────────
  const handlePickAndUpload = useCallback(async () => {
    if (picking || uploading) return;
    if (attachments.length >= MAX_PER_PROJECT) {
      Alert.alert(
        'Attachment limit reached',
        `Projects can hold at most ${MAX_PER_PROJECT} attachments. Delete one before uploading another.`,
      );
      return;
    }

    setPicking(true);
    setError(null);
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
    } catch (e) {
      setPicking(false);
      setError(e?.message || 'Could not open the document picker.');
      return;
    }
    setPicking(false);

    if (result?.canceled) return;

    const asset = Array.isArray(result.assets) ? result.assets[0] : result?.assets?.[0];
    if (!asset?.uri) {
      setError('Picked file has no readable URI.');
      return;
    }

    // 10 MB client-side guard — server enforces too but reject early.
    const declaredSize = Number(asset.size);
    if (Number.isFinite(declaredSize) && declaredSize > MAX_FILE_BYTES) {
      setError(`File exceeds 10 MB limit (${formatBytes(declaredSize)}).`);
      return;
    }

    // Optional caption. `Alert.prompt` is iOS-only; on Android we
    // skip the inline prompt for now and let the user rename later
    // via the API directly. The backend treats `caption` as optional,
    // so a missing field is fine — uploads still succeed.
    let caption = '';
    if (Platform.OS === 'ios') {
      try {
        caption = await new Promise((resolve) => {
          Alert.prompt(
            'Caption (optional)',
            'Add a short caption for this file.',
            [
              { text: 'Skip', onPress: () => resolve('') },
              { text: 'Add',  onPress: (text) => resolve((text || '').trim()) },
            ],
            'plain-text',
            '',
            'default',
          );
        });
      } catch {
        caption = '';
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'evidence',
        type: asset.mimeType || 'application/octet-stream',
      });
      formData.append('kind', 'evidence');
      if (caption) formData.append('caption', caption);

      const created = await projectsApi.uploadAttachment(projectId, formData);
      const next = [...attachments, created];
      onChange?.(next);
    } catch (e) {
      const cls = classifyProjectError(e);
      if (cls.kind === 'verification') {
        Alert.alert(
          'Verify your email first',
          'You need to verify your email before uploading evidence.',
        );
      } else if (cls.kind === 'limit_exceeded') {
        Alert.alert('Upload rejected', cls.message || 'Attachment limit reached.');
      } else {
        setError(cls.message || 'Upload failed.');
      }
    } finally {
      setUploading(false);
    }
  }, [attachments, picking, uploading, projectId, onChange]);

  // ── Add link evidence ────────────────────────────────────────
  const openLinkModal = useCallback(() => {
    if (linkModalOpen || addingLink) return;
    if (attachments.length >= MAX_PER_PROJECT) {
      Alert.alert(
        'Attachment limit reached',
        `Projects can hold at most ${MAX_PER_PROJECT} attachments. Delete one before adding another.`,
      );
      return;
    }
    setError(null);
    setLinkUrl('');
    setLinkCaption('');
    setLinkModalOpen(true);
  }, [attachments.length, linkModalOpen, addingLink]);

  const cancelLinkModal = useCallback(() => {
    if (addingLink) return;
    setLinkModalOpen(false);
    setLinkUrl('');
    setLinkCaption('');
  }, [addingLink]);

  const handleAddLink = useCallback(async () => {
    if (addingLink) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setError('Link is required.');
      return;
    }
    // Cheap client-side check; backend re-validates and rejects javascript:
    // / data: / relative URLs.
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Links must start with http:// or https://');
      return;
    }
    setAddingLink(true);
    setError(null);
    try {
      const created = await projectsApi.addLinkAttachment(projectId, {
        url: trimmed,
        caption: linkCaption.trim() || undefined,
      });
      onChange?.([...attachments, created]);
      setLinkModalOpen(false);
      setLinkUrl('');
      setLinkCaption('');
    } catch (e) {
      const cls = classifyProjectError(e);
      setError(cls.message || 'Could not add the link.');
    } finally {
      setAddingLink(false);
    }
  }, [addingLink, linkUrl, linkCaption, attachments, projectId, onChange]);

  // ── Open a link row in the system browser ────────────────────
  const handleOpenLink = useCallback(async (att) => {
    const url = att?.linkUrl;
    if (!url) return;
    try {
      // `canOpenURL` returns false on Android when no handler is registered
      // for the scheme (rare for http/https) — but Linking silently no-ops if
      // openURL fails, so we just attempt it.
      await Linking.openURL(url);
    } catch (e) {
      setError(e?.message || 'Could not open the link.');
    }
  }, []);

  // ── Download + share ─────────────────────────────────────────
  const handleDownloadAndShare = useCallback(async (att) => {
    if (!att?.id) return;
    if (acting[att.id]) return;
    setActing((prev) => ({ ...prev, [att.id]: 'downloading' }));
    setError(null);
    try {
      const path = projectsApi.attachmentDownloadPath(projectId, att.id);
      const { blob, contentType, filename } = await apiDownload(path);
      const safeName = filename || att.originalFilename || `evidence-${att.id}`;
      const target = new File(Paths.cache, 'evidence', safeName);
      // Cache directory may not exist yet — create defensively.
      if (!target.parentDirectory.exists) target.parentDirectory.create({ intermediates: true, idempotent: true });
      const buffer = await blob.arrayBuffer();
      target.write(new Uint8Array(buffer), { overwrite: true });

      const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
      if (isAvailable) {
        await Sharing.shareAsync(target.uri, { mimeType: contentType, dialogTitle: safeName });
      } else {
        Alert.alert('Saved', `${safeName} saved to app cache.`);
      }
    } catch (e) {
      const cls = classifyProjectError(e);
      setError(cls.message || 'Download failed.');
    } finally {
      setActing((prev) => {
        const { [att.id]: _omit, ...rest } = prev;
        return rest;
      });
    }
  }, [acting, projectId]);

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = useCallback((att) => {
    if (!att?.id) return;
    if (acting[att.id]) return;
    Alert.alert(
      'Delete attachment?',
      att.originalFilename || 'This attachment',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActing((prev) => ({ ...prev, [att.id]: 'deleting' }));
            // Optimistic remove with rollback on error.
            const previous = attachments;
            onChange?.(attachments.filter((a) => a.id !== att.id));
            try {
              await projectsApi.removeAttachment(projectId, att.id);
            } catch (e) {
              onChange?.(previous);
              const cls = classifyProjectError(e);
              setError(cls.message || 'Delete failed.');
            } finally {
              setActing((prev) => {
                const { [att.id]: _omit, ...rest } = prev;
                return rest;
              });
            }
          },
        },
      ],
    );
  }, [acting, attachments, projectId, onChange]);

  // ── Render ───────────────────────────────────────────────────
  const atCap = attachments.length >= MAX_PER_PROJECT;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Evidence</Text>
          <Text style={styles.subtitle}>
            Files or links that prove progress on this project.{' '}
            {attachments.length}/{MAX_PER_PROJECT} used.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.linkBtn,
              (linkModalOpen || addingLink || atCap) && styles.btnDisabled,
            ]}
            onPress={openLinkModal}
            disabled={linkModalOpen || addingLink || atCap}
            activeOpacity={0.85}
          >
            <Text style={styles.linkBtnText}>+ Add link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              (picking || uploading || atCap) && styles.btnDisabled,
            ]}
            onPress={handlePickAndUpload}
            disabled={picking || uploading || atCap}
            activeOpacity={0.85}
          >
            {uploading || picking ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.uploadBtnText}>+ Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && attachments.length === 0 ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
      ) : attachments.length === 0 ? (
        <Text style={styles.emptyText}>
          No evidence yet. Upload a file or add a link (GitHub, YouTube, hosted
          prototype) to back your milestones.
        </Text>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) =>
            item.type === 'link' || item.linkUrl ? (
              <LinkRow
                attachment={item}
                busy={acting[item.id]}
                onOpen={() => handleOpenLink(item)}
                onDelete={() => handleDelete(item)}
              />
            ) : (
              <EvidenceRow
                attachment={item}
                busy={acting[item.id]}
                onDownload={() => handleDownloadAndShare(item)}
                onDelete={() => handleDelete(item)}
              />
            )
          }
        />
      )}

      {/* Add-link modal — kept tiny; the server validates scheme/host. */}
      <Modal
        visible={linkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={cancelLinkModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add link evidence</Text>
            <Text style={styles.modalSub}>
              Point to a hosted prototype, demo video, repository, or live page.
              The link must start with http:// or https://.
            </Text>
            <Text style={styles.formLabel}>URL *</Text>
            <TextInput
              style={styles.formInput}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://github.com/you/project"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
            />
            <Text style={styles.formLabel}>Caption (optional)</Text>
            <TextInput
              style={styles.formInput}
              value={linkCaption}
              onChangeText={setLinkCaption}
              placeholder="e.g. Working MVP demo"
              placeholderTextColor={colors.textMuted}
              maxLength={240}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={cancelLinkModal}
                disabled={addingLink}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, addingLink && styles.btnDisabled]}
                onPress={handleAddLink}
                disabled={addingLink}
                activeOpacity={0.85}
              >
                {addingLink ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Add link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EvidenceRow({ attachment, busy, onDownload, onDelete }) {
  const isDownloading = busy === 'downloading';
  const isDeleting    = busy === 'deleting';
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {attachment.originalFilename || `Attachment #${attachment.id}`}
        </Text>
        <Text style={styles.rowMeta}>
          {formatBytes(attachment.sizeBytes)} · {attachment.mimeType || 'unknown'}
          {attachment.uploadedByName ? ` · ${attachment.uploadedByName}` : ''}
        </Text>
        {attachment.caption ? <Text style={styles.rowCaption}>{attachment.caption}</Text> : null}
        <Text style={styles.rowDate}>Uploaded {formatUploadedAt(attachment.uploadedAt)}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary, (isDownloading || isDeleting) && styles.btnDisabled]}
          onPress={onDownload}
          disabled={!!busy}
          activeOpacity={0.85}
        >
          {isDownloading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.actionPrimaryText}>Open</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger, (isDownloading || isDeleting) && styles.btnDisabled]}
          onPress={onDelete}
          disabled={!!busy}
          activeOpacity={0.85}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.actionDangerText}>Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Link evidence has no bytes — render a tappable row that opens the system
// browser, plus a delete affordance. The server populates
// `originalFilename` with the URL's host (e.g. "github.com") as a label.
function LinkRow({ attachment, busy, onOpen, onDelete }) {
  const isDeleting = busy === 'deleting';
  const host = attachment.originalFilename || 'link';
  const url  = attachment.linkUrl;
  return (
    <View style={[styles.row, styles.linkRow]}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>🔗 {host}</Text>
        {url ? (
          <Text style={styles.linkUrl} numberOfLines={1}>{url}</Text>
        ) : null}
        {attachment.caption ? (
          <Text style={styles.rowCaption}>{attachment.caption}</Text>
        ) : null}
        <Text style={styles.rowMeta}>
          Link
          {attachment.uploadedByName ? ` · ${attachment.uploadedByName}` : ''}
        </Text>
        <Text style={styles.rowDate}>Added {formatUploadedAt(attachment.uploadedAt)}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary, isDeleting && styles.btnDisabled]}
          onPress={onOpen}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          <Text style={styles.actionPrimaryText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger, isDeleting && styles.btnDisabled]}
          onPress={onDelete}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.actionDangerText}>Delete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  uploadBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.primary, minWidth: 96, alignItems: 'center',
  },
  uploadBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  linkBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.35)',
    minWidth: 96, alignItems: 'center',
  },
  linkBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.55 },

  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b91c1c', lineHeight: 17 },
  retryText: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },

  loader: { paddingVertical: 18, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.textSecondary, paddingVertical: 8 },

  separator: { height: 12 },

  row: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  linkRow: { borderColor: 'rgba(37, 99, 235, 0.35)', backgroundColor: 'rgba(37, 99, 235, 0.04)' },
  rowMain: { marginBottom: 10 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  rowMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  rowCaption: { fontSize: 12, color: colors.textPrimary, marginTop: 6, fontStyle: 'italic' },
  rowDate: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  linkUrl: { fontSize: 12, color: '#1d4ed8', marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  actionDanger: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  actionDangerText: { color: colors.error, fontWeight: '700', fontSize: 12 },

  // ── Add-link modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  modalSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 6, marginTop: 6 },
  formInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.background,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  modalBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    minWidth: 96, alignItems: 'center',
  },
  modalBtnGhost: {
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  modalBtnGhostText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});

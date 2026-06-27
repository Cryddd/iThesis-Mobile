import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useSimilarTheses, useThesisDetail, useThesisManagement } from '@/hooks/queries';
import { thesisApi } from '@/api/services';
import { useAuth } from '@/store/AuthContext';
import { downloadAndOpen } from '@/utils/downloadFile';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import type { Thesis } from '@/types';
import type { IconType } from '@/types/icon';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ThesisDetail'>;

export function ThesisDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const query = useThesisDetail(params.id);
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  // Record a view for analytics once the thesis loads (best-effort).
  React.useEffect(() => {
    if (query.data?.id) void thesisApi.recordView(query.data.id);
  }, [query.data?.id]);

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Button
          label="Back"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<ArrowLeft size={18} color={colors.primary} />}
          onPress={() => navigation.goBack()}
        />
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError || !query.data ? (
        <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <DetailBody
          thesis={query.data}
          isLibrarian={isLibrarian}
          onDeleted={() => navigation.goBack()}
        />
      )}
    </Screen>
  );
}

function DetailBody({
  thesis,
  isLibrarian,
  onDeleted,
}: {
  thesis: Thesis;
  isLibrarian: boolean;
  onDeleted: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const authors = thesis.authors ?? [];
  const dept = thesis.department;
  const keywords = thesis.keywords?.length ? thesis.keywords : (thesis.aiTags ?? []);
  const management = useThesisManagement(thesis.id);
  const similar = useSimilarTheses(thesis.id);
  const [opening, setOpening] = useState<'doc' | 'summary' | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thesis.title);
  const [editAuthors, setEditAuthors] = useState(authors.join(', '));
  const [editAdviser, setEditAdviser] = useState(thesis.adviser ?? '');
  const [editYear, setEditYear] = useState(thesis.publicationYear ? String(thesis.publicationYear) : '');
  const [editError, setEditError] = useState('');

  const saveEdits = async () => {
    setEditError('');
    try {
      const nextAuthors = editAuthors.split(',').map((a) => a.trim()).filter(Boolean);
      await management.updateDetails.mutateAsync({
        title: editTitle.trim(),
        adviser: editAdviser.trim() || null,
        authors: nextAuthors,
      });
      const yearNum = editYear.trim() ? Number(editYear.trim()) : null;
      if (yearNum !== (thesis.publicationYear ?? null)) {
        await management.updateYear.mutateAsync(Number.isNaN(yearNum as number) ? null : yearNum);
      }
      setEditing(false);
    } catch (err) {
      setEditError(describeApiError(err));
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete thesis', `Soft-delete "${thesis.title}"? It can be recovered later.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          management.softDelete.mutate(undefined, {
            onSuccess: onDeleted,
            onError: (e) => Alert.alert('Failed', describeApiError(e)),
          }),
      },
    ]);
  };

  const openDocument = async () => {
    if (!thesis.documentUrl) return;
    setOpening('doc');
    try {
      await downloadAndOpen(`/api/v1/theses/${thesis.id}/document`, `thesis-${thesis.id}.pdf`);
    } catch (err) {
      Alert.alert('Could not open document', describeApiError(err));
    } finally {
      setOpening(null);
    }
  };

  const openSummary = async () => {
    setOpening('summary');
    try {
      await downloadAndOpen(
        `/api/v1/theses/${thesis.id}/executive-summary`,
        `summary-${thesis.id}.pdf`,
      );
    } catch (err) {
      Alert.alert('Could not open summary', describeApiError(err));
    } finally {
      setOpening(null);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.headerCard}>
        <View style={styles.cover}>
          {thesis.thumbnailUrl ? (
            <Image source={{ uri: thesis.thumbnailUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <FileText size={34} color={colors.primaryLight} />
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          {thesis.status ? <StatusBadge status={thesis.status} /> : null}
          <Text style={styles.title}>{thesis.title}</Text>
          {authors.length ? (
            <View style={styles.metaLine}>
              <Users size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{authors.join(', ')}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.statRow}>
        {dept ? <Stat icon={Building2} label="Department" value={dept} /> : null}
        {thesis.publicationYear ? (
          <Stat icon={Calendar} label="Year" value={String(thesis.publicationYear)} />
        ) : null}
        {typeof thesis.viewCount === 'number' ? (
          <Stat icon={Eye} label="Views" value={String(thesis.viewCount)} />
        ) : null}
      </View>

      {thesis.abstract ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abstract</Text>
          <Text style={styles.abstract}>{thesis.abstract}</Text>
        </View>
      ) : null}

      {keywords.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keywords</Text>
          <View style={styles.tags}>
            {keywords.map((k) => (
              <View key={k} style={styles.tag}>
                <Text style={styles.tagText}>{k}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Open document"
          icon={<FileText size={18} color={colors.white} />}
          onPress={openDocument}
          loading={opening === 'doc'}
          disabled={!thesis.documentUrl}
        />
        {thesis.hasExecutiveSummary ? (
          <Button
            label="Executive summary"
            variant="outline"
            icon={<Download size={18} color={colors.primary} />}
            onPress={openSummary}
            loading={opening === 'summary'}
          />
        ) : null}
      </View>
      {similar.data && similar.data.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related theses</Text>
          {similar.data.slice(0, 4).map((rel: Thesis) => (
            <Pressable
              key={rel.id}
              style={styles.relatedRow}
              onPress={() => navigation.push('ThesisDetail', { id: rel.id, title: rel.title })}
            >
              <FileText size={16} color={colors.primaryLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.relatedTitle} numberOfLines={2}>
                  {rel.title}
                </Text>
                {rel.authors.length ? (
                  <Text style={styles.relatedMeta} numberOfLines={1}>
                    {rel.authors.join(', ')}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {isLibrarian ? (
        <View style={styles.manageCard}>
          <Text style={styles.manageTitle}>Librarian tools</Text>
          <View style={styles.manageRow}>
            <Button
              label="Edit details"
              variant="outline"
              size="sm"
              icon={<Pencil size={16} color={colors.primary} />}
              onPress={() => setEditing(true)}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <Button
              label="Delete"
              variant="danger"
              size="sm"
              icon={<Trash2 size={16} color={colors.white} />}
              onPress={confirmDelete}
              loading={management.softDelete.isPending}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.notice}>
        Documents are watermarked and provided for academic reference only.
      </Text>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Edit thesis</Text>
            <Field label="Title" value={editTitle} onChangeText={setEditTitle} />
            <Field
              label="Author(s) — comma separated"
              value={editAuthors}
              onChangeText={setEditAuthors}
            />
            <Field label="Adviser" value={editAdviser} onChangeText={setEditAdviser} />
            <Field
              label="Publication year"
              value={editYear}
              onChangeText={setEditYear}
              keyboardType="number-pad"
            />
            {editError ? <Text style={styles.sheetError}>{editError}</Text> : null}
            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setEditing(false)}
                style={{ flex: 1 }}
                fullWidth={false}
              />
              <Button
                label="Save"
                onPress={saveEdits}
                loading={management.updateDetails.isPending || management.updateYear.isPending}
                style={{ flex: 1.4 }}
                fullWidth={false}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.fieldInput}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  headerCard: { flexDirection: 'row', gap: spacing.lg },
  cover: { width: 96, height: 128 },
  thumb: { width: 96, height: 128, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  thumbPlaceholder: {
    width: 96,
    height: 128,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  title: { ...typography.h1, fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
    ...shadows.card,
  },
  statLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { ...typography.label, fontSize: 14 },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h3, fontFamily: fonts.display, color: colors.primaryDark },
  abstract: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  tagText: { ...typography.caption, fontSize: 12, color: colors.primaryDark },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  notice: { ...typography.caption, textAlign: 'center' },
  manageCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  manageTitle: { ...typography.label, color: colors.primaryDark },
  manageRow: { flexDirection: 'row', gap: spacing.md },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  relatedTitle: { ...typography.label, fontSize: 14 },
  relatedMeta: { ...typography.caption },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: { ...typography.h2, fontFamily: fonts.display },
  sheetError: { ...typography.small, color: colors.rejected },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.label },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    backgroundColor: colors.surface,
  },
});

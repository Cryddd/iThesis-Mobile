import React, { useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  XCircle,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useRecentSubmissions, useReviewDecision } from '@/hooks/queries';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { Thesis } from '@/types';

type Decision = { thesis: Thesis; type: 'approve' | 'reject' } | null;

export function ReviewScreen() {
  const query = useRecentSubmissions(['pending']);
  const decisionMutation = useReviewDecision();
  const [decision, setDecision] = useState<Decision>(null);
  const [remarks, setRemarks] = useState('');
  const [errorText, setErrorText] = useState('');

  const items = query.data ?? [];
  const total = items.length;

  const openDecision = (thesis: Thesis, type: 'approve' | 'reject') => {
    setRemarks('');
    setErrorText('');
    setDecision({ thesis, type });
  };

  const confirm = async () => {
    if (!decision) return;
    if (decision.type === 'reject' && !remarks.trim()) {
      setErrorText('Please provide a reason for rejection.');
      return;
    }
    try {
      await decisionMutation.mutateAsync({
        id: decision.thesis.id,
        decision: decision.type,
        reason: remarks.trim() || undefined,
      });
      setDecision(null);
    } catch (err) {
      setErrorText(describeApiError(err));
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Review queue</Text>
        <Text style={styles.subtitle}>
          {total > 0 ? `${total} pending submission${total === 1 ? '' : 's'}` : 'Pending submissions'}
        </Text>
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ClipboardCheck size={40} color={colors.approved} />}
              title="All caught up"
              message="There are no submissions waiting for review."
            />
          }
          renderItem={({ item }) => (
            <ReviewCard thesis={item} onApprove={() => openDecision(item, 'approve')} onReject={() => openDecision(item, 'reject')} />
          )}
        />
      )}

      <DecisionModal
        decision={decision}
        remarks={remarks}
        setRemarks={setRemarks}
        error={errorText}
        loading={decisionMutation.isPending}
        onCancel={() => setDecision(null)}
        onConfirm={confirm}
      />
    </Screen>
  );
}

function ReviewCard({
  thesis,
  onApprove,
  onReject,
}: {
  thesis: Thesis;
  onApprove: () => void;
  onReject: () => void;
}) {
  const authors = (thesis.authors ?? []).join(', ');
  const dept = thesis.department;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {thesis.title}
      </Text>
      {authors ? <Text style={styles.cardAuthors}>{authors}</Text> : null}
      <View style={styles.cardMeta}>
        {dept ? <Text style={styles.metaPill}>{dept}</Text> : null}
        {thesis.publicationYear ? (
          <Text style={styles.metaPill}>{thesis.publicationYear}</Text>
        ) : null}
        {thesis.trackingCode ? (
          <Text style={styles.metaPill}>{thesis.trackingCode}</Text>
        ) : null}
      </View>
      {thesis.abstract ? (
        <Text style={styles.cardAbstract} numberOfLines={3}>
          {thesis.abstract}
        </Text>
      ) : null}

      {thesis.documentUrl ? (
        <Pressable
          style={styles.viewDoc}
          onPress={() => Linking.openURL(thesis.documentUrl!).catch(() => undefined)}
        >
          <FileText size={16} color={colors.primary} />
          <Text style={styles.viewDocText}>View manuscript</Text>
        </Pressable>
      ) : null}

      <View style={styles.cardActions}>
        <Button
          label="Reject"
          variant="outline"
          size="sm"
          icon={<XCircle size={16} color={colors.primary} />}
          onPress={onReject}
          style={{ flex: 1 }}
          fullWidth={false}
        />
        <Button
          label="Approve"
          size="sm"
          icon={<CheckCircle2 size={16} color={colors.white} />}
          onPress={onApprove}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>
    </View>
  );
}

function DecisionModal({
  decision,
  remarks,
  setRemarks,
  error,
  loading,
  onCancel,
  onConfirm,
}: {
  decision: Decision;
  remarks: string;
  setRemarks: (v: string) => void;
  error: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isReject = decision?.type === 'reject';
  return (
    <Modal visible={!!decision} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>
            {isReject ? 'Reject submission' : 'Approve submission'}
          </Text>
          <Text style={styles.sheetThesis} numberOfLines={2}>
            {decision?.thesis.title}
          </Text>
          <Text style={styles.sheetLabel}>
            {isReject ? 'Reason for rejection (required)' : 'Remarks (optional)'}
          </Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder={isReject ? 'Explain what needs to change…' : 'Add a note for the record…'}
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.sheetInput}
          />
          {error ? <Text style={styles.sheetError}>{error}</Text> : null}
          <View style={styles.sheetActions}>
            <Button label="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1 }} fullWidth={false} />
            <Button
              label={isReject ? 'Confirm reject' : 'Confirm approve'}
              variant={isReject ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
              style={{ flex: 1.4 }}
              fullWidth={false}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 2 },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardTitle: { ...typography.h3, fontFamily: fonts.sansBold },
  cardAuthors: { ...typography.small, color: colors.textSecondary },
  cardMeta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  metaPill: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  cardAbstract: { ...typography.small, color: colors.textSecondary, lineHeight: 20 },
  viewDoc: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  viewDocText: { ...typography.small, color: colors.primary, fontFamily: fonts.sansSemibold },
  cardActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  sheetTitle: { ...typography.h2, fontFamily: fonts.display },
  sheetThesis: { ...typography.bodyMuted, marginBottom: spacing.sm },
  sheetLabel: { ...typography.label },
  sheetInput: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceMuted,
  },
  sheetError: { ...typography.small, color: colors.rejected },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});

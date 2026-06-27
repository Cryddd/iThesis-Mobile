import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, KeyRound, Plus, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useAccessCodes, useAccessCodeActions } from '@/hooks/queries';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { AccessCode, AccessCodeStatus } from '@/types';

const FILTERS: { key: 'all' | AccessCodeStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unused', label: 'Unused' },
  { key: 'used', label: 'Used' },
  { key: 'expired', label: 'Expired' },
];

const STATUS_STYLE: Record<AccessCodeStatus, { bg: string; fg: string }> = {
  unused: { bg: colors.approvedBg, fg: colors.approved },
  used: { bg: colors.infoBg, fg: colors.info },
  expired: { bg: colors.rejectedBg, fg: colors.rejected },
};

export function AccessCodesScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | AccessCodeStatus>('all');
  const query = useAccessCodes(filter);
  const { generate, clearAll } = useAccessCodeActions();

  const items = query.data?.results ?? [];
  const total = query.data?.count ?? 0;

  const onGenerate = () => {
    Alert.alert('Generate access codes', 'How many codes do you want to create?', [
      { text: 'Cancel', style: 'cancel' },
      { text: '5', onPress: () => generate.mutate(5) },
      { text: '10', onPress: () => generate.mutate(10) },
      { text: '25', onPress: () => generate.mutate(25) },
    ]);
  };

  const onClear = () => {
    Alert.alert('Clear all access codes', 'This permanently removes every access code. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () =>
          clearAll.mutate(undefined, {
            onError: (e) => Alert.alert('Failed', describeApiError(e)),
          }),
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Access codes</Text>
        <Text style={styles.subtitle}>{total} code{total === 1 ? '' : 's'} · guests use these to browse and submit</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Generate"
          size="sm"
          icon={<Plus size={16} color={colors.white} />}
          onPress={onGenerate}
          loading={generate.isPending}
          style={{ flex: 1 }}
          fullWidth={false}
        />
        <Button
          label="Clear all"
          variant="outline"
          size="sm"
          icon={<Trash2 size={16} color={colors.primary} />}
          onPress={onClear}
          loading={clearAll.isPending}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>

      <View style={styles.segment}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.segBtn, filter === f.key && styles.segBtnActive]}
          >
            <Text style={[styles.segText, filter === f.key && styles.segTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
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
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<KeyRound size={36} color={colors.primaryLight} />}
              title="No access codes"
              message="Generate codes to hand out to library guests."
            />
          }
          renderItem={({ item }) => <CodeRow code={item} />}
        />
      )}
    </Screen>
  );
}

function CodeRow({ code }: { code: AccessCode }) {
  const style = STATUS_STYLE[code.status] ?? STATUS_STYLE.unused;
  return (
    <View style={styles.row}>
      <View style={styles.codeIcon}>
        <KeyRound size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.code}>{code.code}</Text>
        <Text style={styles.meta}>
          {code.status === 'used' && code.usedBy ? `Used by ${code.usedBy}` : code.date ? `Created ${code.date}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: style.bg }]}>
        <Text style={[styles.badgeText, { color: style.fg }]}>{code.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 2 },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted },
  actions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.surface, ...shadows.card },
  segText: { ...typography.small, color: colors.textSecondary },
  segTextActive: { color: colors.primary, fontFamily: fonts.sansSemibold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  codeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { ...typography.h3, fontFamily: fonts.sansBold, letterSpacing: 2 },
  meta: { ...typography.caption },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { ...typography.caption, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
});

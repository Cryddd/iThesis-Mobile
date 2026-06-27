import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScrollText } from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useErrorLogs, useSystemLogs } from '@/hooks/queries';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { ActivityEntry } from '@/types';

const FILTERS: { key: 'all' | 'authenticated' | 'guest'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'authenticated', label: 'Staff' },
  { key: 'guest', label: 'Guests' },
];

export function SystemLogsScreen() {
  const [tab, setTab] = useState<'activity' | 'errors'>('activity');
  const [userType, setUserType] = useState<'all' | 'authenticated' | 'guest'>('all');
  const activityQuery = useSystemLogs(userType);
  const errorQuery = useErrorLogs();
  const query = tab === 'activity' ? activityQuery : errorQuery;
  const logs = query.data?.logs ?? [];
  const total = query.data?.pagination.total ?? 0;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>System logs</Text>
        <Text style={styles.subtitle}>{total} recorded event{total === 1 ? '' : 's'}</Text>
        <View style={styles.segment}>
          {(['activity', 'errors'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.segBtn, tab === t && styles.segBtnActive]}
            >
              <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                {t === 'activity' ? 'Activity' : 'Errors'}
              </Text>
            </Pressable>
          ))}
        </View>
        {tab === 'activity' ? (
          <View style={styles.segment}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setUserType(f.key)}
                style={[styles.segBtn, userType === f.key && styles.segBtnActive]}
              >
                <Text style={[styles.segText, userType === f.key && styles.segTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ScrollText size={36} color={colors.primaryLight} />}
              title="No logs"
              message="No activity recorded for this filter."
            />
          }
          renderItem={({ item }: { item: ActivityEntry }) => (
            <View style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.action}>{item.action.replace(/_/g, ' ')}</Text>
                <Text style={styles.time}>
                  {item.date}
                  {item.time ? ` ${item.time}` : ''}
                </Text>
              </View>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.user}>{item.user}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted, marginTop: -2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.xs,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  segBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.chocolate,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { ...typography.small, color: colors.textSecondary },
  segTextActive: { color: colors.primary, fontFamily: fonts.sansSemibold },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  action: { ...typography.label, fontSize: 14, textTransform: 'capitalize', flex: 1 },
  time: { ...typography.caption },
  desc: { ...typography.small, color: colors.textSecondary },
  user: { ...typography.caption, color: colors.primary },
});

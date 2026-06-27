import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';

import { ThesisCard } from '@/components/ThesisCard';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useRecentSubmissions } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Thesis, ThesisStatus } from '@/types';

type Segment = 'all' | ThesisStatus;

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const ALL_STATUSES: ThesisStatus[] = ['pending', 'approved', 'rejected'];

export function RepositoryScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const debounced = useDebounced(search, 300).trim().toLowerCase();

  const statuses = segment === 'all' ? ALL_STATUSES : [segment];
  const query = useRecentSubmissions(statuses);

  const items = useMemo(() => {
    const list = query.data ?? [];
    if (!debounced) return list;
    return list.filter(
      (t: Thesis) =>
        t.title.toLowerCase().includes(debounced) ||
        t.authors.some((a: string) => a.toLowerCase().includes(debounced)) ||
        (t.trackingCode ?? '').toLowerCase().includes(debounced),
    );
  }, [query.data, debounced]);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Submissions</Text>
        <Text style={styles.subtitle}>
          {items.length} record{items.length === 1 ? '' : 's'}
        </Text>
        <TextField
          placeholder="Search title, author, tracking code…"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          autoCorrect={false}
        />
      </View>

      <View style={styles.segment}>
        {SEGMENTS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSegment(s.key)}
            style={[styles.segBtn, segment === s.key && styles.segBtnActive]}
          >
            <Text style={[styles.segText, segment === s.key && styles.segTextActive]}>
              {s.label}
            </Text>
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
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={query.refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState title="No records found" message="Adjust your search or filter." />
          }
          renderItem={({ item }) => (
            <ThesisCard
              thesis={item}
              showStatus
              onPress={(t) =>
                navigation.getParent()?.navigate('ThesisDetail', { id: t.id, title: t.title })
              }
            />
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
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
});

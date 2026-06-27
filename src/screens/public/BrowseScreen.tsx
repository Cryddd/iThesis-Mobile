import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';

import { ThesisCard } from '@/components/ThesisCard';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useBrowseTheses, useDepartments, flattenPages } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { BrowseParams, BrowseSort, Department } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SORTS: { key: BrowseSort; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title_asc', label: 'Title A–Z' },
];

export function BrowseScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [departmentCode, setDepartmentCode] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<BrowseSort>('newest');
  const debouncedSearch = useDebounced(search, 350);

  const params = useMemo<Omit<BrowseParams, 'page'>>(
    () => ({ query: debouncedSearch || undefined, departmentCode, sort }),
    [debouncedSearch, departmentCode, sort],
  );

  const { data: departments } = useDepartments();
  const query = useBrowseTheses(params);
  const theses = flattenPages(query.data?.pages);
  const total = query.data?.pages[0]?.count ?? 0;

  const filtersActive = !!departmentCode || sort !== 'newest';

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Repository</Text>
        <Text style={styles.subheading}>
          {total > 0 ? `${total} approved ${total === 1 ? 'thesis' : 'theses'}` : 'Approved theses'}
        </Text>
        <TextField
          placeholder="Search by title, author, keyword…"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* Department chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label="All departments"
            active={!departmentCode}
            onPress={() => setDepartmentCode(undefined)}
          />
          {departments?.map((d: Department) => (
            <Chip
              key={d.id}
              label={d.code || d.name}
              active={departmentCode === d.code}
              onPress={() => setDepartmentCode((cur) => (cur === d.code ? undefined : d.code))}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <SlidersHorizontal size={15} color={colors.textSecondary} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {filtersActive ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setDepartmentCode(undefined);
              setSort('newest');
            }}
            style={styles.clear}
          >
            <X size={14} color={colors.primary} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {query.isLoading ? (
        <LoadingState label="Loading theses…" />
      ) : query.isError ? (
        <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={theses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ThesisCard
              thesis={item}
              onPress={(t) => navigation.navigate('ThesisDetail', { id: t.id, title: t.title })}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={query.refetch}
              tintColor={colors.primary}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Search size={36} color={colors.primaryLight} />}
              title="No theses found"
              message="Try a different search term or clear your filters."
            />
          }
        />
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  heading: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subheading: { ...typography.bodyMuted, marginTop: -2 },
  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 200,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontFamily: fonts.sansSemibold },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sortChips: { gap: spacing.sm, paddingRight: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  sortChipActive: { backgroundColor: colors.accentSoft },
  sortText: { ...typography.caption, fontSize: 12, color: colors.textSecondary },
  sortTextActive: { color: colors.primaryDark, fontFamily: fonts.sansSemibold },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  clearText: { ...typography.caption, fontSize: 12, color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.xs },
});

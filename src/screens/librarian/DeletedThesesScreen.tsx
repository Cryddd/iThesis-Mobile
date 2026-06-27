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
import { ArrowLeft, RotateCcw, Search, Trash } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useDeletedTheses, useRecoverThesis } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { DeletedThesis } from '@/types';

export function DeletedThesesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const query = useDeletedTheses(debounced);
  const recover = useRecoverThesis();

  const items = query.data?.items ?? [];
  const total = query.data?.count ?? 0;

  const onRecover = (thesis: DeletedThesis) => {
    Alert.alert('Recover thesis', `Restore "${thesis.title}" to the repository?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Recover',
        onPress: () =>
          recover.mutate(thesis.id, {
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
        <Text style={styles.title}>Deleted theses</Text>
        <Text style={styles.subtitle}>{total} recoverable record{total === 1 ? '' : 's'}</Text>
        <TextField
          placeholder="Search deleted theses…"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          autoCorrect={false}
        />
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
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Trash size={36} color={colors.primaryLight} />}
              title="Nothing deleted"
              message="Soft-deleted theses appear here for recovery."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.authors.length ? (
                <Text style={styles.cardMeta}>{item.authors.join(', ')}</Text>
              ) : null}
              <Text style={styles.deletedMeta}>
                Deleted {item.deletedAt ?? '—'}
                {item.deletedByName ? ` · by ${item.deletedByName}` : ''}
              </Text>
              <Button
                label="Recover"
                variant="outline"
                size="sm"
                icon={<RotateCcw size={16} color={colors.primary} />}
                onPress={() => onRecover(item)}
                loading={recover.isPending && recover.variables === item.id}
                fullWidth={false}
                style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted, marginTop: -2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
    ...shadows.card,
  },
  cardTitle: { ...typography.h3, fontFamily: fonts.sansBold },
  cardMeta: { ...typography.small, color: colors.textSecondary },
  deletedMeta: { ...typography.caption, color: colors.rejected, marginTop: 2 },
});

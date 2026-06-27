import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BookMarked,
  CheckCircle2,
  FileClock,
  Users,
} from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useDashboard } from '@/hooks/queries';
import { useAuth } from '@/store/AuthContext';
import { describeApiError } from '@/api/client';
import { initials } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { DashboardSummary } from '@/types';
import type { IconType } from '@/types/icon';

export function LibrarianDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const query = useDashboard();

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetLabel}>Welcome back,</Text>
            <Text style={styles.greetName}>{user?.fullName ?? 'Librarian'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
          </View>
        </View>

        {query.isLoading ? (
          <LoadingState />
        ) : query.isError || !query.data ? (
          <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <Stats data={query.data} onReview={() => navigation.navigate('Review')} />
        )}
      </ScrollView>
    </Screen>
  );
}

function Stats({ data, onReview }: { data: DashboardSummary; onReview: () => void }) {
  return (
    <>
      {data.pendingReviews > 0 ? (
        <View style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <FileClock size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              {data.pendingReviews} submission{data.pendingReviews === 1 ? '' : 's'} awaiting review
            </Text>
            <Text style={styles.actionDesc}>Tap to open the review queue</Text>
          </View>
          <Text style={styles.actionCta} onPress={onReview}>
            Review →
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <KpiCard
          icon={FileClock}
          label="Pending reviews"
          value={data.pendingReviews}
          tint={colors.pending}
          bg={colors.pendingBg}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approved this week"
          value={data.approvedThisWeek}
          tint={colors.approved}
          bg={colors.approvedBg}
        />
        <KpiCard
          icon={BookMarked}
          label="Total theses"
          value={data.totalTheses}
          tint={colors.primary}
          bg={colors.accentSoft}
        />
        <KpiCard
          icon={Users}
          label="Unique users (30d)"
          value={data.uniqueUsers}
          tint={colors.info}
          bg={colors.infoBg}
        />
      </View>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: IconType;
  label: string;
  value: number;
  tint: string;
  bg: string;
}) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={tint} />
      </View>
      <Text style={styles.kpiValue}>{value.toLocaleString()}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetLabel: { ...typography.bodyMuted },
  greetName: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.white, fontFamily: fonts.sansBold },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.h3, color: colors.white, fontSize: 15 },
  actionDesc: { ...typography.small, color: 'rgba(255,255,255,0.85)' },
  actionCta: { ...typography.label, color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kpiValue: { ...typography.h1, fontFamily: fonts.sansBold, color: colors.textPrimary, fontSize: 24 },
  kpiLabel: { ...typography.small, color: colors.textSecondary },
  snapshot: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  snapHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  snapTitle: { ...typography.h3 },
  snapRow: { flexDirection: 'row', alignItems: 'center' },
  snapItem: { flex: 1, alignItems: 'center', gap: 2 },
  snapValue: { ...typography.h1, fontFamily: fonts.sansBold, color: colors.primary },
  snapLabel: { ...typography.caption, textAlign: 'center' },
  snapDivider: { width: 1, height: 44, backgroundColor: colors.border },
});

import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Activity, BookMarked, ShieldCheck, Users } from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useAdminDashboard, useAdminRecentActivity } from '@/hooks/queries';
import { useAuth } from '@/store/AuthContext';
import { describeApiError } from '@/api/client';
import { initials } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { ActivityEntry } from '@/types';

export function AdminDashboardScreen() {
  const { user } = useAuth();
  const dashboard = useAdminDashboard();
  const activity = useAdminRecentActivity();

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching || activity.isRefetching}
            onRefresh={() => {
              dashboard.refetch();
              activity.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.kicker}>ADMIN CONSOLE</Text>
            <Text style={styles.name}>{user?.fullName ?? 'Administrator'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
          </View>
        </View>

        {dashboard.isLoading ? (
          <LoadingState />
        ) : dashboard.isError || !dashboard.data ? (
          <ErrorState message={describeApiError(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <View style={styles.grid}>
            <Metric icon={Users} label="Active librarians" value={dashboard.data.activeLibrarians} />
            <Metric icon={ShieldCheck} label="Active admins" value={dashboard.data.activeAdmins} />
            <Metric icon={BookMarked} label="Total theses" value={dashboard.data.totalTheses} wide />
          </View>
        )}

        <View style={styles.activityHead}>
          <Activity size={18} color={colors.primary} />
          <Text style={styles.activityTitle}>Recent activity</Text>
        </View>

        {activity.isLoading ? (
          <LoadingState />
        ) : activity.isError ? (
          <ErrorState message={describeApiError(activity.error)} onRetry={() => activity.refetch()} />
        ) : (
          <View style={styles.activityCard}>
            {(activity.data ?? []).slice(0, 12).map((entry: ActivityEntry, idx: number, arr: ActivityEntry[]) => (
              <View key={entry.id} style={[styles.activityRow, idx < arr.length - 1 && styles.activityDivider]}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityAction}>{entry.action.replace(/_/g, ' ')}</Text>
                  <Text style={styles.activityMeta}>
                    {entry.user} · {entry.date}
                  </Text>
                </View>
              </View>
            ))}
            {(activity.data ?? []).length === 0 ? (
              <Text style={styles.empty}>No recent activity.</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  wide?: boolean;
}) {
  return (
    <View style={[styles.metric, wide && styles.metricWide]}>
      <View style={styles.metricIcon}>
        <Icon size={18} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { ...typography.caption, color: colors.primary, letterSpacing: 1.2 },
  name: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.white, fontFamily: fonts.sansBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 2,
    ...shadows.card,
  },
  metricWide: { width: '100%' },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: { ...typography.h1, fontFamily: fonts.sansBold, fontSize: 24, color: colors.primary },
  metricLabel: { ...typography.small, color: colors.textSecondary },
  activityHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activityTitle: { ...typography.h3, fontFamily: fonts.display, color: colors.primaryDark },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight },
  activityAction: { ...typography.label, fontSize: 14, textTransform: 'capitalize' },
  activityMeta: { ...typography.caption },
  empty: { ...typography.bodyMuted, textAlign: 'center', paddingVertical: spacing.lg },
});

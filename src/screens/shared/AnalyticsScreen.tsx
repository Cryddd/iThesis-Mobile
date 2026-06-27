import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, BarChart3, Download, Eye, TrendingUp, Users } from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useAnalyticsSummary } from '@/hooks/queries';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { AnalyticsSummary } from '@/types';
import type { IconType } from '@/types/icon';

export function AnalyticsScreen({ showBack = true }: { showBack?: boolean }) {
  const navigation = useNavigation<any>();
  const query = useAnalyticsSummary();

  return (
    <Screen edges={['top']}>
      {showBack ? (
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Usage analytics</Text>

        {query.isLoading ? (
          <LoadingState />
        ) : query.isError || !query.data ? (
          <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <Body data={query.data} />
        )}
      </ScrollView>
    </Screen>
  );
}

function Body({ data }: { data: AnalyticsSummary }) {
  const d = data.demographics;
  return (
    <>
      <View style={styles.grid}>
        <Stat icon={Eye} label="Total views" value={data.totalViews} tint={colors.info} bg={colors.infoBg} />
        <Stat icon={Download} label="Downloads" value={data.totalDownloads} tint={colors.approved} bg={colors.approvedBg} />
        <Stat icon={BarChart3} label="Theses viewed" value={data.viewedTheses} tint={colors.primary} bg={colors.accentSoft} />
        <Stat icon={Users} label="Unique users" value={data.uniqueUsers} tint={colors.pending} bg={colors.pendingBg} />
      </View>

      <View style={styles.highlight}>
        <TrendingUp size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.highlightLabel}>Top department</Text>
          <Text style={styles.highlightValue}>{data.topDept || 'N/A'}</Text>
        </View>
        <View>
          <Text style={styles.highlightLabel}>Avg reads</Text>
          <Text style={styles.highlightValue}>{data.avgReads}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Demographics</Text>
      <View style={styles.demoCard}>
        <DemoRow label="Students" value={d.studentUsers} />
        <DemoRow label="Faculty / non-teaching" value={d.facultyNonTeachingUsers} />
        <DemoRow label="Outside researchers" value={d.outsideResearchers} />
        <DemoRow label="Male" value={d.maleUsers} />
        <DemoRow label="Female" value={d.femaleUsers} last />
      </View>
    </>
  );
}

function Stat({
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
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{(value ?? 0).toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DemoRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <View style={[styles.demoRow, !last && styles.demoDivider]}>
      <Text style={styles.demoLabel}>{label}</Text>
      <Text style={styles.demoValue}>{(value ?? 0).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: {
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
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { ...typography.h1, fontFamily: fonts.sansBold, fontSize: 24 },
  statLabel: { ...typography.small, color: colors.textSecondary },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  highlightLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightValue: { ...typography.h3, color: colors.primaryDark },
  sectionTitle: { ...typography.h3, fontFamily: fonts.display, color: colors.primaryDark },
  demoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  demoDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  demoLabel: { ...typography.body, color: colors.textSecondary },
  demoValue: { ...typography.h3, fontFamily: fonts.sansBold },
});

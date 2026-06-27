import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { ThesisStatus } from '@/types';

const MAP: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: colors.pendingBg, fg: colors.pending, label: 'Pending' },
  approved: { bg: colors.approvedBg, fg: colors.approved, label: 'Approved' },
  rejected: { bg: colors.rejectedBg, fg: colors.rejected, label: 'Rejected' },
};

export function StatusBadge({ status }: { status: ThesisStatus | string }) {
  const conf = MAP[status] ?? { bg: colors.infoBg, fg: colors.info, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }]}>
      <View style={[styles.dot, { backgroundColor: conf.fg }]} />
      <Text style={[styles.text, { color: conf.fg }]}>{conf.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.caption, fontSize: 12 },
});

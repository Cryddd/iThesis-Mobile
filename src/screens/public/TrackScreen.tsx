import React, { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Hash, PackageSearch } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Screen } from '@/components/ui/Screen';
import { thesisApi } from '@/api/services';
import { describeApiError } from '@/api/client';
import { formatDate } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { TrackingResult } from '@/types';

export function TrackScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);

  const onTrack = async () => {
    if (!code.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await thesisApi.track(code));
    } catch (err) {
      setError(describeApiError(err, 'No submission found for that tracking code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Track submission</Text>
          <Text style={styles.subtitle}>
            Enter the tracking code you received after submitting your thesis to see its review
            status.
          </Text>
        </View>

        <TextField
          label="Tracking code"
          placeholder="e.g. ITH-2026-00421"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          leftIcon={<Hash size={18} color={colors.textMuted} />}
          onSubmitEditing={onTrack}
          returnKeyType="search"
        />
        <Button label="Check status" onPress={onTrack} loading={loading} disabled={!code.trim()} />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <PackageSearch size={20} color={colors.primary} />
              <Text style={styles.cardCode}>{result.trackingCode}</Text>
            </View>
            {result.title ? <Text style={styles.cardTitle}>{result.title}</Text> : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <StatusBadge status={result.status} />
            </View>
            {result.submittedAt ? (
              <Row label="Submitted" value={formatDate(result.submittedAt)} />
            ) : null}
            {result.approvedAt ? (
              <Row label="Approved" value={formatDate(result.approvedAt)} />
            ) : null}
            {result.status === 'rejected' && result.rejectionReason ? (
              <View style={styles.remarks}>
                <Text style={styles.rowLabel}>Reason for rejection</Text>
                <Text style={styles.remarksText}>{result.rejectionReason}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted },
  errorBox: {
    backgroundColor: colors.rejectedBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rejected,
    padding: spacing.md,
  },
  errorText: { ...typography.small, color: colors.rejected },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardCode: { ...typography.h3, color: colors.primary },
  cardTitle: { ...typography.body, fontFamily: fonts.sansSemibold },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { ...typography.small, color: colors.textMuted },
  rowValue: { ...typography.label, fontSize: 14 },
  remarks: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  remarksText: { ...typography.body, color: colors.textSecondary },
});

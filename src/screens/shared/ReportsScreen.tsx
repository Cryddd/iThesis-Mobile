import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileType,
} from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { reportPaths } from '@/api/services';
import { downloadAndOpen } from '@/utils/downloadFile';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { IconType } from '@/types/icon';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [busy, setBusy] = useState<string | null>(null);

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const run = async (key: string, path: string, name: string) => {
    setBusy(key);
    try {
      await downloadAndOpen(path, name);
    } catch (err) {
      Alert.alert('Export failed', describeApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const tag = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reports & exports</Text>

        <View style={styles.monthPicker}>
          <Pressable hitSlop={10} onPress={() => shift(-1)} style={styles.arrow}>
            <ChevronLeft size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.monthLabel}>
            <Text style={styles.monthText}>{MONTHS[month - 1]}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </View>
          <Pressable hitSlop={10} onPress={() => shift(1)} style={styles.arrow}>
            <ChevronRight size={22} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Monthly usage report</Text>
        <View style={styles.group}>
          <ReportRow
            icon={FileText}
            label="Monthly report (PDF)"
            busy={busy === 'pdf'}
            onPress={() => run('pdf', reportPaths.monthlyPdf(year, month), `monthly-report-${tag}.pdf`)}
          />
          <ReportRow
            icon={FileSpreadsheet}
            label="Monthly report (Excel)"
            busy={busy === 'xlsx'}
            onPress={() => run('xlsx', reportPaths.monthlyXlsx(year, month), `monthly-report-${tag}.xlsx`)}
          />
          <ReportRow
            icon={FileType}
            label="Monthly report (CSV)"
            busy={busy === 'csv'}
            onPress={() => run('csv', reportPaths.monthlyCsv(year, month), `monthly-report-${tag}.csv`)}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Official reports</Text>
        <View style={styles.group}>
          <ReportRow
            icon={FileText}
            label="Official usage report (PDF)"
            busy={busy === 'official'}
            onPress={() =>
              run('official', reportPaths.officialUsage(year, month), `official-usage-${tag}.pdf`)
            }
          />
          <ReportRow
            icon={FileType}
            label="Certification report (CSV)"
            busy={busy === 'cert'}
            onPress={() => run('cert', reportPaths.certificationReport(), `certification-report.csv`)}
          />
          <ReportRow
            icon={FileType}
            label="Upload usage report (CSV)"
            busy={busy === 'upload'}
            onPress={() => run('upload', reportPaths.uploadUsageReport(), `upload-usage-report.csv`)}
            last
          />
        </View>

        <Text style={styles.note}>Exports download with your librarian credentials and open in the share sheet.</Text>
      </ScrollView>
    </Screen>
  );
}

function ReportRow({
  icon: Icon,
  label,
  busy,
  onPress,
  last,
}: {
  icon: IconType;
  label: string;
  busy: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <Icon size={19} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowAction}>{busy ? 'Preparing…' : 'Export'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { alignItems: 'center' },
  monthText: { ...typography.h3, fontFamily: fonts.display, color: colors.primaryDark },
  yearText: { ...typography.small, color: colors.textSecondary },
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.primary,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowIcon: { width: 24, alignItems: 'center' },
  rowLabel: { ...typography.body, flex: 1, fontFamily: fonts.sansMedium },
  rowAction: { ...typography.small, color: colors.primary, fontFamily: fonts.sansSemibold },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});

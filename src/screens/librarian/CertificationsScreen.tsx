import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Award, FileCheck2, FileText, PenLine, Search, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useBrowseTheses, flattenPages } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { certificationsApi } from '@/api/services';
import { downloadAndOpen } from '@/utils/downloadFile';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { Thesis } from '@/types';

function SignatoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [titleText, setTitleText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    certificationsApi
      .getSignatory()
      .then((s) => {
        setName(s.signatory_name ?? '');
        setTitleText(s.signatory_title ?? '');
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [visible]);

  const save = async () => {
    setSaving(true);
    try {
      await certificationsApi.setSignatory({ signatory_name: name.trim(), signatory_title: titleText.trim() });
      onClose();
    } catch (err) {
      Alert.alert('Could not save', describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={modal.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={modal.title}>Certificate signatory</Text>
          <Text style={modal.sub}>Shown on generated certificates and forms.</Text>
          {loading ? (
            <LoadingState />
          ) : (
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              <TextField label="Signatory name" value={name} onChangeText={setName} />
              <TextField label="Signatory title" value={titleText} onChangeText={setTitleText} />
              <Button label="Save" onPress={save} loading={saving} />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  title: { ...typography.h2, fontFamily: fonts.display },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
});

export function CertificationsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const [target, setTarget] = useState<Thesis | null>(null);
  const [generating, setGenerating] = useState<'certificate' | 'form' | null>(null);
  const [showSignatory, setShowSignatory] = useState(false);

  const query = useBrowseTheses(useMemo(() => ({ query: debounced || undefined, sort: 'newest' as const }), [debounced]));
  const theses = flattenPages(query.data?.pages);

  const generate = async (type: 'certificate' | 'form') => {
    if (!target) return;
    setGenerating(type);
    try {
      const url = certificationsApi.generateUrl({ thesisId: target.id, type, includeESignature: true });
      await downloadAndOpen(url, `${type}-${target.id}.pdf`);
      setTarget(null);
    } catch (err) {
      Alert.alert('Generation failed', describeApiError(err));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.topBarRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable onPress={() => setShowSignatory(true)} hitSlop={10} style={styles.signatory}>
          <PenLine size={16} color={colors.primary} />
          <Text style={styles.backText}>Signatory</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Certifications & forms</Text>
        <Text style={styles.subtitle}>
          Generate a certificate or routing form for any approved thesis.
        </Text>
        <TextField
          placeholder="Search approved theses…"
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
          data={theses}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={<EmptyState title="No theses found" message="Try a different search." />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => setTarget(item)}>
              <View style={styles.rowIcon}>
                <Award size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.authors.join(', ')}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={!!target} transparent animationType="slide" onRequestClose={() => setTarget(null)}>
        <Pressable style={styles.backdrop} onPress={() => setTarget(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Generate document</Text>
              <Pressable hitSlop={10} onPress={() => setTarget(null)}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetThesis} numberOfLines={2}>
              {target?.title}
            </Text>
            <Button
              label="Certificate"
              icon={<FileCheck2 size={18} color={colors.white} />}
              onPress={() => generate('certificate')}
              loading={generating === 'certificate'}
              disabled={!!generating}
            />
            <Button
              label="Routing form"
              variant="outline"
              icon={<FileText size={18} color={colors.primary} />}
              onPress={() => generate('form')}
              loading={generating === 'form'}
              disabled={!!generating}
            />
            <Text style={styles.note}>The PDF opens in your device's share sheet once generated.</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <SignatoryModal visible={showSignatory} onClose={() => setShowSignatory(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signatory: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.h3, fontSize: 14.5 },
  rowMeta: { ...typography.small, color: colors.textSecondary },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.soft,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { ...typography.h2, fontFamily: fonts.display },
  sheetThesis: { ...typography.bodyMuted, marginBottom: spacing.sm },
  note: { ...typography.caption, textAlign: 'center' },
});

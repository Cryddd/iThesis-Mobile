import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileText,
  KeyRound,
  Upload as UploadIcon,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { useDepartments } from '@/hooks/queries';
import { accessApi, guestApi, thesisApi } from '@/api/services';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Department } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickedFile = { uri: string; name: string; mimeType?: string };

export function UploadScreen() {
  const navigation = useNavigation<Nav>();
  const { data: departments } = useDepartments();

  const [accessCode, setAccessCode] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [uploaderSrCode, setUploaderSrCode] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [adviser, setAdviser] = useState('');
  const [departmentCode, setDepartmentCode] = useState<string | undefined>(undefined);
  const [year, setYear] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [summary, setSummary] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const authorList = useMemo(
    () => authors.split(',').map((a) => a.trim()).filter(Boolean),
    [authors],
  );
  const abstractWords = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;

  const pick = async (setter: (f: PickedFile) => void) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setter({ uri: a.uri, name: a.name, mimeType: a.mimeType });
    }
  };

  const canSubmit =
    accessCode.trim() &&
    title.trim() &&
    authorList.length > 0 &&
    adviser.trim() &&
    departmentCode &&
    abstract.trim() &&
    abstractWords <= 300 &&
    file &&
    !submitting;

  const onSubmit = async () => {
    if (!canSubmit || !file) return;
    if (authorList.length > 10) {
      setError('Maximum 10 authors allowed per thesis.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 1) Verify (and consume) the upload access code, like the web flow.
      const verify = await accessApi.verify({
        code: accessCode,
        name: uploaderName,
        email: uploaderEmail,
        srCode: uploaderSrCode,
      });
      if (!verify.ok) {
        setError('That access code is invalid, expired, or already used.');
        return;
      }

      // Record the guest's upload session for analytics (best-effort).
      void guestApi.trackSession({
        name: uploaderName,
        email: uploaderEmail,
        accessLevel: 'upload',
        srCode: uploaderSrCode,
      });

      // 2) Submit the thesis.
      const res = await thesisApi.submit({
        title: title.trim(),
        abstract: abstract.trim(),
        adviser: adviser.trim(),
        authors: authorList,
        departmentCode,
        yearPublished: year.trim() || undefined,
        file,
        summary,
        uploaderName: uploaderName.trim() || undefined,
        uploaderEmail: uploaderEmail.trim() || undefined,
        uploaderSrCode: uploaderSrCode.trim() || undefined,
      });
      setTrackingCode(res.trackingCode);
    } catch (err) {
      setError(describeApiError(err, 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (trackingCode) {
    return (
      <Screen edges={['top', 'bottom']} padded>
        <View style={styles.success}>
          <CheckCircle2 size={64} color={colors.approved} />
          <Text style={styles.successTitle}>Submission received</Text>
          <Text style={styles.successBody}>
            Your thesis is now pending librarian review. Save your tracking code to check its status
            on the Track tab.
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{trackingCode}</Text>
            <Copy size={18} color={colors.primary} />
          </View>
          <Button label="Done" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.head}>
            <Text style={styles.title}>Submit a thesis</Text>
            <Text style={styles.subtitle}>
              Enter your upload access code and manuscript details. A librarian will review your
              submission.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <SectionLabel>Access</SectionLabel>
          <TextField
            label="Upload access code"
            placeholder="Provided by the library"
            value={accessCode}
            onChangeText={setAccessCode}
            autoCapitalize="characters"
            leftIcon={<KeyRound size={18} color={colors.textMuted} />}
          />

          <SectionLabel>Submitter</SectionLabel>
          <TextField label="Your name" placeholder="Full name" value={uploaderName} onChangeText={setUploaderName} />
          <TextField
            label="Institutional email"
            placeholder="you@g.batstate-u.edu.ph"
            value={uploaderEmail}
            onChangeText={setUploaderEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="SR code" placeholder="e.g. 21-12345" value={uploaderSrCode} onChangeText={setUploaderSrCode} />

          <SectionLabel>Thesis details</SectionLabel>
          <TextField label="Thesis title" placeholder="Full title" value={title} onChangeText={setTitle} />
          <TextField
            label="Author(s)"
            placeholder="Separate multiple authors with commas"
            value={authors}
            onChangeText={setAuthors}
            hint={authorList.length ? `${authorList.length} author(s)` : 'Up to 10 authors'}
          />
          <TextField label="Adviser" placeholder="Thesis adviser" value={adviser} onChangeText={setAdviser} />

          <View style={{ gap: spacing.xs }}>
            <Text style={styles.fieldLabel}>Department</Text>
            <View style={styles.deptWrap}>
              {departments?.map((d: Department) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDepartmentCode((c) => (c === d.code ? undefined : d.code))}
                  style={[styles.deptChip, departmentCode === d.code && styles.deptChipActive]}
                >
                  <Text
                    style={[styles.deptChipText, departmentCode === d.code && styles.deptChipTextActive]}
                  >
                    {d.code || d.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextField
            label="Publication year (optional)"
            placeholder="Auto-detected if left blank"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TextField
            label="Abstract"
            placeholder="Brief summary of the study (max 300 words)"
            value={abstract}
            onChangeText={setAbstract}
            multiline
            numberOfLines={5}
            style={styles.textArea}
            error={abstractWords > 300 ? `Abstract is ${abstractWords} words (max 300).` : undefined}
            hint={abstractWords > 0 ? `${abstractWords}/300 words` : undefined}
          />

          <SectionLabel>Files</SectionLabel>
          <FilePicker label="Manuscript (PDF) *" file={file} onPress={() => pick(setFile)} />
          <FilePicker
            label="Executive summary (PDF, optional)"
            file={summary}
            onPress={() => pick(setSummary)}
          />

          <Button
            label="Submit for review"
            icon={<UploadIcon size={18} color={colors.white} />}
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function FilePicker({
  label,
  file,
  onPress,
}: {
  label: string;
  file: PickedFile | null;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={onPress} style={[styles.dropzone, file && styles.dropzoneFilled]}>
        <FileText size={20} color={file ? colors.primary : colors.textMuted} />
        <Text style={[styles.dropzoneText, file && styles.dropzoneTextFilled]} numberOfLines={1}>
          {file ? file.name : 'Tap to choose a PDF'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  head: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  subtitle: { ...typography.bodyMuted },
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.md },
  fieldLabel: { ...typography.label },
  deptWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  deptChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deptChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  deptChipText: { ...typography.small, color: colors.textSecondary },
  deptChipTextActive: { color: colors.white, fontFamily: fonts.sansSemibold },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  dropzoneFilled: { borderStyle: 'solid', borderColor: colors.primary, backgroundColor: colors.surface },
  dropzoneText: { ...typography.body, color: colors.textMuted, flex: 1 },
  dropzoneTextFilled: { color: colors.textPrimary, fontFamily: fonts.sansSemibold },
  errorBox: {
    backgroundColor: colors.rejectedBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rejected,
    padding: spacing.md,
  },
  errorText: { ...typography.small, color: colors.rejected },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  successTitle: { ...typography.h1, fontFamily: fonts.display, textAlign: 'center' },
  successBody: { ...typography.bodyMuted, textAlign: 'center' },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  code: { ...typography.h2, fontFamily: fonts.sansBold, color: colors.primaryDark, letterSpacing: 1 },
});

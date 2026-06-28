import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileText,
  Sparkles,
  Upload as UploadIcon,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Screen } from '@/components/ui/Screen';
import { UploadAccessModal, type UploadAccessInfo } from '@/components/UploadAccessModal';
import { useDepartments } from '@/hooks/queries';
import { accessApi, guestApi, thesisApi } from '@/api/services';
import { describeApiError } from '@/api/client';
import { readGuestSession, saveGuestSession } from '@/utils/guestSession';
import {
  ABSTRACT_MAX_WORDS,
  limitWords,
  pickAutofillYear,
  splitAuthorsIfCommaSeparated,
  type ThesisAutofillFields,
} from '@/utils/thesisAutofill';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickedFile = { uri: string; name: string; mimeType?: string };

/** Maps an /access/verify failure to a friendly message (mirrors the web). */
function mapVerifyError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) {
      const m = (err.response.data as { message?: string } | undefined)?.message;
      return m && m.trim() ? m : 'Too many access code attempts. Please wait before trying again.';
    }
    const code = (err.response?.data as { error?: string } | undefined)?.error;
    if (code === 'invalid') return 'Invalid code.';
    if (code === 'used') return 'This code has already been used.';
    if (code === 'expired') return 'This code has expired.';
  }
  return describeApiError(err, 'Unable to verify access code. Please try again.');
}

export function UploadScreen() {
  const navigation = useNavigation<Nav>();
  const { data: departments } = useDepartments();

  // ── Upload access gate (mirrors the web's UploadAccessModal) ──
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessError, setAccessError] = useState<string | undefined>(undefined);
  // Pre-fill the submitter name from an existing guest session, like the web.
  const [prefillName, setPrefillName] = useState('');

  useEffect(() => {
    let active = true;
    readGuestSession().then((s) => {
      if (active && s?.name) setPrefillName(s.name);
    });
    return () => {
      active = false;
    };
  }, []);

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

  // PDF auto-fill state (mirrors the web's extract-on-upload behaviour).
  const [extracting, setExtracting] = useState(false);
  const [manuscriptMsg, setManuscriptMsg] = useState('');
  const [summaryExtracting, setSummaryExtracting] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState('');

  const authorList = useMemo(
    () => authors.split(',').map((a) => a.trim()).filter(Boolean),
    [authors],
  );
  const abstractWords = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;

  const departmentOptions = useMemo<SelectOption[]>(
    () => (departments ?? []).map((d) => ({ value: d.code, label: d.name })),
    [departments],
  );
  const selectedDeptLabel = departments?.find((d) => d.code === departmentCode)?.name;

  /**
   * Pre-fills form fields from extracted PDF metadata, only where the user
   * hasn't typed a value yet. Mirrors the web's `applyAutoFilledFields`.
   */
  const applyAutoFill = (
    fields: ThesisAutofillFields,
    opts: {
      allowAbstract: boolean;
      allowTitle: boolean;
      allowAuthors?: boolean;
      allowAdviser?: boolean;
      allowDepartment?: boolean;
      allowYear?: boolean;
    },
  ) => {
    const allowAuthors = opts.allowAuthors !== false;
    const allowAdviser = opts.allowAdviser !== false;
    const allowDepartment = opts.allowDepartment !== false;
    const allowYear = opts.allowYear !== false;

    if (allowAuthors && ((fields.authors_list && fields.authors_list.length) || fields.authors.trim())) {
      setAuthors((prev) => {
        if (prev.trim()) return prev;
        const fromList = (fields.authors_list || []).map((a) => a.toUpperCase()).filter(Boolean);
        if (fromList.length) return fromList.join(', ');
        const parsed = splitAuthorsIfCommaSeparated(fields.authors.toUpperCase());
        return parsed.length ? parsed.join(', ') : prev;
      });
    }
    if (opts.allowTitle && fields.title.trim()) {
      setTitle((prev) => (prev.trim() ? prev : fields.title.toUpperCase()));
    }
    if (opts.allowAbstract && fields.abstract.trim()) {
      setAbstract((prev) => (prev.trim() ? prev : limitWords(fields.abstract, ABSTRACT_MAX_WORDS)));
    }
    if (allowAdviser && fields.adviser.trim()) {
      setAdviser((prev) => (prev.trim() ? prev : fields.adviser.toUpperCase()));
    }
    if (allowDepartment && fields.department_code.trim()) {
      const code = fields.department_code.toUpperCase();
      setDepartmentCode((prev) => {
        if (prev) return prev;
        const match = (departments ?? []).find((d) => d.code.toUpperCase() === code);
        return match?.code ?? prev;
      });
    }
    if (allowYear) {
      const picked = pickAutofillYear(fields);
      if (picked) setYear((prev) => (prev.trim() ? prev : String(picked)));
    }
  };

  const pickPdf = async (): Promise<PickedFile | null> => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const a = res.assets[0];
    return { uri: a.uri, name: a.name, mimeType: a.mimeType };
  };

  // Manuscript → extract title, authors, adviser, department, year (NOT abstract).
  const pickManuscript = async () => {
    const picked = await pickPdf();
    if (!picked) return;
    setFile(picked);
    setExtracting(true);
    setManuscriptMsg('Reading the manuscript and auto-filling details…');
    try {
      const fields = await thesisApi.extractFields(picked);
      applyAutoFill(fields, { allowAbstract: false, allowTitle: true });
      setManuscriptMsg('Details auto-filled from the manuscript — please verify and correct.');
    } catch {
      setManuscriptMsg('Uploaded, but auto-fill failed. Please fill the details manually.');
    } finally {
      setExtracting(false);
    }
  };

  // Executive summary → extract the abstract only.
  const pickSummary = async () => {
    const picked = await pickPdf();
    if (!picked) return;
    setSummary(picked);
    setSummaryExtracting(true);
    setSummaryMsg('Reading the executive summary for the abstract…');
    try {
      const fields = await thesisApi.extractFields(picked);
      applyAutoFill(fields, {
        allowAbstract: true,
        allowTitle: false,
        allowAuthors: false,
        allowAdviser: false,
        allowDepartment: false,
      });
      setSummaryMsg('Abstract auto-filled from the executive summary — please verify.');
    } catch {
      setSummaryMsg('Uploaded, but abstract extraction failed. Please enter it manually.');
    } finally {
      setSummaryExtracting(false);
    }
  };

  const canSubmit =
    title.trim() &&
    authorList.length > 0 &&
    adviser.trim() &&
    departmentCode &&
    abstract.trim() &&
    abstractWords <= 300 &&
    file &&
    !submitting;

  // Gate: verify (and consume) the access code up front, like the web. On
  // success we hydrate the submitter fields and reveal the thesis form.
  const handleAccessSubmit = async (info: UploadAccessInfo) => {
    setAccessSubmitting(true);
    setAccessError(undefined);
    try {
      const verify = await accessApi.verify({
        code: info.accessCode,
        name: info.name,
        email: info.email,
        srCode: info.srCode,
      });
      if (!verify.ok) {
        setAccessError('That access code is invalid, expired, or already used.');
        return;
      }
      setUploaderName(info.name);
      setUploaderEmail(info.email);
      setUploaderSrCode(info.srCode);

      // Persist + report the upload guest session for analytics (best-effort).
      const session = await saveGuestSession(
        { name: info.name, email: info.email, srCode: info.srCode, code: info.accessCode },
        'upload',
      );
      void guestApi.trackSession({
        name: session.name,
        email: session.email,
        accessLevel: 'upload',
        sessionId: session.sessionId,
        srCode: session.srCode,
      });

      setAccessGranted(true);
    } catch (err) {
      setAccessError(mapVerifyError(err));
    } finally {
      setAccessSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (!canSubmit || !file) return;
    if (authorList.length > 10) {
      setError('Maximum 10 authors allowed per thesis.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Access code was already verified + consumed at the gate; just submit.
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

  // Gate: until the access code is verified, hold the form behind the modal.
  if (!accessGranted) {
    return (
      <Screen edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.locked}>
          <View style={styles.lockBadge}>
            <UploadIcon size={30} color={colors.primary} />
          </View>
          <Text style={styles.lockTitle}>Thesis Upload Access</Text>
          <Text style={styles.lockBody}>
            Enter your details and the one-time access code from the library to submit a thesis.
          </Text>
        </View>
        <UploadAccessModal
          key={prefillName}
          visible
          submitting={accessSubmitting}
          error={accessError}
          initial={{ name: prefillName }}
          onSubmit={handleAccessSubmit}
          onCancel={() => navigation.goBack()}
        />
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
              Add your manuscript details below. A librarian will review your submission.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <SectionLabel>Submitter</SectionLabel>
          <View style={styles.verifiedBanner}>
            <CheckCircle2 size={16} color={colors.approved} />
            <Text style={styles.verifiedBannerText}>
              Access code verified — your details are pre-filled below.
            </Text>
          </View>
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

          {/* Documents first — uploading the manuscript auto-fills the details below. */}
          <SectionLabel>Documents</SectionLabel>
          <View style={styles.autofillNote}>
            <Sparkles size={15} color={colors.primary} />
            <Text style={styles.autofillNoteText}>
              Upload your manuscript and we'll auto-fill the title, authors, adviser, department and
              year. The abstract is read from your executive summary.
            </Text>
          </View>
          <FilePicker
            label="Manuscript (PDF) *"
            file={file}
            busy={extracting}
            message={manuscriptMsg}
            onPress={pickManuscript}
          />
          <FilePicker
            label="Executive summary (PDF)"
            file={summary}
            busy={summaryExtracting}
            message={summaryMsg}
            onPress={pickSummary}
          />

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

          <Select
            label="Department"
            placeholder="Select department"
            value={departmentCode ?? ''}
            display={selectedDeptLabel}
            options={departmentOptions}
            onChange={setDepartmentCode}
          />

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
            placeholder="Auto-filled from your executive summary (max 300 words)"
            value={abstract}
            onChangeText={(t) => setAbstract(limitWords(t, ABSTRACT_MAX_WORDS))}
            multiline
            numberOfLines={5}
            style={styles.textArea}
            error={abstractWords > 300 ? `Abstract is ${abstractWords} words (max 300).` : undefined}
            hint={abstractWords > 0 ? `${abstractWords}/300 words` : undefined}
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
  busy,
  message,
  onPress,
}: {
  label: string;
  file: PickedFile | null;
  busy?: boolean;
  message?: string;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={busy}
        style={[styles.dropzone, file && styles.dropzoneFilled]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <FileText size={20} color={file ? colors.primary : colors.textMuted} />
        )}
        <Text style={[styles.dropzoneText, file && styles.dropzoneTextFilled]} numberOfLines={1}>
          {file ? file.name : 'Tap to choose a PDF'}
        </Text>
      </Pressable>
      {message ? <Text style={styles.extractMsg}>{message}</Text> : null}
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
  autofillNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  autofillNoteText: { ...typography.small, flex: 1, color: colors.primaryDark, lineHeight: 19 },
  extractMsg: { ...typography.small, color: colors.textSecondary, paddingHorizontal: spacing.xs },
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
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  lockBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    ...typography.h2,
    fontFamily: fonts.display,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  lockBody: { ...typography.bodyMuted, textAlign: 'center', maxWidth: 300 },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.approvedBg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  verifiedBannerText: { ...typography.small, color: colors.approved, flex: 1 },
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

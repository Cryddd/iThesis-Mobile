import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Info, KeyRound } from 'lucide-react-native';

import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import {
  SCHOOL_EMAIL_DOMAIN,
  formatPersonName,
  formatSrCode,
  isValidInstitutionalEmail,
  isValidSrCode,
  normalizeInstitutionalEmail,
} from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';

export interface UploadAccessInfo {
  name: string;
  srCode: string;
  email: string;
  accessCode: string;
}

interface Props {
  visible: boolean;
  submitting?: boolean;
  /** Verification error surfaced by the parent (e.g. invalid / used / expired). */
  error?: string;
  initial?: Partial<UploadAccessInfo>;
  onCancel: () => void;
  onSubmit: (info: UploadAccessInfo) => void;
}

export function UploadAccessModal({
  visible,
  submitting,
  error,
  initial,
  onCancel,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState(initial?.name ?? '');
  const [srCode, setSrCode] = useState(initial?.srCode ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [accessCode, setAccessCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [srCodeError, setSrCodeError] = useState('');

  const handleEmailChange = (value: string) => {
    const normalized = normalizeInstitutionalEmail(value);
    setEmail(normalized);
    setEmailError(
      normalized.trim() !== '' && !isValidInstitutionalEmail(normalized)
        ? `Use your school email only (@${SCHOOL_EMAIL_DOMAIN}).`
        : '',
    );
  };

  const handleSrCodeChange = (value: string) => {
    const formatted = formatSrCode(value);
    setSrCode(formatted);
    setSrCodeError(formatted.trim() !== '' && !isValidSrCode(formatted) ? 'Format: XX-XXXXX' : '');
  };

  const canContinue = useMemo(
    () =>
      fullName.trim() !== '' &&
      srCode.trim() !== '' &&
      email.trim() !== '' &&
      accessCode.trim() !== '' &&
      !emailError &&
      !srCodeError,
    [fullName, srCode, email, accessCode, emailError, srCodeError],
  );

  const handleSubmit = () => {
    if (!canContinue) return;
    onSubmit({
      name: fullName.trim(),
      srCode: srCode.trim(),
      email: email.trim(),
      accessCode: accessCode.trim().toUpperCase(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Thesis Upload Access</Text>
            <Text style={styles.subtitle}>
              Please enter your details and access code provided by the library to continue.
            </Text>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextField
                  label="Full Name"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChangeText={(v) => setFullName(formatPersonName(v))}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.col}>
                <TextField
                  label="SR-Code"
                  placeholder="Enter your SR-Code"
                  value={srCode}
                  onChangeText={handleSrCodeChange}
                  keyboardType="number-pad"
                  maxLength={8}
                  error={srCodeError || undefined}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextField
                  label="Email"
                  placeholder={`e.g. 22-37726@${SCHOOL_EMAIL_DOMAIN}`}
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={emailError || undefined}
                />
              </View>
              <View style={styles.col}>
                <TextField
                  label="Access Code"
                  placeholder="Enter Access Code"
                  value={accessCode}
                  onChangeText={(v) => setAccessCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  leftIcon={<KeyRound size={18} color={colors.textMuted} />}
                />
              </View>
            </View>

            {/* Access Code help (mirrors the web info banner) */}
            <View style={styles.help}>
              <Info size={16} color={colors.info} style={{ marginTop: 1 }} />
              <Text style={styles.helpText}>
                <Text style={styles.helpStrong}>Don't have an access code? </Text>
                Visit the library office to request a one-time code for thesis upload. Each code is
                valid for single use only.
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                label="Continue"
                onPress={handleSubmit}
                disabled={!canContinue}
                loading={submitting}
                fullWidth={false}
                style={styles.actionBtn}
              />
              <Button
                label="Cancel"
                variant="outline"
                onPress={onCancel}
                fullWidth={false}
                style={styles.actionBtn}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.soft,
  },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  title: {
    ...typography.h2,
    fontFamily: fonts.display,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.small,
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  help: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  helpText: { ...typography.small, flex: 1, color: colors.textSecondary, lineHeight: 19 },
  helpStrong: { fontFamily: fonts.sansSemibold, color: colors.primaryDark },
  error: { ...typography.small, color: colors.rejected, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionBtn: { minWidth: 130, paddingHorizontal: spacing.xl },
});

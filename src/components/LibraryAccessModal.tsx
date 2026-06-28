import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';

import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatPersonName } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';

export interface LibraryAccessInfo {
  name: string;
  gender: string;
  category: string;
  course?: string;
}

interface Props {
  visible: boolean;
  submitting?: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (info: LibraryAccessInfo) => void;
}

const GENDERS = ['Male', 'Female', 'Other'];

const CATEGORIES = [
  { value: 'Student', label: 'Student' },
  { value: 'Faculty', label: 'Faculty/Non-Teaching' },
  { value: 'Outside Researcher', label: 'Outside Researcher' },
];

/** Courses offered — mirrors the web AccessModal list verbatim. */
const COURSES = [
  'BSIT Major in Business Analytics',
  'BSIT Major in Service Management',
  'BSIT Major in Network Technology',
  'BSBA Major in Human Resource Management',
  'BSBA Major in Marketing Management',
  'BSBA Major Operations Management',
  'Bachelor of Science in Management Accounting',
  'Bachelor in Public Administration',
  'BSED Major in English',
  'BSED Major in Mathematics',
  'BSED Major in Science',
  'BA Communication',
  'BS Psychology',
  'Bachelor of Computer Engineering Technology',
  'Bachelor of Electrical Engineering Technology',
  'Bachelor of Electronics Engineering Technology',
  'Bachelor of Instrumentation & Control',
];

export function LibraryAccessModal({ visible, submitting, error, onCancel, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [course, setCourse] = useState('');
  const [consent, setConsent] = useState(false);

  const isStudent = category === 'Student';

  const canContinue = useMemo(
    () =>
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      gender !== '' &&
      category !== '' &&
      (!isStudent || course !== '') &&
      consent,
    [firstName, lastName, gender, category, course, consent, isStudent],
  );

  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  const handleSubmit = () => {
    if (!canContinue) return;
    onSubmit({
      name: `${firstName} ${lastName}`.trim(),
      gender,
      category,
      course: isStudent ? course : undefined,
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
            <Text style={styles.title}>Library Access Required</Text>
            <Text style={styles.subtitle}>
              Please fill in your details to browse our collection of academic theses.
            </Text>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextField
                  label="First Name"
                  placeholder="Enter First Name"
                  value={firstName}
                  onChangeText={(v) => setFirstName(formatPersonName(v))}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.col}>
                <TextField
                  label="Last Name"
                  placeholder="Enter Last Name"
                  value={lastName}
                  onChangeText={(v) => setLastName(formatPersonName(v))}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Select
                  label="Gender"
                  placeholder="Select"
                  value={gender}
                  display={gender}
                  options={GENDERS.map((g) => ({ value: g, label: g }))}
                  onChange={setGender}
                />
              </View>
              <View style={styles.col}>
                <Select
                  label="Category"
                  placeholder="Select"
                  value={category}
                  display={categoryLabel}
                  options={CATEGORIES}
                  onChange={(v) => {
                    setCategory(v);
                    if (v !== 'Student') setCourse('');
                  }}
                />
              </View>
            </View>

            {isStudent ? (
              <Select
                label="Course"
                placeholder="Select Course"
                value={course}
                display={course}
                options={COURSES.map((c) => ({ value: c, label: c }))}
                onChange={setCourse}
              />
            ) : null}

            {/* Data Privacy Acknowledgement (RA 10173) */}
            <Pressable
              style={styles.consent}
              onPress={() => setConsent((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
            >
              <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
                {consent ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.consentText}>
                I consent to the collection of my information for thesis access tracking and library
                analytics only.{'\n'}
                <Text style={styles.consentMuted}>
                  This data will be handled securely in compliance with RA 10173 (Data Privacy Act of
                  2012).
                </Text>
              </Text>
            </Pressable>

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

  // Consent
  consent: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { ...typography.small, flex: 1, color: colors.textSecondary, lineHeight: 19 },
  consentMuted: { color: colors.textMuted },

  error: { ...typography.small, color: colors.rejected, textAlign: 'center' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionBtn: { minWidth: 130, paddingHorizontal: spacing.xl },
});

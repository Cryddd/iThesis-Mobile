import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
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

/* ── Inline Select (nested modal picker) ─────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
}

function Select({
  label,
  placeholder,
  value,
  display,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  display?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = display || options.find((o) => o.value === value)?.label;

  return (
    <View style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{label}</Text>
      <Pressable style={styles.selectField} onPress={() => setOpen(true)}>
        <Text style={[styles.selectValue, !selectedLabel && styles.selectPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.pickerRow, active && styles.pickerRowActive]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.pickerRowText, active && styles.pickerRowTextActive]}>
                      {opt.label}
                    </Text>
                    {active ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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

  // Select
  selectWrap: { gap: spacing.xs, flex: 1 },
  selectLabel: { ...typography.label },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  selectValue: { ...typography.body, flex: 1, marginRight: spacing.sm },
  selectPlaceholder: { color: colors.textMuted },

  // Picker overlay
  pickerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  pickerTitle: {
    ...typography.label,
    color: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pickerScroll: { flexGrow: 0 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pickerRowActive: { backgroundColor: colors.surfaceMuted },
  pickerRowText: { ...typography.body, flex: 1, marginRight: spacing.sm },
  pickerRowTextActive: { color: colors.primary, fontFamily: fonts.sansSemibold },

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

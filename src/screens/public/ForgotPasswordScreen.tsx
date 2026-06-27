import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { authApi } from '@/api/services';
import { describeApiError } from '@/api/client';
import { colors, fonts, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
        <ArrowLeft size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {sent ? (
        <View style={styles.center}>
          <CheckCircle2 size={56} color={colors.approved} />
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.body}>
            If an account exists for {email.trim()}, we've sent password reset instructions.
          </Text>
          <Button label="Back to login" onPress={() => navigation.goBack()} fullWidth={false} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.body}>
            Enter the email tied to your staff account and we'll send a reset link.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextField
            label="Email"
            placeholder="you@g.batstate-u.edu.ph"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={18} color={colors.textMuted} />}
          />
          <Button
            label="Send reset link"
            onPress={onSubmit}
            loading={submitting}
            disabled={!email.trim() || submitting}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
  backText: { ...typography.label, color: colors.primary },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { ...typography.h1, fontFamily: fonts.display, textAlign: 'center' },
  body: { ...typography.bodyMuted, textAlign: 'center' },
  error: { ...typography.small, color: colors.rejected },
});

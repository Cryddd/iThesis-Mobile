import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing, typography } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I browse theses?',
    a: 'Open the Browse tab and search by title, author, or keyword. Filter by department and sort the results. Only approved theses appear in the public repository.',
  },
  {
    q: 'How do I submit my thesis?',
    a: 'Go to Submit a thesis from the home screen. Enter the upload access code provided by the library, fill in your details, attach your PDF manuscript, and submit. You will receive a tracking code.',
  },
  {
    q: 'Where do I get an access code?',
    a: 'Access codes are issued by the library. Visit or contact the TheNEU Lipa Campus Library to receive a code for browsing or uploading.',
  },
  {
    q: 'How do I check my submission status?',
    a: 'Use the Track tab and enter the tracking code you received after submitting. You will see whether your thesis is pending, approved, or rejected — including any librarian remarks.',
  },
  {
    q: 'Can I read the full PDF?',
    a: 'Yes. Open a thesis and tap Open document. Documents are watermarked and provided for academic reference only.',
  },
  {
    q: 'Do I need an account?',
    a: 'Students and library visitors do not need an account to browse, submit, or track. Only library staff (librarians and administrators) sign in, to access the review and management console.',
  },
];

export function FAQScreen() {
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === i ? null : i));
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Frequently asked questions</Text>
        {FAQS.map((item, i) => {
          const expanded = open === i;
          return (
            <Pressable key={item.q} onPress={() => toggle(i)} style={styles.card}>
              <View style={styles.qRow}>
                <Text style={styles.question}>{item.q}</Text>
                <ChevronDown
                  size={20}
                  color={colors.primary}
                  style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                />
              </View>
              {expanded ? <Text style={styles.answer}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  question: { ...typography.h3, fontSize: 15, flex: 1 },
  answer: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.md },
});

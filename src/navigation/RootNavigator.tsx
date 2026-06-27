import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PublicTabs } from './PublicTabs';
import { LibrarianTabs } from './LibrarianTabs';
import { AdminTabs } from './AdminTabs';
import { ThesisDetailScreen } from '@/screens/public/ThesisDetailScreen';
import { UploadScreen } from '@/screens/public/UploadScreen';
import { LoginScreen } from '@/screens/public/LoginScreen';
import { ForgotPasswordScreen } from '@/screens/public/ForgotPasswordScreen';
import { AccessCodesScreen } from '@/screens/librarian/AccessCodesScreen';
import { DeletedThesesScreen } from '@/screens/librarian/DeletedThesesScreen';
import { CertificationsScreen } from '@/screens/librarian/CertificationsScreen';
import { AnalyticsScreen } from '@/screens/shared/AnalyticsScreen';
import { ReportsScreen } from '@/screens/shared/ReportsScreen';
import { ManageStaffScreen } from '@/screens/admin/ManageStaffScreen';
import { AboutScreen } from '@/screens/public/AboutScreen';
import { FAQScreen } from '@/screens/public/FAQScreen';
import { useAuth } from '@/store/AuthContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, sessionNotice, clearSessionNotice } = useAuth();
  const role = user?.role;

  // Surface forced logout when the staff session expires.
  useEffect(() => {
    if (!sessionNotice) return;
    Alert.alert(
      'Session ended',
      'Your session has expired. Please sign in again.',
      [{ text: 'OK', onPress: clearSessionNotice }],
    );
  }, [sessionNotice, clearSessionNotice]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {role === 'admin' ? (
        <Stack.Group>
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
          <Stack.Screen name="ThesisDetail" component={ThesisDetailScreen} />
          <Stack.Screen name="ManageStaff" component={ManageStaffScreen} />
          <Stack.Screen name="LibrarianAnalytics" component={AnalyticsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
        </Stack.Group>
      ) : role === 'librarian' ? (
        <Stack.Group>
          <Stack.Screen name="LibrarianTabs" component={LibrarianTabs} />
          <Stack.Screen name="ThesisDetail" component={ThesisDetailScreen} />
          <Stack.Screen name="AccessCodes" component={AccessCodesScreen} />
          <Stack.Screen name="DeletedTheses" component={DeletedThesesScreen} />
          <Stack.Screen name="LibrarianAnalytics" component={AnalyticsScreen} />
          <Stack.Screen name="Certifications" component={CertificationsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="PublicTabs" component={PublicTabs} />
          <Stack.Screen name="ThesisDetail" component={ThesisDetailScreen} />
          <Stack.Screen
            name="Upload"
            component={UploadScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

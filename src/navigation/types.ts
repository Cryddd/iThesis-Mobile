import type { NavigatorScreenParams } from '@react-navigation/native';

export type PublicTabParamList = {
  Home: undefined;
  Browse: undefined;
  Track: undefined;
  Account: undefined;
};

export type LibrarianTabParamList = {
  Dashboard: undefined;
  Review: undefined;
  Repository: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  Staff: undefined;
  Logs: undefined;
  AdminProfile: undefined;
};

export type RootStackParamList = {
  PublicTabs: NavigatorScreenParams<PublicTabParamList>;
  LibrarianTabs: NavigatorScreenParams<LibrarianTabParamList>;
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  ThesisDetail: { id: number; title?: string };
  Upload: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  // Librarian sub-screens
  AccessCodes: undefined;
  DeletedTheses: undefined;
  LibrarianAnalytics: undefined;
  Certifications: undefined;
  Reports: undefined;
  // Admin sub-screens
  ManageStaff: { role: 'librarian' | 'admin' };
  // Public info
  About: undefined;
  FAQ: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

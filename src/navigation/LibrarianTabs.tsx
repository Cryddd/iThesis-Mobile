import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ClipboardCheck, Library, UserCircle2 } from 'lucide-react-native';

import { LibrarianDashboardScreen } from '@/screens/librarian/DashboardScreen';
import { ReviewScreen } from '@/screens/librarian/ReviewScreen';
import { RepositoryScreen } from '@/screens/librarian/RepositoryScreen';
import { ProfileScreen } from '@/screens/librarian/ProfileScreen';
import { tabScreenOptions } from './tabOptions';
import type { LibrarianTabParamList } from './types';

const Tab = createBottomTabNavigator<LibrarianTabParamList>();

export function LibrarianTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={LibrarianDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{ tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Repository"
        component={RepositoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Library size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <UserCircle2 size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

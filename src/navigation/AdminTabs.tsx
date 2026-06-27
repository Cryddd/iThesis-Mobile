import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ScrollText, UserCircle2, Users } from 'lucide-react-native';

import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { ManageStaffScreen } from '@/screens/admin/ManageStaffScreen';
import { SystemLogsScreen } from '@/screens/admin/SystemLogsScreen';
import { AdminProfileScreen } from '@/screens/admin/AdminProfileScreen';
import { tabScreenOptions } from './tabOptions';
import type { AdminTabParamList } from './types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Staff"
        component={ManageStaffScreen}
        options={{ tabBarIcon: ({ color, size }) => <Users size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Logs"
        component={SystemLogsScreen}
        options={{ tabBarIcon: ({ color, size }) => <ScrollText size={size} color={color} /> }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <UserCircle2 size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

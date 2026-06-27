import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Library, PackageSearch, UserCircle2 } from 'lucide-react-native';

import { LandingScreen } from '@/screens/public/LandingScreen';
import { BrowseScreen } from '@/screens/public/BrowseScreen';
import { TrackScreen } from '@/screens/public/TrackScreen';
import { AccountScreen } from '@/screens/public/AccountScreen';
import { tabScreenOptions } from './tabOptions';
import type { PublicTabParamList } from './types';

const Tab = createBottomTabNavigator<PublicTabParamList>();

export function PublicTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={LandingScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarIcon: ({ color, size }) => <Library size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Track"
        component={TrackScreen}
        options={{ tabBarIcon: ({ color, size }) => <PackageSearch size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <UserCircle2 size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

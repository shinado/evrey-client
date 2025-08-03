import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { RouterName } from '../constants/navigation';
import { SettingsStackParamList } from './types';
import SettingsScreen from '../screens/Holdings/Settings/SettingsScreen';
import HelpCenterScreen from '../screens/Holdings/Settings/HelpCenterScreen';
import WalletScreen from '../screens/Holdings/Settings/WalletScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function Settings() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={RouterName.SETTINGS} component={SettingsScreen} />
      <Stack.Screen name={RouterName.HELP_CENTER} component={HelpCenterScreen} />
      <Stack.Screen name={RouterName.WALLET} component={WalletScreen} />
    </Stack.Navigator>
  );
}
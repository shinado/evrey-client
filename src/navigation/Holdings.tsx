import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouterName } from '../constants/navigation';
import { HoldingsStackParamList } from './types';

import HoldingsScreen from '../screens/Holdings/HoldingsScreen';
import DepositScreen from '../screens/Holdings/DepositScreen';
import FollowingScreen from '../screens/Holdings/FollowingScreen';
import FollowersScreen from '../screens/Holdings/FollowersScreen';

const Stack = createNativeStackNavigator<HoldingsStackParamList>();

export default function Holdings() {
  return (
    <Stack.Navigator
      initialRouteName={RouterName.HOLDINGS}
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: 'white',
        },
      }}
    >
      <Stack.Screen name={RouterName.HOLDINGS} component={HoldingsScreen} />
      <Stack.Screen name={RouterName.DEPOSIT} component={DepositScreen} />
      <Stack.Screen name={RouterName.FOLLOWING} component={FollowingScreen} />
      <Stack.Screen name={RouterName.FOLLOWERS} component={FollowersScreen} />
    </Stack.Navigator>
  );
}

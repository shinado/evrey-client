import React from 'react';
import { createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { ViewStyle, Text } from 'react-native';

import { NavigatorName, RouterName } from '../constants/navigation';
import { MainTabParamList } from './types';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import { useLanguage } from '../contexts/LanguageContext';

import Holdings from './Holdings';
import FeedScreen from '../screens/Feed/FeedScreen';
import SearchTokenScreen from '../screens/Create/SearchTokenScreen';

import DiscoveryIcon from '../../assets/tab/discovery.svg';
import CreateIcon from '../../assets/tab/create.svg';
import MeIcon from '../../assets/tab/me.svg';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabBarIconHoldings = ({ color, size }:any) => (
  <MeIcon width={size} height={size} color={color} />
);

const tabBarIconCreate = ({ color, size }:any) => (
  <CreateIcon width={size} height={size} color={color} />
);

const tabBarIconFeed = ({ color, size }:any) => (
  <DiscoveryIcon width={size*1.25} height={size} color={color} />
);

export default function MainTab() {
  const { i18n } = useLanguage();
  
  const tabBarStyle: ViewStyle = {
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 10,
    paddingTop: 10,
    height: 60,
  };

  const tabBarLabelStyle = {
    fontFamily: FontFamily.medium,
  };

  return (
    <Tab.Navigator
      initialRouteName={RouterName.FEED}
      screenOptions={({ route }) => ({
        contentStyle: {
          backgroundColor: 'white',
        },
        tabBarActiveTintColor: Theme.primaryColors,
        tabBarInactiveTintColor: Theme.text[300],
        tabBarStyle,
        headerShown: false,
        tabBarLabelStyle,
        tabBarLabel: ({ focused }) => (
          <Text style={[
            tabBarLabelStyle,
            { color: focused ? Theme.primaryColors : Theme.text[300] }
          ]}>
            {i18n.t(`tabs.${route.name}`)}
          </Text>
        ),
      })}
    >
      <Tab.Screen
        name={RouterName.FEED}
        component={FeedScreen}
        options={{
          tabBarIcon: tabBarIconFeed,
        }}
      />
      <Tab.Screen
        name={RouterName.SEARCH_TOKEN}
        component={SearchTokenScreen}
        options={{
          tabBarIcon: tabBarIconCreate,
          tabBarStyle: {
            display: 'none',
          },
        }}
      />
      <Tab.Screen
        name={NavigatorName.HOLDINGS_STACK}
        component={Holdings}
        options={{
          tabBarIcon: tabBarIconHoldings,
        }}
      />
    </Tab.Navigator>
  );
}

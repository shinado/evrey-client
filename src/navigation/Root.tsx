import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { RouterName, NavigatorName } from '../constants/navigation';
import { navigationRef } from './service';
import MainTab from './MainTab';
import Auth from './Auth';
import Onboarding from './Onboarding';
import LandingScreen from '../screens/Auth/LandingScreen';
import WebViewScreen from '../screens/Common/WebViewScreen';
import TokenInfoScreen from '../screens/Common/TokenInfoScreen';
import FeedDetailScreen from '../screens/Common/FeedDetailScreen';
import CreatorProfileScreen from '../screens/Common/CreatorProfileScreen';
import CreatePostScreen from 'src/screens/Create/CreatePostScreen';
import DraftListScreen from 'src/screens/Create/DraftListScreen';
import SearchScreen from 'src/screens/Feed/SearchScreen';
import HistoryOrdersScreen from 'src/screens/Holdings/HistoryOrdersScreen';
import CashoutScreen from 'src/screens/Holdings/CashoutScreen';
import ProfileScreen from 'src/screens/Holdings/ProfileScreen';
import Settings from './Settings';
import HoldingTokenScreen from 'src/screens/Holdings/HoldingTokenScreen';
import PostCommissionScreen from 'src/screens/Holdings/PostCommissionScreen';
import InterestSelectionScreen from 'src/screens/Onboarding/InterestSelectionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNav = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={RouterName.LANDING}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'white',
          },
        }}
      >
        <Stack.Screen name={RouterName.LANDING} component={LandingScreen} />
        <Stack.Screen name={NavigatorName.MAIN_TAB} component={MainTab} />
        <Stack.Screen name={NavigatorName.AUTH_STACK} component={Auth} />
        <Stack.Screen name={NavigatorName.ONBOARDING_STACK} component={Onboarding} />
        <Stack.Screen name={RouterName.WEBVIEW} component={WebViewScreen} />
        <Stack.Screen name={RouterName.TOKEN_INFO} component={TokenInfoScreen} />
        <Stack.Screen name={RouterName.FEED_DETAIL} component={FeedDetailScreen} />
        <Stack.Screen name={RouterName.CREATOR_PROFILE} component={CreatorProfileScreen} />
        <Stack.Screen name={RouterName.CREATE_POST} component={CreatePostScreen} />
        <Stack.Screen name={RouterName.DRAFT_LIST} component={DraftListScreen} />
        <Stack.Screen name={RouterName.SEARCH} component={SearchScreen} />
        <Stack.Screen name={RouterName.HISTORY_ORDERS} component={HistoryOrdersScreen} />
        <Stack.Screen name={RouterName.CASH_OUT} component={CashoutScreen} />
        <Stack.Screen name={RouterName.PROFILE} component={ProfileScreen} />
        <Stack.Screen name={NavigatorName.SETTINGS_STACK} component={Settings} />
        <Stack.Screen name={RouterName.HOLDING_TOKEN} component={HoldingTokenScreen} />
        <Stack.Screen name={RouterName.POST_COMMISSION} component={PostCommissionScreen} />
        <Stack.Screen name={RouterName.INTEREST_SELECTION} component={InterestSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNav;

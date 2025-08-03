import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouterName } from '../constants/navigation';
import { OnboardingStackParamList } from './types';

import InterestSelectionScreen from '../screens/Onboarding/InterestSelectionScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function Onboarding() {
  return (
    <Stack.Navigator
      initialRouteName={RouterName.INTEREST_SELECTION}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name={RouterName.INTEREST_SELECTION}
        component={InterestSelectionScreen}
      />
    </Stack.Navigator>
  );
} 
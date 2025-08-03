import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouterName } from '../constants/navigation';
import { AuthStackParamList } from './types';

import SignInScreen from '../screens/Auth/SignInScreen';
import VerificationScreen from '../screens/Auth/VerificationScreen';
// import InvitationCodeScreen from '../screens/__deprecated__/InvitationCodeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function Auth() {
  return (
    <Stack.Navigator
      initialRouteName={RouterName.SIGN_IN}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name={RouterName.SIGN_IN}
        component={SignInScreen}
      />
      <Stack.Screen
        name={RouterName.VERIFICATION}
        component={VerificationScreen}
      />
      {/* <Stack.Screen
        name={RouterName.INVITATIONCODESCREEN}
        component={InvitationCodeScreen}
      /> */}
    </Stack.Navigator>
  );
}



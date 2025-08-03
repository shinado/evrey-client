import { createNavigationContainerRef, CommonActions, NavigationState } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { RouterName, NavigatorName } from '../constants/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const NavigationService = {
  /**
   * 重置导航状态到指定路由
   */
  reset(routeName: RouterName | NavigatorName, params?: object) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );
    }
  },

  /**
   * 导航到指定路由
   */
  navigate(routeName: RouterName, params?: object) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.navigate(routeName, params)
      );
    }
  },

  /**
   * 获取当前路由状态
   */
  getCurrentRoute() {
    return navigationRef.getCurrentRoute();
  },

  /**
   * 获取当前导航状态
   */
  getState(): NavigationState | undefined {
    return navigationRef.getState();
  }
}; 
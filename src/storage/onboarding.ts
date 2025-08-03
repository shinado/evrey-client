import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEYS = {
  INTERESTS_COMPLETED: 'onboarding_interests_completed',
  USER_ID: 'onboarding_user_id',
} as const;

export const onboardingStorage = {
  /**
   * 检查用户是否已完成兴趣选择
   */
  async isInterestsCompleted(userId: string): Promise<boolean> {
    try {
      const storedUserId = await AsyncStorage.getItem(ONBOARDING_KEYS.USER_ID);
      const isCompleted = await AsyncStorage.getItem(ONBOARDING_KEYS.INTERESTS_COMPLETED);
      
      // 如果用户ID不匹配，说明是新用户或切换了账号
      if (storedUserId !== userId) {
        return false;
      }
      
      return isCompleted === 'true';
    } catch (error) {
      console.error('Failed to check interests completion status:', error);
      return false;
    }
  },

  /**
   * 标记用户已完成兴趣选择
   */
  async markInterestsCompleted(userId: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_KEYS.USER_ID, userId),
        AsyncStorage.setItem(ONBOARDING_KEYS.INTERESTS_COMPLETED, 'true'),
      ]);
    } catch (error) {
      console.error('Failed to mark interests as completed:', error);
    }
  },

  /**
   * 重置兴趣选择状态（用于测试或用户重新选择）
   */
  async resetInterestsStatus(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ONBOARDING_KEYS.USER_ID,
        ONBOARDING_KEYS.INTERESTS_COMPLETED,
      ]);
    } catch (error) {
      console.error('Failed to reset interests status:', error);
    }
  },

  /**
   * 清除所有onboarding相关数据
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(ONBOARDING_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  },
}; 
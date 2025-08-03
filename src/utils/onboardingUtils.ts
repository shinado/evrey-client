import { onboardingStorage } from '../storage/onboarding';

export const onboardingUtils = {
  /**
   * 检查用户是否需要显示兴趣选择页面
   */
  async shouldShowInterests(userId: string): Promise<boolean> {
    try {
      const isCompleted = await onboardingStorage.isInterestsCompleted(userId);
      return !isCompleted;
    } catch (error) {
      console.error('Failed to check if should show interests:', error);
      return true; // 出错时默认显示
    }
  },

  /**
   * 重置用户的兴趣选择状态（用于测试）
   */
  async resetInterestsStatus(): Promise<void> {
    try {
      await onboardingStorage.resetInterestsStatus();
      console.log('Interests status reset successfully');
    } catch (error) {
      console.error('Failed to reset interests status:', error);
    }
  },

  /**
   * 清除所有onboarding数据（用于测试或用户重新开始）
   */
  async clearAllOnboardingData(): Promise<void> {
    try {
      await onboardingStorage.clearAll();
      console.log('All onboarding data cleared successfully');
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  },
}; 
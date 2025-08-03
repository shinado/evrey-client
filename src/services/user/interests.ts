import { primaryApi } from '../http/apiClient';

export interface Interest {
  id: string;
  name: string;
  emoji: string;
}

export const interests: Interest[] = [
  { id: 'ai', name: 'AI', emoji: '🤖' },
  { id: 'animals', name: 'Animals', emoji: '🐱' },
  { id: 'fun', name: 'Fun', emoji: '😄' },
  { id: 'politics', name: 'Politics', emoji: '🏛️' },
  { id: 'nasdaq', name: 'Nasdaq', emoji: '📈' },
  { id: 'animates', name: 'Animates', emoji: '🎬' },
  { id: 'celebrities', name: 'Celebrities', emoji: '⭐' },
  { id: 'games', name: 'Games', emoji: '🎮' },
  { id: 'pop-culture', name: 'Pop Culture', emoji: '🎵' },
  { id: 'elon-musk', name: 'Elon Musk', emoji: '🚀' },
  { id: 'tech', name: 'Tech', emoji: '💻' },
];

export const interestsService = {
  /**
   * 保存用户选择的兴趣
   */
  async saveUserInterests(interestIds: string[]): Promise<void> {
    try {
      await primaryApi.put('/user/user/interests', {
        interests: interestIds,
      });
    } catch (error) {
      console.error('Failed to save user interests:', error);
      throw error;
    }
  },

  /**
   * 获取用户已选择的兴趣
   */
  async getUserInterests(): Promise<string[]> {
    try {
      const response = await primaryApi.get('/user/user/interests');
      return response?.data?.data?.interests || [];
    } catch (error) {
      console.error('Failed to get user interests:', error);
      return [];
    }
  },

  /**
   * 获取所有可用的兴趣列表
   */
  getAllInterests(): Interest[] {
    return interests;
  },

  /**
   * 根据ID获取兴趣信息
   */
  getInterestById(id: string): Interest | undefined {
    return interests.find(interest => interest.id === id);
  },
};

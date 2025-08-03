import { reportImpressions } from "./engagement/impressions";

class ReportService {
  private static instance: ReportService;
  private impressionQueue: number[] = [];
  private reportedPosts = new Set<string>();

  static getInstance() {
    if (!this.instance) {
      this.instance = new ReportService();
    }
    return this.instance;
  }

  /**
   * 批量记录post触达数据
   */
  trackImpressions(postIds: string[]) {
    const newPostIds = postIds.reduce((acc, postId) => {
      if (!this.reportedPosts.has(postId)) {
        acc.push(Number(postId));
        this.reportedPosts.add(postId);
        console.log(`📊 Tracking impression: ${postId}`);
      }
      return acc;
    }, [] as number[]);
    
    // 将新的postId添加到队列中
    this.impressionQueue.push(...newPostIds);
  }

  /**
   * 立即上报所有待上报的数据
   */
  async flushAll() {
    if (this.impressionQueue.length === 0) return;
    
    const postIds = this.impressionQueue;
    this.impressionQueue = [];
    
    try {
      await reportImpressions({ postIds });
      console.log(`📊 Immediately reported ${postIds.length} impressions`);
    } catch (error) {
      console.error('Failed to report impressions:', error);
      // 失败时重新加入队列
      this.impressionQueue.unshift(...postIds);
    }
  }

  /**
   * 清理已上报记录（可选，用于测试或重置）
   */
  clearReportedPosts() {
    this.reportedPosts.clear();
  }
}

export const reportService = ReportService.getInstance();
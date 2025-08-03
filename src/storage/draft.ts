import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./config";
import { Post } from "../types/content";
import { UiToken } from "../types/token";
import i18n from "src/i18n";

// 草稿类型，扩展 Post 类型以包含草稿特有的字段
export interface DraftPost extends Post {
  images?: Array<{
    uri: string;
    _uniqueId: string;
    thumbnailUri?: string;
    type?: string;
  }>;
  selectedToken?: UiToken;
}

export const DraftStorage = {
  // 获取所有草稿
  async getAllDrafts(): Promise<DraftPost[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.POST_DRAFTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get drafts:", error);
      return [];
    }
  },

  // 保存草稿
  async saveDraft(draft: DraftPost): Promise<string> {
    try {
      const drafts = await this.getAllDrafts();
      drafts.unshift(draft); // 新草稿放在最前面
      
      if (drafts.length > 10) {
        drafts.pop();
        throw new Error(i18n.t('createPost.errors.draftLimitReached'));
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.POST_DRAFTS, JSON.stringify(drafts));
      return draft.id;
    } catch (error) {
      console.error("Failed to save draft:", error);
      throw error;
    }
  },

  // 更新草稿
  async updateDraft(id: string, updates: Partial<DraftPost>): Promise<void> {
    try {
      const drafts = await this.getAllDrafts();
      const index = drafts.findIndex(draft => draft.id === id);
      
      if (index !== -1) {
        drafts[index] = {
          ...drafts[index],
          ...updates,
        };
        
        await AsyncStorage.setItem(STORAGE_KEYS.POST_DRAFTS, JSON.stringify(drafts));
      }
    } catch (error) {
      console.error("Failed to update draft:", error);
      throw error;
    }
  },

  // 删除草稿
  async deleteDraft(id: string): Promise<void> {
    try {
      const drafts = await this.getAllDrafts();
      const filteredDrafts = drafts.filter(draft => draft.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.POST_DRAFTS, JSON.stringify(filteredDrafts));
    } catch (error) {
      console.error("Failed to delete draft:", error);
      throw error;
    }
  },

  // 获取单个草稿
  async getDraft(id: string): Promise<DraftPost | null> {
    try {
      const drafts = await this.getAllDrafts();
      return drafts.find(draft => draft.id === id) || null;
    } catch (error) {
      console.error("Failed to get draft:", error);
      return null;
    }
  },

  // 清空所有草稿
  async clearAllDrafts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.POST_DRAFTS);
    } catch (error) {
      console.error("Failed to clear drafts:", error);
      throw error;
    }
  },

  // 将 DraftPost 转换为 Post 格式
  convertDraftToPost(draft: DraftPost): Post {
    return {
      id: draft.id,
      title: draft.title,
      content: draft.content,
      head_img: draft.head_img,
      media: draft.media,
      mint_address: draft.mint_address,
      mint_chain: draft.mint_chain,
      type: draft.type,
      author: draft.author,
      coin: draft.coin,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
    };
  },
}; 
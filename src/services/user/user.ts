import { primaryApi } from "../http/apiClient";
import { extractSuccess, extractData } from "../http/responseHandler";
import { UserInfoData } from "../../types";
import { useUserInfo } from "../../hooks/useUserInfo";

export interface UserSearchResult {
  has_more:boolean,
  list: UserInfoData[],
}

export const userService = {
  /**
   * 绑定邀请码
   * @param code 邀请码
   */
  bindReferrer: async (code: string) => {
    const response = await primaryApi.put('/user/user/bind/referrer', { code });
    return extractSuccess(response);
  },

  /**
   * 用户名重命名
   * @param username 新用户名
   */
  renameUsername: async (username: string) => {
    const response = await primaryApi.put('/user/user/username', { username });
    return extractSuccess(response);
  },

  /**
   * 检查用户名是否存在
   * @param username 用户名
   * @returns 是否存在
   */

  checkUsernameExist: async (username: string) => {
    const response = await primaryApi.get("/user/user/username/exist", {
      params: { username },
    });
    return extractData<boolean>(response);
  },


  /**
   * 更新用户信息
   * @param nickname 昵称
   * @param avatar 头像
   * @param bio 个人简介
   */
  updateUserInfo: async (nickname?: string, avatar?: string, bio?: string) => {
    const response = await primaryApi.put('/user/user/profile', { nickname, avatar, bio });
    return extractSuccess(response);
  },

  /**
   * 替换邮箱
   * @param email 邮箱
   */
  replaceEmail: async (email: string) => {
    const response = await primaryApi.put('/user/user/bind/email/replace', { email });
    return extractSuccess(response);
  },

  // /**
  //  * 通过ID获取用户信息
  //  * @param id 用户ID
  //  * @returns Promise<UserSearchResult | null>
  //  */
  // searchUsers: async (id: string | number) => {
  //   try {
  //     if (!id) return null;
  //     const currentUser = await UserStorage.getUserInfo();
  //     const response = await primaryApi.get(`/user/user/simple-info/${id}`);
  //     const data = extractData<UserSearchResult>(response) || {};
  //     if (!data || data.id === currentUser?.id) {
  //       return null;
  //     }
  //     return data;
  //   } catch (error) {
  //     console.error('Search user by ID error:', error);
  //     return null;
  //   }
  // },

  searchUsers: async (q:string, page:number, limit:number) => {
    const response = await primaryApi.get(`/user/user/search`, {
      params: {
        q,
        page,
        limit,
      },
    });
    console.log("search Users!!!",response.data.data)
    return extractData<UserSearchResult>(response);
  },

  searchUsersByUsername: async (q: string, page: number, limit: number) => {
    console.log(`🚀🚀🚀 searchUsersByUsername params:`, { q, page, limit });
    const response = await primaryApi.get(`/user/user/search-rich`, {
      params: {
        q,
        page,
        limit,
      },
    });
    console.log(`🚀🚀🚀 searchUsersByUsername response:`, response?.data?.data);
    return extractData<UserSearchResult>(response);
  },

  fetchUserInfoByUserId: async (userId: string) => {
    console.log(`🚀🚀🚀 fetchUserInfoByUserId params:`, userId);
    const response = await primaryApi.get(`/user/user/${userId}`);
    console.log(`🚀🚀🚀 fetchUserInfoByUserId response:`, response?.data?.data);
    return extractData<UserInfoData>(response);
  },

  /**
   * 账户注销获取验证码
   */
  getAccountCancellationCode: async () => {
    const response = await primaryApi.get('/user/user/delete/request');
    return extractData<{captchaId: string}>(response);
  },

  /**
   * 账户注销
   * @param captchaId 验证码ID
   * @param captcha 验证码
   */
  accountCancellation: async (captchaId: string, captcha: string) => {
    console.log("🔑 Account cancellation params:", captchaId, captcha);
    const response = await primaryApi.delete('/user/user/delete', { data: { captchaId, captcha } });
    return extractSuccess(response);
  },

  /**
   * 获取关注报告
   * @returns 关注人数，粉丝人数
   */
  fetchFollowReport: async () => {
    const response = await primaryApi.get('/content/follow/report');
    console.log("🚀🚀🚀 fetchFollowReport response:", response);
    return extractData<{
      followings: number;
      followers: number;
    }>(response);
  },

  fetchFollowingsList: async (start: number, limit: number) => {
    const response = await primaryApi.get("/content/follow/followings", {
      params: {
        start,
        limit,
      },
    });
    return extractData<{
      next: number;
      has_more: boolean;
      list: UserInfoData[];
    }>(response);
  },

  fetchFollowersList: async (start: number, limit: number) => {
    console.log("🚀🚀🚀 fetchFollowersList params:", { start, limit });
    const response = await primaryApi.get("/content/follow/followers", {
      params: {
        start,
        limit,
      },
    });
    console.log("🚀🚀🚀 fetchFollowersList response:", response);
    return extractData<{
      next: number;
      has_more: boolean;
      list: UserInfoData[];
    }>(response);
  },
};
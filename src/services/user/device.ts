import { primaryApi } from "../http/apiClient";
import { extractData, extractSuccess } from "../http/responseHandler";

export interface DeviceRegisterData {
  id: string;
  name: string;
  type: number;
  loginAt?: string;
}

export const deviceService = {
  /**
   * 注册设备
   * @param params 设备注册参数
   * @returns 设备注册数据
   */
  registerDevice: async (params: {
    name: string;      // 设备名称
    type: number;      // 系统类型
    udid: string;      // 唯一设备ID
    messagingToken?: string; // 消息推送token
  }) => {
    const response = await primaryApi.post(
      '/user/device',
      params
    );
    console.log("res", response);
    return extractData<DeviceRegisterData>(response);
  },

    /**
   * 更新设备名称
   * @param id 设备ID
   * @param name 新的设备名称
   */
    updateDeviceName: async (id: string, name: string) => {
      const response = await primaryApi.put(`/user/device/${id}`, { name });
      return extractData<DeviceRegisterData>(response);
    },

  /**
   * 更改设备通知开关
   * @param id 设备ID
   * @param params { priceAlert: boolean, referralRewards: boolean }
   */
  updateDeviceNotification: async (
    id: string,
    params: { priceAlert: boolean; referralRewards: boolean }
  ) => {
    const response = await primaryApi.put(`/user/device/${id}/notification`, params);
    return extractSuccess(response);
  },

  /**
   * 更新设备推送消息 token
   * @param id 设备ID
   * @param token 推送消息 token
   */
  updateDeviceMessagingToken: async (id: string, token: string) => {
    const response = await primaryApi.put(`/user/device/${id}/messaging-token`, { token });
    return extractSuccess(response);
  },

  /**
   * 获取设备列表
   * @returns 设备列表
   */
  getDeviceList: async () => {
    const response = await primaryApi.get(`/user/device`);
    return extractData<DeviceRegisterData[]>(response);
  },

  /**
   * 登出指定设备
   * @param id 设备ID
   */
  logoutDevice: async (id: string) => {
    const response = await primaryApi.delete(`/user/device/${id}/logout`);
    return extractSuccess(response);
  }
};

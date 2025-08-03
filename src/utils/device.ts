import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { v4 as uuidv4 } from 'uuid'; // 需要安装 uuid 包

export enum DeviceTypes {
  Android = 1,
  Ios = 2,
  HarmonyOS = 3,
  H5 = 4,
  Web = 5,
}

export function getOSType(): DeviceTypes {
  if (Platform.OS === 'ios') return DeviceTypes.Ios;
  if (Platform.OS === 'android') return DeviceTypes.Android;
  return DeviceTypes.Web;
}

export const getDeviceInfo = async () => {
  try {
    // 获取设备名称
    const deviceName = await DeviceInfo.getDeviceName();
    
    // 获取系统类型 
    const deviceType = getOSType();
    
    // 获取唯一设备ID
    let udid;
    try {
      udid = await DeviceInfo.getUniqueId();
    } catch (error) {
      // 如果获取失败，使用两个 UUID 拼接
      udid = `${uuidv4()}-${uuidv4()}`;
    }

    if(deviceType === DeviceTypes.Web) {
      return {
        name: "web",
        type: DeviceTypes.Android,
        udid: `${uuidv4()}-${uuidv4()}`,
      };
    }
    return {
      name: deviceName,
      type: deviceType,
      udid: udid
    };
  } catch (error) {
    console.error('获取设备信息失败:', error);
    throw error;
  }
};
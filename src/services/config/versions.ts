import { aiboxApi } from "../http/apiClient";
import { extractData } from "../http/responseHandler";
import DeviceInfo from 'react-native-device-info';
import { DeviceTypes, getOSType } from '../../utils';
import { VersionData } from '../../types';


export const versionService = () => {
  const compareVersions = (v1: string, v2: string) => {
    console.log("v1 😭 ", v1);
    console.log("v2 😭 ", v2);
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  const checkUpdate = async () => {
    try {
      let currentVersion = DeviceInfo.getVersion() || "1.0.0";
      if(currentVersion === "unknown" || !currentVersion) {
        currentVersion = "1.0.0";
      }
      let os_type = getOSType();
      if(os_type === DeviceTypes.Web) {
        os_type = 1;
      }
      const response = await aiboxApi.get("/common/version/check", {
        params: { os_type }
      });
      const versionData = extractData<VersionData>(response);
      
      // 使用 versionStr 而不是 version
      const isNewerVersion = compareVersions(versionData.versionStr, currentVersion) > 0;
      const needsUpdate = isNewerVersion;
      
      return {
        ...versionData,
        needsUpdate,
      };
    } catch (error) {
      console.error("Failed to check update:", error);
      throw error;
    }
  };

  return { checkUpdate };
};

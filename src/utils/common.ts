// src/utils/linkUtils.ts
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';


const openLink = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
    return true;
  } else {
    // 如果链接无法打开，则复制到剪贴板
    await Clipboard.setStringAsync(url); // 使用 setStringAsync
    return false;
  }
};

/**
 * 从文件URI中获取文件扩展名
 * @param uri 文件URI
 * @returns 文件扩展名
 * 
 * 注意：此函数仅用于获取文件扩展名，不进行格式转换
 * 如果需要转换文件格式，请使用相应的转换函数
 */
export const getFileExtension = (uri: string): string => {
  const filename = uri.split('/').pop() || '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

export { openLink };
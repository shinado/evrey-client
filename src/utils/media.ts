import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { Video, Image } from 'react-native-compressor';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxSize?: number; // 最大文件大小（KB）
}

export interface VideoCompressionOptions {
  maxDuration?: number; // 最大时长（秒）
  maxSize?: number; // 最大文件大小（MB）
  onProgress?: (progress: number) => void; // 压缩进度回调
}

/**
 * 计算图片压缩参数
 */
const calculateImageCompression = (
  originalSizeKB: number,
  options: ImageCompressionOptions
) => {
  const {
    maxWidth = 1080,
    maxSize = 1024 // 默认最大1MB
  } = options;

  // 计算目标大小（压缩到原大小的一半，但不超过最大限制）
  const targetSizeKB = Math.min(originalSizeKB * 0.5, maxSize);
  const compressionRatio = targetSizeKB / originalSizeKB;

  // 根据压缩比例自动调整质量
  let quality = 0.8; // 默认质量
  if (compressionRatio < 0.3) {
    quality = 0.5;
  } else if (compressionRatio < 0.6) {
    quality = 0.7;
  }

  return {
    shouldCompress: true, // 始终压缩
    settings: {
      maxWidth,
      quality,
      outputType: 'jpeg' as const,
    }
  };
};

/**
 * 计算视频压缩参数
 */
const calculateVideoCompression = (
  originalSizeMB: number,
  options: VideoCompressionOptions
) => {
  const {
    maxSize = 50 // 默认最大50MB
  } = options;

  // 计算目标大小（压缩到原大小的一半，但不超过最大限制）
  const targetSizeMB = Math.min(originalSizeMB * 0.5, maxSize);
  const compressionRatio = targetSizeMB / originalSizeMB;

  // 根据压缩比例自动选择质量级别
  let qualityLevel: 'low' | 'medium' | 'high' = 'medium'; // 默认质量
  if (compressionRatio < 0.3) {
    qualityLevel = 'low';
  } else if (compressionRatio < 0.6) {
    qualityLevel = 'medium';
  } else {
    qualityLevel = 'high';
  }

  // 基础压缩参数
  const baseSettings = {
    low: {
      minimumBitrate: 1000000, // 1Mbps
      maxWidth: 640,
      maxHeight: 360,
    },
    medium: {
      minimumBitrate: 2000000, // 2Mbps
      maxWidth: 1280,
      maxHeight: 720,
    },
    high: {
      minimumBitrate: 4000000, // 4Mbps
      maxWidth: 1920,
      maxHeight: 1080,
    },
  }[qualityLevel];

  // 根据压缩比例调整比特率
  const adjustedBitrate = Math.floor(baseSettings.minimumBitrate * compressionRatio);

  return {
    shouldCompress: true, // 始终压缩
    settings: {
      ...baseSettings,
      minimumBitrate: adjustedBitrate,
      compressionMethod: 'auto' as const,
      includeAudio: true,
    }
  };
};

/**
 * 压缩图片
 */
export const compressImage = async (
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<string> => {
  try {
    // 获取图片信息
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const originalSizeKB = fileInfo.exists && 'size' in fileInfo ? fileInfo.size / 1024 : 0;

    // 计算压缩参数
    const { shouldCompress, settings } = calculateImageCompression(originalSizeKB, options);

    if (!shouldCompress) {
      return uri;
    }

    // 压缩图片
    const compressedUri = await Image.compress(uri, settings);
    return compressedUri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri;
  }
};

/**
 * 压缩视频
 */
export const compressVideo = async (
  uri: string,
  options: VideoCompressionOptions = {}
): Promise<{ uri: string; thumbnailUri: string }> => {
  try {
    // 生成缩略图
    const thumbnailUri = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 0,
      quality: 0.1,
    }).then(result => result.uri);

    // 获取视频信息
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const originalSizeMB = fileInfo.exists && 'size' in fileInfo ? fileInfo.size / (1024 * 1024) : 0;

    // 计算压缩参数
    const { shouldCompress, settings } = calculateVideoCompression(originalSizeMB, options);

    if (!shouldCompress) {
      return {
        uri,
        thumbnailUri,
      };
    }

    // 压缩视频
    const compressedUri = await Video.compress(
      uri,
      settings,
      (progress: number) => {
        // 调用进度回调
        if (options.onProgress) {
          options.onProgress(progress);
        }
      }
    );

    return {
      uri: compressedUri,
      thumbnailUri,
    };
  } catch (error) {
    console.error('Error compressing video:', error);
    return {
      uri,
      thumbnailUri: uri,
    };
  }
}; 
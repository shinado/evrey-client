import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions,StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { FontFamily } from '../../constants/typo';
import i18n from '../../i18n';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { useNavigation, useIsFocused } from '@react-navigation/native';

interface MediaPlayerProps {
  url: string;
  previewImageUrl?: string;
}

const { width } = Dimensions.get('window');
const videoSize = width * 0.9;

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  url,
  previewImageUrl,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playableUri, setPlayableUri] = useState<string | null>(null);
  const [localCacheUri, setLocalCacheUri] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();

  // 清理本地缓存文件
  const cleanupLocalCache = useCallback(async (uri: string) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
        console.log('Cleaned up local cache:', uri);
      }
    } catch (error) {
      console.log('Error cleaning up local cache:', error);
    }
  }, []);

  // 处理本地 file 路径，拷贝到 cacheDirectory
  useEffect(() => {
    let isMounted = true;
    const prepareLocalVideo = async () => {
      if (url && url.startsWith('file://')) {
        try {
          const fileName = url.split('/').pop() || `preview.mp4`;
          const newUri = FileSystem.cacheDirectory + fileName;
          // 只在目标文件不存在时拷贝，避免重复
          const info = await FileSystem.getInfoAsync(newUri);
          if (!info.exists) {
            await FileSystem.copyAsync({ from: url, to: newUri });
          }
          if (isMounted) {
            setPlayableUri(newUri);
            setLocalCacheUri(newUri);
          }
        } catch (e) {
          if (isMounted) setPlayableUri(url); // fallback
        }
      } else {
        setPlayableUri(url);
      }
    };
    prepareLocalVideo();
    return () => { 
      isMounted = false;
      stopVideo();
      // 清理本地缓存
      if (localCacheUri) {
        cleanupLocalCache(localCacheUri);
      }
    };
  }, [url, cleanupLocalCache]);

  // 监听页面焦点变化
  useEffect(() => {
    if (!isFocused) {
      stopVideo();
    }
  }, [isFocused]);

  // 停止视频播放
  const stopVideo = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.setPositionAsync(0);
      } catch (error) {
        console.log('Error stopping video:', error);
      }
    }
  }, []);

  
  
  // 处理视频播放错误
  const handlePlayError = useCallback((error: any) => {
    console.log(`视频播放错误:`, error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{ alignSelf: 'center' }}
    >
      <View style={[styles.playerContainer, { width: videoSize, height: videoSize }]}> 
        <Video
          ref={videoRef}
          source={{ uri: playableUri as string }}
          style={{ width: videoSize, height: videoSize }}
          useNativeControls={true}
          isLooping
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isFocused}
          posterSource={previewImageUrl ? { uri: previewImageUrl } : undefined}
          posterStyle={{ width: '100%', height: '100%' }}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={handlePlayError}
        />
        {(isLoading || hasError) && (
          <View style={styles.overlay}>
            <Image 
              source={{ uri: previewImageUrl || url }}
              style={{ width: videoSize, height: videoSize}}
              contentFit="contain"
            />
            <View style={styles.overlay}>
              <Text style={styles.loadingText}>
                {hasError 
                  ? i18n.t('common.videoLoadFailed') 
                  : i18n.t('common.loading')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    position: 'relative',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
    marginVertical: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: 'white',
    fontFamily: FontFamily.medium,
    fontSize: 14,
    marginTop: 8,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
});

export default MediaPlayer;
import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import { Image } from 'expo-image';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';

// Toast 类型
export type ToastType = 'default' | 'simple' | 'uploading';
export type ToastStatus = 'success' | 'processing' | 'failed';

export type ToastMessage = {
  title?: string;
  message?: string;
  prefix?: string;
  suffix?: string;
  link?: { text: string; url: string };
  avatar?: string;
  progress?: number;
  yPosition?: number | `${number}%`;
  [key: string]: any;
};

export type ToastState = {
  visible: boolean;
  type: ToastType;
  status: ToastStatus;
  message: ToastMessage;
  duration: number;
};

const DEFAULT_DURATION = 4000;

// Default Toast
const DefaultToast: React.FC<ToastState & { onClose: () => void }> = ({ status, message, onClose, duration }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // 控制关闭动画
  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    if (status !== 'processing') {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const getStatusIcon = (status: ToastStatus) => {
    switch (status) {
      case 'success': return require('../../assets/Toast/success.png');
      case 'processing': return require('../../assets/Toast/processing.png');
      case 'failed': return require('../../assets/Toast/failed.png');
      default: return require('../../assets/Toast/success.png');
    }
  };
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <LinearGradient colors={['#F7F8FA', '#FFFFFF']} style={styles.content}>
        <Image source={getStatusIcon(status)} style={styles.icon} contentFit="contain" />
        <Text style={styles.message}>{message.message}</Text>
        <View style={styles.messageBox}>
          {message.title && <Text style={styles.message}>{message.title}</Text>}
          <Text style={[message.title ? styles.messageDesc : styles.message]}>
            {message.prefix ?? ''}
            {message.link && (
              <Text style={styles.link} onPress={() => Linking.openURL(message.link!.url)}>{message.link.text}</Text>
            )}
            {message.suffix ?? ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={Theme.text[300]} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// Simple Toast
const SimpleToast: React.FC<ToastState & { onClose: () => void } & Omit<ToastState, 'status'>> = ({ message, onClose, duration = 2000 }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Animated.View style={[styles.simpleContainer, { opacity: fadeAnim, top: message.yPosition ?? '5%' }]}> 
      <Text style={styles.simpleText}>{message.message}</Text>
    </Animated.View>
  );
};

// Uploading Toast
const UploadingToast: React.FC<ToastState & { onClose: () => void }> = ({ message, onClose }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <View style={styles.uploadingContent}> 
        <View style={styles.uploadingAvatarBox}>
          {message.avatar && (
            <Image
              source={{ uri: message.avatar }}
              style={styles.uploadingAvatar}
              contentFit="cover"
            />
          )}
          <Text style={styles.uploadingPercent}>
            {Math.round(message.progress ?? 0)}%
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadingMessage}>{message.message}</Text>          
        </View>
        <TouchableOpacity onPress={onClose} style={{ marginLeft: 8 }}>
          <Ionicons name="close" size={18} color="#bbb" />
        </TouchableOpacity>
      </View>
      <View style={[styles.uploadingProgressBar, { width: `${(message.progress ?? 0) - 1}%` }]} />
    </Animated.View>
  );
};

// Context
interface ToastContextType {
  showToast: (
    status: ToastStatus,
    message: ToastMessage,
    duration?: number,
    type?: ToastType
  ) => (update: Partial<ToastMessage>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (
    status: ToastStatus,
    message: ToastMessage,
    duration = DEFAULT_DURATION,
    type: ToastType = 'default'
  ) => {
    setToast({
      visible: true,
      type,
      status,
      message,
      duration,
    });
    // 返回 update 函数
    return (update: Partial<ToastMessage>) => {
      setToast(prev => prev ? { ...prev, message: { ...prev.message, ...update } } : prev);
    };
  };

  const hideToast = () => setToast(null);

  let toastNode = null;
  if (toast?.visible) {
    if (toast.type === 'default') {
      toastNode = <DefaultToast {...toast} onClose={hideToast} />;
    } else if (toast.type === 'simple') {
      toastNode = <SimpleToast {...toast} onClose={hideToast} />;
    } else if (toast.type === 'uploading') {
      toastNode = <UploadingToast {...toast} onClose={hideToast} />;
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toastNode}
    </ToastContext.Provider>
  );
};

// 自定义 Hook 用于在组件中使用 Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 样式
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 10,           // 增加 zIndex
    elevation:  10,        // 增加 elevation（用于 Android）
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
    flexShrink: 0,
  },
  messageBox: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
    flexWrap: 'wrap',
  },
  messageDesc: {
    color: Theme.text[100],
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
    flexShrink: 0,
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  link: {
    color: '#3ABC6A',
    fontWeight: 'bold',
  },
  simpleContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    zIndex: 10,          // 增加 zIndex
    elevation: 10,       // 增加 elevation（用于 Android）
  },
  simpleText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  uploadingAvatarBox: {
    position: 'relative',
    marginRight: 12,
  },
  uploadingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  uploadingPercent: {
    position: 'absolute',
    height: 48,
    width: 48,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  uploadingMessage: {
    fontSize: 14,
    color: Theme.textColors[300],
    fontFamily: FontFamily.medium,
  },
  uploadingProgressBar: {
    position: 'absolute',
    left: 2,
    bottom: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    height: 4,
    backgroundColor: Theme.primary,
  },
});

// 默认导出 ToastProvider
export default ToastProvider;

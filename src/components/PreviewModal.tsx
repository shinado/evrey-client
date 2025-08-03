import React from 'react';
import { Modal, View, FlatList, Dimensions, TouchableOpacity, Text, StyleSheet, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface PreviewModalProps {
  visible: boolean;
  images: { uri: string, type?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ visible, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [playableUri, setPlayableUri] = React.useState<string | null>(null);
  const lastPlayableUri = React.useRef<string | null>(null);

  const isVideo = images.length === 1 && images[0].type === 'video';

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  React.useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('rgba(0,0,0,0.9)');
    } else {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('white');
    }
  }, [visible]);

  React.useEffect(() => {
    if (isVideo) {
      let isMounted = true;
      const prepareLocalVideo = async () => {
        let uri = images[0].uri;
        if (uri && uri.startsWith('file://')) {
          try {
            const fileName = uri.split('/').pop() || `preview.mp4`;
            const newUri = FileSystem.cacheDirectory + fileName;
            const info = await FileSystem.getInfoAsync(newUri);
            if (!info.exists) {
              await FileSystem.copyAsync({ from: uri, to: newUri });
            }
            if (isMounted) setPlayableUri(newUri);
          } catch (e) {
            if (isMounted) setPlayableUri(uri);
          }
        } else {
          setPlayableUri(uri);
        }
      };
      prepareLocalVideo();
      return () => { isMounted = false; };
    }
  }, [images, isVideo]);

  React.useEffect(() => {
    lastPlayableUri.current = playableUri;
  }, [playableUri]);

  const handleClose = async () => {
    if (
      lastPlayableUri.current?.startsWith(FileSystem.cacheDirectory as string)
    ) {
      try {
        await FileSystem.deleteAsync(lastPlayableUri.current, { idempotent: true });
      } catch (e) {}
    }
    setPlayableUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent onRequestClose={handleClose} animationType="fade">
      <View style={styles.container}>
        <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.topShadow} />
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        {isVideo ? (
          <Video
            source={{ uri: playableUri || images[0].uri }}
            style={styles.image}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
          />
        ) : (
          <FlatList
            horizontal
            pagingEnabled
            data={images}
            initialScrollIndex={currentIndex}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.uri }} style={styles.image} contentFit="contain" />
              </View>
            )}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentIndex(idx);
            }}
          />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.bottomShadow} />
        {!isVideo && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)' 
  },
  topShadow: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 150, 
    zIndex: 1 
  },
  closeButton: { 
    position: 'absolute', 
    top: 20, 
    right: 20, 
    zIndex: 10, 
    padding: 8 
  },
  imageContainer: { 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  bottomShadow: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 150, 
    zIndex: 1 
  },
  counter: { 
    position: 'absolute', 
    bottom: 40, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    zIndex: 2 },
  counterText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  }
});

export default PreviewModal;
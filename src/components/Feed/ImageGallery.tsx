import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
} from 'react-native';
import { Theme } from '../../constants/Theme';
import { Image } from 'expo-image';
import PreviewModal from '../PreviewModal';
import Swiper from 'react-native-swiper';

interface ImageGalleryProps {
  images: string[];
  onImagePress?: (image: string, index: number) => void;
}

const { width } = Dimensions.get('window');
const imageWidth = width * 0.9;

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImagePress,
}) => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // 处理图片点击
  const handleImagePress = (image: string, index: number) => {
    if (onImagePress) {
      onImagePress(image, index);
    } else {
      setPreviewIndex(index);
      setPreviewModalVisible(true);
    }
  };

  const handlePreviewClose = () => {
    setPreviewModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Swiper
        style={styles.wrapper}
        dot={<View style={styles.paginationDotInactive} />}
        activeDot={<View style={styles.paginationDotActive} />}
        loop={false}
        showsPagination={images.length > 1}
        paginationStyle={styles.pagination}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={() => handleImagePress(image, index)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: image }}
              style={{ width: imageWidth, height: imageWidth }}
              contentFit="contain"
            />
          </TouchableOpacity>
        ))}
      </Swiper>

      <PreviewModal
        visible={previewModalVisible}
        images={images.map(img => ({ uri: img, type: 'image' }))}
        initialIndex={previewIndex}
        onClose={handlePreviewClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  wrapper: {
    height: imageWidth,
  },
  imageContainer: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    backgroundColor: "#000",
  },
  pagination: {
    bottom: 10,
  },
  paginationDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.primary,
    marginHorizontal: 2,
  },
  paginationDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.text[100],
    marginHorizontal: 2,
  },
});

export default ImageGallery;
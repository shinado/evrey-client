import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, TextInput, KeyboardAvoidingView, ScrollView, Dimensions, ActivityIndicator} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Theme } from '../../constants/Theme';
import DraggableFlatList, { RenderItemParams, DragEndParams } from 'react-native-draggable-flatlist';
import CoinListItem from '../../components/CoinListItem';
import { Post, UserInfoData, UiToken } from '../../types';
import { useUserInfo } from '../../hooks/useUserInfo';
import PreviewModal from '../../components/PreviewModal';
import { PostType } from '../../types';
import { eventBus, UploadTask } from '../../services';
import { RouterName, NavigatorName } from '../../constants/navigation';
import { NavigationService } from '../../navigation/service';
import { useToast } from '../../contexts/ToastContext';
import i18n from '../../i18n';
import { getFileExtension } from '../../utils/common';
import { DraftStorage, DraftPost } from '../../storage/draft';
import { CreatePostRouteParams } from '../../types/navigation';

export type AssetWithId = ImagePicker.ImagePickerAsset & { 
  _uniqueId: string;
  thumbnailUri?: string;
};

const MAX_IMAGES = 9;

// 支持的图片格式
const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
// 支持的视频格式
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'm4v'];

const CreatePostScreen = () => {
  const [images, setImages] = useState<AssetWithId[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string | undefined>(undefined);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [selectedToken, setSelectedToken] = useState<UiToken | undefined>((route.params as CreatePostRouteParams)?.token);
  const isDraft = (route.params as CreatePostRouteParams)?.isDraft;
  const draftId = (route.params as CreatePostRouteParams)?.draftId;
  const draftData = (route.params as CreatePostRouteParams)?.draftData;
  const { userInfo } = useUserInfo();
  const [previewModalMedia, setPreviewModalMedia] = useState<{ uri: string, type?: string }[]>([]);
  const { showToast } = useToast();
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // 加载草稿数据
  useEffect(() => {
    if (draftData) {
      setTitle(draftData.title);
      setContent(draftData.content);
      setImages(draftData.images as AssetWithId[] || []);
      if (draftData.selectedToken) {
        setSelectedToken(draftData.selectedToken);
      }
    }
  }, [draftData]);

  // 生成唯一id
  const addUniqueIdToAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    return assets.map(asset => ({
      ...asset,
      _uniqueId: `f_${Math.random().toString(36).slice(2, 10)}`
    }));
  };

  // 选择照片
  const pickImages = async () => {
    setShowModal(false);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: MAX_IMAGES - images.length,
      });

      if (!result.canceled) {
        // 检查每张图片的大小和格式
        const validImages = result.assets.filter(img => {
          // 检查文件大小（10MB限制）
          if (img.fileSize && img.fileSize > 10 * 1024 * 1024) {
            showToast('failed', { message: i18n.t('createPost.errors.imageSize') }, 3000, 'simple');
            return false;
          }

          // 检查图片格式
          const extension = getFileExtension(img.uri);
          if (!SUPPORTED_IMAGE_FORMATS.includes(extension)) {
            showToast('failed', { 
              message: i18n.t('createPost.errors.imageFormat', { 
                formats: SUPPORTED_IMAGE_FORMATS.join(', ') 
              }) 
            }, 3000, 'simple');
            return false;
          }

          return true;
        });

        if (validImages.length > 0) {
          const newAssets = addUniqueIdToAssets(validImages);
          setImages([...images, ...newAssets].slice(0, MAX_IMAGES));
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      showToast('failed', { message: i18n.t('createPost.errors.createFailed') }, 3000, 'simple');
    }
  };

  // 选择视频
  const pickVideos = async () => {
    setShowModal(false);
    setIsProcessingVideo(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 1,
        selectionLimit: 1,
        videoMaxDuration: 15 * 60,
      });
      if (!result.canceled) {
        const video = result.assets[0];
        
        // 检查视频大小（100MB限制）
        if (video.fileSize && video.fileSize > 100 * 1024 * 1024) {
          showToast('failed', { message: i18n.t('createPost.errors.videoSize') }, 3000, 'simple');
          return;
        }

        // 检查视频时长（15分钟限制）
        if (video.duration && video.duration > 15 * 60*1000) {
          showToast('failed', { message: i18n.t('createPost.errors.videoDuration') }, 3000, 'simple');
          return;
        }

        // 检查视频格式
        const extension = getFileExtension(video.uri);
        if (!SUPPORTED_VIDEO_FORMATS.includes(extension)) {
          showToast('failed', { 
            message: i18n.t('createPost.errors.videoFormat', { 
              formats: SUPPORTED_VIDEO_FORMATS.join(', ') 
            }) 
          }, 3000, 'simple');
          return;
        }

        const newAsset = {
          ...video,
          _uniqueId: `f_${Math.random().toString(36).slice(2, 10)}`,
        };
        setImages([...images, newAsset].slice(0, 2));
      }
    } catch (error) {
      console.error('Error picking video:', error);
      showToast('failed', { message: i18n.t('createPost.errors.createFailed') }, 3000, 'simple');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    setShowModal(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('failed', { message: i18n.t('createPost.errors.cameraPermission') }, 3000, 'simple');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // 检查图片格式
        const extension = getFileExtension(asset.uri);
        if (!SUPPORTED_IMAGE_FORMATS.includes(extension)) {
          showToast('failed', { 
            message: i18n.t('createPost.errors.imageFormat', { 
              formats: SUPPORTED_IMAGE_FORMATS.join(', ') 
            }) 
          }, 3000, 'simple');
          return;
        }

        const newAsset: AssetWithId = {
          ...asset,
          _uniqueId: `f_${Math.random().toString(36).slice(2, 10)}`,
        };
        setImages([...images, newAsset].slice(0, MAX_IMAGES));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showToast('failed', { message: i18n.t('createPost.errors.createFailed') }, 3000, 'simple');
    }
  };

  // 录制视频
  const handleRecordVideo = async () => {
    setShowModal(false);
    setIsProcessingVideo(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('failed', { message: i18n.t('createPost.errors.cameraPermission') }, 3000, 'simple');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 15 * 60,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        allowsMultipleSelection: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // 检查视频大小（100MB限制）
        if (asset.fileSize && asset.fileSize > 100 * 1024 * 1024) {
          showToast('failed', { message: i18n.t('createPost.errors.videoSize') }, 3000, 'simple');
          return;
        }

        // 检查视频格式
        const extension = getFileExtension(asset.uri);
        if (!SUPPORTED_VIDEO_FORMATS.includes(extension)) {
          showToast('failed', { 
            message: i18n.t('createPost.errors.videoFormat', { 
              formats: SUPPORTED_VIDEO_FORMATS.join(', ') 
            }) 
          }, 3000, 'simple');
          return;
        }

        const newAsset: AssetWithId = {
          ...asset,
          _uniqueId: `f_${Math.random().toString(36).slice(2, 10)}`,
        };
        setImages([...images, newAsset].slice(0, 2));
      }
    } catch (error) {
      console.error('Error recording video:', error);
      showToast('failed', { message: i18n.t('createPost.errors.createFailed') }, 3000, 'simple');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // 删除图片
  const removeImage = (_uniqueId: string) => {
    setImages(images.filter(img => img._uniqueId !== _uniqueId));
  };

  // 拖拽排序
  const handleDragEnd = ({ data }: DragEndParams<AssetWithId | { _uniqueId: string }>) => {
    setImages(data.filter((item): item is AssetWithId => 'uri' in item));
  };

  // 处理图片/视频点击
  const handleMediaPress = (index: number) => {
    const item = images[index];
    if (item.type && item.type.startsWith('video')) {
      // 视频
      setPreviewIndex(0);
      setPreviewModalVisible(true);
      setPreviewModalMedia([{ uri: item.uri, type: 'video' }]);
    } else {
      // 图片
      const imageList = images.filter(img => !img.type || !img.type.startsWith('video'));
      setPreviewIndex(imageList.findIndex(img => img._uniqueId === item._uniqueId));
      setPreviewModalVisible(true);
      setPreviewModalMedia(imageList.map(img => ({ uri: img.uri, type: 'image' })));
    }
  };

  // 处理模态框关闭
  const handlePreviewClose = () => {
    setPreviewModalVisible(false);
  };

  // 渲染每个图片项
  const renderImageItem = ({ item, drag, isActive }: RenderItemParams<AssetWithId | { _uniqueId: string }>) => {
    if (item._uniqueId === 'add-btn') {
      return (
        <View style={styles.imageWrapper}>
          {isProcessingVideo ? (
            <View style={[styles.addBtn, styles.processingBtn]}>
              <ActivityIndicator size="small" color={Theme.primary} />
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Text style={{ fontSize: 32, color: '#bbb' }}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    // Type guard for AssetWithId
    if ('uri' in item) {
      const idx = images.findIndex(img => img._uniqueId === item._uniqueId);
      const isVideo = item.type?.startsWith('video');
      return (
        <View style={[
          styles.imageWrapper, 
          isActive && { opacity: 0.7 },
          isVideo && styles.videoWrapper
        ]}>
          <TouchableOpacity 
            onLongPress={drag} 
            delayLongPress={150} 
            activeOpacity={0.9}
            onPress={() => handleMediaPress(idx)}
          >
            <Image 
              source={{ uri: item.uri }} 
              style={[styles.image, isVideo && styles.videoImage]} 
            />
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(item._uniqueId)}>
              <Text style={{ color: '#fff', fontSize: 16 }}>×</Text>
            </TouchableOpacity>
            {/* 右下角显示播放图标或序号 */}
            <View style={styles.indexBadge}>
              {isVideo ? (
                <Ionicons name="play" size={12} color="#fff" />
              ) : (
                <Text style={styles.indexBadgeText}>{idx + 1}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const showAdd = images.length < MAX_IMAGES && !images.some(img => img.type && img.type.startsWith('video'));
  const data: ({ _uniqueId: string } | AssetWithId)[] = showAdd ? [...images, { _uniqueId: 'add-btn' }] : images;

  const handleTokenPress = () => {
    if (selectedToken) {
      navigation.navigate(RouterName.TOKEN_INFO, { token: selectedToken });
    }
  };

  const handlePreview = () => {
    if (!title) {
      showToast('failed', { message: i18n.t('createPost.errors.titleEmpty') }, 3000, 'simple');
      return;
    }
    if (images.length === 0) {
      showToast('failed', { message: i18n.t('createPost.errors.mediaEmpty') }, 3000, 'simple');
      return;
    }
    // 创建一个预览用的 Post 对象
    const previewItem: Post = {
      author: userInfo as UserInfoData,
      coin: selectedToken as UiToken,
      created_at: new Date().toISOString(),
      head_img: images[0].uri,
      id: '1',
      media: {
        images: images.filter(img => !img.type?.startsWith('video')).map(img => img.uri),
        videos: images.filter(img => img.type?.startsWith('video')).map(img => img.uri)
      },
      mint_address: selectedToken?.mint || '',
      mint_chain: selectedToken?.chain || 'solana',
      title: title || '',
      content: content || '',
      type: images.some(img => img.type?.startsWith('video')) ? PostType.VIDEO : PostType.IMAGE,
      updated_at: new Date().toISOString(),
    }
    

    // 跳转到预览页面，并传入发布回调
    navigation.navigate(RouterName.FEED_DETAIL, {
      item: previewItem,
      isPreview: true,
      onPublish: handlePublish,
    });
  };

  const handlePublish = async () => {
    if (!title) {
      showToast('failed', { message: i18n.t('createPost.errors.titleEmpty') }, 3000, 'simple');
      return;
    }
    if (images.length === 0) {
      showToast('failed', { message: i18n.t('createPost.errors.mediaEmpty') }, 3000, 'simple');
      return;
    }
    
    try {
      // 检查是否包含视频
      const hasVideo = images.some(img => img.type?.startsWith('video'));

      const task: UploadTask = {
        id: Date.now().toString(),
        files: images,
        type: hasVideo ? PostType.VIDEO : PostType.IMAGE,
        postInfo: {
          title: title || '',
          content: content || '',
          mint_address: selectedToken?.mint || ''
        }
      };

      // 发送上传开始事件
      eventBus.emit('UPLOAD_START', task);
      console.log('The Upload event has been sent ❤️');
      // 回到首页
      NavigationService.reset(NavigatorName.MAIN_TAB);
    } catch (error) {
      console.error('Create Post failed:', error);
      showToast('failed', { message: i18n.t('createPost.errors.createFailed') }, 3000, 'simple');
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (images.length === 0) {
      showToast('failed', { message: i18n.t('createPost.errors.mediaEmpty') }, 3000, 'simple');
      return;
    }

    if (!title) {
      showToast('failed', { message: i18n.t('createPost.errors.titleEmpty') }, 3000, 'simple');
      return;
    }

    try {
      const newDraft: DraftPost = {
        id: draftId || `draft_${Date.now()}`,
        title: title || '',
        content: content || '',
        head_img: images[0].uri,
        media: {
          images: images.filter(img => !img.type?.startsWith('video')).map(img => img.uri),
          videos: images.filter(img => img.type?.startsWith('video')).map(img => img.uri)
        },
        mint_address: selectedToken?.mint || '',
        mint_chain: selectedToken?.chain || 'solana',
        type: images.some(img => img.type?.startsWith('video')) ? PostType.VIDEO : PostType.IMAGE,
        created_at: draftData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: userInfo as UserInfoData,
        coin: selectedToken as UiToken,
        images: images,
        selectedToken: selectedToken,
      };

      if (draftId) {
        // 更新现有草稿
        await DraftStorage.updateDraft(draftId, newDraft);
        showToast('success', { message: i18n.t('createPost.draftUpdated') }, 2000, 'simple');
      } else {
        // 创建新草稿
        await DraftStorage.saveDraft(newDraft);
        showToast('success', { message: i18n.t('createPost.draftSaved') }, 2000, 'simple');
      }
    } catch (error) {
      console.error('Save draft failed:', error);
      showToast('failed', { message: error instanceof Error ? error.message : i18n.t('createPost.errors.draftSaveFailed') }, 3000, 'simple');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flex: 1, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
        </View>
        <DraggableFlatList<AssetWithId | { _uniqueId: string }>
          data={data}
          renderItem={renderImageItem}
          keyExtractor={item => item._uniqueId}
          horizontal={true}
          onDragEnd={handleDragEnd}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={true}
        />
        {images.length === 0 && <Text style={styles.imageTip}>{i18n.t('createPost.imageTip')}</Text>}
       

        {/* 标题输入框 */}
        <View style={{ position: 'relative', marginBottom: 2 }}>
          <TextInput
            style={styles.inputTitle}
            placeholder={i18n.t('createPost.titlePlaceholder')}
            maxLength={25}
            value={title}
            onChangeText={setTitle}
          />
          {title && title.length > 0 && (
            <TouchableOpacity
              style={styles.clearTitleBtn}
              onPress={() => setTitle('')}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={20} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>

        {/* 内容输入框 */}
        <TextInput
          style={styles.inputContent}
          placeholder={i18n.t('createPost.contentPlaceholder')}
          multiline
          value={content}
          onChangeText={setContent}
          textAlignVertical='top'
        />
        {/* 这里用 CoinListItem 组件，传入选中的代币数据 */}
        {selectedToken && (
          <CoinListItem
            style={styles.coinListItem}
            token={selectedToken}
            onPress={handleTokenPress}
          />
        )}
      </ScrollView>
      {/* 底部吸附按钮 */}
      <KeyboardAvoidingView style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          <View style={styles.leftBtns}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              hitSlop={5} 
              onPress={handleSaveDraft}
              disabled={!title && images.length === 0}
            >
              <Ionicons name="archive-outline" size={20} color={Theme.textColors[200]} style={styles.icon} />
              <Text style={styles.iconBtnText}>{i18n.t('createPost.saveDraft')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} hitSlop={5} onPress={handlePreview} disabled={!title && images.length === 0}>
              <Ionicons name="eye-outline" size={20} color={Theme.textColors[200]} style={styles.icon}/>
              <Text style={styles.iconBtnText}>{i18n.t('createPost.preview')}</Text>
            </TouchableOpacity>
          </View>
          <Button 
            type="primary" 
            style={{ width: '50%', height: 45 }} 
            disabled={!title || images.length === 0}
            onPress={handlePublish}
          >
            {i18n.t('createPost.publish')}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* 模态框 */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalBtn} onPress={pickImages}>
              <Text style={styles.modalBtnText}>{i18n.t('createPost.modal.photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalBtn} 
              onPress={handleTakePhoto}
            >
              <Text style={styles.modalBtnText}>
                {i18n.t('createPost.modal.takePhoto')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalBtn} 
              onPress={pickVideos}
              disabled={images.length > 0}
            >
              <Text style={[styles.modalBtnText, images.length > 0 && { color: '#999' }]}>{i18n.t('createPost.modal.video')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalBtn} 
              onPress={handleRecordVideo}
              disabled={images.length > 0}
            >
              <Text style={[styles.modalBtnText, images.length > 0 && { color: '#999' }]}>
                {i18n.t('createPost.modal.recordVideo')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.modalBtnText}>{i18n.t('createPost.modal.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 图片预览模态框 */}
      <PreviewModal
        visible={previewModalVisible}
        images={previewModalMedia}
        initialIndex={previewIndex}
        onClose={handlePreviewClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  imageTip: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 10,
  },
  imageWrapper: { 
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  image: { 
    width: 80, 
    height: 80, 
    borderRadius: 8 
  },
  deleteBtn: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    width: 20, height: 20, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  addBtn: {
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    backgroundColor: '#f5f5f5', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    color: Theme.textColors[300],
  },
  inputTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingBottom: 10,
  },
  inputContent: {
    fontSize: 15,
    flex:1,
    paddingBottom: 10,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  coinListItem: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 4,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
    paddingBottom: 10,
    marginVertical: 10,
    padding: 10,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#E6EBF3',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  leftBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    borderRadius: 20,
    backgroundColor: Theme.backgroundColor,
    padding: 8,
  },
  iconBtnText: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearTitleBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
    zIndex: 10,
  },
  indexBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoWrapper: {
    marginRight: 16,
    marginBottom: 16,
  },
  videoImage: {
    width: 200,
    height: 120,
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  previewTopShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  previewBottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  previewCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  previewListContent: {
    flexGrow: 1,
  },
  previewImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImageCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  previewImageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: Theme.primary,
    borderStyle: 'dashed',
  },
});

export default CreatePostScreen;
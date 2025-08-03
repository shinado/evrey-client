import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Dimensions } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DraftStorage, DraftPost } from '../../storage/draft';
import { useToast } from '../../contexts/ToastContext';
import i18n from '../../i18n';
import FeedCard from '../../components/Feed/FeedCard';
import { Post } from '../../types/content';
import { RouterName } from '../../constants/navigation';
import AppBar from 'src/components/AppBar';
import { Theme } from 'src/constants/Theme';

const DraftListScreen = () => {
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const isFocused = useIsFocused();

  // 计算卡片尺寸
  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 48) / 2;

  // 监听页面聚焦状态，重新聚焦时刷新草稿列表
  useEffect(() => {
    if (isFocused) {
      loadDrafts();
    }
  }, [isFocused]);

  const loadDrafts = async () => {
    try {
      const allDrafts = await DraftStorage.getAllDrafts();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      showToast('failed', { message: i18n.t('draftList.loadFailed') }, 3000, 'simple');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (draft: DraftPost) => {
    // 跳转到创建页面并加载草稿数据
    navigation.navigate(RouterName.CREATE_POST, { 
      isDraft: true,
      draftId: draft.id,
      draftData: draft 
    });
  };

  const handleDeleteDraft = (draft: DraftPost) => {
    Alert.alert(
      i18n.t('draftList.deleteConfirm.title'),
      i18n.t('draftList.deleteConfirm.message'),
      [
        { text: i18n.t('draftList.deleteConfirm.cancel'), style: 'cancel' },
        {
          text: i18n.t('draftList.deleteConfirm.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await DraftStorage.deleteDraft(draft.id);
              showToast('success', { message: i18n.t('draftList.deleteSuccess') }, 2000, 'simple');
              loadDrafts(); // 重新加载列表
            } catch (error) {
              console.error('Failed to delete draft:', error);
              showToast('failed', { message: i18n.t('draftList.deleteFailed') }, 3000, 'simple');
            }
          }
        }
      ]
    );
  };

  // 将DraftPost转换为Post格式，以便FeedCard使用
  const convertDraftToPost = (draft: DraftPost): Post => {
    return DraftStorage.convertDraftToPost(draft);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{i18n.t('draftList.empty')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppBar title={i18n.t('draftList.title')} onBack={() => navigation.goBack()} style={{ paddingHorizontal: 16 }} />
      
      {/* 提示信息 */}
      <View style={styles.tipContainer}>
        <Text style={[styles.tipText, { fontSize: 16 }]}>👉</Text>
        <Text style={[styles.tipText, { flex: 1 }]}>{i18n.t('draftList.tip')}</Text>
      </View>

      <FlatList
        data={drafts}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <FeedCard
              item={convertDraftToPost(item)}
              onPress={() => handleEditDraft(item)}
              width={cardWidth}
            />
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => handleDeleteDraft(item)}
              hitSlop={10}
            >
              <Ionicons name="trash-outline" size={20} color={Theme.secondary} />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  cardContainer: {
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 16,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: Theme.background[200],
    paddingVertical: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: Theme.text[50],
  },
});

export default DraftListScreen; 
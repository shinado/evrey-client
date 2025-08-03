import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { CoinFormatUtil } from '../../utils';
import { RouterName } from '../../constants/navigation';
import { Post, PostType } from '../../types';
import HorizontalFeedCard from '../../components/Feed/HorizontalFeedCard';
import HorizontalFeedCardSkeleton from '../../components/Feed/HorizontalFeedCardSkeleton';
import NoData from '@assets/rebate/friends_list_null.svg';
import { postService } from '../../services/post';
import { fetchHistoryReport, HistoryReportData } from '../../services';
import i18n from '../../i18n';

const PostCommissionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [historyReport, setHistoryReport] = useState<HistoryReportData>();

  const {
    isLoading,
    data: postsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['myPosts', 'commission'],
    queryFn: ({ pageParam = 1 }) => postService.getMyPosts(pageParam, 10),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.has_more) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchOnMount: 'always', // 每次挂载都重新请求
    staleTime: 0, // 立即认为数据过期
  });

  useEffect(() => {
    getHistoryReport();
  }, []);

  // 获取历史报告数据（佣金总额）
  const getHistoryReport = async () => {
    try {
      const response = await fetchHistoryReport();
      setHistoryReport(response);
    } catch (error) {
      console.error('Failed to fetch history report:', error);
    }
  };

  // 处理帖子点击
  const handleFeedCardPress = (item: Post) => {
    navigation.navigate(RouterName.FEED_DETAIL, { item });
  };

  // 处理加载更多
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // 扁平化帖子数据
  const posts = postsData?.pages.flatMap(page => page.list) || [];

  // 渲染头部
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={20}>
        <Ionicons name="chevron-back" size={24} color={Theme.text[300]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Posts</Text>
    </View>
  );

  // 渲染收益展示区域
  const renderCommissionSection = () => (
    <View style={styles.commissionContainer}>
      <ImageBackground source={require('@assets/postCommission/bg.png')} style={styles.commissionBg} />
      <Text style={styles.commissionAmount}>
        ${CoinFormatUtil.formatPrice(Number(historyReport?.commissionAmount) / 1e6 || 0)}
      </Text>
      <Text style={styles.commissionLabel}>Total commission</Text>
    </View>
  );

  // 渲染帖子列表
  const renderPostsList = () => {
    if (isLoading && posts.length === 0) {
      return (
        <View>
          {Array.from({ length: 6 }).map((_, index) => (
            <HorizontalFeedCardSkeleton key={index} width={Dimensions.get('window').width - 32} />
          ))}
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={{ marginTop: 100, alignItems: 'center', gap: 24 }}>
          <NoData width={140} height={140} />
          <Text
            style={{
              color: Theme.text[100],
              fontFamily: FontFamily.regular,
              fontWeight: '400',
              fontSize: 12,
              fontStyle: 'normal',
            }}
          >
            {i18n.t('holdings.empty.posts.title')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <HorizontalFeedCard item={item} onPress={handleFeedCardPress} width={Dimensions.get('window').width - 32} />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Theme.text[300]} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderCommissionSection()}
      {renderPostsList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  commissionContainer: {
    width: '100%',
    height: 150,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  commissionBg: {
    width: 323,
    height: 120,
    position: 'absolute',
    top: 30,
    left: 120,
  },
  commissionAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
  },
  commissionLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
});

export default PostCommissionScreen;

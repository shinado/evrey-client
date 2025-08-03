import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  SectionList,
  Dimensions,
} from 'react-native';
import FeedCard from '../../components/Feed/FeedCard';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { Ionicons } from '@expo/vector-icons';
import { useContentList, useRecommendPostList } from '../../hooks/useContentList';
import { useNavigation } from '@react-navigation/native';
import FeedCardSkeleton from '../../components/Feed/FeedCardSkeleton';
import { versionService } from '../../services/config/versions';
import UpdateModal from '../../components/UpdateModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useBalance } from '../../hooks/useBalance';
import Skeleton from '../../components/Skeleton';
import { Button } from '../../components/Button';
import TabBar from '../../components/TabBar';
import { Post, VersionData } from '../../types';
import { RouterName } from '../../constants/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { reportService } from '../../services/report';
import { contentService, postService } from 'src/services';
import { queryClient } from '../../services/config/queryClient';

type TabType = 'Recommend' | 'Following';

type Section = {
  title: string;
  data: any[];
  renderItem: (info: { item: any; section: Section; index: number; separators: any }) => React.ReactElement | null;
  renderSectionHeader?: () => React.ReactElement | null;
};

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { checkUpdate } = versionService();
  const { language, toggleLanguage, i18n } = useLanguage();

  const tabs = [
    { key: 'Recommend', label: i18n.t('feed.tabs.recommend') },
    { key: 'Following', label: i18n.t('feed.tabs.following') },
  ];
  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 48) / 2;

  const { totalBalance, loading: balanceLoading, refetch: refreshBalance } = useBalance();
  const {
    data: recommendData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refreshRecommendList,
    isRefetching,
  } = useRecommendPostList('20');

  const [activeTab, setActiveTab] = useState<TabType>('Recommend');
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  // My interested posts
  const [isFetchingMyInterestedPosts, setIsFetchingMyInterestedPosts] = useState(false);
  const [myInterestedPosts, setMyInterestedPosts] = useState<Post[]>([]);

  // Followed posts
  const isInitialLoad = useRef(true);
  const isFetchingFollowedPosts = useRef(false);
  const [followedPosts, setFollowedPosts] = useState<Post[]>([]);
  const [hasMoreFollowedPosts, setHasMoreFollowedPosts] = useState(true);
  const [nextFollowedPostsStart, setNextFollowedPostsStart] = useState<number | undefined>(undefined);

  const recommendAndInterestedList = useMemo(() => {
    const allItems = recommendData?.pages.flatMap(page => page.items) ?? [];
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
    
    // Filter out posts that are already in myInterestedPosts
    const myInterestedPostIds = new Set(myInterestedPosts.map(post => post.id));
    const filteredUniqueItems = uniqueItems.filter(item => !myInterestedPostIds.has(item.id));
    
    return [...myInterestedPosts, ...filteredUniqueItems];
  }, [recommendData, myInterestedPosts]);
  // 使用 useRef 定义 onViewableItemsChanged 函数，避免重新创建
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (!viewableItems || viewableItems.length === 0) return;

    const postIds = viewableItems.flatMap(({ item }) => (item?.id ? [item.id] : []));
    if (postIds.length > 0) {
      reportService.trackImpressions(postIds);
    }
  }).current;

  useEffect(() => {
    checkVersion();
    getFollowedPosts();
    getMyInterestedPosts();
  }, []);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (activeTab === 'Following') {
      getFollowedPosts();
    }
  }, [activeTab]);

  // 检查版本更新
  const checkVersion = async () => {
    try {
      const result = await checkUpdate();
      if (result && result.needsUpdate) {
        setVersionData(result);
        setIsVersionModalVisible(true);
      }
    } catch (error) {
      console.error('Version check failed:', error);
    }
  };
  // 语言切换处理函数
  // const handleToggleLanguage = async () => {
  //   await toggleLanguage();
  // };
  const getFollowedPosts = async (start?: number) => {
    if (isFetchingFollowedPosts.current) return;
    isFetchingFollowedPosts.current = true;
    try {
      const result = await contentService.getFollowedPosts(start, 10);
      setFollowedPosts(start ? [...followedPosts, ...result.list] : result.list);
      setHasMoreFollowedPosts(result.has_more);
      setNextFollowedPostsStart(result.next);
    } catch (error) {
      console.error('Failed to fetch followed posts:', error);
    } finally {
      isFetchingFollowedPosts.current = false;
    }
  };
  const getMyInterestedPosts = async () => {
    setIsFetchingMyInterestedPosts(true);
    try {
      const result = await postService.fetchMyInterestedPosts(20);
      setMyInterestedPosts(result.list || []);
    } catch (error) {
      console.error('Failed to fetch my interested posts:', error);
      setMyInterestedPosts([]);
    } finally {
      setIsFetchingMyInterestedPosts(false);
    }
  };
  // 处理卡片点击 - 先上报数据，再导航
  const handleCardPress = async (item: Post) => {
    console.log('item', item);

    // 先上报当前浏览过的所有数据
    await reportService.flushAll();

    // 然后导航到详情页
    navigation.navigate(RouterName.FEED_DETAIL, { item });
  };
  // 处理搜索按钮点击
  const handleSearchPress = async () => {
    // 进入搜索页面前也上报数据
    await reportService.flushAll();
    navigation.navigate(RouterName.SEARCH);
  };
  // 修改刷新函数，同时刷新余额
  const handleRefresh = async () => {
    console.log('下拉刷新触发');
    setMyInterestedPosts([]);
    await queryClient.resetQueries({ queryKey: ['content', 'recommend'] });
    await Promise.all([getMyInterestedPosts(), refreshRecommendList(), refreshBalance()]);
  };
  // 渲染顶部卡片
  const renderTopCard = () => (
    <LinearGradient colors={['#FFFFFF', '#E5E5E5']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <Image
        source={require('../../../assets/home/home-card.png')}
        style={styles.topCardBackground}
        contentFit="none"
        contentPosition="right bottom"
      />
      <View style={styles.topIconBarContainer}>
        <TouchableOpacity onPress={() => navigation.navigate(RouterName.DRAFT_LIST)} hitSlop={10}>
          <Ionicons name="document-outline" size={24} color={Theme.text[300]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSearchPress} hitSlop={10}>
          <Ionicons name="search" size={24} color={Theme.text[300]} />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={handleToggleLanguage} hitSlop={10}>
          <Text style={styles.languageButtonText}>{language === 'en' ? 'EN' : '中'}</Text>
        </TouchableOpacity> */}
      </View>
      <View style={styles.topCardContent}>
        {balanceLoading ? (
          <Skeleton isLoading={balanceLoading} layout={styles.balanceSkeleton} />
        ) : (
          <Text style={styles.totalAssetAmount}>${Number(totalBalance).toFixed(2)}</Text>
        )}
        <Text style={styles.totalAssetLabel}>{i18n.t('totalBalance')}</Text>
      </View>
    </LinearGradient>
  );
  // 渲染底部加载指示器
  const renderFooter = () => {
    if (activeTab === 'Recommend') {
      if (!isFetchingNextPage) {
        return null;
      }
    }
    if (activeTab === 'Following') {
      if (!isFetchingFollowedPosts.current) {
        return null;
      }
    }
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={Theme.text[300]} />
        <Text style={styles.footerText}>{i18n.t('common.loading')}</Text>
      </View>
    );
  };
  // 渲染空状态
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={60} color={Theme.text[100]} />
        <Text style={styles.emptyText}>{i18n.t('feed.empty')}</Text>
        <Button type="primary" onPress={() => refreshRecommendList()}>
          {i18n.t('common.reload')}
        </Button>
      </View>
    );
  };
  // 渲染骨架屏
  const renderSkeleton = () => {
    return (
      <FlatList
        data={[...Array(6).keys()]}
        renderItem={() => <FeedCardSkeleton width={cardWidth} />}
        numColumns={2}
        keyExtractor={(_, index) => `skeleton-${index}`}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    );
  };
  const onEndReached = () => {
    if (activeTab === 'Recommend') {
      if (hasNextPage && !isFetchingNextPage && recommendAndInterestedList.length > 0) {
        fetchNextPage();
      }
      return;
    }
    if (activeTab === 'Following') {
      if (followedPosts.length > 0 && hasMoreFollowedPosts && !isFetchingFollowedPosts.current) {
        getFollowedPosts(nextFollowedPostsStart);
      }
    }
  };
  const renderRecommendContent = () => {
    return (
      <>
        {isFetchingMyInterestedPosts || (isLoading && recommendAndInterestedList.length === 0) ? (
          renderSkeleton()
        ) : (
          <FlatList
            key="feed-list"
            data={recommendAndInterestedList}
            renderItem={({ item }) => <FeedCard item={item} onPress={handleCardPress} width={cardWidth} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            nestedScrollEnabled
            onViewableItemsChanged={onViewableItemsChanged}
          />
        )}
      </>
    );
  };
  const renderFollowingContent = () => {
    return (
      <>
        {isLoading && followedPosts.length === 0 ? (
          renderSkeleton()
        ) : (
          <FlatList
            key="followed-list"
            data={followedPosts}
            renderItem={({ item }) => <FeedCard item={item} onPress={handleCardPress} width={cardWidth} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            nestedScrollEnabled
            onViewableItemsChanged={onViewableItemsChanged}
          />
        )}
      </>
    );
  };
  const sections: Section[] = [
    {
      title: 'header',
      data: [{}],
      renderItem: () => renderTopCard(),
    },
    {
      title: 'TabBar',
      data: [{}],
      renderItem: () => null,
      renderSectionHeader: () => (
        <View style={{ backgroundColor: '#E5E5E5' }}>
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab as TabType)}
            containerStyle={styles.tabBarContainer}
          />
        </View>
      ),
    },
    {
      title: 'Content',
      data: [{}],
      renderItem: () => {
        if (activeTab === 'Recommend') {
          return renderRecommendContent();
        } else if (activeTab === 'Following') {
          return renderFollowingContent();
        }
        return null;
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={({ item, section, index, separators }) => section.renderItem({ item, section, index, separators })}
        renderSectionHeader={({ section: { title, renderSectionHeader } }) => {
          if (renderSectionHeader) {
            return renderSectionHeader();
          }
          return null;
        }}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />
      {versionData && (
        <UpdateModal
          isVisible={isVersionModalVisible}
          onClose={() => setIsVersionModalVisible(false)}
          versionData={versionData}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topCardBackground: {
    position: 'absolute',
    right: 0,
    top: 40,
    width: 300,
    height: 180,
  },
  topCardContent: {
    justifyContent: 'flex-start',
    padding: 20,
    flex: 1,
  },
  topIconBarContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 20,
  },
  languageButtonText: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[200],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Theme.text[200],
    marginTop: 16,
    marginBottom: 24,
  },
  balanceSkeleton: {
    width: 120,
    height: 32,
    marginBottom: 4,
  },
  totalAssetAmount: {
    fontSize: 30,
    fontFamily: FontFamily.semiBold,
    color: '#000',
  },
  totalAssetLabel: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#666',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: 'white',
  },
});

export default FeedScreen;

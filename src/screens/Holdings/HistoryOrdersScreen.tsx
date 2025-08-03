import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getTradeHistory,
  getAirdropHistory,
  getDepositHistory,
  DepositData,
  fetchCommissionHistory,
} from '../../services/trading/history';
import { useCommissionHistory } from '../../hooks/useCommissionHistory';
import { format } from 'date-fns';
import { CoinFormatUtil } from '../../utils/format';
import { Theme } from '../../constants/Theme';

import i18n from '../../i18n';
import NoData from '@assets//rebate/friends_list_null.svg';
import { FontFamily } from '../../constants/typo';
import AppBar from '../../components/AppBar';

import * as Clipboard from 'expo-clipboard';
import Skeleton from '../../components/Skeleton';
import { rebateService } from '../../services/__deprecated__/rebate';
import { CommissionHistoryItem } from '../../types/history';
import { TimeFormatUtil } from '../../utils';
import dayjs from 'dayjs';
import FeedCard from '../../components/Feed/FeedCard';
import FeedCardSkeleton from '../../components/Feed/FeedCardSkeleton';
import { RouterName } from '../../constants/navigation';

import { browseService } from 'src/services/engagement/browse';
import { Post } from 'src/types';
import HistoryTransactionItem from '../../components/HistoryTransactionItem';
import HistoryTransactionItemSkeleton from '../../components/HistoryTransactionItemSkeleton';
import CommissionHistory from '../../components/CommissionHistory';
import CommissionHistorySkeleton from '../../components/CommissionHistorySkeleton';

const EmptyTransactions = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.emptyState}>
      <NoData width={140} height={140} />
      <Text style={styles.emptyDescription}>{i18n.t('history.empty.title')}</Text>
    </View>
  );
};

const cardWidth = (Dimensions.get('window').width - 48) / 2;

const HistoryOrdersScreen = () => {
  // **使用固定 key，防止多语言影响**
  const TABS = [
    { key: 'transaction', label: i18n.t('history.title') }, // 交易记录
    { key: 'fund', label: i18n.t('history.tagTitle') }, // 资金记录
    { key: 'views', label: i18n.t('history.viewsTitle') }, // 新增
  ];
  // 交易筛选记录
  // const TRANSFER_TAGS = [
  //   { key: "buy", label: i18n.t("history.dataType.buy") }, // 买入
  //   { key: "sell", label: i18n.t("history.dataType.sell") }, // 卖出
  // ];
  // 资金记录筛选项（固定 key）
  const FUND_TAGS = [
    { key: 'buy', label: i18n.t('history.dataType.buy') }, // 买入
    { key: 'sell', label: i18n.t('history.dataType.sell') }, // 卖出
    { key: 'deposit', label: i18n.t('history.subTags.topUp') }, // 充值
    { key: 'withdraw', label: i18n.t('history.subTags.withdraw') }, // 提现
    { key: 'transfer', label: i18n.t('history.subTags.transfer') }, // 站内转账
    // { key: "reward", label: i18n.t("history.subTags.award") }, // 奖励
    // { key: "airdrop", label: i18n.t("history.subTags.airdrop") }, // 空投
  ];

  const ItemText = {
    transaction: {
      buy: { text: i18n.t('history.dataType.buy'), color: 'active' },
      sell: { text: i18n.t('history.dataType.sell'), color: 'default' },
    },
    fund: {
      deposit: { text: i18n.t('history.dataType.top_up'), color: 'default' },
      withdraw: { text: i18n.t('history.dataType.withdraw'), color: 'default' },
      airdrop: { text: i18n.t('history.dataType.airdrop'), color: 'active' },
      reward: { text: i18n.t('history.dataType.reward'), color: 'active' },
      transfer_in: {
        text: i18n.t('history.dataType.transfer_in'),
        color: 'default',
      },
      transfer_out: {
        text: i18n.t('history.dataType.transfer_out'),
        color: 'active',
      },
    },
  };

  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageStart, setPageStart] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const latestTagRef = useRef<string | null>(null);

  // 添加 Views 相关状态
  const [browseList, setBrowseList] = useState<Post[]>([]);
  const [isLoadingBrowseList, setIsLoadingBrowseList] = useState(true);
  const [isRefreshingBrowseList, setIsRefreshingBrowseList] = useState(false);
  const [hasMoreBrowseList, setHasMoreBrowseList] = useState(true);
  const [browseListStart, setBrowseListStart] = useState(0);

  // **默认选中交易记录**
  const [activeTab, setActiveTab] = useState<'transaction' | 'fund' | 'views'>('transaction'); // "transaction" | "fund" | "views"
  const [activeSubTag, setActiveSubTag] = useState('buy'); // 资金记录下的默认选项

  const isTransactionTab = activeTab === 'transaction';
  const commissionHistory = useCommissionHistory(isTransactionTab, 20);
  const allCommissionItems = commissionHistory.data?.pages.flatMap(page => page.items) || [];

  // 初始加载
  useEffect(() => {
    if (activeTab === 'views') {
      fetchViewsData(true);
    } else if (activeTab === 'transaction') {
      // useCommissionHistory hook 会自动处理佣金历史记录的加载
      // 不需要手动调用 getCommissionHistory
    } else {
      setLoading(true);
      fetchTransactions();
    }
  }, [activeTab, activeSubTag]);

  // 刷新数据
  const onRefresh = async () => {
    if (activeTab === 'views') {
      setIsRefreshingBrowseList(true);
      await fetchViewsData(true);
      setIsRefreshingBrowseList(false);
    } else if (activeTab === 'transaction') {
      // 使用 hook 的 refetch 方法刷新佣金历史记录
      await commissionHistory.refetch();
    } else {
      setRefreshing(true);
      setPage(1);
      await fetchTransactions(1, true);
      setRefreshing(false);
    }
  };

  // 加载更多
  const loadMore = async () => {
    if (activeTab === 'views') {
      if (!hasMoreBrowseList) {
        return;
      }
      await fetchViewsData(false);
      return;
    }
    if (activeTab === 'transaction') {
      // 使用 hook 的 fetchNextPage 方法加载更多佣金历史记录
      if (commissionHistory.hasNextPage && !commissionHistory.isFetchingNextPage) {
        await commissionHistory.fetchNextPage();
      }
      return;
    }
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchTransactions(page + 1);
    setLoadingMore(false);
  };

  // 获取 Views 数据
  const fetchViewsData = async (refresh = false) => {
    setIsLoadingBrowseList(true);
    try {
      const response = await browseService.getBrowseList(refresh ? undefined : browseListStart, 10);
      const newList = refresh ? response.list : [...browseList, ...response.list];
      setBrowseList(newList);
      setHasMoreBrowseList(response.has_more);
      setBrowseListStart(response.next);
    } catch (error) {
      console.error('Failed to fetch views data:', error);
    } finally {
      setIsLoadingBrowseList(false);
    }
  };

  const fetchTransactions = async (pageNum = 1, refresh = false) => {
    try {
      /**
       *  getTradeHistory 要传 type
       *  买卖：1,2
       *  内部转账: 5,7 5是发起，7是收到
       *  提现:4
       * */
      // 记录当前请求的 activeSubTag
      latestTagRef.current = activeSubTag;
      let newData: DepositData = { list: [], hasMore: false, next: 0 };
      // 资金记录
      if (activeTab === 'fund') {
        // 资金记录 - 充值
        if (activeSubTag === 'deposit') {
          // TODO
          newData = await getDepositHistory({
            start: refresh ? 0 : pageStart,
            pageSize: 10,
          });
          if (newData.list && newData.list.length > 0) {
            newData.list = newData.list.map((item: any) => {
              const utcString = dayjs.unix(item.timestamp).format(); // 生成 ISO 格式的 UTC 时间
              const localTime = TimeFormatUtil.formatUTCTime(utcString);
              return {
                ...item,
                timestampDate: localTime,
              };
            });
          }
        }
        // 资金记录 - 提现
        if (activeSubTag === 'withdraw') {
          newData = await getTradeHistory({
            start: refresh ? 0 : pageStart,
            type: 4,
            pageSize: 10,
          });
        }
        // 资金记录 - 内部转账
        if (activeSubTag === 'transfer') {
          newData = await getTradeHistory({
            start: refresh ? 0 : pageStart,
            type: [5, 7],
            pageSize: 10,
          });
        }
        // 资金记录 - 奖励
        if (activeSubTag === 'reward') {
          const response = await rebateService.getWithdrawRecords({
            start: refresh ? 0 : pageStart,
            limit: 10,
          });

          newData = {
            hasMore: response.hasMore,
            next: response.next,
            list: response.list.map(item => {
              return {
                id: Number(item.id),
                coin_image_url: '',
                coin_symbol: 'USDT',
                created_at: item.createdAt,
                amountToken: Number(item.amount) / 1000000,
                status: 1000,
                timestampDate: new Date(item.createdAt).toLocaleString(),
              };
            }),
          };
        }
        // 资金记录 - 空投
        if (activeSubTag === 'airdrop') {
          newData = await getAirdropHistory({
            pageNo: pageNum,
            pageSize: 10,
          });
        }
      }
      // 交易记录
      if (activeTab === 'transaction') {
        // 交易记录 - 买入
        if (activeSubTag === 'buy') {
          newData = await getTradeHistory({
            start: refresh ? 0 : pageStart,
            type: 1,
            pageSize: 10,
          });
        }
        // 交易记录 - 售出
        if (activeSubTag === 'sell') {
          newData = await getTradeHistory({
            start: refresh ? 0 : pageStart,
            type: 2,
            pageSize: 10,
          });
        }
      }

      console.log('response222222:', newData);
      // **只在最新的 tag 仍然相同时，才更新数据**
      if (latestTagRef.current === activeSubTag) {
        console.log('Updating transactions for:', activeSubTag);
        if (refresh || pageNum === 1) {
          setTransactions(newData.list);
        } else {
          setTransactions(prev => [...prev, ...newData.list]);
        }

        setHasMore(newData.hasMore);
        if (newData.hasMore) {
          setPageStart(newData.next);
        }
        setPage(pageNum);
      } else {
        console.log('Ignored outdated response for:', activeSubTag);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const getDataType = (type?: number): { text: string; color: string } => {
    if (activeTab === 'transaction') {
      if (type && type === 1) {
        return ItemText.transaction['buy'];
      }
      return ItemText.transaction['sell'];
    }
    if (activeTab === 'fund') {
      if (
        activeSubTag === 'deposit' ||
        activeSubTag === 'reward' ||
        activeSubTag === 'withdraw' ||
        activeSubTag === 'airdrop'
      ) {
        // @ts-ignore
        return ItemText[activeTab][activeSubTag];
      }
      if (activeSubTag === 'transfer') {
        if (type && type === 5) {
          return ItemText[activeTab]['transfer_out'];
        }
        return ItemText[activeTab]['transfer_in'];
      }
      return {
        text: '--',
        color: 'default',
      };
    }
    // fallback
    return { text: '--', color: 'default' };
  };
  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy/MM/dd HH:mm:ss');
    } catch (error) {
      console.error('Date formatting error:', { dateString, error });
      return '';
    }
  };

  const handleHashPress = async (signature: string) => {
    const baseUrl = 'https://solscan.io/tx/';
    const url = `${baseUrl}${signature}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Clipboard.setStringAsync(signature);
    }
  };

  // 处理用户交易项点击
  const handleUserTradePress = (trade: CommissionHistoryItem) => {
    console.log('User trade pressed:', trade);
    // 这里可以添加导航到交易详情页等逻辑
  };

  // 渲染骨架屏
  const renderSkeleton = () => {
    return (
      <FlatList
        data={[...Array(6).keys()]}
        renderItem={() => <FeedCardSkeleton width={cardWidth} />}
        numColumns={2}
        keyExtractor={(_, index) => `skeleton-${index}`}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title={i18n.t('history.pageTitle')} />
      {/* 顶部 Tab 选择 */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key as 'transaction' | 'fund' | 'views')}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* 资金记录的子筛选项 */}
      {activeTab === 'fund' && (
        <View style={styles.subTabsContainer}>
          {FUND_TAGS.map(tag => (
            <TouchableOpacity
              key={tag.key}
              style={[styles.subTabButton, activeSubTag === tag.key && styles.activeSubTabButton]}
              onPress={() => setActiveSubTag(tag.key)}
            >
              <Text style={[styles.subTabText, activeSubTag === tag.key && styles.activeSubTabText]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView
        style={{ marginTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={
              activeTab === 'views'
                ? isRefreshingBrowseList
                : activeTab === 'transaction'
                  ? commissionHistory.isRefetching
                  : refreshing
            }
            onRefresh={onRefresh}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

          let shouldLoadMore = false;

          if (activeTab === 'views') {
            shouldLoadMore = isEndReached && hasMoreBrowseList;
          } else if (activeTab === 'transaction') {
            shouldLoadMore = isEndReached && commissionHistory.hasNextPage && !commissionHistory.isFetchingNextPage;
          } else {
            shouldLoadMore = isEndReached && !loadingMore && hasMore;
          }

          if (shouldLoadMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* 浏览记录 */}
        {activeTab === 'views' ? (
          isLoadingBrowseList && !browseList?.length ? (
            renderSkeleton()
          ) : browseList.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <FlatList
              data={browseList}
              renderItem={({ item }) => (
                <FeedCard
                  item={item}
                  width={cardWidth}
                  onPress={() => navigation.navigate(RouterName.FEED_DETAIL, { item })}
                />
              )}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshingBrowseList}
              onRefresh={onRefresh}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
            />
          )
        ) : (
          // 交易记录 和 资金记录
          <>
            {activeTab === 'transaction' ? (
              <>
                {commissionHistory.isLoading ? (
                  <HistoryTransactionItemSkeleton />
                ) : allCommissionItems.length === 0 ? (
                  <EmptyTransactions />
                ) : (
                  <>
                    {allCommissionItems.map((tx, index) => (
                      <CommissionHistory
                        key={tx.id}
                        trade={tx}
                        onPress={handleUserTradePress}
                        onViewTxPress={handleHashPress}
                      />
                    ))}

                    {commissionHistory.isFetchingNextPage && <HistoryTransactionItemSkeleton showSingleItem />}

                    {!commissionHistory.hasNextPage && allCommissionItems.length > 0 && (
                      <Text style={styles.noMoreText}>{i18n.t('history.loading.noMore')}</Text>
                    )}
                  </>
                )}
              </>
            ) : (
              // 资金记录 - 使用原有逻辑
              <>
                {loading ? (
                  <HistoryTransactionItemSkeleton />
                ) : transactions.length === 0 ? (
                  <EmptyTransactions />
                ) : (
                  <>
                    {transactions.map((tx, index) => (
                      <HistoryTransactionItem
                        key={tx.id}
                        transaction={tx}
                        activeTab={activeTab}
                        activeSubTag={activeSubTag}
                        isLast={index === transactions.length - 1}
                        onHashPress={handleHashPress}
                        getDataType={getDataType}
                        formatTransactionDate={formatTransactionDate}
                      />
                    ))}

                    {loadingMore && <HistoryTransactionItemSkeleton showSingleItem />}

                    {!hasMore && transactions.length > 0 && (
                      <Text style={styles.noMoreText}>{i18n.t('history.loading.noMore')}</Text>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  demoSection: {
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 12,
    marginTop: 16,
  },
  noMoreText: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
    fontSize: 14,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    gap: 24,
  },
  emptyIcon: {
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.secondaryColors[900],
    marginBottom: 8,
  },
  emptyDescription: {
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    fontStyle: 'normal',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primaryColors[500],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  exploreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

  // 顶部筛选样式
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'white',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: Theme.primary,
  },
  tabText: {
    color: Theme.text[100], // #000000 (主文字)
    fontFamily: FontFamily.semiBold, // 600 对应 Manrope-SemiBold
    fontSize: 15,
  },
  activeTabText: {
    color: Theme.primary,
  },
  // 资金记录的子筛选项
  subTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 0,
    gap: 4,
    height: 32,
  },
  subTabButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
    marginRight: 4,
    minWidth: 0,
  },
  activeSubTabButton: {
    backgroundColor: Theme.primary,
  },
  subTabText: {
    fontSize: 12,
    color: Theme.text[200],
    fontFamily: FontFamily.semiBold,
  },
  activeSubTabText: {
    color: '#fff',
  },
});

export default HistoryOrdersScreen;

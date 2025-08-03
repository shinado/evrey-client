import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SectionList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { NavigatorName, RouterName } from "../../constants/navigation";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../constants/Theme";
import { useNavigation } from "@react-navigation/native";
import { mapToUiToken, Token, UiToken } from "../../types/token";
import DepositScreen from "./DepositScreen";
import SendScreen from "./Send/SendScreen";
import i18n from "../../i18n";
import { FontFamily } from "../../constants/typo";
import { SafeAreaView } from "react-native-safe-area-context";
import ErrorBottomSheet, {
  ErrorMessage,
} from "../../components/ErrorBottomSheet";
import TokenSelectSheet from "../../components/TokenSelectSheet";
import BottomSheet from "../../components/BottomSheet";
import HistoryIcon from "../../../assets/holdings/act.svg";
import SettingsIcon from "../../../assets/holdings/settings.svg";
import { useTokensAggregate } from "../../hooks/useBalance";
import { getPriceChangeIconAndColor, CoinFormatUtil } from "../../utils";
import CompileIcon from "../../../assets/holdings/compile.svg";
import BackIcon from "../../../assets/holdings/back.svg";
import { DefaultAvatar } from "../../constants/icons";
import { useUserInfo } from "../../hooks/useUserInfo";
import TokenCard from "../../components/TokenCard";
import { useTokenList } from "../../hooks/useTokenList";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tokensService, watchlistService } from "../../services/trading/tokens";
import CoinListItem from "../../components/CoinListItem";
import FeedCard from "../../components/Feed/FeedCard";
import TabBar from "../../components/TabBar";
import HorizontalFeedCard from "src/components/Feed/HorizontalFeedCard";
import { postService } from "src/services/post";
import HorizontalFeedCardSkeleton from "src/components/Feed/HorizontalFeedCardSkeleton";
import FeedCardSkeleton from "src/components/Feed/FeedCardSkeleton";
import NoData from "@assets//rebate/friends_list_null.svg";
import { favoriteService } from "src/services/engagement/favorite";
import { Post } from "src/types";
import SkeletonCoinListItem from "src/components/SkeletonCoinListItem";
import { fetchHistoryReport, HistoryReportData, userService } from "src/services";

type HoldingTab = "Posts" | "Collections" | "Watchlist";

const HoldingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userInfo, refreshUserInfo } = useUserInfo();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [followReport, setFollowReport] = useState<{
    followings: number;
    followers: number;
  }>();

  const { tokensAggregate, loading, refetch } = useTokensAggregate();
  const totalBalance = Number(tokensAggregate?.balance_usd || 0);

  const tokens = tokensAggregate?.tokens || [];
  const cashToken = tokensAggregate?.cash_token;
  const profitLoss = tokensAggregate?.profit_margin || {
    earnings: 0,
    cost: 0,
    rate: 0,
  };
  const { color: profitLossColor, icon: profitLossIcon } =
    getPriceChangeIconAndColor(Number(profitLoss?.rate ?? 0));

  // 盈亏颜色判断
  const profitDisplayColor =
    Number(profitLoss?.rate ?? 0) === 0 ? Theme.text[100] : profitLossColor;
  // 盈亏符号判断
  const rateNum = Number(profitLoss?.rate ?? 0);
  const earningsNum = Number(profitLoss?.earnings ?? 0);
  const ratePrefix = rateNum > 0 ? "+" : rateNum < 0 ? "-" : "";
  const earningsPrefix = earningsNum > 0 ? "+" : earningsNum < 0 ? "-" : "";

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const [tokenSelectVisible, setTokenSelectVisible] = useState(false);
  const [action, setAction] = useState<"transfer" | "cashout">("transfer");
  const [selectedToken, setSelectedToken] = useState<Token>();
  const [activeTab, setActiveTab] = useState<HoldingTab>("Posts");

  // Watchlist 逻辑复用 HomeScreen
  // const watchlistQuery = useTokenList("watchlist");
  // React.useEffect(() => {
  //   setWatchlistData(watchlistQuery.data?.pages.flat() ?? []);
  // }, [watchlistQuery.data]);

  const queryClient = useQueryClient();

  // 跳转到 FeedDetailScreen
  const handleFeedCardPress = (item: any) => {
    navigation.navigate(RouterName.FEED_DETAIL, { item });
  };

  // 使用真实数据，移除 mock 数据回退
  const displayTokens = [...(cashToken ? [cashToken] : []), ...tokens];

  const [isLoadingMyPosts, setIsLoadingMyPosts] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [historyReport, setHistoryReport] = useState<HistoryReportData>();

  const [isLoadingMyCollections, setIsLoadingMyCollections] = useState(false);
  const [myCollections, setMyCollections] = useState<Post[]>([]);
  const [myCollectionsPage, setMyCollectionsPage] = useState(1);
  const [hasMoreMyCollections, setHasMoreMyCollections] = useState(false);

  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState<UiToken[]>([]);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [hasMoreWatchlist, setHasMoreWatchlist] = useState(false);
  const { adjustWatchlistOrder } = tokensService();

  useEffect(() => {
    getMyPosts();
    getMyCollections();
    getWatchlist();
    getFollowReport();
  }, []);
  useEffect(() => {
    if (activeTab === "Posts") {
      getMyPosts();
      getHistoryReport();
    } else if (activeTab === "Collections") {
      getMyCollections();
    } else if (activeTab === "Watchlist") {
      getWatchlist();
    }
  }, [activeTab]);

  const getMyPosts = async () => {
    setIsLoadingMyPosts(true);
    try {
      const response = await postService.getMyPosts(1, 10);
      setMyPosts(response.list);
    } catch (error) {
      console.error("Failed to fetch my posts:", error);
    } finally {
      setIsLoadingMyPosts(false);
    }
  };
  const getHistoryReport = async () => {
    const response = await fetchHistoryReport();
    setHistoryReport(response);
  };
  const getMyCollections = async (page = 1, pageSize = 20) => {
    setIsLoadingMyCollections(true);
    try {
      const response = await favoriteService.getFavorites(page, pageSize);
      const newCollections =
        page === 1 ? response.list : [...myCollections, ...response.list];
      setMyCollectionsPage(page);
      setMyCollections(newCollections);
      setHasMoreMyCollections(response.has_more);
    } catch (error) {
      console.error("Failed to fetch my collections:", error);
    } finally {
      setIsLoadingMyCollections(false);
    }
  };
  const getWatchlist = async (page = 1, pageSize = 20) => {
    setIsLoadingWatchlist(true);
    try {
      const response = await watchlistService.getWatchlist(page, pageSize);
      const newWatchlist =
        page === 1 ? response.list : [...watchlist, ...response.list];
      setWatchlist(newWatchlist as UiToken[]);
      setWatchlistPage(page);
      setHasMoreWatchlist(response.hasMore);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };
  const getFollowReport = async () => {
    const response = await userService.fetchFollowReport();
    setFollowReport(response);
  };
  const handleDepositModalClose = () => {
    setDepositModalVisible(false);
    console.log("🔄 Refreshing balances after deposit modal closed");
    refetch();
  };
  const handleSendModalClose = () => {
    setSendModalVisible(false);
  };
  const handleCashoutPress = () => {
    if (loading) return;
    if (totalBalance <= 0) {
      setErrorMessage({
        title: i18n.t("tradeError.insufficientBalance"),
        message: i18n.t("tradeError.noTokenSelect", {
          mode: i18n.t("modes.cashout"),
        }),
      });
      return;
    }

    // 检查是否只有一种资产
    const hasCashToken = cashToken?.account.balance_token.ui_amount !== 0;
    const tokenCount = tokens.length;

    if (hasCashToken && tokenCount === 0) {
      navigation.navigate(RouterName.CASH_OUT, { token: cashToken });
    } else if (!hasCashToken && tokenCount === 1) {
      navigation.navigate(RouterName.CASH_OUT, { token: tokens[0] });
    } else {
      // 多种资产，显示选择弹窗
      setAction("cashout");
      setTokenSelectVisible(true);
    }
  };
  const handleSendPress = () => {
    if (loading) return;
    if (totalBalance <= 0) {
      setErrorMessage({
        title: i18n.t("tradeError.insufficientBalance"),
        message: i18n.t("tradeError.noTokenSelect", {
          mode: i18n.t("modes.transfer"),
        }),
      });
      return;
    }

    // 检查是否只有一种资产
    const hasCashToken = cashToken?.account.balance_token.ui_amount !== 0;
    const tokenCount = tokens.length;

    if (hasCashToken && tokenCount === 0) {
      // 只有 cash token
      setSelectedToken(cashToken);
      setSendModalVisible(true);
    } else if (!hasCashToken && tokenCount === 1) {
      // 只有一个 token
      setSelectedToken(tokens[0]);
      setSendModalVisible(true);
    } else {
      // 多种资产，显示选择弹窗
      setAction("transfer");
      setTokenSelectVisible(true);
    }
  };
  const handleTokenSelect = (token: any, isCashToken: boolean) => {
    setTokenSelectVisible(false);
    try {
      if (action === "transfer") {
        setSelectedToken(token);
        setTimeout(() => {
          setSendModalVisible(true);
        }, 400);
      } else {
        navigation.navigate(RouterName.CASH_OUT, { token, isCashToken });
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const handleHistoryPress = () => {
    navigation.navigate(RouterName.HISTORY_ORDERS);
  };
  const handleSettingsPress = () => {
    navigation.navigate(NavigatorName.SETTINGS_STACK);
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refreshUserInfo()]);
    setIsRefreshing(false);
  };

  const tabs = [
    { key: "Posts", label: i18n.t("holdings.tabs.posts") },
    { key: "Collections", label: i18n.t("holdings.tabs.collections") },
    { key: "Watchlist", label: i18n.t("holdings.tabs.watchlist") },
  ];

  // 计算是否需要滚动
  const screenWidth = Dimensions.get("window").width;
  const containerPadding = 32; // 左右各16px的padding
  const tokenCardWidth = 120; // TokenCard 的固定宽度
  const gap = 12; // TokenCard 之间的间距
  const availableWidth = screenWidth - containerPadding;

  // 计算能容纳多少个 TokenCard
  // 公式：n * tokenCardWidth + (n-1) * gap <= availableWidth
  // 解出：n <= (availableWidth + gap) / (tokenCardWidth + gap)
  const maxCardsPerRow = Math.floor(
    (availableWidth + gap) / (tokenCardWidth + gap)
  );
  const needsScroll = displayTokens.length > maxCardsPerRow;

  // 调试信息
  // console.log('TokenCard Layout Debug:', {
  //   screenWidth,
  //   containerPadding,
  //   availableWidth,
  //   tokenCardWidth,
  //   gap,
  //   maxCardsPerRow,
  //   displayTokensLength: displayTokens.length,
  //   needsScroll
  // });

  const renderPostsFooter = () => {
    if (!myPosts?.length) return null;
    return (
      <View style={styles.footerContainer}>
        <Text
          style={[
            styles.footerText,
            { color: Theme.text[300], fontWeight: "600" },
          ]}
        >
          {i18n.t("holdings.posts.footer", {
            commissionAmount: CoinFormatUtil.formatPrice(
              Number(historyReport?.commissionAmount) / 1e6
            ),
          })}
          ,{" "}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(RouterName.POST_COMMISSION)}
        >
          <Text style={styles.footerViewAll}>{i18n.t("common.viewAll")}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  const renderFooter = () => {
    if (activeTab === "Collections") {
      if (!hasMoreMyCollections || myCollections.length === 0) {
        return null;
      }
    }
    if (activeTab === "Watchlist") {
      if (!hasMoreWatchlist || watchlist.length === 0) {
        return null;
      }
    }
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={Theme.text[300]} />
        <Text style={styles.footerText}>{i18n.t("common.loading")}</Text>
      </View>
    );
  };

  // 渲染 TokenCard 列表
  const renderTokenCards = () => {
    if (needsScroll) {
      // 需要滚动时使用 FlatList
      return (
        <FlatList
          data={displayTokens}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(token) => token.attributes.address}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item: token }) => (
            <TokenCard
              token={token}
              onPress={() =>
                navigation.navigate(RouterName.TOKEN_INFO, {
                  token: mapToUiToken(token),
                })
              }
            />
          )}
          nestedScrollEnabled={true}
          ListEmptyComponent={() =>
            loading ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.loadingText}>
                  {i18n.t("holdings.loadingMyFunds")}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {i18n.t("holdings.noMyFunds")}
                </Text>
              </View>
            )
          }
        />
      );
    } else {
      // 不需要滚动时使用普通 View
      return (
        <View style={styles.tokenCardsRow}>
          {displayTokens.map((token, index) => (
            <TokenCard
              key={token.attributes.address}
              token={token}
              onPress={() =>
                navigation.navigate(RouterName.TOKEN_INFO, {
                  token: mapToUiToken(token),
                })
              }
            />
          ))}
          {loading && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.loadingText}>
                {i18n.t("holdings.loadingMyFunds")}
              </Text>
            </View>
          )}
          {!loading && displayTokens.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                {i18n.t("holdings.noMyFunds")}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  const renderPosts = () => {
    if (isLoadingMyPosts && myPosts.length === 0) {
      return (
        <View>
          {Array.from({ length: 6 }).map((_, index) => (
            <HorizontalFeedCardSkeleton
              key={index}
              width={Dimensions.get("window").width - 32}
            />
          ))}
        </View>
      );
    }
    if (myPosts.length === 0) {
      return (
        <View style={{ marginTop: 100, alignItems: "center", gap: 24 }}>
          <NoData width={140} height={140} />
          <Text
            style={{
              color: Theme.text[100],
              fontFamily: FontFamily.regular,
              fontWeight: "400",
              fontSize: 12,
              fontStyle: "normal",
            }}
          >
            {i18n.t("holdings.empty.posts.title")}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        key="posts-flatlist"
        data={myPosts}
        renderItem={({ item }) => (
          <HorizontalFeedCard
            item={item}
            onPress={handleFeedCardPress}
            width={Dimensions.get("window").width - 32}
          />
        )}
        ListFooterComponent={renderPostsFooter}
        keyExtractor={(item) => item.id.toString()}
        numColumns={1}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      />
    );
  };

  const renderCollections = () => {
    if (
      isLoadingMyCollections &&
      myCollectionsPage === 1 &&
      myCollections.length === 0
    ) {
      return (
        <View style={{ flexDirection: "row", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <FeedCardSkeleton
              key={index}
              width={(Dimensions.get("window").width - 48) / 2}
            />
          ))}
        </View>
      );
    }
    if (myCollections.length === 0) {
      return (
        <View style={{ marginTop: 100, alignItems: "center", gap: 24 }}>
          <NoData width={140} height={140} />
          <Text
            style={{
              color: Theme.text[100],
              fontFamily: FontFamily.regular,
              fontWeight: "400",
              fontSize: 12,
              fontStyle: "normal",
            }}
          >
            {i18n.t("holdings.empty.collections.title")}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        key="collections-flatlist"
        data={myCollections}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            onPress={handleFeedCardPress}
            width={(Dimensions.get("window").width - 48) / 2}
          />
        )}
        ListFooterComponent={renderFooter}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onEndReached={() => {
          if (hasMoreMyCollections) {
            getMyCollections(myCollectionsPage + 1, 20);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    );
  };
  const renderWatchlist = () => {
    if (isLoadingWatchlist && watchlistPage === 1 && watchlist.length === 0) {
      return (
        <View>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCoinListItem key={index} />
          ))}
        </View>
      );
    }
    if (watchlist.length === 0) {
      return (
        <View style={{ marginTop: 100, alignItems: "center", gap: 24 }}>
          <NoData width={140} height={140} />
          <Text style={styles.emptyStateText}>
            {i18n.t("holdings.empty.watchlist.title")}
          </Text>
        </View>
      );
    }
    return (
      <DraggableFlatList
        data={watchlist}
        renderItem={({ item, drag }) => (
          <CoinListItem
            token={item}
            onPress={() => {
              navigation.navigate(RouterName.TOKEN_INFO, {
                token: item,
              });
            }}
            showDragHandle={true}
            onLongPress={drag}
          />
        )}
        keyExtractor={(item) => item.mint}
        onDragEnd={async ({ data, from, to }) => {
          if (from === to) return;
          setWatchlist(data);
          let mint: string;
          let nextMint: string;
          if (from < to) {
            mint = watchlist[from].mint;
            nextMint = watchlist[to].mint;
          } else {
            mint = watchlist[from].mint;
            nextMint = watchlist[to - 1]?.mint ?? undefined;
          }
          if (await adjustWatchlistOrder(mint, nextMint)) {
            queryClient.invalidateQueries({
              queryKey: ["tokens", "watchlist"],
            });
          }
        }}
        onEndReached={() => {
          if (hasMoreWatchlist) {
            getWatchlist(watchlistPage + 1, 20);
          }
        }}
        onEndReachedThreshold={0.5}
        nestedScrollEnabled
        contentContainerStyle={{ paddingTop: 8 }}
        ListFooterComponent={renderFooter}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={[
          {
            title: "header",
            data: [{}],
            renderItem: () => (
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleHistoryPress} hitSlop={20}>
                    <HistoryIcon width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSettingsPress} hitSlop={20}>
                    <SettingsIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => {
                    navigation.navigate(RouterName.PROFILE);
                  }}
                >
                  <View style={styles.avatarContainerLeft}>
                    <Image
                      source={
                        userInfo?.avatar
                          ? { uri: userInfo.avatar }
                          : DefaultAvatar
                      }
                      style={styles.avatar}
                    />
                    <View style={styles.usernameContainer}>
                      <Text style={styles.username}>
                        {userInfo?.nickname || i18n.t("common.notSet")}
                      </Text>
                      <Text style={styles.uidText}>@{userInfo?.username}</Text>
                    </View>
                  </View>
                  <View style={styles.avatarContainerLeft}>
                    <CompileIcon />
                    <BackIcon />
                  </View>
                </TouchableOpacity>

                <View style={styles.followContainer}>
                  <TouchableOpacity
                    hitSlop={20}
                    onPress={() => {
                      navigation.navigate(RouterName.FOLLOWING);
                    }}
                  >
                    <Text style={styles.followText}>
                      {followReport?.followings} {i18n.t("holdings.following")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={20}
                    onPress={() => {
                      navigation.navigate(RouterName.FOLLOWERS);
                    }}
                  >
                    <Text style={styles.followText}>
                      {followReport?.followers} {i18n.t("holdings.followers")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceCard}>
                  <View style={styles.balanceRow}>
                    <View style={styles.balanceLeft}>
                      <Text style={styles.balanceLabel}>
                        {i18n.t("totalBalance")}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Text style={styles.totalAmount}>
                          ${CoinFormatUtil.formatPrice(totalBalance)}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={Theme.text[100]}
                        />
                      </View>
                    </View>
                    <View style={styles.profitRight}>
                      <Text
                        style={[
                          styles.profitPercent,
                          { color: profitDisplayColor },
                        ]}
                      >
                        {ratePrefix}
                        {CoinFormatUtil.formatPercentage(Math.abs(rateNum))}
                      </Text>
                      <Text
                        style={[
                          styles.profitPercent,
                          { color: Theme.text[100] },
                        ]}
                      >
                        {earningsPrefix}${Math.abs(earningsNum).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.balanceActionsRow}>
                    <TouchableOpacity
                      style={styles.balanceActionBtn}
                      onPress={() => setDepositModalVisible(true)}
                    >
                      <Text style={styles.balanceActionText}>
                        {i18n.t("modes.deposit")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.balanceActionBtn}
                      onPress={handleSendPress}
                    >
                      <Text style={styles.balanceActionText}>
                        {i18n.t("modes.transfer")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.balanceActionBtn}
                      onPress={handleCashoutPress}
                    >
                      <Text style={styles.balanceActionText}>
                        {i18n.t("modes.cashout")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ),
          },
          {
            title: "My Funds",
            data: [{}],
            renderItem: () => (
              <View>
                <View style={styles.fundsHeader}>
                  <Text style={styles.fundsTitle}>
                    {i18n.t("holdings.myFunds") || "My Funds"}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate(RouterName.HOLDING_TOKEN)
                    }
                    hitSlop={10}
                  >
                    <Text style={styles.viewAllText}>
                      {i18n.t("common.viewAll") || "View All"}
                      <Ionicons
                        name="chevron-forward"
                        size={10}
                        color={Theme.text[100]}
                      />
                    </Text>
                  </TouchableOpacity>
                </View>
                {renderTokenCards()}
              </View>
            ),
          },
          {
            title: "TabBar",
            data: [{}],
            renderItem: () => null,
            renderSectionHeader: () => (
              <TabBar
                tabs={tabs}
                activeTab={activeTab}
                containerStyle={styles.tabBarContainer}
                onTabChange={(tab) => setActiveTab(tab as HoldingTab)}
              />
            ),
          },
          {
            title: "Content",
            data: [{}],
            renderItem: () => {
              if (activeTab === "Posts") {
                return renderPosts();
              } else if (activeTab === "Collections") {
                return renderCollections();
              } else if (activeTab === "Watchlist") {
                return renderWatchlist();
              } else {
                return null;
              }
            },
          },
        ]}
        renderItem={({ item, section, index, separators }) =>
          section.renderItem({ item, section, index, separators })
        }
        renderSectionHeader={({ section: { title, renderSectionHeader } }) => {
          if (renderSectionHeader) {
            return renderSectionHeader();
          }
          return null;
        }}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        keyExtractor={(item, index) => index.toString()}
      />

      <TokenSelectSheet
        isVisible={tokenSelectVisible}
        onClose={() => setTokenSelectVisible(false)}
        onSelect={handleTokenSelect}
        cashToken={cashToken}
        tokens={tokens}
        title={i18n.t("selectToken", { mode: i18n.t(`modes.${action}`) })}
      />

      <BottomSheet
        isVisible={sendModalVisible}
        onClose={handleSendModalClose}
        height="90%"
        disableGestures={true}
      >
        <SendScreen
          token={selectedToken as Token}
          onClose={handleSendModalClose}
        />
      </BottomSheet>

      <BottomSheet
        isVisible={depositModalVisible}
        onClose={handleDepositModalClose}
        height="90%"
      >
        <DepositScreen onClose={handleDepositModalClose} />
      </BottomSheet>

      <ErrorBottomSheet
        errorMessage={errorMessage}
        onClose={() => setErrorMessage(null)}
        visible={!!errorMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginVertical: 6,
    gap: 24,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarContainerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.secondaryColors[100],
    justifyContent: "center",
    alignItems: "center",
  },
  usernameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  uidText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    fontWeight: "400",
    color: Theme.text[100],
  },
  followContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followText: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.semiBold,
  },
  balanceCard: {
    backgroundColor: "white",
    paddingTop: 10,
    paddingBottom: 10,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  balanceLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  profitRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  profitPercent: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FontFamily.medium,
  },
  balanceActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  balanceActionBtn: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  balanceActionText: {
    fontSize: 14,
    color: Theme.textColors[300],
    fontFamily: FontFamily.semiBold,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Theme.text[100],
  },
  totalAmount: {
    fontSize: 30,
    fontWeight: "600",
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  fundsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fundsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.text[300],
  },
  viewAllText: {
    fontSize: 12,
    color: Theme.text[100],
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.secondaryColors[400],
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
  tabBarContainer: {
    backgroundColor: "white",
  },
  emptyStateContainer: {
    height: 120,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  tokenCardsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[200],
  },
  footerViewAll: {
    color: Theme.blue,
    fontWeight: "600",
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
});

export default HoldingsScreen;

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { RouterName } from "../../navigation";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CoinListItem from "../../components/CoinListItem";
import { useEffect, useState, useMemo, useCallback } from "react";
import { tokensService } from "../../services/trading/tokens";
import { VersionData } from "../../types";
import { useVersionService } from "../../services/config/versions";
import UpdateModal from "../../components/UpdateModal";
import React from "react";
import i18n, { getCurrentLanguage, toggleLanguage } from "../../i18n";
import { Image } from "expo-image";
import { FontFamily } from "../../constants/typo";
import { topIcons } from "../../constants/icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { openLink } from "../../utils/common";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useBalance } from "../../hooks/useBalance";
import { useTokenList } from "../../hooks/useTokenList";
import SkeletonCoinListItem from "../../components/SkeletonCoinListItem";
import { UiToken } from "../../types/token";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../contexts/ToastContext";


// 定义标签类型
type TabType = "Recommend" | "Watchlist" | "Trending";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("Recommend");
  const navigation = useNavigation<any>();
  const {
    totalBalance,
    loading: balanceLoading,
    refetch: refreshBalance,
  } = useBalance();
  const { showToast } = useToast();
  const { adjustWatchlistOrder } = tokensService();
  const [isVisible, setIsVisible] = useState(false);
  const { checkUpdate } = useVersionService();
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const queryClient = useQueryClient();
  const [watchlistData, setWatchlistData] = useState<UiToken[]>([]);

  // 每个 tab 使用独立的查询
  const queries = {
    Recommend: useTokenList("recommended"),
    Watchlist: useTokenList("watchlist"),
    Trending: useTokenList("trending"),
  };

  // 使用 useMemo 优化派生状态
  const currentQuery = useMemo(() => queries[activeTab], [queries, activeTab]);
  const allTokens = useMemo(
    () => currentQuery.data?.pages.flat() ?? [],
    [currentQuery.data]
  );

  useEffect(() => {
    if (activeTab === "Watchlist") {
      console.log("Watchlist data:", currentQuery.data?.pages.flat());
      setWatchlistData(currentQuery.data?.pages.flat() ?? []);
    }
  }, [currentQuery.data, activeTab]);

  // i18n 键映射
  const tabI18nKeys = {
    Recommend: "home.tabs.recommend",
    Watchlist: "home.tabs.watchlist",
    Trending: "home.tabs.trending",
  };

  // 添加语言状态
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // 在组件加载时获取当前语言设置
  useEffect(() => {
    //checkVsersion();
    getCurrentLanguage().then(setCurrentLanguage);
  }, []);

  // 创建一个刷新所有数据的函数
  const refreshAll = useCallback(async () => {
    // 刷新余额和当前标签的数据
    await Promise.all([refreshBalance(), currentQuery.refetch()]);
  }, [refreshBalance, currentQuery]);

  // 渲染资产卡片
  const renderAssetCard = () => (
    <LinearGradient
      colors={["#FFFFFF", "#EFF2F9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.assetCardContainer}
    >
      {/* 背景图片放在最底层 */}
      <Image
        source={require("../../../assets/home/home-card.png")}
        style={styles.assetCardBackground}
        contentFit="cover"
      />
      {/* 顶部图标栏 */}
      {renderTopIconBar()}

      {/* 资产信息放在上方 */}
      <View style={styles.assetCardContent}>
        {balanceLoading ? (
          <View style={styles.skeletonBalance} />
        ) : (
          <Text style={styles.totalAssetAmount}>
            ${Number(totalBalance).toFixed(2)}
          </Text>
        )}
        <Text style={styles.totalAssetLabel}>{i18n.t("totalBalance")}</Text>
      </View>

      {/* 标签栏放在底部 */}
      {renderTabs()}
    </LinearGradient>
  );

  // 修改 renderTopIconBar 函数
  const renderTopIconBar = () => (
    <View style={styles.topIconBarContainer}>
      <View style={styles.topIconContainer}>
        {topIcons.map((iconItem, index) => {
          const IconComponent = iconItem.icon;
          return (
            <TouchableOpacity
              key={index}
              style={styles.iconTabButton}
              onPress={async () => {
                if (iconItem.url) {
                  if (!(await openLink(iconItem.url))) {
                    showToast("success", {message: i18n.t("tokenInfo.social.copied"), yPosition: '10%'}, 2000, "simple");
                  }
                }
              }}
            >
              <IconComponent width={24} height={24} />
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.languageButton}
          onPress={handleLanguageToggle}
        >
          <Text style={styles.languageText}>
            {currentLanguage === "en" ? "EN" : "中"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          console.log("search");
          navigation.navigate(RouterName.SEARCH_TOKEN);
        }}
        style={{
          padding: 8, // 增加点击区域
          marginLeft: 16,
        }}
      >
        <Ionicons name="search" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  // 渲染标签栏
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(Object.keys(queries) as TabType[]).map((key) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.tabButton,
            activeTab === key && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab(key)}
        >
          <Text
            style={[styles.tabText, activeTab === key && styles.activeTabText]}
          >
            {i18n.t(tabI18nKeys[key])}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleTokenPress = (token: UiToken) => {
    navigation.navigate(RouterName.TOKEN_INFO, { token });
  };

  // 修改列表底部加载状态
  const renderFooter = () => {
    if (activeTab === "Watchlist") return null;
    if (!currentQuery.hasNextPage) return null;
    if (currentQuery.isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  };

  // 渲染列表
  const renderTokenList = () => {
    if (activeTab === "Watchlist") {
      if (watchlistData.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {i18n.t("home.watchlistEmpty")}
            </Text>
          </View>
        );
      }
      return (
        <DraggableFlatList
          data={watchlistData}
          renderItem={({ item, drag }) => (
            <CoinListItem
              token={item}
              onPress={() => handleTokenPress(item)}
              showDragHandle={true}
              onLongPress={drag}
            />
          )}
          keyExtractor={(item) => item.mint}
          onDragEnd={async ({ data, from, to }) => {
            if (from === to) return;
            console.log("data", data);
            setWatchlistData(data);
            let mint: string;
            let nextMint: string;
            if (from < to) {
              mint = watchlistData[from].mint;
              nextMint = watchlistData[to].mint;
            } else {
              mint = watchlistData[from].mint;
              nextMint = watchlistData[to - 1]?.mint ?? undefined;
            }
            console.log("mint", mint, "nextMint", nextMint);
            if (await adjustWatchlistOrder(mint, nextMint)) {
              // 使当前的数据失效
              console.log("调整顺序成功");
              queryClient.invalidateQueries({
                queryKey: ["tokens", "watchlist"],
              });
            }
          }}
        />
      );
    }

    return (
      <FlatList
        data={allTokens}
        keyExtractor={(item) => item.mint}
        renderItem={({ item }) => (
          <CoinListItem token={item} onPress={() => handleTokenPress(item)} />
        )}
        refreshing={currentQuery.isLoading || balanceLoading}
        onRefresh={refreshAll}
        onEndReached={() => {
          if (currentQuery.hasNextPage) {
            currentQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={() => {
          if (currentQuery.isLoading) return null;
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{i18n.t("home.listEmpty")}</Text>
            </View>
          );
        }}
        ListFooterComponent={renderFooter}
      />
    );
  };

  // 修改语言切换按钮的点击处理
  const handleLanguageToggle = async () => {
    const newLanguage = await toggleLanguage();
    setCurrentLanguage(newLanguage);
  };

  // const checkVsersion = async () => {
  //   const res = await checkUpdate();
  //   if (res.needsUpdate) {
  //     setIsVisible(true);
  //     setVersionData(res);
  //   }
  // };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ flex: 1 }}>
        {/* 资产卡片 */}
        {renderAssetCard()}

        {/* 代币列表 - 注意这里不再使用 ScrollView 包裹 */}
        <View style={[styles.tokenListContainer, { flex: 1 }]}>
          {currentQuery.isLoading || balanceLoading ? (
            <SkeletonCoinListItem />
          ) : (
            renderTokenList()
          )}
        </View>
      </View>
      {versionData?.version && (
        <UpdateModal
          versionData={versionData}
          onClose={handleClose}
          isVisible={isVisible}
        ></UpdateModal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.secondaryColors[900],
  },
  balanceLabel: {
    color: Theme.secondaryColors[500],
    fontSize: 16,
    fontWeight: "bold",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: Theme.secondaryColors[900],
  },
  gainersContainer: {
    paddingRight: 16,
    gap: 8,
    flexDirection: "row",
  },
  assetCardContainer: {
    backgroundColor: "#E6EFFF",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  assetCardContent: {
    padding: 20,
    zIndex: 2, // 确保内容在图片上方
  },
  assetCardBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 380,
    height: 235,
    zIndex: 1, // 确保图片在内容下方
  },
  totalAssetAmount: {
    fontSize: 32,
    fontFamily: FontFamily.semiBold,
    color: "#000",
    marginBottom: 4,
  },
  totalAssetLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: "#666",
  },
  assetCardSkeleton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#EBEBEB",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 24,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  tabButton: {
    paddingTop: 10,
    paddingBottom: 5,
    marginHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontFamily: FontFamily.semiBold,
  },
  tokenListContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  topButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  topButtonsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 16,
  },
  languageText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[100],
    marginLeft: 4,
  },
  topIconBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10, // 确保在其他元素之上
  },
  topIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconTabButton: {
    marginRight: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Theme.grayColors[100],
    fontFamily: FontFamily.regular,
  },
  draggableItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  loadingFooter: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: Theme.secondaryColors[400],
    fontFamily: FontFamily.regular,
  },
  skeletonBalance: {
    height: 32,
    width: 120,
    backgroundColor: "#EBEBEB",
    borderRadius: 4,
  },
  languageButton: {
    alignItems: "center",
  },
});

export default HomeScreen;

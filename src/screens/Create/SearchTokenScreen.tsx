import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
import { UiToken } from "../../types/token";
import { useNavigation } from "@react-navigation/native";
import SearchHeader from "../../components/SearchHeader";
import { RecentTokenStorage } from "../../storage";
import Chip from "../../components/Chip";
import CoinListItem from "../../components/CoinListItem";
import { Theme } from "../../constants/Theme";
import i18n from '../../i18n';
import { SafeAreaView } from "react-native-safe-area-context";
import { FontFamily } from "../../constants/typo";
import { useTokenList } from "../../hooks/useTokenList";
import SkeletonCoinListItem from "../../components/SkeletonCoinListItem";
import { useSearchTokens } from "../../hooks/useSearchTokens";
import AppBar from "../../components/AppBar";
import Feather from '@expo/vector-icons/Feather';
import { RouterName } from "../../constants/navigation";
const NoResultsImage = require('@assets/common/noResults.png');

const SearchTokenScreen = () => {
  const navigation = useNavigation<any>();
  const [recentTokens, setRecentTokens] = useState<UiToken[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = useMemo(() => Boolean(searchQuery.trim()), [searchQuery]);
  
  // 使用 useSearchTokens 钩子获取搜索结果
  const { 
    data: searchResults = [], 
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useSearchTokens(searchQuery);

  // 使用 useTokenList 钩子获取热门代币
  const trendingQuery = useTokenList('trending');
  
  // 使用 useMemo 获取所有热门代币
  const trendingTokens = useMemo(() => 
    trendingQuery.data?.pages.flat() || [], 
    [trendingQuery.data]
  );

  // 加载最近搜索的代币
  useEffect(() => {
    RecentTokenStorage.getRecentTokens().then(setRecentTokens);
  }, []);

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 处理代币点击
  const handleTokenPress = useCallback(async (token: UiToken) => {
    console.log('Token pressed:', token);
    await RecentTokenStorage.addRecentToken(token);
    const updated = await RecentTokenStorage.getRecentTokens();
    setRecentTokens(updated);
    // 导航到 CreatePostScreen 并传递选中的代币
    navigation.navigate(RouterName.CREATE_POST, { token });
  }, [navigation]);

  // 清除最近搜索
  const handleClearRecent = useCallback(async () => {
    await RecentTokenStorage.clearRecentTokens();
    setRecentTokens([]);
  }, []);

  // 渲染列表底部加载状态
  const renderFooter = useCallback(() => {
    if (!trendingQuery.hasNextPage) return null;
    if (trendingQuery.isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }, [trendingQuery.hasNextPage, trendingQuery.isLoading]);

  // 渲染空状态
  const renderEmpty = useCallback(() => {
    if (trendingQuery.isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {i18n.t('home.listEmpty')}
        </Text>
      </View>
    );
  }, [trendingQuery.isLoading]);

  // 渲染列表头部
  const renderHeader = useCallback(() => (
    <>
      {/* Recent Section - 只在有记录时显示 */}
      {recentTokens.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {i18n.t('search.recent')}
            </Text>
            <TouchableOpacity onPress={handleClearRecent} style={styles.clearButtonContainer}>
              <Feather name="trash-2" size={16} color={Theme.text[100]}/>
              <Text style={styles.clearButton}>
                {i18n.t('search.clear')}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentTokensContainer}
          >
            {recentTokens.map((token) => (
              <Chip
                key={token.mint}
                icon={token.icon}
                label={token.symbol}
                onPress={() => handleTokenPress(token)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top Market Caps Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {i18n.t('search.trending')}
        </Text>
      </View>
    </>
  ), [recentTokens, handleClearRecent, handleTokenPress]);

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title={i18n.t('search.title')}/>
        <SearchHeader onSearch={handleSearch}/>
        {isSearching ? (
          // 搜索结果部分
          searchLoading ? (
            <SkeletonCoinListItem />
          ) : searchResults.length === 0 ? (
            <View style={styles.noResultContainer}>
              <Image 
                source={NoResultsImage}
                style={styles.noResultImage}
              />
              <Text style={styles.noResultText}>
                {i18n.t('search.noResults', { query: searchQuery })}
              </Text>
            </View>
          ) : (
            // 搜索结果列表
            <FlatList
              showsVerticalScrollIndicator={false}
              data={searchResults}
              keyExtractor={(item) => item.mint}
              renderItem={({ item: token }) => (
                <CoinListItem
                  token={token}
                  onPress={() => handleTokenPress(token)}
                />
              )}
              refreshing={searchLoading}
              onRefresh={() => refetchSearch()}
            />
          )
        ) : (
          // 默认视图
          <FlatList
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            data={trendingTokens}
            keyExtractor={(item) => item.mint}
            renderItem={({ item: token }) => (
              <CoinListItem
                token={token}
                onPress={() => handleTokenPress(token)}
              />
            )}
            refreshing={trendingQuery.isLoading}
            onRefresh={trendingQuery.refetch}
            onEndReached={() => {
              if (trendingQuery.hasNextPage) {
                trendingQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
          />
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[200],
  },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButton: {
    color: Theme.text[100],
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  recentTokensContainer: {
    paddingRight: 16,
    gap: 8,
    flexDirection: 'row',
  },
  loadingIndicator: {
    padding: 20,
    alignItems: 'center',
  },
  noResultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noResultText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  noResultEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultImage: {
    width: 100,
    height: 100,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Theme.grayColors[100],
    fontFamily: FontFamily.regular,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Theme.secondaryColors[400],
    fontFamily: FontFamily.regular,
  },
});

export default SearchTokenScreen;
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import SearchHeader from "../../components/SearchHeader";
import { RecentSearchStorage } from "../../storage";
import Chip from "../../components/Chip";
import { Theme } from "../../constants/Theme";
import i18n from "../../i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontFamily } from "../../constants/typo";
import AppBar from "../../components/AppBar";
import Feather from "@expo/vector-icons/Feather";
import FeedCard from "../../components/Feed/FeedCard";
import { Post } from "../../types";
import TabBar from "../../components/TabBar";
import { Button } from "../../components/Button";
import { followService } from "../../services/content/content";
import { postService } from "src/services/post";
import { userService } from "src/services/user/user";
import { UserInfoData } from "src/types";
import { RouterName } from "src/constants/navigation";
import { useUserInfo } from "src/hooks/useUserInfo";
import { useToast } from "src/contexts/ToastContext";

const DefaultAvatar = require("@assets/common/avatar.png");
const NoResultsImage = require("@assets/common/noResults.png");

type SearchTab = "posts" | "people";

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  const { showToast } = useToast();

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("posts");
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");

  // Some state for post list
  const [postList, setPostList] = useState<Post[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [curPostListPage, setCurPostListPage] = useState(1);

  // Some state for user list
  const [userList, setUserList] = useState<UserInfoData[]>([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [curUserListPage, setCurUserListPage] = useState(1);

  // following users
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // 加载最近搜索记录
  useEffect(() => {
    RecentSearchStorage.getRecentSearches().then(setRecentSearches);
  }, []);
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (activeTab === "posts") {
      getPostListByQuery(searchQuery, 1);
    } else {
      getUserListByUsername(searchQuery, 1);
    }
  }, [activeTab]);

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query);
    if (query.trim()) {
      RecentSearchStorage.addRecentSearch(query.trim());
      RecentSearchStorage.getRecentSearches().then(setRecentSearches);

      if (activeTab === "posts") {
        getPostListByQuery(query, 1);
      } else {
        getUserListByUsername(query, 1);
      }
    }
  }, []);

  const getPostListByQuery = async (query: string, page: number) => {
    const result = await postService.searchPosts(query, page, 10);
    setPostList((prev) =>
      page === 1 ? result.list : [...prev, ...result.list]
    );
    setHasMorePosts(result.has_more);
    setCurPostListPage(page);
  };

  const getUserListByUsername = async (username: string, page: number) => {
    const result = await userService.searchUsersByUsername(username, page, 10);
    const newUserList =
      page === 1 ? result.list : [...userList, ...result.list];
    setUserList(newUserList);
    setHasMoreUsers(result.has_more);
    setCurUserListPage(page);

    const followingUserIds = newUserList
      .filter((user) => user?.isFollowing)
      ?.map((user) => user.id);
    setFollowingUsers(new Set(followingUserIds));
  };

  // 清除最近搜索
  const handleClearRecent = useCallback(async () => {
    await RecentSearchStorage.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  // 处理卡片点击
  const handleCardPress = (item: Post) => {
    navigation.navigate(RouterName.FEED_DETAIL, { item });
  };

  // 处理关注/取消关注
  const handleFollowToggle = async (userId: string) => {
    if (userId === userInfo?.id) {
      showToast("failed", { message: i18n.t("toast.cannotFollowSelf") });
      return;
    }

    // 乐观更新：立即更新UI状态
    const isCurrentlyFollowing = followingUsers.has(userId);
    setFollowingUsers((prev) =>
      isCurrentlyFollowing
        ? new Set([...prev].filter((id) => id !== userId))
        : new Set([...prev, userId])
    );

    try {
      if (isCurrentlyFollowing) {
        await followService.unfollow(userId);
      } else {
        await followService.follow(userId);
      }
      // 成功，保持新状态
    } catch (error) {
      console.error("Follow/Unfollow failed:", error);
      // 失败，回滚到之前的状态
      setFollowingUsers((prev) =>
        isCurrentlyFollowing
          ? new Set([...prev, userId])
          : new Set([...prev].filter((id) => id !== userId))
      );
    }
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (!searchQuery) return null;

    if (activeTab === "posts") {
      if (postList.length === 0) {
        return (
          <View style={styles.noResultContainer}>
            <Image source={NoResultsImage} style={styles.noResultImage} />
            <Text style={styles.noResultText}>
              {i18n.t("search.noResults", { query: searchQuery })}
            </Text>
          </View>
        );
      }

      return (
        <FlatList<Post>
          key="posts-list"
          data={postList}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              onPress={handleCardPress}
              width={(Dimensions.get("window").width - 54) / 2}
            />
          )}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={{ justifyContent: "space-between", gap: 16 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          onEndReached={() => {
            if (hasMorePosts) {
              getPostListByQuery(searchQuery, curPostListPage + 1);
              setCurPostListPage(curPostListPage + 1);
            }
          }}
          onEndReachedThreshold={0.1}
        />
      );
    }

    // 用户搜索结果为空时显示无结果提示
    if (userList.length === 0) {
      return (
        <View style={styles.noResultContainer}>
          <Image source={NoResultsImage} style={styles.noResultImage} />
          <Text style={styles.noResultText}>
            {i18n.t("search.noResults", { query: searchQuery })}
          </Text>
        </View>
      );
    }

    return (
      <FlatList<UserInfoData>
        key="people-list"
        showsVerticalScrollIndicator={false}
        data={userList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => {
              navigation.navigate(RouterName.CREATOR_PROFILE, {
                creatorId: item.id,
              });
            }}
          >
            <Image
              source={item.avatar ? { uri: item.avatar } : DefaultAvatar}
              style={styles.userAvatar}
              contentFit="cover"
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>
                {item.nickname || i18n.t("common.notSet")}
              </Text>
              <Text style={styles.statText}>@{item.username}</Text>
              <View style={styles.userStats}>
                <Text style={styles.statText}>
                  {item.followers.toLocaleString()} {i18n.t("common.followers")}
                </Text>
                {/* <Text style={styles.statText}>
                  {item.posts.toLocaleString()} posts
                </Text> */}
              </View>
            </View>
            <Button
              type="follow"
              isFollowing={followingUsers.has(item.id)}
              onPress={() => handleFollowToggle(item.id)}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 60 }}
        onEndReached={() => {
          if (hasMoreUsers) {
            getUserListByUsername(searchQuery, curUserListPage + 1);
            setCurUserListPage(curUserListPage + 1);
          }
        }}
        onEndReachedThreshold={0.1}
      />
    );
  };

  const tabs = [
    { key: "posts", label: i18n.t("search.tabs.posts") },
    { key: "people", label: i18n.t("search.tabs.people") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title={i18n.t("search.title")} />
      <SearchHeader
        value={searchQuery}
        onSearch={handleSearch}
        placeholder={i18n.t("search.placeholder")}
      />

      {/* 搜索类型切换 */}
      {isSearching && (
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as SearchTab)}
        />
      )}

      {isSearching ? (
        renderSearchResults()
      ) : (
        // 默认视图 - 显示最近搜索记录
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {i18n.t("search.recent")}
                </Text>
                <TouchableOpacity
                  onPress={handleClearRecent}
                  style={styles.clearButtonContainer}
                >
                  <Feather name="trash-2" size={16} color={Theme.text[100]} />
                  <Text style={styles.clearButton}>
                    {i18n.t("search.clear")}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentSearchesContainer}
              >
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={search}
                    onPress={() => handleSearch(search)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearButton: {
    color: Theme.text[100],
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  recentSearchesContainer: {
    paddingRight: 16,
    gap: 8,
    flexDirection: "row",
  },
  noResultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  noResultText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
  noResultImage: {
    width: 100,
    height: 100,
  },
  userItem: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  userStats: {
    flexDirection: "row",
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  recentContainer: {
    flex: 1,
  },
});

export default SearchScreen;

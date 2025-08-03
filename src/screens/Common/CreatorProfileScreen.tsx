import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SectionList,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Dimensions,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import { Ionicons } from "@expo/vector-icons";
import FeedCard from "../../components/Feed/FeedCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import HoldingsSection from "../../components/HoldingsSection";
import TabBar from "../../components/TabBar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { RouterName } from "../../constants/navigation";
import { mockViewsData } from "../../constants";
import { reportService } from "../../services/report";
import { followService } from "../../services/content/content";
import { userService } from "../../services/user/user";
import { Post, UserInfoData } from "../../types";
import { postService } from "src/services";
import FeedCardSkeleton from "src/components/Feed/FeedCardSkeleton";
import ProfileHeaderSkeleton from "src/components/ProfileHeaderSkeleton";
import CompactHeaderSkeleton from "src/components/CompactHeaderSkeleton";
import i18n from "../../i18n";
import NoData from "@assets//rebate/friends_list_null.svg";
import { useUserInfo } from "src/hooks/useUserInfo";
import { useToast } from "src/contexts/ToastContext";

type Section = {
  title: string;
  data: any[];
  renderItem: (info: {
    item: any;
    section: Section;
    index: number;
    separators: any;
  }) => React.ReactElement | null;
  renderSectionHeader?: () => React.ReactElement | null;
};

const CreatorProfileScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  const { showToast } = useToast();

  const creatorId = route.params?.creatorId;
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserInfoData | null>(null);
  const [activeTab, setActiveTab] = useState<"Posts" | "Holdings">("Posts");
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  useEffect(() => {
    getUserProfile();
    getUserPosts(1, 10);
  }, [creatorId]);

  const getUserProfile = async () => {
    if (!creatorId) return;
    try {
      setLoading(true);
      const userData = await userService.fetchUserInfoByUserId(creatorId);
      setUserProfile(userData);
      setIsFollowing(userData.isFollowing);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const getUserPosts = async (
    page: number,
    pageSize: number,
    isLoadMore = false
  ) => {
    if (!creatorId) return;
    try {
      if (isLoadMore) {
        setIsLoadingMorePosts(true);
      } else {
        setIsLoadingPosts(true);
      }

      const posts = await postService.fetchUserPosts(creatorId, page, pageSize);

      if (isLoadMore) {
        setUserPosts((prevPosts) => [...prevPosts, ...posts.list]);
      } else {
        setUserPosts(posts.list);
      }

      setHasMorePosts(posts.has_more);
      setPostsPage(page);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    } finally {
      if (isLoadMore) {
        setIsLoadingMorePosts(false);
      } else {
        setIsLoadingPosts(false);
      }
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const isHeaderVisible = viewableItems.some(
        (item) => item.section?.title === "header"
      );
      setShowCompactHeader(!isHeaderVisible);
    },
    []
  );
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (!viewableItems || viewableItems.length === 0) return;

      const postIds = viewableItems.flatMap(({ item }) =>
        item?.id ? [item.id] : []
      );

      if (postIds.length > 0) {
        reportService.trackImpressions(postIds);
      }
    },
    []
  );
  const handlePostPress = useCallback(
    (item: any) => {
      reportService.flushAll();
      navigation.navigate(RouterName.FEED_DETAIL, { item });
    },
    [navigation]
  );
  const handleBackPress = useCallback(() => {
    reportService.flushAll();
    navigation.goBack();
  }, [navigation]);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Posts" | "Holdings");
  };
  const handleFollowPress = async () => {
    if (!creatorId) return;
    if (creatorId === userInfo?.id) {
      showToast("failed", { message: i18n.t("toast.cannotFollowSelf") });
      return;
    }

    // 乐观更新：立即更新UI状态
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (previousState) {
        await followService.unfollow(creatorId);
      } else {
        await followService.follow(creatorId);
      }
    } catch (error) {
      setIsFollowing(previousState);
      console.error("Follow/Unfollow failed:", error);
    }
  };
  const handleSharePress = () => {
    if (!creatorId) return;
    console.log("🚀🚀🚀 handleSharePress creatorId:", creatorId);
  };

  const renderPostsLoadingSkeleton = () => {
    return (
      <View style={styles.contentContainer}>
        <FlatList
          data={[...Array(6).keys()]}
          renderItem={() => (
            <FeedCardSkeleton
              width={(Dimensions.get("window").width - 48) / 2}
            />
          )}
          numColumns={2}
          keyExtractor={(_, index) => `skeleton-${index}`}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.skeletonContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>
    );
  };

  const renderPostsEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <NoData width={140} height={140} />
        <Text style={styles.emptyText}>
          {i18n.t("holdings.empty.posts.title")}
        </Text>
      </View>
    );
  };

  const renderLoadMoreFooter = () => {
    if (!isLoadingMorePosts) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <FeedCardSkeleton width={(Dimensions.get("window").width - 48) / 2} />
        <FeedCardSkeleton width={(Dimensions.get("window").width - 48) / 2} />
      </View>
    );
  };

  const sections: Section[] = [
    {
      title: "header",
      data: [{}],
      renderItem: ({ item, section, index, separators }) => {
        if (loading || !userProfile) {
          return <ProfileHeaderSkeleton />;
        }

        return (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.infoBlock}>
              <View style={styles.infoContainer}>
                <Text style={styles.nickname}>{userProfile.nickname}</Text>
                <Text style={styles.username}>@{userProfile.username}</Text>
              </View>
              <Image
                source={{ uri: userProfile.avatar }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.bio}>{userProfile.bio || ""}</Text>
            <Text style={styles.followers}>
              {userProfile.followers || 0} {i18n.t("common.followers")}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={handleFollowPress}
              >
                <Ionicons
                  name={isFollowing ? "person-outline" : "person-add-outline"}
                  size={16}
                  color={Theme.primary}
                />
                <Text style={styles.actionBtnText}>
                  {isFollowing
                    ? i18n.t("common.following")
                    : i18n.t("common.follow")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSharePress}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={Theme.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      },
    },
    {
      title: "TabBar",
      data: [{}],
      renderItem: () => null,
      renderSectionHeader: () => (
        <TabBar
          tabs={[
            { key: "Posts", label: "Posts" },
            { key: "Holdings", label: "Holdings" },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          containerStyle={{ paddingHorizontal: 16 }}
        />
      ),
    },
    {
      title: "Content",
      data: [{}],
      renderItem: ({ item, section, index, separators }) => {
        if (activeTab === "Posts") {
          if (isLoadingPosts) {
            return renderPostsLoadingSkeleton();
          }
          return (
            <FlatList
              key={`feed-${userPosts.length}`}
              data={userPosts}
              renderItem={({ item }) => (
                <FeedCard
                  item={item}
                  width={(Dimensions.get("window").width - 48) / 2}
                  onPress={() => handlePostPress(item)}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              onViewableItemsChanged={handleViewableItemsChanged}
              ListEmptyComponent={renderPostsEmpty}
              ListFooterComponent={renderLoadMoreFooter}
              onEndReached={() => {
                if (hasMorePosts && !isLoadingMorePosts) {
                  getUserPosts(postsPage + 1, 10, true);
                }
              }}
              onEndReachedThreshold={0.5}
            />
          );
        }
        if (activeTab === "Holdings") {
          return <HoldingsSection userId={creatorId} />;
        }
        return null;
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.stickyHeaderContent}>
        <TouchableOpacity onPress={() => handleBackPress()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Theme.text[300]} />
        </TouchableOpacity>
        {showCompactHeader && (
          <>
            {loading || !userProfile ? (
              <CompactHeaderSkeleton />
            ) : (
              <View style={styles.compactHeader}>
                <View style={styles.compactLeft}>
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={styles.compactAvatar}
                  />
                  <Text style={styles.compactUsername}>
                    {userProfile.nickname}
                  </Text>
                </View>
                <Button
                  type="follow"
                  isFollowing={isFollowing}
                  onPress={handleFollowPress}
                />
              </View>
            )}
          </>
        )}
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Theme.text[300]}
          />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
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
        contentContainerStyle={styles.sectionListContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  stickyHeader: {
    backgroundColor: "white",
  },
  stickyHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  compactHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  compactLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  compactUsername: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  infoBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  nickname: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
  },
  username: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    color: Theme.text[200],
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  followers: {
    fontSize: 13,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: {
    color: Theme.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    marginLeft: 4,
  },
  sectionListContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    fontWeight: "400",
    fontSize: 12,
    marginTop: 24,
  },
  skeletonContainer: {
    paddingBottom: 20,
  },
  loadMoreContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    paddingVertical: 8,
  },
});

export default CreatorProfileScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { RouterName } from '../../constants/navigation';
import { UserInfoData } from '../../types';
import { userService } from '../../services/user/user';
import { followService } from '../../services/content/content';
import { Button } from '../../components/Button';
import AppBar from '../../components/AppBar';
import NoData from '@assets/rebate/friends_list_null.svg';
import i18n from '../../i18n';

const DefaultAvatar = require('@assets/common/avatar.png');

const FollowersScreen = () => {
  const navigation = useNavigation<any>();
  const [followersList, setFollowersList] = useState<UserInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextStart, setNextStart] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFollowersList();
  }, []);

  const fetchFollowersList = async (start = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (start === 0) {
        setLoading(true);
      }

      const result = await userService.fetchFollowersList(start, 20);

      if (isRefresh || start === 0) {
        setFollowersList(result.list);
      } else {
        setFollowersList(prev => [...prev, ...result.list]);
      }

      setHasMore(result.has_more);
      setNextStart(result.next);

      // 设置关注状态，这里需要检查哪些用户是我们关注的
      const followingUserIds = result.list.filter(user => user?.isFollowing).map(user => user.id);
      setFollowingUsers(new Set(followingUserIds));
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFollowersList(0, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchFollowersList(nextStart);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    // 乐观更新：立即更新UI状态
    const isCurrentlyFollowing = followingUsers.has(userId);
    setFollowingUsers(prev =>
      isCurrentlyFollowing ? new Set([...prev].filter(id => id !== userId)) : new Set([...prev, userId])
    );

    try {
      if (isCurrentlyFollowing) {
        await followService.unfollow(userId);
      } else {
        await followService.follow(userId);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      // 失败，回滚到之前的状态
      setFollowingUsers(prev =>
        isCurrentlyFollowing ? new Set([...prev, userId]) : new Set([...prev].filter(id => id !== userId))
      );
    }
  };

  const renderUserItem = ({ item }: { item: UserInfoData }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        navigation.navigate(RouterName.CREATOR_PROFILE, {
          creatorId: item.id,
        });
      }}
    >
      <Image source={item.avatar ? { uri: item.avatar } : DefaultAvatar} style={styles.userAvatar} contentFit="cover" />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.nickname || i18n.t('common.notSet')}</Text>
        <Text style={styles.statText}>@{item.username}</Text>
        <View style={styles.userStats}>
          <Text style={styles.statText}>
            {item.followers?.toLocaleString()} {i18n.t('common.followers')}
          </Text>
        </View>
      </View>
      <Button type="follow" isFollowing={followingUsers.has(item.id)} onPress={() => handleFollowToggle(item.id)} />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore || followersList.length === 0) return null;
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={Theme.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <NoData width={140} height={140} />
      <Text style={styles.emptyText}>{i18n.t('holdings.followersPage.empty')}</Text>
      <Text style={styles.emptySubtext}>{i18n.t('holdings.followersPage.emptySubtext')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title={i18n.t('holdings.followersPage.title')} />

      <FlatList
        data={followersList}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={followersList.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  emptyContentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    textAlign: 'center',
  },
});

export default FollowersScreen;

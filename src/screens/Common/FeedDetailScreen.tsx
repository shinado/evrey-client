import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, TextInput } from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { Post, Comment, Reply } from '../../types';
import TokenIcon from '../../components/TokenIcon';
import MediaPlayer from '../../components/Feed/MediaPlayer';
import ImageGallery from '../../components/Feed/ImageGallery';
import CommentItem from '../../components/Feed/CommentItem';
import CommentItemSkeleton from '../../components/Feed/CommentItemSkeleton';
import TradeItem, { TradeData } from '../../components/TradeItem';
import TradeItemSkeleton from '../../components/TradeItemSkeleton';
import i18n from '../../i18n';
import { Image } from 'expo-image';
import { Button } from '../../components/Button';
import CoinIcon from '../../../assets/common/coin.svg';
import HeartIcon from '../../../assets/common/heart.svg';
import { DefaultAvatar } from '../../constants/icons';
import { CoinFormatUtil, formatDate } from '../../utils';
import { RouterName } from '../../constants/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { RootStackParamList } from '../../navigation/types';
import { useFeedInfo, CONTENT_LIST_KEYS } from '../../hooks/useContentList';
import { useCommentList, COMMENT_KEYS } from '../../hooks/useCommentList';
import { followService } from '../../services/content/content';
import { favoriteService } from '../../services/engagement/favorite';
import { queryClient } from '../../services/config/queryClient';
import { updatePostLike } from '../../utils/cacheUtils';
import { commentService } from 'src/services/engagement/comment';
import NoData from '@assets//rebate/friends_list_null.svg';
import { useToast } from '../../contexts/ToastContext';
import { usePostTradeHistory, POST_HISTORY_KEYS } from 'src/hooks/usePostTradeHistory';
import { useTrade } from '../../contexts/TradeContext';
import { useUserInfo } from 'src/hooks/useUserInfo';

type FeedDetailScreenRouteProp = RouteProp<RootStackParamList, RouterName.FEED_DETAIL>;

// 定义列表项类型
type ListItem =
  | { type: 'post'; data: Post }
  | { type: 'comment'; data: Comment }
  | { type: 'tabs'; data: null }
  | { type: 'trade'; data: null }
  | { type: 'commentInput'; data: null }
  | { type: 'loadMore'; data: null }
  | { type: 'commentSkeleton'; data: null }
  | { type: 'commentEmpty'; data: null };

const FeedDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userInfo } = useUserInfo();
  const { showToast } = useToast();

  const route = useRoute<FeedDetailScreenRouteProp>();
  const { item: initialItem, isPreview = false, onPublish } = route.params;
  const { trades } = useTrade();

  const [activeTab, setActiveTab] = useState<'comments' | 'trades'>('comments');

  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isPostLiked, setIsPostLiked] = useState(initialItem.isFavorited || false);
  const [postLikeCount, setPostLikeCount] = useState(initialItem.favoritesCount || 0);
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  // 回复状态管理
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    userId: string;
    nickname: string;
  } | null>(null);
  const { language } = useLanguage();

  // 使用 useFeedInfo hook 获取最新的 feed 数据（仅在非预览模式下）
  const { data: feedInfo, isLoading, error } = useFeedInfo(isPreview ? '' : initialItem.id);

  // 使用 useCommentList hook 获取评论数据（仅在非预览模式下）
  const {
    data: commentData,
    isLoading: commentsLoading,
    error: commentsError,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingMoreComments,
  } = useCommentList(isPreview ? '' : initialItem.id, '10');

  // 简单合并数据：优先使用 feedInfo，但保留 initialItem 中 feedInfo 没有的字段
  const item = useMemo(() => {
    if (isPreview) return initialItem;
    return feedInfo ? { ...initialItem, ...feedInfo } : initialItem;
  }, [feedInfo, initialItem, isPreview]);

  // 当获取到最新数据时，同步更新点赞状态
  useEffect(() => {
    if (feedInfo && !isPreview) {
      setIsFollowing(feedInfo.isFollowed || initialItem.isFollowed || false);
      setIsPostLiked(feedInfo.isFavorited || initialItem.isFavorited || false);
      setPostLikeCount(feedInfo.favoritesCount || initialItem.favoritesCount || 0);
    }
  }, [feedInfo, isPreview]);

  // 从缓存中同步点赞状态（当从列表页返回时）
  useEffect(() => {
    if (!isPreview) {
      const cachedData = queryClient.getQueryData(CONTENT_LIST_KEYS.detail(item.id));
      if (cachedData) {
        const cachedPost = cachedData as Post;
        setIsFollowing(cachedPost.isFollowed || false);
        setIsPostLiked(cachedPost.isFavorited || false);
        setPostLikeCount(cachedPost.favoritesCount || 0);
      }
    }
  }, [item.id, isPreview]);

  // 处理评论数据
  const comments = useMemo(() => {
    if (isPreview) return [];
    if (!commentData?.pages) return [];
    return commentData.pages.flatMap(page => page.items);
  }, [commentData, isPreview]);

  const {
    data: postTradeHistory,
    isLoading: isLoadingPostTradeHistory,
    hasNextPage: hasMorePostTradeHistory,
    fetchNextPage: fetchNextPostTradeHistory,
    refetch: refetchPostTradeHistory,
  } = usePostTradeHistory(initialItem.id);
  const postTradeHistoryList = postTradeHistory?.pages.flatMap(page => page.items);

  // 当页面重新获得焦点时，刷新交易历史数据
  useFocusEffect(
    useCallback(() => {
      if (!isPreview) {
        // 延迟1.2秒刷新交易历史数据，避免数据更新不及时
        setTimeout(() => {
          // 刷新交易历史数据
          refetchPostTradeHistory();
          // 同时刷新帖子信息
          queryClient.invalidateQueries({ queryKey: CONTENT_LIST_KEYS.detail(initialItem.id) });
        }, 1200);
      }
    }, [refetchPostTradeHistory, initialItem.id, isPreview])
  );

  useEffect(() => {
    const initialLikeCounts = new Map<string, number>();
    const initialLikedComments = new Set<string>();

    // 初始化评论的点赞数量和状态
    comments.forEach(comment => {
      initialLikeCounts.set(comment.id, comment.like_count || 0);
      if (comment.is_liked) {
        initialLikedComments.add(comment.id);
      }

      // 初始化回复的点赞数量和状态
      if (comment.replies?.list?.length > 0) {
        comment.replies.list.forEach(reply => {
          initialLikeCounts.set(reply.id, reply.like_count || 0);
          if (reply.is_liked) {
            initialLikedComments.add(reply.id);
          }
        });
      }
    });

    setLikeCounts(initialLikeCounts);
    setLikedComments(initialLikedComments);
  }, [comments]);

  // 构建 FlatList 数据源
  const listData = useMemo<ListItem[]>(() => {
    const data: ListItem[] = [];

    // 添加帖子内容
    data.push({ type: 'post', data: item });

    // Tabs
    data.push({ type: 'tabs', data: null });

    // 如果是交易标签页，添加交易容器
    if (activeTab === 'trades') {
      data.push({ type: 'trade', data: null });
    }

    // 添加评论输入框 (只在评论标签页显示)
    if (activeTab === 'comments') {
      data.push({ type: 'commentInput', data: null });
    }

    // 如果正在加载评论且还没有评论数据，显示骨架屏
    if (activeTab === 'comments') {
      if (commentsLoading && comments.length === 0 && !isPreview) {
        // 添加3个评论骨架屏
        for (let i = 0; i < 3; i++) {
          data.push({ type: 'commentSkeleton', data: null });
        }
      } else if (!commentsLoading && comments.length === 0 && !isPreview) {
        // 如果加载完成且没有评论，显示空状态
        data.push({ type: 'commentEmpty', data: null });
      } else {
        // 添加评论列表
        comments.forEach(comment => {
          data.push({ type: 'comment', data: comment });
        });

        // 添加加载更多按钮
        if (hasMoreComments) {
          data.push({ type: 'loadMore', data: null });
        }
      }
    }

    return data;
  }, [item, comments, hasMoreComments, commentsLoading, isPreview, activeTab]);

  const handleAuthorPress = () => {
    navigation.navigate(RouterName.CREATOR_PROFILE, {
      creatorId: item?.author?.id,
    });
  };

  const handleReply = (commentId: string, userId: string, nickname: string) => {
    console.log('Reply to comment:', commentId, 'from user:', nickname);
    setReplyingTo({ commentId, userId, nickname }); // 保存回复目标信息
    setIsCommentInputFocused(true);
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
    setIsCommentInputFocused(false);
  };

  // 发送评论或回复
  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const params: {
        postId: number;
        content: string;
        repliedId?: number;
        repliedTopId?: number;
      } = {
        postId: parseInt(item.id),
        content: commentText.trim(),
      };

      // 如果是回复，添加回复相关参数
      if (replyingTo) {
        params.repliedId = parseInt(replyingTo.commentId); // 被回复的评论ID
        params.repliedTopId = parseInt(replyingTo.userId); // 被回复的用户ID (顶级回复ID)
      }

      console.log('🚀🚀🚀 发送评论参数:', params);

      await commentService.createComment(params);

      // 发送成功后清空输入框和回复状态
      setCommentText('');
      setReplyingTo(null);
      setIsCommentInputFocused(false);

      // 刷新评论列表 - 使用正确的查询键格式
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.list(item.id),
      });

      // 对于无限查询，重置到第一页以确保显示最新评论
      queryClient.resetQueries({
        queryKey: COMMENT_KEYS.list(item.id),
      });
    } catch (error) {
      console.error('发送评论失败:', error);
      showToast('failed', { message: '发送评论失败' });
    }
  };

  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    if (item.author.id === userInfo?.id) {
      showToast('failed', { message: i18n.t('toast.cannotFollowSelf') });
      return;
    }
    // 乐观更新：立即更新UI状态
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (previousState) {
        await followService.unfollow(item.author.id);
      } else {
        await followService.follow(item.author.id);
      }
      // 成功，保持新状态
    } catch (error) {
      console.error('Follow/Unfollow failed:', error);
      // 失败，回滚到之前的状态
      setIsFollowing(previousState);
    }
  };

  // 处理帖子点赞/取消点赞
  const handlePostLike = async () => {
    // 乐观更新：立即更新UI状态
    const previousLiked = isPostLiked;
    const previousCount = postLikeCount;

    setIsPostLiked(!isPostLiked);
    setPostLikeCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      if (previousLiked) {
        await favoriteService.removeFavorite(item.id);
      } else {
        await favoriteService.addFavorite(item.id);
      }

      // 成功，更新缓存
      updatePostLike(
        queryClient,
        item.id,
        !isPostLiked,
        previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1
      );
    } catch (error) {
      console.error('Post like/unlike failed:', error);
      // 失败，回滚到之前的状态
      setIsPostLiked(previousLiked);
      setPostLikeCount(previousCount);
    }
  };

  const handleLike = async (commentId: string) => {
    // 获取当前状态
    const isCurrentlyLiked = likedComments.has(commentId);
    const currentCount = likeCounts.get(commentId) || 0;

    // 乐观更新：立即更新UI状态
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setLikeCounts(prev => {
      const newMap = new Map(prev);
      if (isCurrentlyLiked) {
        // 取消点赞，数量减1
        newMap.set(commentId, Math.max(0, currentCount - 1));
      } else {
        // 点赞，数量加1
        newMap.set(commentId, currentCount + 1);
      }
      return newMap;
    });

    try {
      // 调用API
      if (isCurrentlyLiked) {
        await commentService.unlikeComment(commentId);
      } else {
        await commentService.likeComment(commentId);
      }
      // 成功，保持乐观更新的状态，并刷新评论数据以确保服务端状态同步
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.list(item.id),
      });

      // 同时刷新所有回复数据，确保动态加载的回复状态也同步
      queryClient.invalidateQueries({
        queryKey: ['comments', 'replies', item.id],
      });
    } catch (error) {
      console.error('Comment like/unlike failed:', error);
      // 失败，回滚到之前的状态
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });

      setLikeCounts(prev => {
        const newMap = new Map(prev);
        if (isCurrentlyLiked) {
          newMap.set(commentId, currentCount);
        } else {
          newMap.set(commentId, Math.max(0, currentCount - 1));
        }
        return newMap;
      });
    }
  };

  const handleLoadMoreReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      newSet.add(commentId);
      return newSet;
    });
  };

  const handleUpdateReplyStates = (replies: Reply[]) => {
    // 更新动态加载的回复的点赞状态
    setLikedComments(prev => {
      const newSet = new Set(prev);
      replies.forEach(reply => {
        if (reply.is_liked) {
          newSet.add(reply.id);
        }
      });
      return newSet;
    });

    // 更新动态加载的回复的点赞数量
    setLikeCounts(prev => {
      const newMap = new Map(prev);
      replies.forEach(reply => {
        newMap.set(reply.id, reply.like_count || 0);
      });
      return newMap;
    });
  };

  // 渲染帖子内容
  const renderPostContent = (post: Post) => {
    return (
      <View style={styles.postContent}>
        {/* 先显示图片部分 - 横向滑动 */}
        {post.media.images && post.media.images.length > 0 && <ImageGallery images={post.media.images} />}

        {/* 视频部分 */}
        {post.media.videos && post.media.videos.length > 0 && (
          <MediaPlayer url={post.media.videos[0]} previewImageUrl={post.head_img} />
        )}

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.content}</Text>
        <Text style={styles.date}>{formatDate(post.created_at, language)}</Text>
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[activeTab === 'comments' && styles.tabBarItemActive]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabBarText, activeTab === 'comments' && styles.tabBarTextActive]}>
            {i18n.t('feedDetail.tabs.comments', { count: comments.length })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[activeTab === 'trades' && styles.tabBarItemActive]}
          onPress={() => setActiveTab('trades')}
        >
          <Text style={[styles.tabBarText, activeTab === 'trades' && styles.tabBarTextActive]}>
            {i18n.t('feedDetail.tabs.trades', {
              count: postTradeHistoryList?.length || 0,
            })}
          </Text>
        </TouchableOpacity>
        <View style={styles.tabBarLine} />
      </View>
    );
  };

  // 渲染交易容器 - 统一处理所有交易相关的渲染逻辑
  const renderTrade = () => {
    if (isLoadingPostTradeHistory && !postTradeHistoryList?.length) {
      return (
        <View>
          {Array.from({ length: 3 }).map((_, index) => (
            <TradeItemSkeleton key={`trade-skeleton-${index}`} />
          ))}
        </View>
      );
    }

    if (!isLoadingPostTradeHistory && !postTradeHistoryList?.length) {
      return (
        <View style={styles.emptyContainer}>
          <NoData width={140} height={140} />
          <Text style={styles.emptyText}>{i18n.t('feedDetail.trade.noTrades')}</Text>
          <Text style={styles.emptySubText}>{i18n.t('feedDetail.trade.noTradesSubtext')}</Text>
        </View>
      );
    }

    return (
      <View>
        {postTradeHistoryList?.map(trade => (
          <TradeItem
            key={trade.id}
            trade={trade}
            onPress={trade => {
              console.log('Trade pressed:', trade.id);
            }}
          />
        ))}
      </View>
    );
  };

  // 渲染评论输入框
  const renderCommentInput = () => {
    return (
      <View style={styles.commentInputContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              {i18n.t('feed.comments.replyingTo')} @{replyingTo.nickname}
            </Text>
            <TouchableOpacity onPress={handleCancelReply} hitSlop={10}>
              <Ionicons name="close" size={20} color={Theme.text[300]} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.commentInputBar}>
          <Image
            source={item?.author?.avatar ? { uri: item?.author?.avatar } : DefaultAvatar}
            style={styles.commentInputAvatar}
          />
          <View style={styles.commentInputBox}>
            <TextInput
              style={styles.commentInput}
              placeholder={
                replyingTo
                  ? `${i18n.t('feed.comments.reply')} @${replyingTo.nickname}...`
                  : i18n.t('feed.commentPlaceholder')
              }
              placeholderTextColor={Theme.textColors[200]}
              value={commentText}
              onChangeText={setCommentText}
              underlineColorAndroid="transparent"
              onFocus={() => setIsCommentInputFocused(true)}
              onBlur={() => setIsCommentInputFocused(false)}
              multiline
              maxLength={500}
            />
          </View>
          {commentText.trim() && (
            <Button type="primary" style={{ height: 38 }} onPress={handleSendComment} disabled={!commentText.trim()}>
              {i18n.t('feed.send')}
            </Button>
          )}
        </View>
      </View>
    );
  };

  // 渲染单个评论
  const renderComment = (comment: Comment) => {
    return (
      <View style={styles.commentContainer}>
        <CommentItem
          comment={comment}
          isAuthorId={item.author.id}
          likedComments={likedComments}
          likeCounts={likeCounts}
          expandedComments={expandedComments}
          onLike={handleLike}
          onReply={handleReply}
          onLoadMoreReplies={handleLoadMoreReplies}
          onUpdateReplyStates={handleUpdateReplyStates}
          postId={item.id}
        />
      </View>
    );
  };

  // 渲染加载更多按钮
  const renderLoadMore = () => {
    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={() => fetchNextComments()}
        disabled={isFetchingMoreComments}
      >
        <Text style={styles.loadMoreButtonText}>
          {isFetchingMoreComments ? i18n.t('feed.comments.loading') : i18n.t('feed.comments.loadMore')}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染评论空状态
  const renderCommentsEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <NoData width={140} height={140} />
        <Text style={styles.emptyText}>{i18n.t('feed.comments.empty')}</Text>
        <Text style={styles.emptySubText}>{i18n.t('feed.comments.emptySubtext')}</Text>
      </View>
    );
  };

  // FlatList 渲染函数
  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'post':
        return isCommentInputFocused ? null : renderPostContent(item.data);
      case 'tabs':
        return renderTabs();
      case 'trade':
        return activeTab === 'trades' ? renderTrade() : null;
      case 'commentInput':
        return activeTab === 'comments' ? renderCommentInput() : null;
      case 'comment':
        return activeTab === 'comments' && !isCommentInputFocused ? renderComment(item.data) : null;
      case 'loadMore':
        return renderLoadMore();
      case 'commentSkeleton':
        return isCommentInputFocused ? null : <CommentItemSkeleton />;
      case 'commentEmpty':
        return isCommentInputFocused ? null : renderCommentsEmpty();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={Theme.text[300]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAuthorPress} hitSlop={10} style={styles.headerAuthor}>
            <Image
              source={item?.author?.avatar ? { uri: item.author.avatar } : DefaultAvatar}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerAuthorName} numberOfLines={1} ellipsizeMode="tail">
              {item?.author?.nickname || item?.author?.username}
            </Text>
          </TouchableOpacity>
        </View>
        {!isPreview && <Button type="follow" isFollowing={isFollowing} onPress={handleFollowToggle} />}
      </View>

      <FlatList<ListItem>
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
      />

      {/* 底部栏 - 预览模式和正式模式显示不同内容 */}
      <View style={styles.bottomBar}>
        {isPreview ? (
          <Button type="primary" style={{ flex: 1 }} onPress={onPublish}>
            {i18n.t('feed.publish')}
          </Button>
        ) : (
          <View style={styles.bottomBarContent}>
            <Button
              type="primary"
              onPress={() => {
                navigation.navigate(RouterName.TOKEN_INFO, {
                  token: item.coin,
                  postId: item.id,
                });
              }}
              style={styles.tokenButton}
            >
              <TokenIcon icon={item.coin?.icon} size={24} />
              <Text style={styles.tokenBtnText} numberOfLines={1} ellipsizeMode="tail">
                {item.coin?.symbol}
              </Text>
              <Text style={styles.tokenBtnPrice}>${CoinFormatUtil.formatPrice(item.coin?.quoteTokenPriceUsd)}</Text>
            </Button>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handlePostLike}>
                <HeartIcon width={24} height={24} fill={isPostLiked ? 'red' : 'none'} />
                <Text style={styles.actionText}>{postLikeCount}</Text>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <TokenIcon icon={item.coin?.icon} size={24} />
                <Text style={styles.actionText}>{CoinFormatUtil.formatAmount(item.coin?.volume24h)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: 60,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAuthorName: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  date: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Theme.textColors[200],
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  footerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[200],
  },
  relatedTokensSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 12,
    marginLeft: 12,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    fontWeight: '600',
    fontSize: 16,
    color: Theme.secondaryColors[900],
  },
  subText: {
    color: Theme.secondaryColors[400],
    fontSize: 10,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
  },
  singleTokenContainer: {
    flex: 1,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#E6EBF3',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    padding: 12,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tokenButton: {
    flex: 1,
    gap: 8,
  },
  tokenBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FontFamily.bold,
    flex: 1,
  },
  tokenBtnPrice: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  postContent: {
    paddingHorizontal: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  tabBarItemActive: {
    color: Theme.primary,
    borderBottomWidth: 2,
    borderColor: Theme.primary,
    zIndex: 2,
  },
  tabBarTextActive: {
    color: Theme.primary,
  },
  tabBarText: {
    fontSize: 12,
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderRadius: 1,
    position: 'relative',
    zIndex: 1,
  },
  tabBarLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomWidth: 2,
    borderColor: Theme.gray,
  },

  commentInputContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  commentContainer: {
    paddingHorizontal: 16,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.backgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Theme.primary,
  },
  replyingToText: {
    fontSize: 12,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 18,
  },
  commentInputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentInputBox: {
    flex: 1,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 4,
    backgroundColor: Theme.backgroundColor,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  commentInput: {
    fontSize: 13,
    color: Theme.text[300],
    fontFamily: FontFamily.regular,
    padding: 0,
    backgroundColor: 'transparent',
  },
  loadMoreButton: {
    marginVertical: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadMoreButtonText: {
    fontSize: 12,
    color: Theme.primary,
    fontFamily: FontFamily.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: Theme.text[200],
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
});

export default FeedDetailScreen;

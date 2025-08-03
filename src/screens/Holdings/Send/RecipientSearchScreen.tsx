import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../constants/Theme';
import SearchLayout from '../../../layouts/SearchLayout';
import { Platform } from 'react-native';
import { userService } from '../../../services/user/user';
import TokenIcon from '../../../components/TokenIcon';
import { Recipient } from './SendScreen';
import i18n from '../../../i18n';
import { Token } from "../../../types/token"
import { Image } from "expo-image"
import SkeletonCoinListItem from '../../../components/SkeletonCoinListItem';
import { FontFamily } from '../../../constants/typo';
import {DefaultAvatar} from '../../../constants/icons'
import { useUserInfo } from 'src/hooks/useUserInfo';

interface RecipientSearchScreenProps {
  token: Token;
  onSelect: (recipient: Recipient) => void;
  onClose: () => void;
}

const RecipientSearchScreen: React.FC<RecipientSearchScreenProps> = ({
  token,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Recipient[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const currentUserId = useUserInfo().userInfo?.id;

  const handleSearch = async (query: string, isLoadMore = false) => {
    if (!query) {
      setUsers([]);
      setError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const result = await userService.searchUsers(query, currentPage, 10);
      const userList = result?.list.filter(user => user.id !== currentUserId) || [];
      
      if (userList.length > 0) {
        const newUsers = userList.map(userInfo => ({
          uid: Number(userInfo.id),
          username: userInfo.username ?? '',
          avatar: userInfo.avatar ?? '',
        }));

        setUsers(isLoadMore ? [...users, ...newUsers] : newUsers);
        setHasMore(result?.has_more || false);
        setPage(currentPage);
        setError('');
      } else {
        throw new Error('No users found');
      }
    } catch (err) {
      if (!isLoadMore) {
        setUsers([]);
        setError(i18n.t('senduid.error'));
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 简单的防抖：当 searchQuery 变化时，500ms 后执行搜索
  useEffect(() => {
    if (!searchQuery) {
      setUsers([]);
      setError('');
      setPage(1);
      setHasMore(false);
      return;
    }

    const timer = setTimeout(() => {
      setPage(1);
      handleSearch(searchQuery, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleClear = () => {
    setSearchQuery(''); 
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore && searchQuery) {
      handleSearch(searchQuery, true);
    }
  };

  const renderUserItem = ({ item }: { item: Recipient }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => onSelect(item)}
    >
      <Image source={item.avatar ? { uri: item.avatar } : DefaultAvatar} style={styles.avatar} />
      <Text style={styles.username}>@{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <SearchLayout
      title={i18n.t('modes.transfer')}
      onClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.tokenInfo}>
            <TokenIcon icon={token.attributes.image} size={20} />
            <Text style={styles.tokenName}>{token.attributes.name}</Text>
          </View>

          <View style={[styles.inputContainer, !!error && { borderColor: Theme.descend }]}>
            <Text style={styles.input}>@</Text>
            <TextInput
              style={[styles.input,{flex:1}]}
              placeholder={i18n.t('senduid.placeholder')}
              value={searchQuery}
              onChangeText={handleTextChange}
              placeholderTextColor={Theme.secondaryColors[400]}
              autoCapitalize="none"
              keyboardType="default"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={handleClear}>
                <Ionicons name="close" size={20} color={Theme.secondaryColors[800]} />
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : isLoading && users.length === 0 ? (
            <SkeletonCoinListItem />
          ) : (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.uid.toString()}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={isLoading && users.length > 0 ? <SkeletonCoinListItem /> : null}
              contentContainerStyle={styles.flatListContent}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            />
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SearchLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf:'center',
    marginBottom: 24,
    gap:8
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '400',
    color: Theme.text[200],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background[200],
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 44,
    borderColor: Theme.text[200], 
    borderWidth: 1 
  },
  input: {
    fontSize: 14,
    color: Theme.text[300],
  },
  errorText: {
    color: Theme.descend,
    fontSize: 14,
    paddingHorizontal: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Theme.secondaryColors[50],
    borderRadius: 12,
    gap:12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.secondaryColors[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  loadingFooter: {
    paddingVertical: 10,
  },
});

export default RecipientSearchScreen;

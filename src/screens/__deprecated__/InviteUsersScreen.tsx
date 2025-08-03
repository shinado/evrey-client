import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { rebateService, InviteUsersData } from '../../services/__deprecated__/rebate';
import { CoinFormatUtil } from '../../utils/format';
import IconBack from '@assets/userSettings/iconBack.svg';
import i18n from '../../i18n';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";


const PAGE_SIZE = 20;

const InviteUsersScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<InviteUsersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isRefresh = false) => {
    try {
      const currentPage = isRefresh ? 1 : page;
      const data = await rebateService.getInviteUsers({
        page: currentPage,
        limit: PAGE_SIZE
      });
      
      const newUsers = Array.isArray(data) ? data : [];
      setUsers(isRefresh ? newUsers : [...users, ...newUsers]);
      setHasMore(newUsers.length === PAGE_SIZE);
      if (!isRefresh) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('获取邀请用户列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchUsers(true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchUsers();
    }
  };

  const renderItem = ({ item }: { item: InviteUsersData }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={Theme.secondaryColors[400]} />
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.wallet}>{CoinFormatUtil.formatAddressShort(item.wallet)}</Text>
        </View>
      </View>
      <Text style={styles.amount}>
        ${CoinFormatUtil.formatPrice((item.rewards || 0) / 1000000)}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Theme.brand.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <IconBack width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('rebate.invited_friends')}</Text>
      </View>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background[50],
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.background[100],
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    flex: 1,
  },
  list: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.background[100],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Theme.secondaryColors[100],
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 4,
  },
  wallet: {
    fontSize: 12,
    color: Theme.text[100],
  },
  amount: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default InviteUsersScreen; 
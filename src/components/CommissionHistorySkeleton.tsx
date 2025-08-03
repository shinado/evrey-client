import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

interface CommissionHistorySkeletonProps {
  showSingleItem?: boolean;
}

const CommissionHistorySkeleton: React.FC<CommissionHistorySkeletonProps> = ({ showSingleItem = false }) => {
  const renderSingleItem = () => (
    <View style={styles.container}>
      {/* 用户信息行骨架 */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Skeleton
            isLoading={true}
            layout={{
              width: 24,
              height: 24,
              borderRadius: 4,
              marginRight: 8,
            }}
          />
          <Skeleton
            isLoading={true}
            layout={{
              width: 60,
              height: 16,
              borderRadius: 8,
            }}
          />
        </View>
        <Skeleton
          isLoading={true}
          layout={{
            width: 100,
            height: 12,
            borderRadius: 6,
          }}
        />
      </View>

      {/* Post信息卡片骨架 */}
      <View style={styles.postCard}>
        <Skeleton
          isLoading={true}
          layout={{
            width: 48,
            height: 60,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 4,
            borderBottomLeftRadius: 16,
            marginRight: 12,
          }}
        />
        <View style={styles.postInfo}>
          <Skeleton
            isLoading={true}
            layout={{
              width: 180,
              height: 16,
              borderRadius: 8,
              marginBottom: 6,
            }}
          />
          <Skeleton
            isLoading={true}
            layout={{
              width: 80,
              height: 20,
              borderRadius: 10,
            }}
          />
        </View>
      </View>

      {/* 交易详情行骨架 */}
      <View style={styles.tradeDetails}>
        <View style={styles.amounts}>
          <Skeleton
            isLoading={true}
            layout={{
              width: 60,
              height: 18,
              borderRadius: 9,
              marginBottom: 4,
            }}
          />
          <Skeleton
            isLoading={true}
            layout={{
              width: 80,
              height: 14,
              borderRadius: 7,
            }}
          />
        </View>

        <View style={styles.statusSection}>
          <Skeleton
            isLoading={true}
            layout={{
              width: 70,
              height: 20,
              borderRadius: 4,
              marginRight: 12,
            }}
          />
          <Skeleton
            isLoading={true}
            layout={{
              width: 50,
              height: 16,
              borderRadius: 8,
            }}
          />
        </View>
      </View>
    </View>
  );

  if (showSingleItem) {
    return renderSingleItem();
  }

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(item => (
        <View key={item}>{renderSingleItem()}</View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingTop: 0,
  },
  container: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postCard: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    flexDirection: 'row',
  },
  postInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  tradeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amounts: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CommissionHistorySkeleton;

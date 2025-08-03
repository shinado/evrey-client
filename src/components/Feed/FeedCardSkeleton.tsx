import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';
import { styles as feedStyles } from './FeedCard';

interface FeedCardSkeletonProps {
  width: number;
}

const styles = StyleSheet.create({
  authorName: {
    width: 80,
    height: 10,
  },
  authorUsername: {
    width: 60,
    height: 10,
  },
  title: {
    width: '100%',
    height: 18,
  },
  tokenIcon: {
    width: 16,
    height: 16,
  },
  tokenText: {
    width: 40,
    height: 12,
  },
});

const FeedCardSkeleton: React.FC<FeedCardSkeletonProps> = ({ width }) => {
  return (
    <View style={{ width, marginVertical: 8 }}>
      {/* 作者区 */}
      <View style={feedStyles.authorContainer}>
        <Skeleton isLoading={true} layout={feedStyles.avatar} />
        <View style={feedStyles.authorInfo}>
          <Skeleton isLoading={true} layout={styles.authorName} />
          <Skeleton isLoading={true} layout={styles.authorUsername} />
        </View>
      </View>

      {/* 内容区 */}
      <View style={feedStyles.contentContainer}>
        <Skeleton isLoading={true} layout={{
          width: '100%',
          height: width,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 15,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
        }} />
        <View style={feedStyles.descriptionContainer}>
          <Skeleton isLoading={true} layout={styles.title} />
          <View style={feedStyles.tokenRow}>
            <View style={feedStyles.tokenIconContainer}>
              <Skeleton isLoading={true} layout={styles.tokenIcon} />
              <Skeleton isLoading={true} layout={styles.tokenText} />
            </View>
            <Skeleton isLoading={true} layout={styles.tokenText} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default FeedCardSkeleton; 
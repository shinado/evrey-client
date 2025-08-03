import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

interface HistoryTransactionItemSkeletonProps {
  showSingleItem?: boolean;
}

const HistoryTransactionItemSkeleton: React.FC<HistoryTransactionItemSkeletonProps> = ({
  showSingleItem = false,
}) => {
  const renderSingleItem = () => (
    <View style={styles.orderItem}>
      <View style={styles.orderDetails}>
        <Skeleton
          isLoading
          layout={{ width: 100, height: 16, marginBottom: 8 }}
        />
        <Skeleton isLoading layout={{ width: 70, height: 14 }} />
      </View>
      <View style={[styles.orderDetails, styles.orderDetailsEnd]}>
        <Skeleton
          isLoading
          layout={{ width: 50, height: 14, marginBottom: 8 }}
        />
        <Skeleton isLoading layout={{ width: 40, height: 14 }} />
      </View>
    </View>
  );

  if (showSingleItem) {
    return renderSingleItem();
  }

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2].map((group) => (
        <View key={group}>
          {[1, 2, 3, 4].map((item) => (
            <View key={`${group}-${item}`} style={styles.orderItem}>
              <View style={styles.orderDetails}>
                <Skeleton
                  isLoading
                  layout={{ width: 100, height: 16, marginBottom: 8 }}
                />
                <Skeleton isLoading layout={{ width: 70, height: 14 }} />
              </View>
              <View style={[styles.orderDetails, styles.orderDetailsEnd]}>
                <Skeleton
                  isLoading
                  layout={{ width: 50, height: 14, marginBottom: 8 }}
                />
                <Skeleton isLoading layout={{ width: 40, height: 14 }} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingTop: 0,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    justifyContent: "space-between",
    width: "100%",
  },
  orderDetails: {
    display: "flex",
  },
  orderDetailsEnd: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
});

export default HistoryTransactionItemSkeleton; 
import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

const TradeItemSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Skeleton
          isLoading={true}
          layout={{
            width: 40,
            height: 40,
            borderRadius: 20,
          }}
        />

        <View style={styles.userInfo}>
          <Skeleton
            isLoading={true}
            layout={{
              width: 80,
              height: 16,
              borderRadius: 8,
              marginBottom: 4,
            }}
          />

          <Skeleton
            isLoading={true}
            layout={{
              width: 60,
              height: 12,
              borderRadius: 6,
            }}
          />
        </View>
      </View>

      <View style={styles.rightSection}>
        <Skeleton
          isLoading={true}
          layout={{
            width: 70,
            height: 16,
            borderRadius: 8,
            marginBottom: 4,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

export default TradeItemSkeleton;

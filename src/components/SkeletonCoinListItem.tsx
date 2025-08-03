import React from "react";
import { View, TouchableOpacity } from "react-native";
import Skeleton from "./Skeleton";
import { styles as coinStyles } from "./CoinListItem";

const styles = {
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  symbol: {
    width: 40,
    height: 16,
    borderRadius: 4,
  },
  subText: {
    width: 61,
    height: 14,
    borderRadius: 4,
  },
  price: {
    width: 64,
    height: 15,
    borderRadius: 4,
  },
  change: {
    width: 41,
    height: 14,
    borderRadius: 4,
  },
};

const SkeletonCoinListItem = () => {
  return (
    <TouchableOpacity style={coinStyles.container}>
      <View style={coinStyles.container}>
        <Skeleton isLoading layout={styles.icon} />
        <View style={coinStyles.infoContainer}>
          <Skeleton isLoading layout={styles.symbol} />
          <Skeleton isLoading layout={styles.subText} />
        </View>

        <View style={coinStyles.priceContainer}>
          <Skeleton isLoading layout={styles.price} />
          <Skeleton isLoading layout={styles.change} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SkeletonCoinListItem;

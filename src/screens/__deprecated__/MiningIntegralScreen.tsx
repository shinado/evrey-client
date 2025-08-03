import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { RouterName } from "../../navigation";
import { Theme } from "../../constants/Theme";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "../../i18n";
import {
  MiningIntegralService,
  RecordsList,
} from "../../services/__deprecated__/miningIntegral";
import { COMMON_PAGE_SIZE } from "../../constants/CommonPageSize";
import TostIcon from "../../assets/video/momo_tost.svg";
import Skeleton from "../../components/Skeleton";
import BottomSheet from "../../components/BottomSheet";
import { UTCToLocalTimeUtil } from "../../utils/UTCToLocalTimeUtil";
import CloseIcon from "../../assets/modal/close.svg";

const MiningIntegralScreen = () => {
  const [data, setData] = useState<RecordsList[]>([]); // 存储数据
  const [page, setPage] = useState(1); // 当前页码
  const [loading, setLoading] = useState(false); // 加载状态
  const [hasMore, setHasMore] = useState(true); // 是否有更多数据
  const [balance, setBalance] = useState(0);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true); // 加载状态
  const obtainedTypeText = {
    0: i18n.t("momoIntegral.obtainedTypeTextLike"),
    1: i18n.t("momoIntegral.obtainedTypeTextShare"),
    2: i18n.t("momoIntegral.obtainedTypeTextAirDrop"),
  };
  const changeTypeText = {
    0: "+",
    1: "-",
  };
  const navigation = useNavigation();
  const goBack = () => {
    navigation.goBack();
  };
  // 模拟 API 请求
  const fetchData = async (page: number = 1) => {
    try {
      if (loading || !hasMore) return;
      setLoading(true);
      const res = await MiningIntegralService.getRecords({
        pageNo: page,
        pageSize: COMMON_PAGE_SIZE,
      });
      if (page == 1) {
        setData(res.list);
      } else {
        setData([...data, ...res.list]);
      }
      setHasMore(res.hasMore);
      setLoading(false);
    } catch (error) {
      console.log(error, "error");
      setLoading(false);
    }
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchData(page + 1);
      setPage(page + 1);
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await MiningIntegralService.getUserMiningCoinsBalance();
        setBalance(res.amount);
        setBalanceLoading(false);
      } catch (error) {
        setBalanceLoading(false);
      }
    };
    getData();
    fetchData();
  }, []);

  const onPress = () => {
    setSendModalVisible(true);
  };
  return (
    <View style={styles.modalContent}>
      <LinearGradient
        colors={["#fff", "#F7F8FA"]} // 渐变色
        locations={[0, 0.2048]} // 渐变位置
        start={{ x: 0, y: 0 }} // 渐变起点
        end={{ x: 0, y: 1 }} // 渐变终点（180deg 表示从上到下）
        style={styles.gradient}
      >
        {Platform.OS === "ios" && <View style={styles.dragIndicator} />}
        <View style={styles.header}>
          <View style={styles.titleIcon}></View>
          <Text style={styles.title}>{i18n.t("momoIntegral.title")}</Text>
          <TouchableOpacity onPress={goBack}>
            <CloseIcon style={styles.titleIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.integral}>
          <View style={styles.integral_info}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.integral_info_title}>
                {i18n.t("momoIntegral.title_balance")}
              </Text>
              <TouchableOpacity onPress={onPress}>
                <TostIcon style={{ width: 14, height: 14, marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
            {balanceLoading ? (
              <Skeleton
                isLoading={balanceLoading}
                layout={{ width: 78, height: 30 }}
              />
            ) : (
              <Text style={styles.integral_info_count}>{balance}</Text>
            )}
          </View>
          <Image
            style={styles.integral_info_icon}
            source={require("../../assets/momo/bg.png")}
          ></Image>
        </View>
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.statistics}>
                <View style={styles.statistics_left}>
                  <Text style={styles.statistics_obtainedType}>
                    {obtainedTypeText[item.obtainedType as 0 | 1 | 2] || ""}
                  </Text>
                  <Image src={item?.avatar} style={styles.statistics_icon} />
                  <Text
                    style={styles.statistics_left_videoName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item?.videoName ?? ""}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.right_count}>
                    {changeTypeText[item.changeType as 0 | 1] || ""}
                    {item?.amount ?? ""}
                  </Text>
                </View>
              </View>
              <View style={styles.base}>
                <Text style={styles.base_time}>
                  {item?.obtainedAt
                    ? UTCToLocalTimeUtil.convertUTCToLocalTime(item?.obtainedAt)
                    : ""}
                </Text>
                <Text style={styles.base_balance}>
                  {i18n.t("momoIntegral.balance")}
                  {item?.balance ?? ""}
                </Text>
              </View>
            </View>
          )}
          onEndReached={onEndReached} // 触底触发加载
          onEndReachedThreshold={0.1} // 触底的触发比例
          ListFooterComponent={() =>
            loading ? (
              <ActivityIndicator
                size="small"
                color="blue"
                style={styles.loader}
              />
            ) : null
          }
        ></FlatList>
        <BottomSheet
          isVisible={sendModalVisible}
          onClose={() => setSendModalVisible(false)}
          height="30%"
        >
          <View style={styles.content}>
            <View>
              <Text style={styles.integral_info_obtain}>
                {i18n.t("momoIntegral.obtain")}
              </Text>
              <Text style={styles.integral_info_obtainText}>
                {i18n.t("momoIntegral.obtainText")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSendModalVisible(false)}
              style={styles.integral_info_obtainBtn}
            >
              <Text style={styles.integral_info_obtainBtnText}>
                {i18n.t("common.ok")}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flex: 1,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    height: "100%",
  },
  dragIndicator: {
    width: 28,
    height: 3,
    backgroundColor: Theme.grayColors["50"],
    alignSelf: "center",
    borderRadius: 99,
    marginTop: 6.5,
    marginBottom: 6.5,
  },
  header: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  titleIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    color: Theme.primaryBlackColors["1"],
    marginBottom: 10,
  },
  integral: {
    borderRadius: 10,
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  integral_info: {
    paddingLeft: 16,
  },
  integral_info_title: {},
  integral_info_count: {
    fontSize: 32,
    fontFamily: "Manrope-SemiBold",
  },
  integral_info_icon: {
    width: 230,
    height: 100,
  },
  list: {
    flex: 1,
    backgroundColor: Theme.primaryWhiteColors["1"],
  },
  item: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
  statistics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statistics_left: {
    flexDirection: "row",
    alignItems: "center",
  },
  statistics_obtainedType: {
    fontSize: 14,
    color: Theme.primaryBlackColors["1"],
    marginRight: 6,
    fontWeight: "bold",
  },
  statistics_icon: {
    width: 18,
    height: 18,
    borderRadius: 18,
    marginRight: 4,
  },
  statistics_left_videoName: {
    fontSize: 14,
    color: Theme.primaryBlackColors["1"],
    marginRight: 6,
    width: 200,
    fontWeight: "bold",
  },
  right: {
    alignItems: "flex-end",
  },
  right_count: {
    fontSize: 14,
    color: Theme.primaryBlackColors["1"],
    fontFamily: "Manrope-SemiBold",
    fontWeight: "bold",
  },
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  base_time: {
    fontSize: 10,
    color: Theme.grayColors["100"],
  },
  base_balance: {
    fontSize: 10,
    color: Theme.grayColors["100"],
  },
  integral_info_obtain: {
    fontSize: 17,
    color: "#000000",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 19,
    marginBottom: 7,
  },
  integral_info_obtainText: {
    fontSize: 13,
    color: "#717277",
    textAlign: "center",
  },
  integral_info_obtainBtn: {
    backgroundColor: "#000000",
    borderRadius: 99,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  integral_info_obtainBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  content: {
    height: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    paddingBottom: 50,
  },
});

export default MiningIntegralScreen;

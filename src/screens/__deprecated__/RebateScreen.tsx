import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RouterName } from "../../navigation";
import { Button } from "../../components/Button";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Theme } from "../../constants/Theme";
import InfoModal from "../../components/InfoModal";
import BottomSheet from "../../components/BottomSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../contexts/ToastContext";

import {
  CommissionRankingData,
  CommissionStatisticsData,
  rebateService,
} from "../../services/__deprecated__/rebate";
import * as Clipboard from "expo-clipboard";
import {
  IconMore,
  Rank1,
  Rank2,
  Rank3,
  IconCopy,
  IconEdit,
  backgroundImage,
  RankAvatar1,
  RankAvatar2,
  RankAvatar3,
} from "../../constants/icons";
import i18n from "../../i18n";
import { FontFamily } from "../../constants/typo";
import { UserInfoData } from "../../types";
import { UserStorage } from "../../storage";
import RebateShareModal from "../../components/Rebate/RebateShareModal";
import Skeleton from "../../components/Skeleton";
import { URL_CONFIG } from "../../constants/url_config";
import { CoinFormatUtil, formatUsername } from "../../utils";
import { Ionicons } from "@expo/vector-icons";


const LoadingSkeleton = () => (
  <TouchableOpacity style={styles.skeletonContainer}>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <View key={`-${item}`} style={[styles.skeletonOrderItem]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ marginRight: 10 }}>
            <Skeleton
              isLoading
              layout={{ width: 32, height: 36, borderRadius: 4 }}
            />
          </View>
          <View style={{ marginRight: 10 }}>
            <Skeleton
              isLoading
              layout={{ width: 38, height: 38, borderRadius: 36 }}
            />
          </View>
          <View style={styles.skeletonOrderDetails}>
            <Skeleton
              isLoading
              layout={{ width: 40, height: 15, marginBottom: 4 }}
            />
            <Skeleton isLoading layout={{ width: 50, height: 15 }} />
          </View>
        </View>
        <View
          style={[styles.skeletonOrderDetails, styles.skeletonOrderDetailsEnd]}
        >
          <Skeleton isLoading layout={{ width: 40, height: 15 }} />
        </View>
      </View>
    ))}
  </TouchableOpacity>
);

const LoadingInviteSkeleton = () => (
  <TouchableOpacity
    style={{
      padding: 16,
      backgroundColor: "#F7F8FA",
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      borderRadius: 12,
    }}
  >
    <View style={{ marginBottom: 10, width: "50%" }}>
      <Skeleton isLoading layout={{ width: 40, height: 15, marginBottom: 4 }} />
      <Skeleton isLoading layout={{ width: 80, height: 15 }} />
    </View>
    <View style={{ marginBottom: 10 }}>
      <Skeleton isLoading layout={{ width: 40, height: 15, marginBottom: 4 }} />
      <Skeleton isLoading layout={{ width: 80, height: 15 }} />
    </View>
    <View style={{ marginBottom: 10, width: "50%" }}>
      <Skeleton isLoading layout={{ width: 40, height: 15, marginBottom: 4 }} />
      <Skeleton isLoading layout={{ width: 80, height: 15 }} />
    </View>
    <View style={{ marginBottom: 10 }}>
      <Skeleton isLoading layout={{ width: 40, height: 15, marginBottom: 4 }} />
      <Skeleton isLoading layout={{ width: 80, height: 15 }} />
    </View>
  </TouchableOpacity>
);

const RankItem = React.memo(({ item, index }: { item: CommissionRankingData; index: number }) => {
  const rankIcons = [Rank1, Rank2, Rank3];
  const rankAvatars = [RankAvatar1, RankAvatar2, RankAvatar3];
  
  return (
    <View style={styles.rankItem}>
      <View style={styles.rankItemAvatarBox}>
        <View style={styles.rankTextBox}>
          {index === 0 && <Rank1 />}
          {index === 1 && <Rank2 />}
          {index === 2 && <Rank3 />}
          {index >= 3 && <Text style={styles.rankText}>{index + 1}</Text>}
        </View>
        <View style={styles.avatarBox}>
          {index < 3 && (
            <Image source={rankAvatars[index]} style={styles.avatarTips} />
          )}
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, { backgroundColor: Theme.secondaryColors[100], justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="person" size={20} color={Theme.secondaryColors[400]} />
            </View>
          )}
        </View>
        <View style={styles.rebateInfoBox}>
          <Text style={styles.rebateInfoName}>
            {formatUsername(item.username)}
          </Text>
          <Text style={styles.rebateInfoFriends}>
            {item.referrals} {i18n.t("rebate.friends")}
          </Text>
        </View>
      </View>
      <View style={styles.rankItemAmountBox}>
        <Text style={styles.rankItemAmount}>
          ${CoinFormatUtil.formatPrice(item.amount / 1000000)}
        </Text>
      </View>
    </View>
  );
});

// 1. 类型定义
interface RankState {
  data: CommissionRankingData[];
  type: "all" | 0 | 1;
  loading: boolean;
}

interface ListInfoItem {
  type: "inviteFriendInfo";
  owner: string;
  invitee: string;
}

interface ModalState {
  commission: boolean;
  info: boolean;
  warning: boolean;
  share: boolean;
  title: string;
  content: { label: string; value?: string }[];
  type: "info" | "confirm";
  topImage: React.ReactNode | null;
}

interface LoadingState {
  main: boolean;
  rank: boolean;
  invite: boolean;
}

// 2. 常量
const CONSTANTS = {
  EXCHANGE_AMOUNT: 1000000,
  RANK_PAGE_SIZE: 50,
} as const;

// 1. 定义排行榜类型按钮组件
const RankTypeButton = ({ 
  type, 
  currentType, 
  onPress 
}: { 
  type: "all" | 0 | 1, 
  currentType: "all" | 0 | 1, 
  onPress: () => void 
}) => {
  const getLabel = (type: "all" | 0 | 1) => {
    switch(type) {
      case "all": return "MAX";
      case 1: return "7D";
      case 0: return "24H";
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[
        styles.rankTimeDefault,
        type === currentType ? styles.rankTimeActive : {}
      ]}>
        {getLabel(type)}
      </Text>
    </TouchableOpacity>
  );
};

// 2. 修改排行榜头部组件
const RankHeader = ({ type, onChange }: { 
  type: "all" | 0 | 1, 
  onChange: (type: "all" | 0 | 1) => void 
}) => (
  <View style={styles.rankTitleBox}>
    <Text style={styles.rankTitle}>{i18n.t("rebate.rankings")}</Text>
    <View style={styles.rankRight}>
      <RankTypeButton 
        type="all" 
        currentType={type} 
        onPress={() => onChange("all")} 
      />
      <RankTypeButton 
        type={1} 
        currentType={type} 
        onPress={() => onChange(1)} 
      />
      <RankTypeButton 
        type={0} 
        currentType={type} 
        onPress={() => onChange(0)} 
      />
    </View>
  </View>
);

const RebateScreen = () => {
  const { formatPrice } = CoinFormatUtil;
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  // 统一的加载状态
  const [loading, setLoading] = useState<LoadingState>({
    main: false,
    rank: false,
    invite: true
  });

  // 统一的弹窗状态
  const [modal, setModal] = useState<ModalState>({
    commission: false,
    info: false,
    warning: false,
    share: false,
    title: "",
    content: [],
    type: "info",
    topImage: null
  });

  // 基础状态
  const [refreshing, setRefreshing] = useState(false);
  const [userInfoData, setUserInfoData] = useState<UserInfoData | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [upInviteCode, setUpInviteCode] = useState("");

  // 佣金相关状态
  const [commissionData, setCommissionData] = useState<CommissionStatisticsData>({
    sum: "0",
    referralsCount: 0,
  });

  // 排行榜相关状态
  const [rankState, setRankState] = useState<RankState>({
    data: [],
    type: "all",
    loading: false
  });

  // 统一的权限配置
  const userPermissions = [
      {
        title: i18n.t("rebate.all_commissions"),
        value: "$" + formatPrice(Number(commissionData.sum) / 1000000),
        clickable: false,
      },
      {
        title: i18n.t("rebate.invited_friends"),
        value: commissionData.referralsCount,
        clickable: true,
        onPress: () => {
          navigation.navigate(RouterName.INVITATIONCODESCREEN);
        }
      },
      {
        title: i18n.t("rebate.my_invited_code"),
        value: inviteCode,
        clickable: true,
        iconType: "copy",
        onPress: () => handleCopy(inviteCode)
      }
  ];

  // 统一的弹窗配置
  const modalConfigs = {
      inviteFriendInfo: {
        title: i18n.t("rebate.invited_friends"),
      content: (info: ListInfoItem) => [
          {
            label: i18n.t("rebate.friends_directly_invited"),
          value: info.owner
        },
        {
          label: i18n.t("rebate.other_friends_number"),
          value: info.invitee
        }
      ]
    }
  };

  // 统一的加载状态管理
  const setLoadingState = (key: keyof typeof loading, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // 统一的弹窗状态管理
  const setModalState = (key: keyof typeof modal, value: any) => {
    setModal(prev => ({ ...prev, [key]: value }));
  };

  // 1. 统一的数据获取函数
  const fetchData = async (options?: { 
    skipRanking?: boolean,
    skipCommission?: boolean 
  }) => {
    try {
      setLoadingState('invite', true);
      setLoadingState('rank', true);

      // 佣金数据
      if (!options?.skipCommission) {
        try {
          const commissionData = await rebateService.getCommissionStatistics();
          console.log("✅commissionData", commissionData);
          setCommissionData(commissionData);
    } catch (error) {
          console.error('获取佣金数据失败:', error);
        }
      }

      // 用户信息
      try {
        const userInfo = await UserStorage.getUserInfo();
        console.log("用户信息:", userInfo);
        setUserInfoData(userInfo);
        setInviteCode(userInfo?.invitationCode || "");
        setUpInviteCode(userInfo?.referralCode || "");
    } catch (error) {
        console.error('获取用户信息失败:', error);
      }

      // 排行榜数据
      if (!options?.skipRanking) {
        try {
          setRankState(prev => ({ ...prev, loading: true }));
          
          const apiType = rankState.type === "all" ? "max" : rankState.type === 1 ? "7d" : "24h";
          const rankData = await rebateService.getCommissionRanking(apiType);
          
          setRankState(prev => ({ 
            ...prev, 
            data: rankData,
            loading: false
          }));
        } catch (error) {
          console.error('获取排行榜数据失败:', error);
          setRankState(prev => ({ ...prev, loading: false }));
        }
      }
    } catch (error) {
      console.error('数据获取失败:', error);
    } finally {
      setLoadingState('invite', false);
      setLoadingState('rank', false);
    }
  };

  // 3. 排行榜类型变化时只更新排行榜
  const prevTypeRef = useRef(rankState.type);
  useEffect(() => {
    // 只在类型真正改变时才请求数据
    if (prevTypeRef.current !== rankState.type) {
      prevTypeRef.current = rankState.type;
      fetchData({ skipCommission: true, skipRanking: false });
    }
  }, [rankState.type]);

  // 4. 页面聚焦时刷新所有数据
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // 5. 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
    setRefreshing(false);
    }
  };

  const showTradeAmountInfo = (info: ListInfoItem) => {
    const config = modalConfigs[info.type];
    setModalState('title', config.title);
    setModalState('content', config.content(info));
    setModalState('type', 'info');
    setModalState('info', true);
  };

  const handleCopy = async (text: string) => {
    console.log("text", text);
    await Clipboard.setStringAsync(text);
    showToast("success", {message: i18n.t("common.copy_success")}, 3000, "simple");
  };

  const showInviteePopup = () => {
    navigation.navigate(RouterName.INVITATIONCODESCREEN, {
      pushType: "goBack"
    });
  };

  const changeRankType = (type: "all" | 0 | 1) => {
    
    // 更新类型并清空数据
    setRankState(prev => ({ 
      ...prev, 
      type,
      data: [] 
    }));
    
    // 获取新数据
    fetchData({ 
      skipCommission: true,
      skipRanking: false
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View
        style={{
          flexGrow: 1,
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 12,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            marginBottom: 0,
            paddingBottom: 0,
            flexGrow: 0,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.levelBox}>
                <Image
                  source={backgroundImage}
                  style={[styles.levelBg, styles.defaultLevelBg]}
                  resizeMode={"cover"}
                />
                <View style={styles.levelTextBox}>
                  <Text style={styles.levelTextTitle}>
                    {i18n.t("rebate.invitation_rebate_title")}
                  </Text>
                  <Text style={styles.levelTextDesc}>
                    {i18n.t("rebate.invitation_rebate_desc")}
                  </Text>
                </View>
                </View>
          {loading.invite ? (
            LoadingInviteSkeleton()
          ) : (
            <View style={styles.rebateRow}>
              {userPermissions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.rebateRowItem}
                  onPress={() => {
                    item.onPress && item.onPress();
                  }}
                  disabled={!item.clickable}
                >
                  <View style={styles.infoBox}>
                    <Text style={styles.rebateInfoTitle}>{item.title}</Text>
                    <Text style={styles.rebateInfoValue}>{item.value}</Text>
                  </View>
                  {item.clickable &&
                    (item.iconType === "copy" ? (
                      <IconCopy width={14} height={14} />
                    ) : (
                      <IconMore width={10} height={10} />
                    ))}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Share Button */}
          <Button
            style={styles.shareButton}
            type={"primary"}
            onPress={() => {
              setModalState('share', true);
            }}
          >
            {i18n.t("rebate.share_earn")}
          </Button>
          {!upInviteCode && (
              <View style={styles.inviteCodeBoxEdit}>
                <Text style={styles.inviteCodeEditTitle}>
                  {i18n.t("rebate.add_invitation_code")}
                </Text>
                <TouchableOpacity onPress={showInviteePopup}>
                  <IconEdit width={16} height={16} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.rebateTips}>
              <Text style={styles.rebateTipsText}>
                * {i18n.t("rebate.friend_transaction_amount_desc_1")}
              </Text>
              <Text style={styles.rebateTipsNumber}> 0.5% </Text>
              <Text style={styles.rebateTipsText}>
                {i18n.t("rebate.friend_transaction_amount_desc_2")}
              </Text>
            </View>
          <View>
            <RankHeader 
              type={rankState.type} 
              onChange={changeRankType} 
            />
            <View>
              {rankState.loading ? (
                  <LoadingSkeleton />
                ) : (
                rankState.data.map((item, index) => (
                  <RankItem key={item.id} item={item} index={index} />
                ))
              )}
            </View>
          </View>
        </ScrollView>
        {/* Leaderboard */}
      </View>
      <InfoModal
        isVisible={modal.info}
        title={modal.title}
        imageElement={modal.topImage}
        content={modal.content}
        type={modal.type}
        onConfirm={() => {
          setModalState('info', false);
        }}
        onClose={() => {
          setModalState('info', false);
        }}
      />
      <BottomSheet
        isVisible={modal.warning}
        onClose={() => setModalState('warning', false)}
        height="auto"
      >
        <Text style={styles.warningBottomSheetTitle}>
          {i18n.t("rebate.commission_is_lower")}
        </Text>
        <Text style={styles.warningBottomSheetDesc}>
          {i18n.t("rebate.minimum_amount")}
        </Text>
        <Button
          type={"primary"}
          style={{ marginBottom: 16 }}
          onPress={() => setModalState('warning', false)}
        >
          {i18n.t("common.confirm")}
        </Button>
      </BottomSheet>
      <RebateShareModal
        visible={modal.share}
        data={{
          inviteCode: inviteCode,
          inviteLink: URL_CONFIG.WEBSITE_URL,
          userName: formatUsername(userInfoData?.username),
          userAvatar: userInfoData?.avatar,
          bgType: 1,
        }}
        onClose={() => setModalState('share', false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Theme.background[50],
    paddingBottom: 0,
  },
  levelBox: {
    alignItems: "flex-end",
    position: "relative",
    marginTop: 16,
  },
  levelBg: {
    height: 110,
    width: 130,
    position: "absolute",
    right: 0,
    top: -12,
    bottom: 0,
  },
  defaultLevelBg: {
    width: 230,
  },
  levelTextBox: {
    height: 100,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  levelTextTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 24,
    lineHeight: 34,
    marginBottom: 4,
    marginTop: 4,
    fontWeight: "400",
  },
  levelTextDesc: {
    fontFamily: FontFamily.regular,
    color: Theme.text[50],
    fontSize: 12,
    lineHeight: 16.8,
  },
  rebateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  rebateRowItem: {
    width: "45%",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  infoBox: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  rebateInfoTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16.8,
    color: Theme.text[100],
    marginBottom: 4,
    textAlign: "left",
    fontWeight: "600",
  },
  rebateInfoValue: {
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
    color: Theme.text[300],
    textAlign: "left",
  },

  rebateTips: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  rebateTipsText: {
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    fontSize: 12,
    fontWeight: "600",
  },
  rebateTipsNumber: {
    color: Theme.brand.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    fontWeight: "600",
  },
  rankTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 16,
  },
  rankTitle: {
    color: Theme.text[200],
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  rankRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rankTimeDefault: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    color: Theme.text[100],
    fontSize: 13,
    marginLeft: 20,
  },
  rankTimeActive: {
    fontFamily: "Manrope-Bold",
    color: Theme.text[300],
    fontWeight: "700",
  },

  // 排行榜
  rankItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 66,
  },
  rankItemAvatarBox: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginRight: 10,
  },
  rankTextBox: {
    width: 33,
    height: 33,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "visible",
  },
  rankText: {
    color: Theme.text[50],
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    fontWeight: "bold",
  },
  rankItemAmountBox: {},
  rankItemAmount: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
  },
  avatarBox: {
    position: "relative",
    width: 42,
    height: 48,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTips: {
    width: 42,
    height: 48,
    position: "absolute",
    left: 2,
    top: -6,
    zIndex: 10,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 24,
  },
  rebateInfoBox: {
    marginLeft: 8,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  rebateInfoName: {
    color: Theme.text[300],
    fontSize: 15,
    lineHeight: 20,
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
  },
  rebateInfoFriends: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[100],
    fontWeight: "600",
  },

  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  linkBoxItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  link: {
    fontSize: 14,
    color: Theme.primaryColors[500],
    marginRight: 4,
    textAlign: "center",
  },

  shareButton: {
    marginBottom: 18,
    marginTop: 18,
    paddingVertical: 8,
    borderRadius: 32,
    alignItems: "center",
    fontSize: 15,
    lineHeight: 44,
    height: 44,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  toastContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  // 弹窗样式开始
  popupContainer: {
    alignItems: "center",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  popupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 5,
  },
  popupLabel: {
    fontSize: 16,
    color: "#000",
  },
  popupValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  // 弹窗样式结束
  // 输入邀请码弹窗
  inviteCodePopupContainer: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  inviteCodeInput: {
    width: "90%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  // 底部1u弹窗
  warningBottomSheetTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 7,
    textAlign: "center",
  },
  warningBottomSheetDesc: {
    fontSize: 13,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    marginBottom: 32,
    textAlign: "center",
  },
  inviteCodeBoxEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCodeEditTitle: {
    color: Theme.text[300],
    fontSize: 15,
    fontWeight: "500",
    fontFamily: FontFamily.medium,
  },

  inviteCodeBoxInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inviteCodeTitle: {
    color: Theme.text[100],
    fontSize: 12,
    fontWeight: "500",
  },
  inviteCodeContent: {
    color: Theme.text[300],
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FontFamily.semiBold,
  },
  setRatioBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  setRatioText: {
    marginLeft: 4,
    fontSize: 15,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  // 空数据页面
  emptyState: {
    alignItems: "center",
    marginTop: 64,
    paddingHorizontal: 24,
  },
  emptyDescription: {
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    fontWeight: "400",
    fontSize: 12,
    fontStyle: "normal",
    marginTop: 24,
  },
  // 骨架屏
  skeletonContainer: {
    paddingTop: 0,
  },

  skeletonOrderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    justifyContent: "space-between",
    width: "100%",
  },
  skeletonOrderDetails: {
    display: "flex",
  },
  skeletonOrderDetailsEnd: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
});

export default RebateScreen;

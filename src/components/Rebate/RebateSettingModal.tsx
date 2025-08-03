import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Animated, ImageBackground} from 'react-native';
import Slider from '@react-native-community/slider'; // 使用滑动条组件 web使用时候需要跟react-native-web一起安装 目前已经安装，但是还没配置
import {Theme} from "../../constants/Theme";
import BottomSheet  from "../../components/BottomSheet"
import { Button } from "../../components/Button";
import {FontFamily} from "../../constants/typo";
import i18n from "../../i18n";
import AppBar from '../AppBar';



interface RebateSettingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue?: number; // 返佣初始比例
}

const RebateSettingModal: React.FC<RebateSettingModalProps> = ({ isVisible, onClose, onConfirm, initialValue = 0 }) => {
  const [rebate, setRebate] = useState(initialValue);
  const animatedValue = useRef(new Animated.Value(rebate)).current; // 用于动画
  const [sliderWidth, setSliderWidth] = useState(1); // 记录Slider的宽度
  // 计算滑块值的位置
  const getSliderPosition = (value: number) => {
    const minValue = 0;
    const maxValue = 100;
    return ((value - minValue) / (maxValue - minValue)) * (sliderWidth - 32); // 32 是滑块 thumb 的大小
  };
  useEffect(() => {
    setRebate(initialValue);
  }, [initialValue]);

  // 清理动画状态
  useEffect(() => {
    return () => {
      animatedValue.setValue(rebate); // 重置动画值
    };
  }, []);

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height="auto"
    >
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <AppBar onBack={onClose} />
          <Text style={styles.title}>{i18n.t("rebate.set_ratio_number")}</Text>
          <View style={{width: 24}}></View>
        </View>

        <View style={styles.sliderContainer}>
          <View style={styles.labelBox}>
            <Text style={styles.label}>{i18n.t("rebate.his_rebate_ratio")}</Text>
            <View style={[styles.labelTips, rebate < 30 ?  {opacity: 1 } : {opacity: 0}]}>
              <View style={{opacity: 1}}>
                <Text style={styles.labelTipsDesc}>{i18n.t("rebate.select_at_least")}</Text>
              </View>
            </View>
          </View>
          {/*<View style={styles.slippageValue}>*/}
          {/*  <Text style={styles.slippagePercent}>{rebate}%</Text>*/}
          {/*</View>*/}
          {/* 数值显示，浮动在滑块上方 */}
          <Animated.View
            style={[
              styles.slippageValue,
              // { left: getSliderPosition(rebate) }, // 动态计算位置
              { left: "45%" }, // 动态计算位置
            ]}
          >
            <ImageBackground source={require("../../../assets/rebate/scale_bg.png")} style={styles.scaleBg}>
              <Text style={styles.slippagePercent}>{rebate}%</Text>
            </ImageBackground>
          </Animated.View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={rebate}
            onValueChange={(value: number) => {
              setRebate(value);
              Animated.timing(animatedValue, {
                toValue: value,
                duration: 200,
                useNativeDriver: false,
              }).start();
            }}
            onLayout={(event) => {
              setSliderWidth(event.nativeEvent.layout.width - 24);
            }}
            minimumTrackTintColor={Theme.text[300]}
            maximumTrackTintColor={Theme.background[300]}
            thumbTintColor={Theme.text[300]}
          />
          <View style={styles.sliderContainer}>
            <View style={styles.ticksContainer}>
              {[0, 20, 40, 60, 80, 100].map((value, index) => (
                <View key={index} style={styles.tickItem}>
                  <View style={styles.tick} />
                  <Text style={styles.sliderLabel}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <Button type={'primary'} disabled={rebate < 30} onPress={() => {
          if(rebate >= 30) {
            onConfirm(rebate)
          }
        }} style={styles.confirmButton}>
          {i18n.t("common.confirm")}
        </Button>

      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    paddingVertical: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.text[300],
    marginLeft: 46,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  labelBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: Theme.text[100],
    textAlign: 'left',
  },
  labelTips: {
    borderRadius: 10,
    opacity: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#666666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16
  },
  labelTipsDesc: {
    fontSize: 12,
    color: Theme.text[50],
    lineHeight: 14,
    opacity: 1
  },
  slider: {
    width: '100%',
    height: 40,
  },
  slippageValue: {
    width: 50,
    height: 31,
    textAlign: 'center',
    // borderRadius: 12,
    marginBottom: 16,
    position: 'absolute',
    bottom: 40, // 数值浮动在滑块上方
  },
  scaleBg: {
    width: 50,
    height: 31,
    // flex: 1,
    resizeMode: 'contain',
    justifyContent: 'center', // 让文字居中
    alignItems: 'center',
    textAlign: "center"
  },
  slippagePercent: {
    color: Theme.background[50],
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: FontFamily.semiBold,
  },
  confirmButton: {
    width: '90%',
    marginTop: 32,
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10
  },
  tickItem: {
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 6,
    backgroundColor: Theme.text[50],
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: Theme.text[100],
  },

});

export default RebateSettingModal;

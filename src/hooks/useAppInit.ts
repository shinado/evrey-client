import { useLayoutEffect, useEffect } from 'react';
import * as Font from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

export function useAppInit() {
  // 加载字体
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "Manrope-Regular": require("../../assets/fonts/Manrope-Regular.ttf"),
          "Manrope-Medium": require("../../assets/fonts/Manrope-Medium.ttf"),
          "Manrope-SemiBold": require("../../assets/fonts/Manrope-SemiBold.ttf"),
          "Manrope-Bold": require("../../assets/fonts/Manrope-Bold.ttf"),
          "DingTalk-JinBuTi": require("../../assets/fonts/DingTalk-JinBuTi.ttf"),
        });
      } catch (e) {
        console.warn("加载字体出错:", e);
      }
    }
    loadFonts();
  }, []);

  // 设置导航栏
  useLayoutEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("white");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);
} 
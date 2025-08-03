import React from 'react';
import { SafeAreaView, StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // 假设你使用 Expo 的图标库

// 仅在非 web 平台导入 WebView
const WebViewComponent = Platform.select({
  native: () => require('react-native-webview').WebView,
  default: () => null,
})();

const WebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { url, title } = route.params;

  // 在 web 平台直接打开新窗口
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      window.open(url, '_blank');
      navigation.goBack();
    }
  }, [url]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 自定义导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{width: 24}}></View>
      </View>

      {Platform.OS !== 'web' && WebViewComponent && (
        <WebViewComponent 
          source={{ uri: url }} 
          style={styles.webview}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  backButton: {
    
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import IconBack from '../../../../assets/userSettings/iconBack.svg';
import IconCopy from '../../../../assets/rebate/icon_copy.svg';
import {useNavigation} from "@react-navigation/native"; // 你可以根据实际路径修改

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();


  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {navigation.goBack()}}>
          <IconBack />
        </TouchableOpacity>
        <View style={styles.settingsText}>
          <Text style={styles.title}>帮助中心</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          需要帮助请发送邮件至：Service@aibox.fun
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsText: {
    flex: 1,
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingRight: 10
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  info: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
});

export default HelpCenterScreen;

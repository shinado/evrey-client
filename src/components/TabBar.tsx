import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';

export interface TabItem {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  containerStyle?: any;
  tabStyle?: any;
  activeTabStyle?: any;
  textStyle?: any;
  activeTextStyle?: any;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  containerStyle,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            tabStyle,
            activeTab === tab.key && styles.activeTab,
            activeTab === tab.key && activeTabStyle,
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              textStyle,
              activeTab === tab.key && styles.activeTabText,
              activeTab === tab.key && activeTextStyle,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.primary,
  },
  tabText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.medium,
  },
  activeTabText: {
    color: Theme.primary,
  },
});

export default TabBar; 
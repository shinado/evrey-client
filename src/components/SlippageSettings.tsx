import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import BottomSheet from './BottomSheet';
import { Button } from './Button';
import i18n from '../i18n';
import AppBar from './AppBar';

export const SLIPPAGE_SETTINGS_KEY = 'user_slippage_settings';

export interface SlippageSettings {
  value: number; // 百分比值，如0.5表示0.5%
  isAuto: boolean;
}

interface SlippageSettingsProps {
  isVisible: boolean;
  initialSettings: SlippageSettings;
  onSave: (settings: SlippageSettings) => void;
  onClose: () => void;
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  isVisible,
  initialSettings,
  onSave,
  onClose,
}) => {
  const [slippageValue, setSlippageValue] = useState(initialSettings.value);
  const [isAuto, setIsAuto] = useState(initialSettings.isAuto);

  useEffect(() => {
    if (isVisible) {
      setSlippageValue(initialSettings.value);
      setIsAuto(initialSettings.isAuto);
    }
  }, [isVisible, initialSettings]);

  const toggleAuto = () => {
    setIsAuto(prev => !prev);
  };

  const handleSlippageChange = (value: number) => {
    if (!isAuto) {
      setSlippageValue(value);
    }
  };

  const handleSave = async () => {
    const settings = {
      value: slippageValue,
      isAuto: isAuto
    };

    try {
      await AsyncStorage.setItem(SLIPPAGE_SETTINGS_KEY, JSON.stringify(settings));
      onSave(settings);
    } catch (error) {
      console.error('Failed to save slippage settings:', error);
    }
  };

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} height="auto">
      <View style={styles.container}>
        <View style={styles.header}>
          <AppBar onBack={onClose} />
          <Text style={styles.title}>{i18n.t('slippage.title')}</Text>
          <View style={styles.autoContainer}>
            <Text style={styles.autoText}>{i18n.t('slippage.auto')}</Text>
            <TouchableOpacity 
              style={[styles.toggleButton, isAuto ? styles.toggleActive : styles.toggleInactive]} 
              onPress={toggleAuto}
            >
              <View style={[styles.toggleCircle, isAuto ? styles.toggleCircleRight : styles.toggleCircleLeft]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.slippageContainer}>
          <View style={styles.slippageValue}>
            <Text style={styles.slippagePercent}>
              {isAuto ? i18n.t('slippage.auto') : `${slippageValue}%`}
            </Text>
          </View>
          
          <Slider
            style={[styles.slider, isAuto && styles.sliderDisabled]}
            minimumValue={0.5}
            maximumValue={20}
            step={0.5}
            value={slippageValue}
            onValueChange={handleSlippageChange}
            minimumTrackTintColor={isAuto ? Theme.background[300] : Theme.text[300]}
            maximumTrackTintColor={Theme.background[300]}
            thumbTintColor={isAuto ? Theme.background[300] : Theme.text[300]}
            disabled={isAuto}
          />
          
          <View style={[styles.sliderLabels, isAuto && styles.sliderDisabled]}>
            {[0, 5, 10, 15, 20].map((value) => (
              <View key={value} style={styles.labelContainer}>
                <View style={styles.tick} />
                <Text style={styles.label}>{value}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.description}>
            *{i18n.t('slippage.description')}
          </Text>
        </View>

        <Button type="primary" onPress={handleSave}>
          {i18n.t('slippage.done')}
        </Button>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.text[300],
    marginLeft: 46,
  },
  autoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
    color: Theme.text[300],
  },
  toggleButton: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Theme.text[300],
  },
  toggleInactive: {
    backgroundColor: Theme.background[300],
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleCircleLeft: {
    alignSelf: 'flex-start',
  },
  toggleCircleRight: {
    alignSelf: 'flex-end',
  },
  slippageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  slippageValue: {
    backgroundColor: Theme.text[300],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  slippagePercent: {
    color: 'white',
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderDisabled: {
    opacity: 0.5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  labelContainer: {
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 6,
    backgroundColor: Theme.text[50],
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: Theme.text[100],
  },
  description: {
    fontSize: 12,
    color: Theme.text[100],
    textAlign: 'center',
  },
});

export default SlippageSettings; 
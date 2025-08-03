import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { NavigatorName } from '../../constants/navigation';
import { NavigationService } from '../../navigation/service';
import { useInterests } from '../../hooks/useInterests';
import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '../../i18n';

const InterestSelectionScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { fromSettings } = (route.params as { fromSettings?: boolean }) || {};

  const {
    selectedInterests,
    isLoading,
    error,
    toggleInterest,
    saveInterests,
    getAllInterests,
    isInterestSelected,
    getSelectedCount,
  } = useInterests();

  const handleSkip = async () => {
    if (fromSettings) {
      navigation.goBack();
    } else {
      NavigationService.reset(NavigatorName.MAIN_TAB);
    }
  };
  const handleNext = async () => {
    const success = await saveInterests();
    if (success) {
      if (fromSettings) {
        navigation.goBack();
      } else {
        NavigationService.reset(NavigatorName.MAIN_TAB);
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Failed to save interests',
        position: 'bottom',
        bottomOffset: 60,
        visibilityTime: 1500,
      });
      console.error('Failed to save interests');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{fromSettings ? i18n.t('common.cancel') : i18n.t('interests.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{i18n.t('interests.title')}</Text>
        <Text style={styles.subtitle}>{i18n.t('interests.subtitle')}</Text>
        {error && <Text style={styles.errorText}>{i18n.t('interests.error')}</Text>}
      </View>

      {/* Interests Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.interestsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.interestsGrid}>
          {getAllInterests().map(interest => {
            const isSelected = isInterestSelected(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[styles.interestButton, isSelected && styles.interestButtonSelected]}
                onPress={() => toggleInterest(interest.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>{interest.name}</Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, getSelectedCount() === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={getSelectedCount() === 0 || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>{i18n.t('interests.next')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.text[300],
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.text[100],
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  errorText: {
    fontSize: 14,
    color: Theme.secondary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  interestsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestButton: {
    width: '48%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  interestButtonSelected: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  interestEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  interestText: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  interestTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  nextButton: {
    backgroundColor: Theme.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Theme.background[300],
  },
  nextButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: FontFamily.bold,
  },
});

export default InterestSelectionScreen;

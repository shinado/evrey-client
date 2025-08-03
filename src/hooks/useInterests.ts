import { useState, useEffect } from 'react';
import { interestsService } from '../services/user/interests';
import { onboardingStorage } from '../storage/onboarding';
import { useUserInfo } from './useUserInfo';

export const useInterests = () => {
  const { userInfo } = useUserInfo();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserInterests();
  }, []);

  const getAllInterests = () => {
    return interestsService.getAllInterests();
  };
  const loadUserInterests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userInterests = await interestsService.getUserInterests();
      setSelectedInterests(userInterests);
    } catch (err) {
      setError('Failed to load user interests');
      console.error('Error loading user interests:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId) ? prev.filter(id => id !== interestId) : [...prev, interestId]
    );
  };
  const saveInterests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await interestsService.saveUserInterests(selectedInterests);

      if (userInfo?.id) {
        await onboardingStorage.markInterestsCompleted(userInfo.id);
      }

      return true;
    } catch (err) {
      setError('Failed to save interests');
      console.error('Error saving interests:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const isInterestSelected = (interestId: string) => {
    return selectedInterests.includes(interestId);
  };
  const getSelectedCount = () => {
    return selectedInterests.length;
  };
  const clearSelection = () => {
    setSelectedInterests([]);
  };

  return {
    selectedInterests,
    isLoading,
    error,
    loadUserInterests,
    toggleInterest,
    saveInterests,
    getAllInterests,
    isInterestSelected,
    getSelectedCount,
    clearSelection,
  };
};

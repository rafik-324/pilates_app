import { Redirect } from 'expo-router';
import React from 'react';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useProfile } from '@/state/profile';

export default function Onboarding() {
  const profile = useProfile((s) => s.profile);
  // Onboarding nur beim ersten Start
  if (profile) return <Redirect href="/" />;
  return <OnboardingScreen />;
}

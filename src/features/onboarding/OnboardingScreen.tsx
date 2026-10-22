import React from 'react';
import { STEP_COMPONENTS } from './steps';
import { useOnboarding } from './store';

export function OnboardingScreen() {
  const step = useOnboarding((s) => s.step);
  const Step = STEP_COMPONENTS[step];
  return <Step />;
}

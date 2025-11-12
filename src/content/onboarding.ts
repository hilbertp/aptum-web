export const onboardingCopy = {
  app: {
    badge: 'APTUM',
    tagline: 'Your system for an intelligent life.'
  },
  steps: [
    { id: 'welcome', label: 'Welcome' },
    { id: 'connect', label: 'Connect' },
    { id: 'profile', label: 'Profile' },
    { id: 'goals', label: 'Goals' },
    { id: 'plan', label: 'Plan' },
    { id: 'preview', label: 'Preview' }
  ] as const
};

export type OnboardingStepId = typeof onboardingCopy.steps[number]['id'];

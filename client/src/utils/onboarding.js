export const getOnboardingStep = (user) => {
  if (!user) return null;
  if (!user.roleConfirmed) return "role";
  if (user.role === "user" && !user.interestsSelected) return "interests";
  return null;
};

export const isOnboardingComplete = (user) =>
  Boolean(user?.roleConfirmed && (user.role === "organizer" || user.interestsSelected));

export const shouldPromptOnboarding = (user) => Boolean(getOnboardingStep(user));

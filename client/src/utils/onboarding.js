


/**
 * onboardingFlow.js
 * Shared utility — determines what onboarding step a user should see next.
 *
 * Returns:
 *   "role"         — user hasn't confirmed their role yet
 *   "verification" — organizer who hasn't started verification AND hasn't
 *                    completed onboarding before (first-time only)
 *   "interests"    — attendee (user) who hasn't selected interests yet
 *   null           — onboarding is complete, go to destination
 */
export function getNextOnboardingStep(user) {
  if (!user) return null;

  // Step 1: Role must be confirmed first
  if (!user.roleConfirmed) return "role";

  // Step 2: Organizer-specific — show verification ONLY on first onboarding pass.
  // If they already submitted docs / got approved / rejected, skip.
  // If they previously completed onboarding (onboardingCompletedAt is set), skip.
  if (user.role === "organizer") {
    const alreadyOnboarded = Boolean(user.onboardingCompletedAt);
    const verificationStatus = user.verification?.status;
    const notStarted =
      !verificationStatus || verificationStatus === "not_started";

    if (!alreadyOnboarded && notStarted) return "verification";
    return null; // organizers don't need interests
  }

  // Step 3: Attendee — show interests if not yet selected
  if (user.role === "user" && !user.interestsSelected) return "interests";

  return null;
}

/**
 * After a role switch in Settings, decide whether to show onboarding modals.
 * Only fires for the FIRST time each role's onboarding was never completed.
 *
 * Rules:
 * - If switching TO organizer and verification was never started AND
 *   onboardingCompletedAt is not set → show verification
 * - If switching TO user and interests were never selected → show interests
 * - Otherwise → nothing extra (user already did it)
 */
export function getOnboardingStepAfterRoleSwitch(user, newRole) {
  if (!user) return null;

  const patchedUser = { ...user, role: newRole, roleConfirmed: true };
  return getNextOnboardingStep(patchedUser);
}
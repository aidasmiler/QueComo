export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  households: (userId: string) => ['households', userId] as const,
  household: (householdId: string) => ['household', householdId] as const,
  householdMembers: (householdId: string) => ['household', householdId, 'members'] as const,
  householdInvitations: (householdId: string) => ['household', householdId, 'invitations'] as const,
  invitationPreview: (token: string) => ['invitation', token] as const,
  dietaryPreferences: (userId: string) => ['dietary-preferences', userId] as const,
};

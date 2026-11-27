export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  households: (userId: string) => ['households', userId] as const,
  household: (householdId: string) => ['household', householdId] as const,
  householdMembers: (householdId: string) => ['household', householdId, 'members'] as const,
  householdInvitations: (householdId: string) => ['household', householdId, 'invitations'] as const,
  invitationPreview: (token: string) => ['invitation', token] as const,
  recipes: (householdId: string) => ['recipes', householdId] as const,
  recipe: (recipeId: string) => ['recipe', recipeId] as const,
  recipeCategories: (householdId: string) => ['recipe-categories', householdId] as const,
  recipeUserState: (userId: string, householdId: string) =>
    ['recipe-user-state', userId, householdId] as const,
  catalogDefinitions: ['catalog-definitions'] as const,
  householdCatalog: (householdId: string) => ['household-catalog', householdId] as const,
  kitchen: (householdId: string) => ['kitchen', householdId] as const,
  cookTimes: (householdId: string) => ['cook-times', householdId] as const,
  cookLogs: (recipeId: string) => ['cook-logs', recipeId] as const,
  dietaryPreferences: (userId: string) => ['dietary-preferences', userId] as const,
};

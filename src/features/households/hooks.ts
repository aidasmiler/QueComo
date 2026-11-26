import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import { queryKeys } from '@/lib/query/keys';
import * as api from './api';

export function useMyHouseholds() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.households(user.id),
    queryFn: () => api.fetchMyHouseholds(user.id),
  });
}

export function useHouseholdMembers(householdId: string) {
  return useQuery({
    queryKey: queryKeys.householdMembers(householdId),
    queryFn: () => api.fetchMembers(householdId),
  });
}

export function usePendingInvitations(householdId: string) {
  return useQuery({
    queryKey: queryKeys.householdInvitations(householdId),
    queryFn: () => api.fetchPendingInvitations(householdId),
  });
}

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.invitationPreview(token),
    queryFn: () => api.fetchInvitationPreview(token),
    retry: false,
  });
}

/** Invalidates everything household-related for the current user after a membership change. */
function useInvalidateHouseholds() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  return async (householdId?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.households(user.id) }),
      householdId ? qc.invalidateQueries({ queryKey: queryKeys.household(householdId) }) : null,
    ]);
  };
}

export function useCreateHousehold() {
  const invalidate = useInvalidateHouseholds();
  // Awaited so the membership list is fresh before the caller navigates (the guards read it).
  return useMutation({ mutationFn: api.createHousehold, onSuccess: () => invalidate() });
}

export function useRenameHousehold(householdId: string) {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (name: string) => api.renameHousehold(householdId, name),
    onSuccess: () => invalidate(householdId),
  });
}

export function useCreateInvitation(householdId: string) {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: () => api.createInvitation(householdId),
    onSuccess: () => invalidate(householdId),
  });
}

export function useRevokeInvitation(householdId: string) {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: api.revokeInvitation,
    onSuccess: () => invalidate(householdId),
  });
}

export function useAcceptInvitation() {
  const invalidate = useInvalidateHouseholds();
  // Awaited so the membership list is fresh before the caller navigates (the guards read it).
  return useMutation({ mutationFn: api.acceptInvitation, onSuccess: (id) => invalidate(id) });
}

export function useLeaveHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({ mutationFn: api.leaveHousehold, onSuccess: (_, id) => invalidate(id) });
}

export function useDeleteHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({ mutationFn: api.deleteHousehold, onSuccess: (_, id) => invalidate(id) });
}

export function useRemoveMember(householdId: string) {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (userId: string) => api.removeMember(householdId, userId),
    onSuccess: () => invalidate(householdId),
  });
}

export function useTransferOwnership(householdId: string) {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (userId: string) => api.transferOwnership(householdId, userId),
    onSuccess: () => invalidate(householdId),
  });
}

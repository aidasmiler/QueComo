import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/auth-context';
import { isSupportedLocale, writeDeviceLocale, type SupportedLocale } from '@/i18n/locale';
import { queryKeys } from '@/lib/query/keys';
import {
  addDietaryPreference,
  fetchDietaryPreferences,
  fetchProfile,
  removeDietaryPreference,
  updateProfile,
  type Profile,
} from './api';

export function useProfile() {
  const user = useCurrentUser();
  return useQuery({ queryKey: queryKeys.profile(user.id), queryFn: () => fetchProfile(user.id) });
}

export function useUpdateProfile() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateProfile>[1]) => updateProfile(user.id, patch),
    onSuccess: (profile) => qc.setQueryData(queryKeys.profile(user.id), profile),
  });
}

/**
 * Changes the UI language immediately, then persists it to the profile (source of truth).
 * Resolves to false when the remote save failed so the caller can inform the user.
 */
export function useChangeLocale() {
  const { i18n } = useTranslation();
  const user = useCurrentUser();
  const qc = useQueryClient();
  return useCallback(
    async (locale: SupportedLocale): Promise<boolean> => {
      await i18n.changeLanguage(locale);
      writeDeviceLocale(locale);
      qc.setQueryData<Profile>(queryKeys.profile(user.id), (old) =>
        old ? { ...old, locale } : old,
      );
      try {
        const saved = await updateProfile(user.id, { locale });
        qc.setQueryData(queryKeys.profile(user.id), saved);
        return true;
      } catch {
        return false;
      }
    },
    [i18n, qc, user.id],
  );
}

/** Applies the profile's language once it loads (remote profile wins over the device default). */
export function useSyncProfileLocale(profile: Profile | undefined) {
  const { i18n } = useTranslation();
  if (profile && isSupportedLocale(profile.locale) && i18n.language !== profile.locale) {
    void i18n.changeLanguage(profile.locale);
    writeDeviceLocale(profile.locale);
  }
}

export function useDietaryPreferences() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.dietaryPreferences(user.id),
    queryFn: fetchDietaryPreferences,
  });
}

export function useAddDietaryPreference() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addDietaryPreference,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.dietaryPreferences(user.id) }),
  });
}

export function useRemoveDietaryPreference() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeDietaryPreference,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.dietaryPreferences(user.id) }),
  });
}

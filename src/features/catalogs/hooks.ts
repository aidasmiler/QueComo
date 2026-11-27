import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ItemKey, ItemRef } from '@/domain/recipes/catalog';
import { useActiveHousehold } from '@/features/households/active-household';
import { queryKeys } from '@/lib/query/keys';
import * as api from './api';

export interface CatalogItem {
  key: ItemKey;
  ref: ItemRef;
  kind: api.CatalogKind;
  /** Global definition id, or the custom item's uuid. */
  id: string;
  custom: boolean;
  name: string;
  /** tag_group / utensil_group of a global item, 'custom' for household items. */
  group: string;
  icon: string | null;
  color: string | null;
  hidden: boolean;
  /** Utensils proposed by the quick kitchen setup. */
  common: boolean;
  /** Household keywords for the classifier (custom items only). */
  keywords: string[];
}

export interface Catalog {
  categories: CatalogItem[];
  tags: CatalogItem[];
  utensils: CatalogItem[];
  /** Lookups per kind: keys are only unique within a kind. */
  maps: Record<api.CatalogKind, Map<ItemKey, CatalogItem>>;
}

function useActive() {
  const { active } = useActiveHousehold();
  if (!active) throw new Error('Catalogs require an active household');
  return active;
}

/** True when the current user owns the active household (may manage catalogs). */
export function useIsOwner() {
  return useActive().role === 'owner';
}

export function useCatalog() {
  const { t, i18n } = useTranslation('catalog');
  const household = useActive();
  const definitions = useQuery({
    queryKey: queryKeys.catalogDefinitions,
    queryFn: api.fetchDefinitions,
    staleTime: Infinity,
  });
  const custom = useQuery({
    queryKey: queryKeys.householdCatalog(household.id),
    queryFn: () => api.fetchHouseholdCatalog(household.id),
  });

  const data = useMemo<Catalog | undefined>(() => {
    if (!definitions.data || !custom.data) return undefined;
    const hidden = new Set(custom.data.hidden.map((h) => `${h.kind}:${h.item_id}`));
    const isHidden = (kind: api.CatalogKind, id: string) => hidden.has(`${kind}:${id}`);
    const global = (
      kind: api.CatalogKind,
      id: string,
      name: string,
      extra: Partial<CatalogItem>,
    ): CatalogItem => ({
      key: `def:${id}`,
      ref: { def: id },
      kind,
      id,
      custom: false,
      name,
      group: '',
      icon: null,
      color: null,
      hidden: isHidden(kind, id),
      common: false,
      keywords: [],
      ...extra,
    });
    const own = (
      kind: api.CatalogKind,
      row: {
        id: string;
        name: string;
        icon?: string | null;
        color?: string | null;
        keywords?: string[];
      },
    ): CatalogItem => ({
      key: `custom:${row.id}`,
      ref: { custom: row.id },
      kind,
      id: row.id,
      custom: true,
      name: row.name,
      group: 'custom',
      icon: row.icon ?? null,
      color: row.color ?? null,
      hidden: false,
      common: false,
      keywords: row.keywords ?? [],
    });
    const sort = (items: CatalogItem[]) =>
      [...items].sort((a, b) => a.name.localeCompare(b.name, i18n.language));
    const categories = [
      ...definitions.data.categories.map((d) =>
        global('category', d.id, t(`categories.${d.id}` as never, { defaultValue: d.name_es }), {
          icon: d.icon,
          color: d.color,
        }),
      ),
      ...sort(custom.data.categories.map((c) => own('category', c))),
    ];
    const tags = [
      ...definitions.data.tags.map((d) =>
        global('tag', d.id, t(`tags.${d.id}` as never, { defaultValue: d.name_es }), {
          group: d.tag_group,
        }),
      ),
      ...sort(custom.data.tags.map((c) => own('tag', c))),
    ];
    const utensils = [
      ...definitions.data.utensils.map((d) =>
        global('utensil', d.id, t(`utensils.${d.id}` as never, { defaultValue: d.name_es }), {
          group: d.utensil_group,
          common: d.common,
        }),
      ),
      ...sort(custom.data.utensils.map((c) => own('utensil', c))),
    ];
    const toMap = (items: CatalogItem[]) => new Map(items.map((item) => [item.key, item] as const));
    return {
      categories,
      tags,
      utensils,
      maps: { category: toMap(categories), tag: toMap(tags), utensil: toMap(utensils) },
    };
  }, [definitions.data, custom.data, t, i18n.language]);

  return {
    data,
    isPending: definitions.isPending || custom.isPending,
    isError: definitions.isError || custom.isError,
    error: definitions.error ?? custom.error,
  };
}

export function useKitchen() {
  const household = useActive();
  return useQuery({
    queryKey: queryKeys.kitchen(household.id),
    queryFn: () => api.fetchKitchen(household.id),
  });
}

function useInvalidateCatalog() {
  const qc = useQueryClient();
  const household = useActive();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.householdCatalog(household.id) }),
      qc.invalidateQueries({ queryKey: queryKeys.recipes(household.id) }),
      qc.invalidateQueries({ queryKey: queryKeys.kitchen(household.id) }),
      qc.invalidateQueries({ queryKey: ['recipe'] }),
    ]);
}

export function useCreateCustom(kind: api.CatalogKind) {
  const household = useActive();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: api.CustomFields) => api.createCustom(kind, household.id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.householdCatalog(household.id) }),
  });
}

export function useUpdateCustom(kind: api.CatalogKind) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: api.CustomFields }) =>
      api.updateCustom(kind, id, fields),
    onSuccess: invalidate,
  });
}

export function useDeleteCustom(kind: api.CatalogKind) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => api.deleteCustom(kind, id),
    onSuccess: invalidate,
  });
}

export function useSetHidden(kind: api.CatalogKind) {
  const household = useActive();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      api.setHidden(household.id, kind, id, hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.householdCatalog(household.id) }),
  });
}

export function useSetUtensilsAvailable() {
  const household = useActive();
  const qc = useQueryClient();
  const key = queryKeys.kitchen(household.id);
  return useMutation({
    mutationFn: ({ keys, available }: { keys: ItemKey[]; available: boolean }) =>
      api.setUtensilsAvailable(household.id, keys, available),
    // Optimistic: ticking must feel instant on a phone.
    onMutate: async ({ keys, available }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<api.KitchenState>(key);
      if (previous) {
        const next = new Set(previous.available);
        for (const k of keys) {
          if (available) next.add(k);
          else next.delete(k);
        }
        qc.setQueryData<api.KitchenState>(key, { configured: true, available: next });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkKitchenConfigured() {
  const household = useActive();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markKitchenConfigured(household.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kitchen(household.id) }),
  });
}

export function useCookTimes() {
  const household = useActive();
  return useQuery({
    queryKey: queryKeys.cookTimes(household.id),
    queryFn: () => api.fetchHouseholdCookTimes(household.id),
  });
}

export function useCookLogs(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.cookLogs(recipeId),
    queryFn: () => api.fetchCookLogs(recipeId),
  });
}

function useInvalidateCookLogs(recipeId: string) {
  const qc = useQueryClient();
  const household = useActive();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.cookLogs(recipeId) }),
      qc.invalidateQueries({ queryKey: queryKeys.cookTimes(household.id) }),
    ]);
}

export function useCreateCookLog(recipeId: string) {
  const invalidate = useInvalidateCookLogs(recipeId);
  return useMutation({ mutationFn: api.createCookLog, onSuccess: invalidate });
}

export function useUpdateCookLog(recipeId: string) {
  const invalidate = useInvalidateCookLogs(recipeId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: api.CookLogPatch }) =>
      api.updateCookLog(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteCookLog(recipeId: string) {
  const invalidate = useInvalidateCookLogs(recipeId);
  return useMutation({ mutationFn: api.deleteCookLog, onSuccess: invalidate });
}

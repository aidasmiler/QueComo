/** A catalog item reference: a global definition (stable text id) or a household custom item. */
export type ItemRef = { def: string } | { custom: string };

/** Stable string key for sets and maps: `def:<id>` or `custom:<uuid>`. */
export type ItemKey = `def:${string}` | `custom:${string}`;

export function refKey(ref: ItemRef): ItemKey {
  return 'def' in ref ? `def:${ref.def}` : `custom:${ref.custom}`;
}

export function keyRef(key: ItemKey): ItemRef {
  return key.startsWith('def:') ? { def: key.slice(4) } : { custom: key.slice(7) };
}

/** Builds a key from a row with one of two nullable columns (num_nonnulls = 1 in the schema). */
export function rowKey(defId: string | null, customId: string | null): ItemKey {
  return defId !== null ? `def:${defId}` : `custom:${customId ?? ''}`;
}

/** Minimum number of real cooks before a median replaces the recipe's original time. */
export const MIN_LOGS_FOR_ESTIMATE = 3;

export interface CookLogTimes {
  user_id: string;
  cooked_on: string;
  total_minutes: number | null;
  active_minutes: number | null;
}

export function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
  return Math.round(value);
}

export interface LogStats {
  count: number;
  medianTotal: number | null;
  medianActive: number | null;
  lastCookedOn: string | null;
  /** Logs with each value, which is what the medians are based on. */
  totalCount: number;
  activeCount: number;
}

export function logStats(logs: readonly CookLogTimes[]): LogStats {
  const totals = logs.flatMap((log) => (log.total_minutes === null ? [] : [log.total_minutes]));
  const actives = logs.flatMap((log) => (log.active_minutes === null ? [] : [log.active_minutes]));
  const lastCookedOn = logs.reduce<string | null>(
    (last, log) => (last === null || log.cooked_on > last ? log.cooked_on : last),
    null,
  );
  return {
    count: logs.length,
    medianTotal: median(totals),
    medianActive: median(actives),
    lastCookedOn,
    totalCount: totals.length,
    activeCount: actives.length,
  };
}

export type EstimateSource = 'personal' | 'household' | 'original';

export interface TimeEstimate {
  minutes: number | null;
  source: EstimateSource;
  /** Number of real cooks behind the value (0 for the original time). */
  basedOn: number;
}

export interface EffectiveTimes {
  total: TimeEstimate;
  active: TimeEstimate;
  personal: LogStats;
  household: LogStats;
  /** True when a time comes from real cooks instead of the recipe. */
  personalised: boolean;
}

function pick(
  original: number | null,
  personal: { value: number | null; count: number },
  household: { value: number | null; count: number },
): TimeEstimate {
  if (personal.count >= MIN_LOGS_FOR_ESTIMATE && personal.value !== null) {
    return { minutes: personal.value, source: 'personal', basedOn: personal.count };
  }
  if (household.count >= MIN_LOGS_FOR_ESTIMATE && household.value !== null) {
    return { minutes: household.value, source: 'household', basedOn: household.count };
  }
  return { minutes: original, source: 'original', basedOn: 0 };
}

/**
 * Personal median from 3+ own cooks, else household median from 3+ cooks, else the recipe's time.
 * Each time (total, active) is chosen independently. Servings are not used to scale times.
 */
export function effectiveTimes(
  original: { total: number | null; active: number | null },
  logs: readonly CookLogTimes[],
  userId: string,
): EffectiveTimes {
  const personal = logStats(logs.filter((log) => log.user_id === userId));
  const household = logStats(logs);
  const total = pick(
    original.total,
    { value: personal.medianTotal, count: personal.totalCount },
    { value: household.medianTotal, count: household.totalCount },
  );
  const active = pick(
    original.active,
    { value: personal.medianActive, count: personal.activeCount },
    { value: household.medianActive, count: household.activeCount },
  );
  return {
    total,
    active,
    personal,
    household,
    personalised: total.source !== 'original' || active.source !== 'original',
  };
}

import type { EntryDraft } from "@/features/plan/component-entries-step";

export function defaultDueDate(year: number): string {
  return `${year}-12-31`;
}

/** Normalize due dates before draft API calls so empty date inputs do not fail validation. */
export function prepareDraftEntries(entries: EntryDraft[], year: number): EntryDraft[] {
  const fallback = defaultDueDate(year);
  return entries.map((entry) => ({
    ...entry,
    dueDate: entry.dueDate?.trim() ? entry.dueDate : fallback,
  }));
}

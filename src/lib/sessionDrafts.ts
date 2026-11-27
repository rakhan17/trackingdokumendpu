import type { Input1Row, Input2Row } from '../types';

export type DraftKind = 'input_1' | 'input_2';
export type DraftRow = Input1Row | Input2Row;
export interface SessionDraft {
  rows: DraftRow[];
  deletedIds: string[];
  dirty: boolean;
}

const storageKey = (kind: DraftKind) => `tracking-dpu:draft:${kind}`;
const memory = new Map<DraftKind, SessionDraft>();

// sessionStorage survives SPA route unmounts. Clear drafts on a hard refresh,
// matching the requested lifecycle: keep while navigating, discard on refresh/close.
if (typeof window !== 'undefined') {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === 'reload') {
    try {
      sessionStorage.removeItem(storageKey('input_1'));
      sessionStorage.removeItem(storageKey('input_2'));
    } catch { /* storage may be unavailable in private/restricted contexts */ }
  }
}

function cloneDraft(draft: SessionDraft): SessionDraft {
  return { rows: draft.rows.map(row => ({ ...row })), deletedIds: [...draft.deletedIds], dirty: draft.dirty };
}

export function getSessionDraft(kind: DraftKind): SessionDraft | undefined {
  const cached = memory.get(kind);
  if (cached) return cloneDraft(cached);
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(storageKey(kind));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SessionDraft;
    if (!Array.isArray(parsed.rows) || !Array.isArray(parsed.deletedIds)) return undefined;
    memory.set(kind, cloneDraft(parsed));
    return cloneDraft(parsed);
  } catch {
    return undefined;
  }
}

export function setSessionDraft(kind: DraftKind, draft: SessionDraft): void {
  const copy = cloneDraft(draft);
  memory.set(kind, copy);
  if (typeof window !== 'undefined') {
    try { sessionStorage.setItem(storageKey(kind), JSON.stringify(copy)); } catch { /* memory fallback */ }
  }
}

export function clearSessionDraft(kind: DraftKind): void {
  memory.delete(kind);
  if (typeof window !== 'undefined') {
    try { sessionStorage.removeItem(storageKey(kind)); } catch { /* ignore */ }
  }
}

import type { Input1Row, Input2Row } from '../types';

export type DraftKind = 'input_1' | 'input_2';
export type DraftRow = Input1Row | Input2Row;
export interface SessionDraft {
  rows: DraftRow[];
  deletedIds: string[];
  dirty: boolean;
}

// Module memory is intentionally used instead of local/sessionStorage:
// it survives React route unmounts within this open tab, but disappears on
// refresh or closing the tab, exactly as requested.
const drafts = new Map<DraftKind, SessionDraft>();

export function getSessionDraft(kind: DraftKind): SessionDraft | undefined {
  const draft = drafts.get(kind);
  return draft ? {
    rows: draft.rows.map(row => ({ ...row })),
    deletedIds: [...draft.deletedIds],
    dirty: draft.dirty,
  } : undefined;
}

export function setSessionDraft(kind: DraftKind, draft: SessionDraft): void {
  drafts.set(kind, {
    rows: draft.rows.map(row => ({ ...row })),
    deletedIds: [...draft.deletedIds],
    dirty: draft.dirty,
  });
}

export function clearSessionDraft(kind: DraftKind): void {
  drafts.delete(kind);
}

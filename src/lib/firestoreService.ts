import { collection, deleteDoc, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import type { Input1Row, Input2Row } from '../types';

type Row = Input1Row | Input2Row;
const col = (name: 'input_1' | 'input_2') => collection(db, name);

export function subscribeRows<T extends Row>(name: 'input_1' | 'input_2', onRows: (rows: T[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(col(name), snapshot => {
    const rows = snapshot.docs.map(item => ({ ...item.data(), id: item.id } as T));
    rows.sort((a, b) => String(a.no ?? '').localeCompare(String(b.no ?? ''), 'id', { numeric: true }));
    onRows(rows);
  }, error => onError?.(error));
}
export async function saveRow(name: 'input_1' | 'input_2', row: Row): Promise<void> {
  const { id, ...data } = row;
  await setDoc(doc(db, name, id), { ...data, updatedAt: Date.now() }, { merge: true });
}
export async function removeRow(name: 'input_1' | 'input_2', id: string): Promise<void> {
  await deleteDoc(doc(db, name, id));
}
export function createRowId(): string {
  return crypto.randomUUID();
}
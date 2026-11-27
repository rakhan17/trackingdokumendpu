import { collection, deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
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
  const reference = doc(db, name, id);
  await setDoc(reference, { ...data, updatedAt: Date.now() }, { merge: true });
  // Confirm the write reached the server before the UI can report success.
  const persisted = await getDocFromServer(reference);
  if (!persisted.exists()) throw new Error(`Firebase belum mengonfirmasi data ${id} tersimpan.`);
  const saved = persisted.data();
  for (const [key, value] of Object.entries(data)) {
    if (JSON.stringify(saved[key] ?? null) !== JSON.stringify(value ?? null)) {
      throw new Error(`Verifikasi Firebase gagal pada kolom ${key} (baris ${id}).`);
    }
  }
}
export async function removeRow(name: 'input_1' | 'input_2', id: string): Promise<void> {
  await deleteDoc(doc(db, name, id));
}
export function createRowId(): string {
  return crypto.randomUUID();
}
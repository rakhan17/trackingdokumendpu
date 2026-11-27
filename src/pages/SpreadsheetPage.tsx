import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Plus, Trash2, Save, CloudUpload, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SpreadsheetInput } from '../components/SpreadsheetInput';
import type { Input1Row, Input2Row } from '../types';
import { INPUT1_COLUMNS, INPUT2_COLUMNS } from '../types';
import { createRowId, saveRow, removeRow } from '../lib/firestoreService';
import { clearSessionDraft, getSessionDraft, setSessionDraft, type DraftRow } from '../lib/sessionDrafts';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;

function comparable(row: Row): string {
  const { updatedAt: _updatedAt, ...content } = row as Row & { updatedAt?: unknown };
  return JSON.stringify(content);
}

export default function SpreadsheetPage({ kind, rows, input2Rows = [] }: { kind: Kind; rows: Row[]; input2Rows?: Input2Row[] }) {
  const isOne = kind === 'input_1';
  const columns = isOne ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const initialDraft = useRef(getSessionDraft(kind));
  const [draftRows, setDraftRows] = useState<Row[]>(() => (initialDraft.current?.rows as Row[] | undefined) ?? rows);
  const [deletedIds, setDeletedIds] = useState<string[]>(() => initialDraft.current?.deletedIds ?? []);
  const [dirty, setDirty] = useState(() => initialDraft.current?.dirty ?? false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [activeSpmCell, setActiveSpmCell] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [spmSearch, setSpmSearch] = useState('');
  const insertValueRef = useRef<((value: string) => void) | null>(null);
  const insertWrapRef = useRef<HTMLDivElement | null>(null);
  const baseRowsRef = useRef<Row[]>(rows);
  const draftRowsRef = useRef<Row[]>(draftRows);
  const deletedIdsRef = useRef<string[]>(deletedIds);
  const dirtyRef = useRef(dirty);
  draftRowsRef.current = draftRows;
  deletedIdsRef.current = deletedIds;
  dirtyRef.current = dirty;

  const commitDraft = useCallback((nextRows: Row[], nextDeleted: string[] = []) => {
    draftRowsRef.current = nextRows;
    deletedIdsRef.current = nextDeleted;
    dirtyRef.current = true;
    setDraftRows(nextRows);
    setDeletedIds(nextDeleted);
    setDirty(true);
    setSessionDraft(kind, { rows: nextRows as DraftRow[], deletedIds: nextDeleted, dirty: true });
  }, [kind]);

  useEffect(() => {
    // While a draft exists, Firestore snapshots must not overwrite it.
    if (!dirtyRef.current && !saving) {
      baseRowsRef.current = rows;
      draftRowsRef.current = rows;
      setDraftRows(rows);
    }
  }, [rows, saving]);

  const selected = draftRows.find(row => row.id === selectedId);
  // Only actual non-empty primary-key values from Input 2 are insertable.
  // Trim whitespace and deduplicate by the key itself, not by display row.
  const spmMatches = Array.from(new Map(input2Rows
    .map(row => ({ row, key: String(row.nomor_spm ?? '').trim() }))
    .filter(item => item.key.length > 0 && item.key.toLowerCase().includes(spmSearch.trim().toLowerCase()))
    .map(item => [item.key, item.row])).values());

  const handleActiveSpmCell = useCallback((id: string, insertValue?: ((value: string) => void), isKeyCell = false) => {
    if (!id) {
      if (insertOpen) return;
      setSelectedId('');
      setActiveSpmCell(false);
      insertValueRef.current = null;
      setInsertOpen(false);
      return;
    }
    setSelectedId(id);
    setActiveSpmCell(isKeyCell);
    insertValueRef.current = isKeyCell ? (insertValue ?? null) : null;
    if (id !== selectedId) setInsertOpen(false);
  }, [selectedId, insertOpen]);

  function chooseSpm(option: Input2Row) {
    if (!selected || !isOne || !activeSpmCell) {
      toast.error('Klik sel Nomor SPM di Input 1 terlebih dahulu.');
      return;
    }
    insertValueRef.current?.(option.nomor_spm);
    const next = draftRowsRef.current.map(row => row.id === selected.id
      ? ({ ...row, nomor_spm: option.nomor_spm, tanggal_spm: option.tanggal_spm, nilai_spm: option.nilai_bruto, bulan: option.bulan } as Row)
      : row);
    commitDraft(next, deletedIdsRef.current);
    setSpmSearch('');
    setInsertOpen(false);
    toast.success('Nomor SPM dimasukkan. Draft tersimpan sementara sampai halaman ditutup atau di-refresh.');
  }

  useEffect(() => {
    if (!insertOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (insertWrapRef.current?.contains(event.target as Node)) return;
      setInsertOpen(false);
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('.fortune-wrap')) {
        setSelectedId('');
        setActiveSpmCell(false);
        insertValueRef.current = null;
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [insertOpen]);

  function addRow() {
    const id = createRowId();
    const row: Row = isOne
      ? { id, no: String(draftRowsRef.current.length + 1), nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' }
      : { id, no: String(draftRowsRef.current.length + 1), tanggal_spm: '', nomor_spm: '', unit_skpd: '', nama_penerima: '', keterangan: '', jenis_spm: '', nilai_bruto: null, bulan: '' };
    commitDraft([...draftRowsRef.current, row], deletedIdsRef.current);
    setSelectedId(id);
    setActiveSpmCell(false);
    insertValueRef.current = null;
    setInsertOpen(false);
  }

  function deleteSelected() {
    if (!selected) {
      toast.error('Pilih baris yang ingin dihapus terlebih dahulu.');
      return;
    }
    const nextRows = draftRowsRef.current.filter(row => row.id !== selected.id);
    const nextDeleted = baseRowsRef.current.some(row => row.id === selected.id)
      ? [...new Set([...deletedIdsRef.current, selected.id])]
      : deletedIdsRef.current;
    commitDraft(nextRows, nextDeleted);
    setSelectedId('');
    setActiveSpmCell(false);
    insertValueRef.current = null;
    setInsertOpen(false);
  }

  const saveDraft = useCallback(async () => {
    if (saving) return;
    const currentRows = draftRowsRef.current;
    const currentDeleted = deletedIdsRef.current;
    // Always write the complete draft when dirty. The dataset is small, and
    // this avoids losing edits when the spreadsheet emits sparse/normalized
    // values that make a row-level diff incorrectly look unchanged.
    const rowsToSave = dirtyRef.current ? currentRows : [];
    const total = rowsToSave.length + currentDeleted.length;

    if (total === 0) {
      if (!dirtyRef.current) {
        toast.info('Tidak ada perubahan untuk disimpan.');
      } else {
        toast.error('Draft masih ada, tetapi belum ada baris yang bisa dikirim. Draft tidak dihapus.');
        setSessionDraft(kind, { rows: currentRows as DraftRow[], deletedIds: currentDeleted, dirty: true });
      }
      return;
    }

    setSaving(true);
    setProgress(0);
    try {
      let done = 0;
      for (const row of rowsToSave) {
        await saveRow(kind, row);
        done += 1;
        setProgress(Math.round(done / total * 100));
      }
      for (const id of currentDeleted) {
        await removeRow(kind, id);
        done += 1;
        setProgress(Math.round(done / total * 100));
      }

      baseRowsRef.current = currentRows;
      setProgress(100);
      // If the user continued editing while uploads were in flight, only mark
      // the submitted snapshot as saved and retain the newer draft.
      const latestRows = draftRowsRef.current;
      const latestDeleted = deletedIdsRef.current;
      const changedDuringSave = JSON.stringify(latestRows) !== JSON.stringify(currentRows)
        || JSON.stringify(latestDeleted) !== JSON.stringify(currentDeleted);
      if (changedDuringSave) {
        dirtyRef.current = true;
        setDirty(true);
        setSessionDraft(kind, { rows: latestRows as DraftRow[], deletedIds: latestDeleted, dirty: true });
        toast.success(`Firebase menyimpan ${total} operasi. Edit terbaru masih menjadi draft.`);
      } else {
        draftRowsRef.current = currentRows;
        deletedIdsRef.current = [];
        dirtyRef.current = false;
        setDeletedIds([]);
        setDirty(false);
        clearSessionDraft(kind);
        toast.success(`Berhasil menyimpan ${total} operasi ke Firebase.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Gagal menyimpan ke Firebase: ${message}`);
      // Keep the draft and deletion queue in module memory so retry works.
      setSessionDraft(kind, { rows: currentRows as DraftRow[], deletedIds: currentDeleted, dirty: true });
      dirtyRef.current = true;
      setDirty(true);
    } finally {
      setSaving(false);
    }
  }, [kind, saving]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveDraft();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveDraft]);

  function downloadCsv() {
    const csv = [columns.map(column => column.label), ...draftRows.map(row => columns.map(column => String((row as any)[column.key] ?? '')))]
      .map(line => line.map(value => '"' + value.replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = kind + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return <section className="sheet-workspace">
    <div className="sheet-toolbar no-print">
      <button className="secondary-button" onClick={addRow}><Plus size={15}/> Tambah baris</button>
      {isOne && activeSpmCell && selected && <div className="spm-insert-wrap" ref={insertWrapRef}>
        <button className="secondary-button spm-insert-button" type="button" onClick={() => { setInsertOpen(value => !value); setSpmSearch(''); }}><Plus size={14}/> Insert</button>
        {insertOpen && <div className="spm-insert-menu">
          <div className="spm-insert-search"><Search size={13}/><input autoFocus value={spmSearch} onChange={event => setSpmSearch(event.target.value)} placeholder="Cari Nomor SPM..."/></div>
          <div className="spm-insert-list">{spmMatches.length ? spmMatches.map(option => <button type="button" key={option.id} onClick={() => chooseSpm(option)}><strong>{option.nomor_spm}</strong><span>{option.tanggal_spm} · {option.unit_skpd} · {option.nama_penerima}</span></button>) : <p>Tidak ada Nomor SPM yang cocok.</p>}</div>
        </div>}
      </div>}
      <button className="secondary-button danger-button" onClick={deleteSelected}><Trash2 size={15}/> Hapus baris</button>
      <span className="save-state">{saving ? <><CloudUpload size={14}/> Mengunggah {progress}%</> : dirty ? <><AlertCircle size={14}/> Belum disimpan</> : <><CheckCircle2 size={14}/> Tersimpan</>}</span>
      <button className="secondary-button" onClick={downloadCsv}><Download size={15}/> Export CSV</button>
      <button className="primary-button save-button" onClick={() => void saveDraft()} disabled={saving}><Save size={15}/>{saving ? 'Menyimpan...' : 'Simpan · ⌘/Ctrl + S'}</button>
    </div>
    {saving && <div className="upload-progress"><span style={{ width: progress + '%' }}/></div>}
    <div className="sheet-grid-frame"><SpreadsheetInput kind={kind} rows={draftRows} input2Rows={input2Rows} onRowsChange={next => commitDraft(next, deletedIdsRef.current)} onActiveRowChange={handleActiveSpmCell}/></div>
  </section>;
}

import { useMemo, useState } from 'react';
import { Download, Search, Plus, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { SpreadsheetInput } from '../components/SpreadsheetInput';
import type { Input1Row, Input2Row } from '../types';
import { INPUT1_COLUMNS, INPUT2_COLUMNS } from '../types';
import { createRowId, saveRow } from '../lib/firestoreService';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;

export default function SpreadsheetPage({ kind, rows, input2Rows = [] }: { kind: Kind; rows: Row[]; input2Rows?: Input2Row[] }) {
  const isOne = kind === 'input_1';
  const columns = isOne ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const [targetId, setTargetId] = useState('');
  const [keyQuery, setKeyQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const selectedRow = rows.find(row => row.id === targetId);
  const matches = useMemo(() => input2Rows.filter(row => row.nomor_spm.toLowerCase().includes(keyQuery.toLowerCase())).slice(0, 30), [input2Rows, keyQuery]);

  async function assignSpm(option: Input2Row) {
    if (!selectedRow || !isOne) return;
    setSavingKey(true);
    try {
      const updated: Input1Row = {
        ...(selectedRow as Input1Row),
        nomor_spm: option.nomor_spm,
        tanggal_spm: option.tanggal_spm,
        nilai_spm: option.nilai_bruto,
        bulan: option.bulan
      };
      await saveRow('input_1', updated);
      setKeyQuery(option.nomor_spm);
      setPickerOpen(false);
      toast.success('Nomor SPM dan data terkait berhasil ditarik dari Input 2.');
    } catch {
      toast.error('Gagal mengambil Nomor SPM. Periksa koneksi Firebase.');
    } finally {
      setSavingKey(false);
    }
  }

  async function addInput1Row() {
    const row: Input1Row = { id: createRowId(), no: String(rows.length + 1), nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' };
    try {
      await saveRow('input_1', row);
      setTargetId(row.id);
      toast.success('Baris baru ditambahkan. Pilih Nomor SPM dari daftar Input 2.');
    } catch {
      toast.error('Gagal menambahkan baris.');
    }
  }

  function downloadCsv() {
    const csv = [columns.map(column => column.label), ...rows.map(row => columns.map(column => String((row as any)[column.key] ?? '')))]
      .map(line => line.map(value => '"' + value.replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${kind}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="sheet-workspace">
    <div className="sheet-toolbar no-print">
      {isOne ? <>
        <button className="secondary-button" onClick={addInput1Row}><Plus size={15}/> Tambah baris</button>
        <div className="spm-picker">
          <label htmlFor="spm-target">Baris tujuan</label>
          <select id="spm-target" value={targetId} onChange={event => setTargetId(event.target.value)}>
            <option value="">Pilih baris Input 1</option>
            {rows.map((row, index) => <option key={row.id} value={row.id}>Baris {index + 1} · {row.no || 'Tanpa nomor'}</option>)}
          </select>
          <div className="spm-search-wrap">
            <Search size={15}/>
            <input value={keyQuery} onFocus={() => setPickerOpen(true)} onChange={event => { setKeyQuery(event.target.value); setPickerOpen(true); }} placeholder="Cari / pilih Nomor SPM dari Input 2..." />
            <button type="button" aria-label="Buka daftar Nomor SPM" onClick={() => setPickerOpen(value => !value)}><ChevronDown size={15}/></button>
            {pickerOpen && <div className="spm-options">
              {matches.length ? matches.map(option => <button type="button" key={option.id} onClick={() => void assignSpm(option)} disabled={!selectedRow || savingKey}>
                <strong>{option.nomor_spm}</strong>
                <span>{option.tanggal_spm} · {option.jenis_spm} · {option.unit_skpd}</span>
              </button>) : <p>{input2Rows.length ? 'Nomor SPM tidak ditemukan.' : 'Belum ada data Nomor SPM di Input 2.'}</p>}
            </div>}
          </div>
          <span className="picker-hint">{selectedRow ? 'Pilih nomor untuk menarik tanggal, nilai, dan bulan.' : 'Pilih baris tujuan terlebih dahulu.'}</span>
        </div>
      </> : <div className="input2-toolbar-note">Input 2 · Register SPM · Sumber data Nomor SPM</div>}
      <span className="row-count">{rows.length} baris</span>
      <button className="secondary-button" onClick={downloadCsv}><Download size={15}/> Export CSV</button>
    </div>
    <div className="sheet-grid-frame"><SpreadsheetInput kind={kind} rows={rows} input2Rows={input2Rows}/></div>
  </section>;
}

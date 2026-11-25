import { useCallback, useEffect, useMemo } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId, saveRow } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;
const blank1 = (): Input1Row => ({ id: createRowId(), no: '', nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' });
const blank2 = (): Input2Row => ({ id: createRowId(), no: '', tanggal_spm: '', nomor_spm: '', unit_skpd: '', nama_penerima: '', keterangan: '', jenis_spm: '', nilai_bruto: null, bulan: '' });

export function SpreadsheetInput({ kind, rows }: { kind: Kind; rows: Row[] }) {
  const columns = kind === 'input_1' ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const sheetData = useMemo(() => {
    const header = columns.map((column, c) => ({ r: 0, c, v: { v: column.label, m: column.label, ct: { fa: '@', t: 's' } } }));
    const cells = rows.map((row, r) => columns.map((column, c) => {
      const value = row[column.key as keyof Row];
      const isKey = column.key === 'nomor_spm';
      const isDocumentNumber = ['nomor_spp', 'nomor_spm', 'nomor_sp2d'].includes(String(column.key));
      const text = isDocumentNumber || value == null ? String(value ?? '') : value;
      return { r: r + 1, c, v: { v: text, m: String(text), ct: { fa: isDocumentNumber ? '@' : 'General', t: isDocumentNumber ? 's' : 'g' }, ...(isKey ? { bg: '#f3e8ff', fc: '#7e22ce' } : {}) } };
    })).flat();
    return [{ name: kind === 'input_1' ? 'Input 1' : 'Input 2', celldata: [...header, ...cells], row: Math.max(rows.length + 30, 100), column: columns.length, config: { columnlen: Object.fromEntries(columns.map((_, i) => [i, 150])) } }];
  }, [columns, kind, rows]);

  const onChange = useCallback((data: any[]) => {
    const sheet = data?.[0];
    if (!sheet?.celldata) return;
    const matrix: Record<number, Record<number, any>> = {};
    sheet.celldata.forEach((cell: any) => { if (cell.r > 0) (matrix[cell.r] ??= {})[cell.c] = cell.v?.v ?? cell.v?.m ?? ''; });
    const entries = Object.entries(matrix).filter(([, cells]) => Object.values(cells).some(value => String(value ?? '').trim() !== ''));
    const source = rows as Row[];
    void Promise.all(entries.map(async ([index, cells]) => {
      const row = (kind === 'input_1' ? blank1() : blank2()) as Row;
      const existing = source[Number(index) - 1];
      row.id = existing?.id ?? row.id;
      columns.forEach((column, c) => {
        const raw = cells[c] ?? '';
        const key = String(column.key);
        if (['nilai_spp', 'nilai_spm', 'nilai_sp2d', 'nilai_bruto'].includes(key)) {
          const normalized = String(raw).replace(/[\sRp.]/g, '').replace(/,/g, '.');
          (row as any)[key] = normalized === '' ? null : Number(normalized);
        } else {
          // Nomor dokumen sengaja disimpan sebagai string, termasuk nol di depan.
          (row as any)[key] = String(raw ?? '');
        }
      });
      await saveRow(kind, row);
    })).then(() => toast.success('Perubahan spreadsheet tersimpan')).catch(() => toast.error('Gagal menyimpan. Periksa koneksi Firebase.'));
  }, [columns, kind, rows]);

  useEffect(() => { /* realtime snapshot updates the workbook source */ }, [rows]);
  return <div className="fortune-wrap"><Workbook data={sheetData as any} onChange={onChange} showToolbar showFormulaBar showSheetTabs={false} /></div>;
}
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId, saveRow } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;
const DATA_START = 6;
const blank1 = (): Input1Row => ({ id: createRowId(), no: '', nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' });
const blank2 = (): Input2Row => ({ id: createRowId(), no: '', tanggal_spm: '', nomor_spm: '', unit_skpd: '', nama_penerima: '', keterangan: '', jenis_spm: '', nilai_bruto: null, bulan: '' });

export function SpreadsheetInput({ kind, rows }: { kind: Kind; rows: Row[] }) {
  const columns = kind === 'input_1' ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const baseline = useRef<string[][]>([]);
  const isOne = kind === 'input_1';
  const documentNumberColumns = columns.map((column, index) => ['nomor_spp', 'nomor_spm', 'nomor_sp2d'].includes(String(column.key)) ? index : -1).filter(index => index >= 0);

  const sheetData = useMemo(() => {
    const cells: any[] = [];
    const put = (r: number, c: number, value: any, style: Record<string, any> = {}) => cells.push({ r, c, v: { v: value, m: String(value ?? ''), ...style } });
    const titleStyle = { bg: '#FFFFFF', fc: '#111827', bl: 1, fs: 13, ht: 1, vt: 1 };
    const groupStyle = (bg: string) => ({ bg, fc: '#111827', bl: 1, ht: 1, vt: 1, fs: 10 });
    const headerStyle = (bg: string, extra: Record<string, any> = {}) => ({ bg, fc: '#111827', bl: 1, ht: 1, vt: 1, fs: 10, ...extra });

    if (isOne) {
      put(0, 0, 'TRACKING DOKUMEN', { ...titleStyle, fs: 16 });
      put(1, 0, 'SKPD: DINAS PEKERJAAN UMUM', titleStyle);
      put(2, 0, 'Periode: 1 Januari 2026 s.d. 31 Oktober 2026', titleStyle);
      put(4, 0, 'NO', groupStyle('#BFBFBF'));
      put(4, 1, 'Surat Permintaan Pembayaran (SPP)', groupStyle('#FFFF00'));
      put(4, 4, 'Surat Perintah Membayar (SPM)', groupStyle('#92D050'));
      put(4, 7, 'Surat Perintah Pencairan Dana (SP2D)', groupStyle('#00B0F0'));
      put(4, 10, 'Bulan', groupStyle('#00B0F0'));
      const colors: Record<string, string> = {
        nomor_spp: '#FFFF00', tanggal_spp: '#FFFF00', nilai_spp: '#FFFF00',
        nomor_spm: '#E739DF', tanggal_spm: '#92D050', nilai_spm: '#92D050',
        nomor_sp2d: '#00B0F0', tanggal_sp2d: '#00B0F0', nilai_sp2d: '#00B0F0', bulan: '#00B0F0', no: '#BFBFBF'
      };
      columns.forEach((column, c) => put(5, c, column.label, headerStyle(colors[String(column.key)] ?? '#FFFFFF', column.key === 'nomor_spm' ? { fc: '#581C87' } : {})));
    } else {
      put(0, 0, 'PEMERINTAH KOTA BALIKPAPAN', { ...titleStyle, fs: 14 });
      put(1, 0, 'REGISTER SPM (TRANSAKSI)', titleStyle);
      put(2, 0, 'SEMUA SKPD (KONSOLIDASI)', titleStyle);
      put(3, 0, 'PERIODE: 1 Januari 2026 s.d. 31 Oktober 2026', titleStyle);
      columns.forEach((column, c) => put(5, c, column.key === 'nilai_bruto' ? 'Nilai (Rp) Bruto' : column.label, headerStyle('#FCE4D6')));
    }

    const dataCells = rows.map((row, index) => columns.map((column, c) => {
      const value = row[column.key as keyof Row];
      const isDocumentNumber = ['nomor_spp', 'nomor_spm', 'nomor_sp2d'].includes(String(column.key));
      const text = isDocumentNumber || value == null ? String(value ?? '') : value;
      const style = isDocumentNumber ? { ct: { fa: '@', t: 's' } } : {};
      const keyStyle = isOne && column.key === 'nomor_spm' ? { bg: '#FCE7F9', fc: '#581C87' } : {};
      return { r: DATA_START + index, c, v: { v: text, m: String(text), ...style, ...keyStyle } };
    })).flat();
    cells.push(...dataCells);

    const formattedRows = Math.max(rows.length + 80, 100);
    const textFormatCells = Array.from({ length: formattedRows }, (_, index) =>
      documentNumberColumns.map(c => ({ r: DATA_START + index, c, v: { v: '', m: '', ct: { fa: '@', t: 's' }, ...(isOne && columns[c].key === 'nomor_spm' ? { bg: '#FCE7F9', fc: '#581C87' } : {}) } }))
    ).flat().filter(cell => !dataCells.some(existing => existing.r === cell.r && existing.c === cell.c));
    cells.push(...textFormatCells);

    const widths = isOne
      ? [55, 300, 130, 130, 300, 130, 130, 300, 130, 130, 100]
      : [60, 145, 310, 220, 280, 420, 100, 150, 110];
    return [{
      name: isOne ? 'Input 1' : 'Input 2',
      celldata: cells,
      row: DATA_START + formattedRows,
      column: columns.length,
      config: { columnlen: Object.fromEntries(widths.map((width, index) => [index, width])) }
    }];
  }, [columns, isOne, rows]);

  useEffect(() => {
    baseline.current = rows.map(row => columns.map(column => String((row as any)[column.key] ?? '')));
  }, [columns, rows]);

  const onChange = useCallback((data: any[]) => {
    const sheet = data?.[0];
    if (!sheet?.celldata) return;
    const matrix: Record<number, Record<number, any>> = {};
    sheet.celldata.forEach((cell: any) => {
      if (cell.r >= DATA_START) (matrix[cell.r] ??= {})[cell.c] = cell.v?.v ?? cell.v?.m ?? '';
    });
    const changedRows = Object.entries(matrix).map(([sheetRow, changedCells]) => {
      const rowIndex = Number(sheetRow) - DATA_START;
      const values = [...(baseline.current[rowIndex] ?? columns.map(() => ''))];
      Object.entries(changedCells).forEach(([columnIndex, value]) => { values[Number(columnIndex)] = String(value ?? ''); });
      return { rowIndex, values };
    }).filter(({ rowIndex, values }) => {
      const previous = baseline.current[rowIndex] ?? columns.map(() => '');
      return values.some((value, columnIndex) => value !== previous[columnIndex]);
    });
    if (!changedRows.length) return;

    if (isOne) {
      const keyColumn = columns.findIndex(column => column.key === 'nomor_spm');
      if (changedRows.some(({ rowIndex, values }) => values[keyColumn] !== (baseline.current[rowIndex]?.[keyColumn] ?? ''))) {
        toast.error('Nomor SPM hanya bisa dipilih melalui pencarian dari daftar Input 2 di toolbar.');
        return;
      }
    }

    void Promise.all(changedRows.map(async ({ rowIndex, values }) => {
      const existing = rows[rowIndex];
      const row = (isOne ? blank1() : blank2()) as Row;
      row.id = existing?.id ?? row.id;
      columns.forEach((column, index) => {
        const raw = values[index] ?? '';
        const key = String(column.key);
        if (['nilai_spp', 'nilai_spm', 'nilai_sp2d', 'nilai_bruto'].includes(key)) {
          const normalized = String(raw).replace(/[\sRp.]/g, '').replace(/,/g, '.');
          (row as any)[key] = normalized === '' ? null : Number(normalized);
        } else (row as any)[key] = String(raw);
      });
      baseline.current[rowIndex] = [...values];
      await saveRow(kind, row);
    })).then(() => toast.success('Perubahan tersimpan')).catch(() => toast.error('Gagal menyimpan. Periksa koneksi Firebase.'));
  }, [columns, isOne, kind, rows]);

  return <div className="fortune-wrap"><Workbook data={sheetData as any} onChange={onChange} showToolbar showFormulaBar showSheetTabs={false} /></div>;
}

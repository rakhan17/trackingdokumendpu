import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId, saveRow } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;
const blank1 = (): Input1Row => ({ id: createRowId(), no: '', nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' });
const blank2 = (): Input2Row => ({ id: createRowId(), no: '', tanggal_spm: '', nomor_spm: '', unit_skpd: '', nama_penerima: '', keterangan: '', jenis_spm: '', nilai_bruto: null, bulan: '' });

export function SpreadsheetInput({ kind, rows, input2Rows = [] }: { kind: Kind; rows: Row[]; input2Rows?: Input2Row[] }) {
  const columns = kind === 'input_1' ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const baseline = useRef<string[][]>([]);
  const isOne = kind === 'input_1';
  const dataStart = isOne ? 6 : 7;
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
      columns.forEach((column, c) => {
        if (column.key !== 'nilai_bruto' && column.key !== 'bulan') put(5, c, column.label, headerStyle('#FCE4D6'));
      });
      put(5, 7, 'Nilai (Rp)', headerStyle('#FCE4D6'));
      put(6, 7, 'Bruto', headerStyle('#FCE4D6'));
      put(6, 8, 'Bulan', headerStyle('#FCE4D6'));
    }

    const dataCells = rows.map((row, index) => columns.map((column, c) => {
      const value = row[column.key as keyof Row];
      const isDocumentNumber = ['nomor_spp', 'nomor_spm', 'nomor_sp2d'].includes(String(column.key));
      const text = isDocumentNumber || value == null ? String(value ?? '') : value;
      const style = isDocumentNumber ? { ct: { fa: '@', t: 's' } } : {};
      const keyStyle = isOne && column.key === 'nomor_spm' ? { bg: '#FCE7F9', fc: '#581C87' } : {};
      return { r: dataStart + index, c, v: { v: text, m: String(text), ...style, ...keyStyle } };
    })).flat();
    cells.push(...dataCells);

    const formattedRows = Math.max(rows.length + 80, 100);
    const textFormatCells = Array.from({ length: formattedRows }, (_, index) =>
      documentNumberColumns.map(c => ({ r: dataStart + index, c, v: { v: '', m: '', ct: { fa: '@', t: 's' }, ...(isOne && columns[c].key === 'nomor_spm' ? { bg: '#FCE7F9', fc: '#581C87' } : {}) } }))
    ).flat().filter(cell => !dataCells.some(existing => existing.r === cell.r && existing.c === cell.c));
    cells.push(...textFormatCells);

    const widths = isOne
      ? [55, 300, 130, 130, 300, 130, 130, 300, 130, 130, 100]
      : [60, 145, 310, 220, 280, 420, 100, 150, 110];
    const merge = isOne ? {
      '0_0': { r: 0, c: 0, rs: 1, cs: 10 }, '1_0': { r: 1, c: 0, rs: 1, cs: 10 }, '2_0': { r: 2, c: 0, rs: 1, cs: 10 },
      '4_0': { r: 4, c: 0, rs: 2, cs: 1 }, '4_1': { r: 4, c: 1, rs: 1, cs: 3 }, '4_4': { r: 4, c: 4, rs: 1, cs: 3 },
      '4_7': { r: 4, c: 7, rs: 1, cs: 3 }, '4_10': { r: 4, c: 10, rs: 2, cs: 1 }
    } : {
      '0_0': { r: 0, c: 0, rs: 1, cs: 8 }, '1_0': { r: 1, c: 0, rs: 1, cs: 8 }, '2_0': { r: 2, c: 0, rs: 1, cs: 8 }, '3_0': { r: 3, c: 0, rs: 1, cs: 8 },
      '5_0': { r: 5, c: 0, rs: 2, cs: 1 }, '5_1': { r: 5, c: 1, rs: 2, cs: 1 }, '5_2': { r: 5, c: 2, rs: 2, cs: 1 },
      '5_3': { r: 5, c: 3, rs: 2, cs: 1 }, '5_4': { r: 5, c: 4, rs: 2, cs: 1 }, '5_5': { r: 5, c: 5, rs: 2, cs: 1 }, '5_6': { r: 5, c: 6, rs: 2, cs: 1 }
    };
    const keyColumn = isOne ? columns.findIndex(column => column.key === 'nomor_spm') : -1;
    const dataVerification: Record<string, any> = {};
    if (isOne && input2Rows.length) {
      const options = [...new Set(input2Rows.map(row => row.nomor_spm).filter(Boolean))].join(',');
      for (let r = dataStart; r < dataStart + formattedRows; r++) dataVerification[`${r}_${keyColumn}`] = {
        type: 'dropdown', type2: null, value1: options, value2: '', checked: false, remote: false, prohibitInput: true, hintShow: true, hintText: 'Pilih Nomor SPM yang sudah terdaftar di Input 2.'
      };
    }
    return [{
      name: isOne ? 'Input 1' : 'Input 2', celldata: cells, row: dataStart + formattedRows, column: columns.length,
      dataVerification, config: { merge, rowlen: isOne ? { '0': 28, '1': 22, '2': 22, '4': 27, '5': 32 } : { '0': 22, '1': 22, '2': 22, '3': 22, '5': 30, '6': 26 }, columnlen: Object.fromEntries(widths.map((width, index) => [index, width])) }
    }];
  }, [columns, dataStart, input2Rows, isOne, rows]);

  useEffect(() => {
    baseline.current = rows.map(row => columns.map(column => String((row as any)[column.key] ?? '')));
  }, [columns, rows]);

  const onChange = useCallback((data: any[]) => {
    const sheet = data?.[0];
    if (!sheet?.celldata) return;
    const matrix: Record<number, Record<number, any>> = {};
    sheet.celldata.forEach((cell: any) => {
      if (cell.r >= dataStart) (matrix[cell.r] ??= {})[cell.c] = cell.v?.v ?? cell.v?.m ?? '';
    });
    const changedRows = Object.entries(matrix).map(([sheetRow, changedCells]) => {
      const rowIndex = Number(sheetRow) - dataStart;
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
      const allowedKeys = new Set(input2Rows.map(option => option.nomor_spm));
      if (changedRows.some(({ rowIndex, values }) => values[keyColumn] !== (baseline.current[rowIndex]?.[keyColumn] ?? '') && !allowedKeys.has(values[keyColumn]))) {
        toast.error('Nomor SPM harus dipilih dari daftar Input 2.');
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
      if (isOne) {
        const key = (row as Input1Row).nomor_spm;
        const linked = input2Rows.find(option => option.nomor_spm === key);
        if (linked) {
          (row as Input1Row).tanggal_spm = linked.tanggal_spm;
          (row as Input1Row).nilai_spm = linked.nilai_bruto;
          (row as Input1Row).bulan = linked.bulan;
        }
      }
      baseline.current[rowIndex] = columns.map(column => String((row as any)[column.key] ?? ''));
      await saveRow(kind, row);
    })).then(() => toast.success('Perubahan tersimpan')).catch(() => toast.error('Gagal menyimpan. Periksa koneksi Firebase.'));
  }, [columns, dataStart, input2Rows, isOne, kind, rows]);

  return <div className="fortune-wrap"><Workbook data={sheetData as any} onChange={onChange} showToolbar showFormulaBar showSheetTabs={false} /></div>;
}

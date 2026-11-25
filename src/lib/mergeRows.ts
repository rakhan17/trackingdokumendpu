import type { Input1Row, Input2Row, MergedOutputRow } from '../types';
export function normalizeSpm(value: unknown): string { return String(value ?? '').trim(); }
export function mergeRows(input1: Input1Row[], input2: Input2Row[]): MergedOutputRow[] {
  const bySpm = new Map<string, Input2Row>();
  input2.forEach(row => {
    const key = normalizeSpm(row.nomor_spm);
    if (key && !bySpm.has(key)) bySpm.set(key, row);
  });
  const seen = new Set<string>();
  const result: MergedOutputRow[] = input1.map(row => {
    const key = normalizeSpm(row.nomor_spm);
    const match = key ? bySpm.get(key) : undefined;
    if (key) seen.add(key);
    return { ...row, unit_skpd: match?.unit_skpd ?? '', nama_penerima: match?.nama_penerima ?? '',
      keterangan: match?.keterangan ?? '', jenis_spm: match?.jenis_spm ?? '', nilai_bruto: match?.nilai_bruto ?? null,
      status: match ? 'matched' : 'pending-input-2', input2Id: match?.id };
  });
  input2.forEach(row => {
    const key = normalizeSpm(row.nomor_spm);
    if (key && !seen.has(key)) result.push({
      id: `missing-${row.id}`, no: '', nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: row.nomor_spm,
      tanggal_spm: row.tanggal_spm, nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: row.bulan,
      unit_skpd: row.unit_skpd, nama_penerima: row.nama_penerima, keterangan: row.keterangan, jenis_spm: row.jenis_spm,
      nilai_bruto: row.nilai_bruto, status: 'pending-input-1', input2Id: row.id
    });
  });
  return result;
}
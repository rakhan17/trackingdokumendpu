export interface Input1Row {
  id: string;
  no: string;
  nomor_spp: string;
  tanggal_spp: string;
  nilai_spp: number | null;
  nomor_spm: string;
  tanggal_spm: string;
  nilai_spm: number | null;
  nomor_sp2d: string;
  tanggal_sp2d: string;
  nilai_sp2d: number | null;
  bulan: string;
  updatedAt?: number;
}
export interface Input2Row {
  id: string;
  no: string;
  tanggal_spm: string;
  nomor_spm: string;
  unit_skpd: string;
  nama_penerima: string;
  keterangan: string;
  jenis_spm: string;
  nilai_bruto: number | null;
  bulan: string;
  updatedAt?: number;
}
export interface MergedOutputRow extends Input1Row {
  unit_skpd: string;
  nama_penerima: string;
  keterangan: string;
  jenis_spm: string;
  nilai_bruto: number | null;
  status: 'matched' | 'pending-input-2' | 'pending-input-1';
  input2Id?: string;
}
export type Input1Field = keyof Omit<Input1Row, 'id' | 'updatedAt'>;
export type Input2Field = keyof Omit<Input2Row, 'id' | 'updatedAt'>;
export const INPUT1_COLUMNS: { key: Input1Field; label: string; type?: 'currency' | 'text' | 'primary' }[] = [
  { key: 'no', label: 'NO' }, { key: 'nomor_spp', label: 'Nomor SPP', type: 'primary' },
  { key: 'tanggal_spp', label: 'Tanggal SPP' }, { key: 'nilai_spp', label: 'Nilai SPP', type: 'currency' },
  { key: 'nomor_spm', label: 'Nomor SPM', type: 'primary' }, { key: 'tanggal_spm', label: 'Tanggal SPM' },
  { key: 'nilai_spm', label: 'Nilai SPM', type: 'currency' }, { key: 'nomor_sp2d', label: 'Nomor SP2D', type: 'primary' },
  { key: 'tanggal_sp2d', label: 'Tanggal SP2D' }, { key: 'nilai_sp2d', label: 'Nilai SP2D', type: 'currency' },
  { key: 'bulan', label: 'Bulan' }
];
export const INPUT2_COLUMNS: { key: Input2Field; label: string; type?: 'currency' | 'text' | 'primary' }[] = [
  { key: 'no', label: 'No.' }, { key: 'tanggal_spm', label: 'Tanggal SPM' },
  { key: 'nomor_spm', label: 'Nomor SPM', type: 'primary' }, { key: 'unit_skpd', label: 'Unit SKPD' },
  { key: 'nama_penerima', label: 'Nama Penerima' }, { key: 'keterangan', label: 'Keterangan' },
  { key: 'jenis_spm', label: 'Jenis SPM' }, { key: 'nilai_bruto', label: 'Nilai Bruto Rp', type: 'currency' },
  { key: 'bulan', label: 'Bulan' }
];
import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { SpreadsheetInput } from '../components/SpreadsheetInput';
import type { Input1Row, Input2Row } from '../types';
import { INPUT1_COLUMNS, INPUT2_COLUMNS } from '../types';

type Kind = 'input_1'|'input_2';
const demoInput2: Input2Row[] = [
 {id:'demo-i2-1',no:'1',tanggal_spm:'5 Januari 2026',nomor_spm:'64.71/03.0/000001/UP/1.03.0.00.0.00.01.0000/M/1/2026',unit_skpd:'DINAS PEKERJAAN UMUM',nama_penerima:'BENDAHARA PENGELUARAN DINAS PEKERJAAN UMUM',keterangan:'Pembayaran Uang Persediaan (UP) Dinas Pekerjaan Umum Kota Balikpapan TA 2026',jenis_spm:'UP',nilai_bruto:390000000,bulan:'Januari'},
 {id:'demo-i2-2',no:'2',tanggal_spm:'5 Januari 2026',nomor_spm:'64.71/03.0/000002/LS/1.03.0.00.0.00.01.0000/M/1/2026',unit_skpd:'DINAS PEKERJAAN UMUM',nama_penerima:'TERLAMPIR',keterangan:'Pembayaran Gaji dan Tunjangan Lainnya PNS Dinas Pekerjaan Umum Bulan Januari 2026, sesuai daftar permintaan terlampir.',jenis_spm:'LS',nilai_bruto:264443763,bulan:'Januari'},
 {id:'demo-i2-3',no:'3',tanggal_spm:'5 Januari 2026',nomor_spm:'64.71/03.0/000003/LS/1.03.0.00.0.00.01.0000/M/1/2026',unit_skpd:'DINAS PEKERJAAN UMUM',nama_penerima:'TERLAMPIR',keterangan:'Pembayaran Gaji dan Tunjangan Lainnya PPPK Dinas Pekerjaan Umum Bulan Januari 2026, sesuai daftar permintaan terlampir.',jenis_spm:'LS',nilai_bruto:312389364,bulan:'Januari'}
];
const demoInput1: Input1Row[] = [
 {id:'demo-i1-1',no:'1',nomor_spp:'64.71/02.0/000001/UP/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_spp:'5 Januari 2026',nilai_spp:390000000,nomor_spm:demoInput2[0].nomor_spm,tanggal_spm:'5 Januari 2026',nilai_spm:390000000,nomor_sp2d:'64.71/04.0/000004/UP/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_sp2d:'5 Januari 2026',nilai_sp2d:390000000,bulan:'Januari'},
 {id:'demo-i1-2',no:'2',nomor_spp:'64.71/02.0/000002/LS/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_spp:'5 Januari 2026',nilai_spp:264443763,nomor_spm:demoInput2[1].nomor_spm,tanggal_spm:'5 Januari 2026',nilai_spm:264443763,nomor_sp2d:'64.71/04.0/000002/LS/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_sp2d:'6 Januari 2026',nilai_sp2d:264443763,bulan:'Januari'},
 {id:'demo-i1-3',no:'3',nomor_spp:'64.71/02.0/000003/LS/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_spp:'5 Januari 2026',nilai_spp:312389364,nomor_spm:demoInput2[2].nomor_spm,tanggal_spm:'5 Januari 2026',nilai_spm:312389364,nomor_sp2d:'64.71/04.0/000003/LS/1.03.0.00.0.00.01.0000/M/1/2026',tanggal_sp2d:'6 Januari 2026',nilai_sp2d:312389364,bulan:'Januari'}
];
export default function SpreadsheetPage({kind,rows}:{kind:Kind;rows:(Input1Row|Input2Row)[]}) {
 const isOne=kind==='input_1'; const cols=isOne?INPUT1_COLUMNS:INPUT2_COLUMNS;
 const demoOnly=rows.length===0;
 const visibleRows=demoOnly?(isOne?demoInput1:demoInput2):rows;
 const [query,setQuery]=useState('');
 const filtered=useMemo(()=>visibleRows.filter(row=>Object.values(row).some(value=>String(value??'').toLowerCase().includes(query.toLowerCase()))),[visibleRows,query]);
 function downloadCsv(){const csv=[cols.map(c=>c.label),...filtered.map(r=>cols.map(c=>String((r as any)[c.key]??'')))].map(row=>row.map(v=>'"'+v.replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${kind}.csv`;a.click();URL.revokeObjectURL(url);}
 return <section className="sheet-workspace">
  <div className="sheet-toolbar no-print"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari di seluruh kolom..."/></div><span className="row-count">{filtered.length} baris</span>{demoOnly&&<span className="demo-label">DATA CONTOH · LOKAL</span>}<button className="secondary-button" onClick={downloadCsv}><Download size={15}/> Export CSV</button></div>
  <div className="sheet-grid-frame"><SpreadsheetInput kind={kind} rows={filtered} demoOnly={demoOnly}/></div>
 </section>;
}
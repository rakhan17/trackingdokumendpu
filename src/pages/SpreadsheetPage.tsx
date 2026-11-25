import { useMemo, useState } from 'react';
import { Search, FileSpreadsheet, Download } from 'lucide-react';
import { SpreadsheetInput } from '../components/SpreadsheetInput';
import type { Input1Row, Input2Row } from '../types';
import { INPUT1_COLUMNS, INPUT2_COLUMNS } from '../types';
import { rupiah } from '../lib/format';
type Kind = 'input_1'|'input_2';
export default function SpreadsheetPage({kind,rows}:{kind:Kind;rows:(Input1Row|Input2Row)[]}) {
 const isOne=kind==='input_1'; const cols=isOne?INPUT1_COLUMNS:INPUT2_COLUMNS;
 const [query,setQuery]=useState('');
 const filtered=useMemo(()=>rows.filter(row=>Object.values(row).some(value=>String(value??'').toLowerCase().includes(query.toLowerCase()))),[rows,query]);
 function downloadCsv(){const csv=[cols.map(c=>c.label),...filtered.map(r=>cols.map(c=>String((r as any)[c.key]??'')))].map(row=>row.map(v=>'"'+v.replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${kind}.csv`;a.click();URL.revokeObjectURL(url);}
 return <><div className="page-heading"><div><p className="eyebrow">DATA ENTRY</p><h1>{isOne?'Input 1':'Input 2'}</h1><p className="muted">{isOne?'Tracking SPP, SPM, dan SP2D':'Register transaksi SPM'}</p></div><button className="secondary-button no-print" onClick={downloadCsv}><Download size={16}/> Export CSV</button></div>
 <div className="sheet-toolbar no-print"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari di seluruh kolom..." /></div><span className="row-count">{filtered.length} baris</span></div>
 <section className="panel spreadsheet-panel"><div className="spreadsheet-title"><div><h2><FileSpreadsheet size={17}/> {isOne?'Tracking SPP / SPM / SP2D':'Register Transaksi SPM'}</h2><p>Tempel data dari Excel langsung ke grid. Kolom nomor dokumen disimpan sebagai teks.</p></div><span className="key-chip">Nomor SPM · Primary key</span></div><SpreadsheetInput kind={kind} rows={filtered}/></section>
 <p className="helper-note">Tips: format kolom nomor dokumen sebagai Text di Excel sebelum copy-paste untuk menjaga angka nol di depan.</p></>;
}
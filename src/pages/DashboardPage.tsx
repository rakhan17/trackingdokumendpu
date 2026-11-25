import { Link } from 'react-router-dom';
import { ArrowUpRight, FileSpreadsheet, ClipboardList, CheckCircle2, Clock3 } from 'lucide-react';
import type { Input1Row, Input2Row } from '../types';
import { mergeRows } from '../lib/mergeRows';
export default function DashboardPage({ input1, input2 }: { input1: Input1Row[]; input2: Input2Row[] }) {
  const merged = mergeRows(input1,input2); const complete = merged.filter(r=>r.status==='matched').length; const pending=merged.length-complete;
  const stats=[{label:'Dokumen Input 1',value:input1.length,icon:FileSpreadsheet},{label:'Register Input 2',value:input2.length,icon:ClipboardList},{label:'Dokumen lengkap',value:complete,icon:CheckCircle2},{label:'Belum terpasang',value:pending,icon:Clock3}];
  return <><div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="muted">Ringkasan status tracking dokumen keuangan.</p></div></div>
    <div className="stats-grid">{stats.map(s=><div className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><s.icon size={18}/></div><strong>{s.value.toLocaleString('id-ID')}</strong></div>)}</div>
    <div className="quick-grid"><Link className="quick-card" to="/input1"><div className="quick-icon"><FileSpreadsheet size={20}/></div><div><h3>Tracking SPP, SPM & SP2D</h3><p>Kelola nomor dan tanggal dokumen, nilai, serta bulan.</p></div><ArrowUpRight size={18}/></Link><Link className="quick-card" to="/input2"><div className="quick-icon"><ClipboardList size={20}/></div><div><h3>Register Transaksi SPM</h3><p>Masukkan unit SKPD, penerima, keterangan, dan nilai bruto.</p></div><ArrowUpRight size={18}/></Link></div>
    <section className="panel"><div className="panel-heading"><div><h2>Perlu ditindaklanjuti</h2><p>Dokumen yang belum memiliki pasangan Nomor SPM.</p></div><Link className="text-link" to="/output">Lihat rekap <ArrowUpRight size={15}/></Link></div><div className="pending-summary"><strong>{pending}</strong><span>baris menunggu kelengkapan data</span></div></section>
  </>;
}
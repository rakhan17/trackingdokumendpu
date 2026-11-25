import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, LayoutDashboard, ClipboardList, ListChecks, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/input1', label: 'Input 1 · SPP/SPM/SP2D', icon: FileSpreadsheet },
  { to: '/input2', label: 'Input 2 · Register SPM', icon: ClipboardList },
  { to: '/output', label: 'Rekap dokumen', icon: ListChecks }
];
export default function AppLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  async function exit() { await logout(); navigate('/login', { replace: true }); }
  return <div className="app-shell">
    <aside className="sidebar no-print">
      <div className="sidebar-brand"><div className="brand-mark small"><FileSpreadsheet size={18}/></div><div><strong>Tracking DPU</strong><span>Keuangan · 2026</span></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>isActive?'nav-link active':'nav-link'}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="user-card"><div className="avatar">{user?.email?.[0]?.toUpperCase() ?? 'A'}</div><div className="user-info"><strong>{user?.email ?? 'Administrator'}</strong><span>Signed in</span></div><button title="Keluar" className="icon-button" onClick={exit}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar no-print"><div><span className="topbar-kicker">DINAS PEKERJAAN UMUM</span><span className="topbar-title">Tracking Dokumen Keuangan</span></div><div className="topbar-status"><span className="status-dot"/> Terhubung</div></header><div className="page-content"><Outlet/></div></main>
  </div>;
}
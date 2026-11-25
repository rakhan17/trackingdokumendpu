import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FileSpreadsheet, LockKeyhole, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={(location.state as any)?.from?.pathname ?? '/'} replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await login(email, password); }
    catch { toast.error('Email atau password tidak sesuai.'); }
    finally { setBusy(false); }
  }
  return <main className="login-page">
    <section className="login-card">
      <div className="brand-mark"><FileSpreadsheet size={22}/></div>
      <p className="eyebrow">DPU · KEUANGAN 2026</p>
      <h1>Tracking Dokumen<br/>Keuangan</h1>
      <p className="muted">Masuk untuk mengelola tracking dokumen SPP, SPM, dan SP2D.</p>
      <form onSubmit={submit} className="login-form">
        <label>Email admin<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@instansi.go.id" required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password" required /></label>
        <button className="primary-button" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk ke aplikasi'} <ArrowRight size={17}/></button>
      </form>
      <div className="login-note"><LockKeyhole size={14}/> Akun dibuat oleh administrator. Pendaftaran tidak tersedia.</div>
    </section>
  </main>;
}
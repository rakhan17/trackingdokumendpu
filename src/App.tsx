import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { onSnapshot, collection } from 'firebase/firestore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SpreadsheetPage from './pages/SpreadsheetPage';
import OutputPage from './pages/OutputPage';
import { db } from './firebase';
import type { Input1Row, Input2Row } from './types';
import { Toaster, toast } from 'sonner';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="loading-screen"><div className="loading-mark"/><span>Memuat workspace...</span></div>;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
function AppRoutes() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/" element={<Protected><AppLayout/></Protected>}>
      <Route index element={<DashboardRoute/>}/>
      <Route path="input1" element={<InputRoute kind="input_1"/>}/>
      <Route path="input2" element={<InputRoute kind="input_2"/>}/>
      <Route path="output" element={<OutputRoute/>}/>
    </Route>
    <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace/>}/>
  </Routes>;
}
function DashboardRoute() {
  const [a,setA]=useState<Input1Row[]>([]); const [b,setB]=useState<Input2Row[]>([]);
  useEffect(() => {
    const x=onSnapshot(collection(db,'input_1'),s=>setA(s.docs.map(d=>({...d.data(),id:d.id} as Input1Row))));
    const y=onSnapshot(collection(db,'input_2'),s=>setB(s.docs.map(d=>({...d.data(),id:d.id} as Input2Row))));
    return ()=>{x();y();};
  },[]);
  return <DashboardPage input1={a} input2={b}/>;
}
function InputRoute({kind}:{kind:'input_1'|'input_2'}) {
  const [rows,setRows]=useState<(Input1Row|Input2Row)[]>([]);
  const [input2Rows,setInput2Rows]=useState<Input2Row[]>([]);
  useEffect(() => onSnapshot(collection(db,kind),s=>setRows(s.docs.map(d=>({...d.data(),id:d.id} as Input1Row|Input2Row))),e=>toast.error('Firestore: '+e.message)),[kind]);
  useEffect(() => {
    if (kind !== 'input_1') return;
    return onSnapshot(collection(db,'input_2'),s=>setInput2Rows(s.docs.map(d=>({...d.data(),id:d.id} as Input2Row))),e=>toast.error('Gagal memuat daftar Nomor SPM: '+e.message));
  },[kind]);
  return <SpreadsheetPage key={kind} kind={kind} rows={rows} input2Rows={input2Rows}/>;
}
function OutputRoute() {
  const [a,setA]=useState<Input1Row[]>([]); const [b,setB]=useState<Input2Row[]>([]);
  useEffect(() => {
    const x=onSnapshot(collection(db,'input_1'),s=>setA(s.docs.map(d=>({...d.data(),id:d.id} as Input1Row))));
    const y=onSnapshot(collection(db,'input_2'),s=>setB(s.docs.map(d=>({...d.data(),id:d.id} as Input2Row))));
    return ()=>{x();y();};
  },[]);
  return <OutputPage input1={a} input2={b}/>;
}
export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes/><Toaster position="bottom-right" richColors/></AuthProvider></BrowserRouter>;
}

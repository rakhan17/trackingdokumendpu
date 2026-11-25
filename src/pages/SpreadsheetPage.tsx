import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Trash2, Save, CloudUpload, CheckCircle2, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { SpreadsheetInput } from '../components/SpreadsheetInput';
import type { Input1Row, Input2Row } from '../types';
import { INPUT1_COLUMNS, INPUT2_COLUMNS } from '../types';
import { createRowId, saveRow, removeRow } from '../lib/firestoreService';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;

export default function SpreadsheetPage({ kind, rows, input2Rows = [] }: { kind: Kind; rows: Row[]; input2Rows?: Input2Row[] }) {
  const isOne = kind === 'input_1';
  const columns = isOne ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  const [draftRows,setDraftRows] = useState<Row[]>(rows);
  const [deletedIds,setDeletedIds] = useState<string[]>([]);
  const [dirty,setDirty] = useState(false);
  const [saving,setSaving] = useState(false);
  const [progress,setProgress] = useState(0);
  const [selectedId,setSelectedId] = useState('');
  const [spmSearch,setSpmSearch] = useState('');
  const [pickerOpen,setPickerOpen] = useState(false);

  useEffect(() => {
    if (!dirty && !saving) setDraftRows(rows);
  },[rows,dirty,saving]);

  const selected = draftRows.find(row=>row.id===selectedId);
  const spmMatches = input2Rows.filter(row=>String(row.nomor_spm||'').toLowerCase().includes(spmSearch.toLowerCase())).slice(0,50);
  function chooseSpm(option:Input2Row){
    if(!selected || !isOne){toast.error('Klik sel Nomor SPM pada baris Input 1 terlebih dahulu.');return;}
    markDraft(draftRows.map(row=>row.id===selected.id?({...row,nomor_spm:option.nomor_spm,tanggal_spm:option.tanggal_spm,nilai_spm:option.nilai_bruto,bulan:option.bulan} as Row):row));
    setSpmSearch(option.nomor_spm);setPickerOpen(false);
    toast.success('Nomor SPM berhasil dipilih. Tekan shortcut save untuk menyimpan.');
  }
  const markDraft = useCallback((next:Row[])=>{setDraftRows(next);setDirty(true);},[]);

  function addRow(){
    const id=createRowId();
    const row:Row=isOne
      ? {id,no:String(draftRows.length+1),nomor_spp:'',tanggal_spp:'',nilai_spp:null,nomor_spm:'',tanggal_spm:'',nilai_spm:null,nomor_sp2d:'',tanggal_sp2d:'',nilai_sp2d:null,bulan:''}
      : {id,no:String(draftRows.length+1),tanggal_spm:'',nomor_spm:'',unit_skpd:'',nama_penerima:'',keterangan:'',jenis_spm:'',nilai_bruto:null,bulan:''};
    markDraft([...draftRows,row]);setSelectedId(id);
  }

  function deleteSelected(){
    if(!selected){toast.error('Pilih baris yang ingin dihapus terlebih dahulu.');return;}
    setDraftRows(current=>current.filter(row=>row.id!==selected.id));
    if(rows.some(row=>row.id===selected.id)) setDeletedIds(current=>[...current,selected.id]);
    setDirty(true);setSelectedId('');
  }

  const saveDraft=useCallback(async()=>{
    if(!dirty||saving)return;
    setSaving(true);setProgress(5);
    try{
      const total=draftRows.length+deletedIds.length;
      let done=0;
      for(const row of draftRows){await saveRow(kind,row);done++;setProgress(Math.max(5,Math.round(done/Math.max(total,1)*100)));}
      for(const id of deletedIds){await removeRow(kind,id);done++;setProgress(Math.round(done/Math.max(total,1)*100));}
      setSyncedIds(draftRows.map(row=>row.id));setDeletedIds([]);setDirty(false);setProgress(100);
      toast.success('Semua perubahan berhasil disimpan ke Firebase.');
    }catch(error){toast.error('Penyimpanan gagal. Draft tetap tersimpan di halaman, coba lagi.');}
    finally{setSaving(false);}
  },[dirty,saving,draftRows,deletedIds,kind]);

  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){
        event.preventDefault();void saveDraft();
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[saveDraft]);

  function downloadCsv(){
    const csv=[columns.map(column=>column.label),...draftRows.map(row=>columns.map(column=>String((row as any)[column.key]??'')))]
      .map(line=>line.map(value=>'"'+value.replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download=kind+'.csv';a.click();URL.revokeObjectURL(url);
  }

  return <section className="sheet-workspace">
    <div className="sheet-toolbar no-print">
      <button className="secondary-button" onClick={addRow}><Plus size={15}/> Tambah baris</button>
      <div className="spm-top-picker"><div className="spm-picker-input"><Search size={14}/><input value={spmSearch} onFocus={()=>setPickerOpen(true)} onChange={e=>{setSpmSearch(e.target.value);setPickerOpen(true);}} placeholder={selected?'Cari Nomor SPM dari Input 2...':'Klik sel Nomor SPM dahulu'} disabled={!selected}/><button type="button" onClick={()=>setPickerOpen(v=>!v)} disabled={!selected}><ChevronDown size={14}/></button></div>{pickerOpen&&selected&&<div className="spm-picker-menu">{spmMatches.length?spmMatches.map(option=><button type="button" key={option.id} onClick={()=>chooseSpm(option)}><strong>{option.nomor_spm}</strong><span>{option.tanggal_spm} · {option.unit_skpd} · {option.nama_penerima}</span></button>):<p>Tidak ada Nomor SPM yang cocok.</p>}</div>}<small>{selected?'Baris aktif: '+(selected.no||selected.id):'Pilih sel di kolom Nomor SPM pada tabel.'}</small></div>
      <button className="secondary-button danger-button" onClick={deleteSelected}><Trash2 size={15}/> Hapus baris</button>
      <span className="save-state">{saving?<><CloudUpload size={14}/> Mengunggah {progress}%</>:dirty?<><AlertCircle size={14}/> Belum disimpan</>:<><CheckCircle2 size={14}/> Tersimpan</>}</span>
      <button className="secondary-button" onClick={downloadCsv}><Download size={15}/> Export CSV</button>
      <button className="primary-button save-button" onClick={()=>void saveDraft()} disabled={!dirty||saving}><Save size={15}/>{saving?'Menyimpan...':'Simpan · ⌘/Ctrl + S'}</button>
    </div>
    {saving&&<div className="upload-progress"><span style={{width:progress+'%'}}/></div>}
    <div className="sheet-grid-frame"><SpreadsheetInput kind={kind} rows={draftRows} input2Rows={input2Rows} onRowsChange={markDraft} onActiveRowChange={setSelectedId}/></div>
  </section>;
}

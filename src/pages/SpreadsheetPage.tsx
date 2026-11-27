import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Plus, Trash2, Save, CloudUpload, CheckCircle2, AlertCircle, Search } from 'lucide-react';
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
  const [activeSpmCell,setActiveSpmCell] = useState(false);
  const [insertOpen,setInsertOpen] = useState(false);
  const [spmSearch,setSpmSearch] = useState('');

  useEffect(() => {
    if (!dirty && !saving) setDraftRows(rows);
  },[rows,dirty,saving]);

  const selected = draftRows.find(row=>row.id===selectedId);
  const spmMatches = input2Rows.filter(row=>String(row.nomor_spm||'').toLowerCase().includes(spmSearch.toLowerCase())).slice(0,50);
  const handleActiveSpmCell=useCallback((id:string,insertValue?:((value:string)=>void),isKeyCell=false)=>{
    if(!id){if(insertOpen)return;setSelectedId('');setActiveSpmCell(false);insertValueRef.current=null;setInsertOpen(false);return;}
    setSelectedId(id);setActiveSpmCell(isKeyCell);insertValueRef.current=isKeyCell?(insertValue??null):null;
    // FortuneSheet may emit selection callbacks while the toolbar opens. Keep the picker
    // open when the active key cell is still the same row.
    if(id!==selectedId)setInsertOpen(false);
  },[selectedId,insertOpen]);
  function chooseSpm(option:Input2Row){
    if(!selected || !isOne || !activeSpmCell){toast.error('Klik sel Nomor SPM di Input 1 terlebih dahulu.');return;}
    insertValueRef.current?.(option.nomor_spm);
    markDraft(draftRows.map(row=>row.id===selected.id?({...row,nomor_spm:option.nomor_spm,tanggal_spm:option.tanggal_spm,nilai_spm:option.nilai_bruto,bulan:option.bulan} as Row):row));
    setSpmSearch('');setInsertOpen(false);
    toast.success('Nomor SPM dimasukkan ke sel yang dipilih. Tekan ⌘ + S / Ctrl + S untuk menyimpan.');
  }
  const markDraft = useCallback((next:Row[])=>{setDraftRows(next);setDirty(true);},[]);

  useEffect(()=>{
    if(!insertOpen)return;
    const closeOutside=(event:PointerEvent)=>{
      if(insertWrapRef.current?.contains(event.target as Node))return;
      setInsertOpen(false);
      const target=event.target as HTMLElement|null;
      if(target?.closest?.('.fortune-wrap')){
        setSelectedId('');setActiveSpmCell(false);insertValueRef.current=null;
      }
    };
    document.addEventListener('pointerdown',closeOutside);
    return()=>document.removeEventListener('pointerdown',closeOutside);
  },[insertOpen]);

  function addRow(){
    const id=createRowId();
    const row:Row=isOne
      ? {id,no:String(draftRows.length+1),nomor_spp:'',tanggal_spp:'',nilai_spp:null,nomor_spm:'',tanggal_spm:'',nilai_spm:null,nomor_sp2d:'',tanggal_sp2d:'',nilai_sp2d:null,bulan:''}
      : {id,no:String(draftRows.length+1),tanggal_spm:'',nomor_spm:'',unit_skpd:'',nama_penerima:'',keterangan:'',jenis_spm:'',nilai_bruto:null,bulan:''};
    markDraft([...draftRows,row]);setSelectedId(id);setActiveSpmCell(false);insertValueRef.current=null;setInsertOpen(false);
  }

  function deleteSelected(){
    if(!selected){toast.error('Pilih baris yang ingin dihapus terlebih dahulu.');return;}
    setDraftRows(current=>current.filter(row=>row.id!==selected.id));
    if(rows.some(row=>row.id===selected.id)) setDeletedIds(current=>[...current,selected.id]);
    setDirty(true);setSelectedId('');setActiveSpmCell(false);insertValueRef.current=null;setInsertOpen(false);
  }

  const saveDraft=useCallback(async()=>{
    if(!dirty||saving)return;
    setSaving(true);setProgress(5);
    try{
      const total=draftRows.length+deletedIds.length;
      let done=0;
      for(const row of draftRows){await saveRow(kind,row);done++;setProgress(Math.max(5,Math.round(done/Math.max(total,1)*100)));}
      for(const id of deletedIds){await removeRow(kind,id);done++;setProgress(Math.round(done/Math.max(total,1)*100));}
      setDeletedIds([]);setDirty(false);setProgress(100);
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
{isOne&&activeSpmCell&&selected&&<div className="spm-insert-wrap" ref={insertWrapRef}><button className="secondary-button spm-insert-button" type="button" onClick={()=>{setInsertOpen(value=>!value);setSpmSearch('');}}><Plus size={14}/> Insert</button>{insertOpen&&<div className="spm-insert-menu"><div className="spm-insert-search"><Search size={13}/><input autoFocus value={spmSearch} onChange={event=>setSpmSearch(event.target.value)} placeholder="Cari Nomor SPM..."/></div><div className="spm-insert-list">{spmMatches.length?spmMatches.map(option=><button type="button" key={option.id} onClick={()=>chooseSpm(option)}><strong>{option.nomor_spm}</strong><span>{option.tanggal_spm} · {option.unit_skpd} · {option.nama_penerima}</span></button>):<p>Tidak ada Nomor SPM yang cocok.</p>}</div></div>}</div>}
      <button className="secondary-button danger-button" onClick={deleteSelected}><Trash2 size={15}/> Hapus baris</button>
      <span className="save-state">{saving?<><CloudUpload size={14}/> Mengunggah {progress}%</>:dirty?<><AlertCircle size={14}/> Belum disimpan</>:<><CheckCircle2 size={14}/> Tersimpan</>}</span>
      <button className="secondary-button" onClick={downloadCsv}><Download size={15}/> Export CSV</button>
      <button className="primary-button save-button" onClick={()=>void saveDraft()} disabled={!dirty||saving}><Save size={15}/>{saving?'Menyimpan...':'Simpan · ⌘/Ctrl + S'}</button>
    </div>
    {saving&&<div className="upload-progress"><span style={{width:progress+'%'}}/></div>}
    <div className="sheet-grid-frame"><SpreadsheetInput kind={kind} rows={draftRows} input2Rows={input2Rows} onRowsChange={markDraft} onActiveRowChange={handleActiveSpmCell}/></div>
  </section>;
}

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId, saveRow } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;
const blank1 = (): Input1Row => ({ id: createRowId(), no: '', nomor_spp: '', tanggal_spp: '', nilai_spp: null, nomor_spm: '', tanggal_spm: '', nilai_spm: null, nomor_sp2d: '', tanggal_sp2d: '', nilai_sp2d: null, bulan: '' });
const blank2 = (): Input2Row => ({ id: createRowId(), no: '', tanggal_spm: '', nomor_spm: '', unit_skpd: '', nama_penerima: '', keterangan: '', jenis_spm: '', nilai_bruto: null, bulan: '' });

export function SpreadsheetInput({ kind, rows, demoOnly = false }: { kind: Kind; rows: Row[]; demoOnly?: boolean }) {
 const columns=kind==='input_1'?INPUT1_COLUMNS:INPUT2_COLUMNS;
 const baseline=useRef<string[][]>([]);
 const documentNumberColumns=columns.map((column,index)=>['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(column.key))?index:-1).filter(index=>index>=0);
 const sheetData=useMemo(()=>{
  const header=columns.map((column,c)=>({r:0,c,v:{v:column.label,m:column.label,ct:{fa:'@',t:'s'},...(column.key==='nomor_spm'?{bg:'#e9d5ff',fc:'#6b21a8'}:{})}}));
  const cells=rows.map((row,r)=>columns.map((column,c)=>{
   const value=row[column.key as keyof Row];const isKey=column.key==='nomor_spm';const isDocumentNumber=['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(column.key));const text=isDocumentNumber||value==null?String(value??''):value;
   return {r:r+1,c,v:{v:text,m:String(text),ct:{fa:isDocumentNumber?'@':'General',t:isDocumentNumber?'s':'g'},...(isKey?{bg:'#f3e8ff',fc:'#6b21a8'}:{})}};
  })).flat();
  const textFormatCells=Array.from({length:Math.max(100,rows.length+30)},(_,r)=>documentNumberColumns.map(c=>({r:r+1,c,v:{v:'',m:'',ct:{fa:'@',t:'s'},...(columns[c].key==='nomor_spm'?{bg:'#f3e8ff',fc:'#6b21a8'}:{})}}))).flat().filter(cell=>!cells.some(existing=>existing.r===cell.r&&existing.c===cell.c));
  return [{name:kind==='input_1'?'Input 1':'Input 2',celldata:[...header,...cells,...textFormatCells],row:Math.max(rows.length+30,100),column:columns.length,config:{columnlen:Object.fromEntries(columns.map((_,i)=>[i,kind==='input_1'?170:190]))}}];
 },[columns,documentNumberColumns,kind,rows]);
 useEffect(()=>{baseline.current=rows.map(row=>columns.map(column=>String((row as any)[column.key]??'')));},[columns,rows]);
 const onChange=useCallback((data:any[])=>{
  const sheet=data?.[0];if(!sheet?.celldata)return;
  const matrix:Record<number,Record<number,any>>={};
  sheet.celldata.forEach((cell:any)=>{if(cell.r>0)(matrix[cell.r]??={})[cell.c]=cell.v?.v??cell.v?.m??'';});
  const changedRows=Object.entries(matrix).filter(([index,cells])=>{
   const rowIndex=Number(index)-1;const current=columns.map((column,c)=>String(cells[c]??''));const previous=baseline.current[rowIndex]??columns.map(()=> '');
   return current.some((value,c)=>value!==previous[c]);
  });
  if(!changedRows.length)return;
  if(demoOnly){toast.info('Data contoh hanya untuk preview. Perubahan tidak dikirim ke Firestore.');return;}
  if(kind==='input_1'&&changedRows.some(([,cells])=>String(cells[columns.findIndex(c=>c.key==='nomor_spm')]??'')!==String(rows[Number(Object.keys(matrix)[0])-1]?.nomor_spm??''))){
   toast.error('Nomor SPM di Input 1 dipilih dari data Input 2. Ubah primary key melalui Input 2.');return;
  }
  void Promise.all(changedRows.map(async([index,cells])=>{
   const rowIndex=Number(index)-1;const existing=rows[rowIndex];const row=(kind==='input_1'?blank1():blank2()) as Row;row.id=existing?.id??row.id;
   columns.forEach((column,c)=>{const raw=cells[c]??'';const key=String(column.key);if(['nilai_spp','nilai_spm','nilai_sp2d','nilai_bruto'].includes(key)){const normalized=String(raw).replace(/[\sRp.]/g,'').replace(/,/g,'.');(row as any)[key]=normalized===''?null:Number(normalized);}else{(row as any)[key]=String(raw??'');}});
   baseline.current[rowIndex]=columns.map(column=>String((row as any)[column.key]??''));await saveRow(kind,row);
  })).then(()=>toast.success('Perubahan tersimpan')).catch(()=>toast.error('Gagal menyimpan. Periksa koneksi Firebase.'));
 },[columns,demoOnly,kind,rows]);
 return <div className="fortune-wrap"><Workbook data={sheetData as any} onChange={onChange} showToolbar showFormulaBar showSheetTabs={false}/></div>;
}
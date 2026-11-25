import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind='input_1'|'input_2';
type Row=Input1Row|Input2Row;
const blank1=():Input1Row=>({id:createRowId(),no:'',nomor_spp:'',tanggal_spp:'',nilai_spp:null,nomor_spm:'',tanggal_spm:'',nilai_spm:null,nomor_sp2d:'',tanggal_sp2d:'',nilai_sp2d:null,bulan:''});
const blank2=():Input2Row=>({id:createRowId(),no:'',tanggal_spm:'',nomor_spm:'',unit_skpd:'',nama_penerima:'',keterangan:'',jenis_spm:'',nilai_bruto:null,bulan:''});

export function SpreadsheetInput({kind,rows,input2Rows=[],onRowsChange,onActiveRowChange}:{kind:Kind;rows:Row[];input2Rows?:Input2Row[];onRowsChange:(rows:Row[])=>void;onActiveRowChange?:(id:string)=>void}){
 const isOne=kind==='input_1';
 const columns=isOne?INPUT1_COLUMNS:INPUT2_COLUMNS;
 const dataStart=isOne?6:7;
 const baseline=useRef<string[][]>([]);
 const workbookRef=useRef<any>(null);
 const input2Keys=useMemo(()=>[...new Set(input2Rows.map(row=>String(row.nomor_spm||'').trim()).filter(Boolean))],[input2Rows]);

 const sheetData=useMemo(()=>{
  const cells:any[]=[];
  const put=(r:number,c:number,value:any,style:Record<string,any>={})=>cells.push({r,c,v:{v:value,m:String(value??''),...style}});
  const title=(size=12)=>({bg:'#FFFFFF',fc:'#111111,',bl:1,fs:size,ht:1,vt:1});
  const group=(bg:string)=>({bg,fc:'#111111',bl:1,fs:10,ht:1,vt:1});
  const header=(bg:string)=>({bg,fc:'#111111',bl:1,fs:10,ht:1,vt:1});
  let merge:Record<string,any>={};
  let rowlen:Record<string,number>={};
  const widths:number[]=[];
  if(isOne){
   put(0,0,'TRACKING DOKUMEN',{...title(16),fc:'#111111'});
   put(1,0,'SKPD: DINAS PEKERJAAN UMUM',{...title(),fc:'#111111'});
   put(2,0,'Periode: 1 Januari 2026 s.d. 31 Oktober 2026',{...title(),fc:'#111111'});
   put(4,0,'NO',group('#D9E1F2'));
   put(4,1,'Surat Permintaan Pembayaran (SPP)',group('#FFFF00'));
   put(4,4,'Surat Perintah Membayar (SPM)',group('#92D050'));
   put(4,7,'Surat Perintah Pencairan Dana (SP2D)',group('#00B0F0'));
   put(4,10,'Bulan',group('#00B0F0'));
   const fills:Record<string,string>={no:'#D9E1F2',nomor_spp:'#FFFF00',tanggal_spp:'#FFFF00',nilai_spp:'#FFFF00',nomor_spm:'#E739DF',tanggal_spm:'#92D050',nilai_spm:'#92D050',nomor_sp2d:'#00B0F0',tanggal_sp2d:'#00B0F0',nilai_sp2d:'#00B0F0',bulan:'#00B0F0'};
   columns.forEach((col,c)=>put(5,c,col.label,header(fills[String(col.key)]||'#FFFFFF')));
   merge={
    '0_0':{r:0,c:0,rs:1,cs:11},'1_0':{r:1,c:0,rs:1,cs:11},'2_0':{r:2,c:0,rs:1,cs:11},
    '4_0':{r:4,c:0,rs:2,cs:1},'4_1':{r:4,c:1,rs:1,cs:3},'4_4':{r:4,c:4,rs:1,cs:3},'4_7':{r:4,c:7,rs:1,cs:3},'4_10':{r:4,c:10,rs:2,cs:1}
   };
   rowlen={'0':30,'1':24,'2':24,'3':10,'4':28,'5':28};
   widths.push(55,230,125,125,230,125,125,230,125,125,95);
  }else{
   put(0,0,'PEMERINTAH KOTA BALIKPAPAN',{...title(14),fc:'#111111'});
   put(1,0,'REGISTER SPM (TRANSAKSI)',{...title(),fc:'#111111'});
   put(2,0,'SEMUA SKPD (KONSOLIDASI)',{...title(),fc:'#111111'});
   put(3,0,'PERIODE: 1 Januari 2026 s.d. 31 Oktober 2026',{...title(),fc:'#111111'});
   const input2Fills=['#FCE4D6','#FCE4D6','#E739DF','#FCE4D6','#FCE4D6','#FCE4D6','#FCE4D6','#FCE4D6','#FCE4D6'];
   columns.forEach((col,c)=>{
    if(c===7)put(5,c,'Nilai (Rp)',header('#FCE4D6'));
    else if(c!==8)put(5,c,col.label,header(input2Fills[c]));
    if(c===8)put(6,c,'Bulan',header('#FCE4D6'));
    else if(c===7)put(6,c,'Bruto',header('#FCE4D6'));
    else put(6,c,'',header(input2Fills[c]));
   });
   merge={'0_0':{r:0,c:0,rs:1,cs:9},'1_0':{r:1,c:0,rs:1,cs:9},'2_0':{r:2,c:0,rs:1,cs:9},'3_0':{r:3,c:0,rs:1,cs:9},'5_0':{r:5,c:0,rs:2,cs:1},'5_1':{r:5,c:1,rs:2,cs:1},'5_2':{r:5,c:2,rs:2,cs:1},'5_3':{r:5,c:3,rs:2,cs:1},'5_4':{r:5,c:4,rs:2,cs:1},'5_5':{r:5,c:5,rs:2,cs:1},'5_6':{r:5,c:6,rs:2,cs:1},'5_8':{r:5,c:8,rs:2,cs:1}};
   rowlen={'0':26,'1':23,'2':23,'3':23,'4':10,'5':25,'6':28};
   widths.push(55,130,220,180,220,360,130,150,100);
  }
  const dataCells=rows.flatMap((row,index)=>columns.map((col,c)=>{
   const value=(row as any)[col.key];
   const isNumber=['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(col.key));
   const linked=isOne&&col.key==='nomor_spm';
   return {r:dataStart+index,c,v:{v:value==null?'':String(value),m:value==null?'':String(value),...(isNumber?{ct:{fa:'@',t:'s'}}:{}),...(linked?{bg:'#FCE7F9',fc:'#581C87'}:{})}};
  }));
  cells.push(...dataCells);
  const formattedRows=Math.max(100,rows.length+30);
  const numberCols=columns.map((col,index)=>['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(col.key))?index:-1).filter(x=>x>=0);
  for(let r=dataStart;r<dataStart+formattedRows;r++)for(const c of numberCols){
   if(!dataCells.some(cell=>cell.r===r&&cell.c===c))cells.push({r,c,v:{v:'',m:'',ct:{fa:'@',t:'s'},...(isOne&&columns[c].key==='nomor_spm'?{bg:'#FCE7F9',fc:'#581C87'}:{})}});
  }
  const keyColumn=isOne?columns.findIndex(col=>col.key==='nomor_spm'):-1;
  const dataVerification:Record<string,any>={};
  if(isOne&&input2Keys.length){
   const options=input2Keys.map(value=>value.replace(/,/g,'，')).join(',');
   for(let r=dataStart;r<dataStart+formattedRows;r++)dataVerification[`${r}_${keyColumn}`]={
    type:'dropdown',type2:false,value1:options,value2:'',remote:false,prohibitInput:true,hintShow:true,hintText:'Pilih Nomor SPM yang terdaftar pada Input 2.'
   };
  }
  return [{
   name:isOne?'Input 1':'Input 2',index:isOne?'input1':'input2',status:1,order:0,
   row:dataStart+formattedRows,column:columns.length,defaultRowHeight:22,defaultColWidth:110,
   celldata:cells,dataVerification,showGridLines:1,
   config:{merge,rowlen,columnlen:Object.fromEntries(widths.map((width,index)=>[index,width]))}
  }];
 },[columns,dataStart,input2Keys,isOne,rows]);

 useEffect(()=>{baseline.current=rows.map(row=>columns.map(col=>String((row as any)[col.key]??'')));},[rows,columns]);

 const onGridClick=useCallback(()=>{
  requestAnimationFrame(()=>{
   const selection=workbookRef.current?.getSelection?.();
   const active=Array.isArray(selection)?selection[0]:null;
   const row=active?.row?.[0]; const col=active?.column?.[0];
   const keyCol=columns.findIndex(column=>column.key==='nomor_spm');
   if(isOne && col===keyCol && typeof row==='number' && row>=dataStart){
    const target=rows[row-dataStart]; if(target) onActiveRowChange?.(target.id);
   }
  });
 },[columns,dataStart,isOne,onActiveRowChange,rows]);

 const onChange=useCallback((workbookData:any[])=>{
  const sheet=workbookData?.[0];if(!sheet)return;
  const next=[...rows];
  const source=sheet.data;
  if(Array.isArray(source)){
   source.forEach((line:any[],rowIndex:number)=>{
    const index=rowIndex-dataStart;if(index<0||index>=next.length||!Array.isArray(line))return;
    const previous=baseline.current[index]??[];
    const values=columns.map((col,c)=>String(line[c]?.v??line[c]?.m??''));
    if(values.every((value,c)=>value===(previous[c]??'')))return;
    const updated:any={...next[index]};
    columns.forEach((col,c)=>{
     const raw=values[c];const key=String(col.key);
     if(['nilai_spp','nilai_spm','nilai_sp2d','nilai_bruto'].includes(key)){
      const normalized=raw.replace(/[\sRp.]/g,'').replace(/,/g,'.');updated[key]=normalized===''?null:Number(normalized);
     }else updated[key]=raw;
    });
    if(isOne){
     const linked=input2Rows.find(option=>option.nomor_spm===updated.nomor_spm);
     if(linked){updated.tanggal_spm=linked.tanggal_spm;updated.nilai_spm=linked.nilai_bruto;updated.bulan=linked.bulan;}
     else if(updated.nomor_spm!==next[index].nomor_spm){toast.error('Nomor SPM wajib dipilih dari daftar Input 2.');return;}
    }
    next[index]=updated;
   });
   onRowsChange(next);
   return;
  }
  if(Array.isArray(sheet.celldata)){
   const matrix:Record<number,Record<number,any>>={};
   sheet.celldata.forEach((cell:any)=>{if(cell.r>=dataStart)(matrix[cell.r]??={})[cell.c]=cell.v?.v??cell.v?.m??'';});
   Object.entries(matrix).forEach(([r,cells])=>{
    const index=Number(r)-dataStart;if(index<0||index>=next.length)return;
    const updated:any={...next[index]};
    Object.entries(cells).forEach(([c,value])=>{const col=columns[Number(c)];if(col)(updated as any)[col.key]=String(value??'');});
    next[index]=updated;
   });
   onRowsChange(next);
  }
 },[columns,dataStart,input2Rows,isOne,onRowsChange,rows]);

 return <div className="fortune-wrap" onMouseUp={onGridClick}><Workbook key={kind} ref={workbookRef} data={sheetData as any} onChange={onChange} showToolbar showFormulaBar showSheetTabs={false} lang="en"/></div>;
}

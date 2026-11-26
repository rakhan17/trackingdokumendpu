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

export function SpreadsheetInput({kind,rows,input2Rows=[],onRowsChange,onActiveRowChange}:{kind:Kind;rows:Row[];input2Rows?:Input2Row[];onRowsChange:(rows:Row[])=>void;onActiveRowChange?:(id:string,insertValue?:((value:string)=>void))=>void}){
 const isOne=kind==='input_1';
 const columns=isOne?INPUT1_COLUMNS:INPUT2_COLUMNS;
 const dataStart=2;
 const baseline=useRef<string[][]>([]);
 const workbookRef=useRef<any>(null);
 const input2Keys=useMemo(()=>[...new Set(input2Rows.map(row=>String(row.nomor_spm||'').trim()).filter(Boolean))],[input2Rows]);

 const sheetData=useMemo(()=>{
  const cells:any[]=[];
  const put=(r:number,c:number,value:any,style:Record<string,any>={})=>cells.push({r,c,v:{v:value,m:String(value??''),...style}});
  const title=(size=9)=>({bg:'#FFFFFF',fc:'#111111',bl:1,fs:size,ff:'Tahoma',ht:0,vt:0,tb:2});
  const group=(bg:string)=>({bg,fc:'#111111',bl:1,fs:9,ff:'Tahoma',ht:0,vt:0,tb:2});
  const header=(bg:string,size=9,ff='Tahoma')=>({bg,fc:'#111111',bl:1,fs:size,ff,ht:0,vt:0,tb:2});
  let merge:Record<string,any>={};
  let rowlen:Record<string,number>={};
  const widths:number[]=[];
  if(isOne){
   // Two clean header rows, exactly at the top of the sheet. No clipped title rows.
   put(0,0,'NO',group('#BFBFBF'));
   put(1,0,'',header('#BFBFBF'));
   put(0,10,'Bulan',group('#00B0F0'));
   put(1,10,'',header('#00B0F0'));
   put(0,1,'Surat Permintaan Pembayaran (SPP)',group('#FFFF00'));
   put(0,4,'Surat Perintah Membayar (SPM)',group('#92D050'));
   put(0,7,'Surat Perintah Pencairan Dana (SP2D)',group('#00B0F0'));
   for(let col=1;col<=3;col++)put(0,col,'',group('#FFFF00'));
   for(let col=4;col<=6;col++)put(0,col,'',group('#92D050'));
   for(let col=7;col<=9;col++)put(0,col,'',group('#00B0F0'));
   const fills:Record<string,string>={no:'#BFBFBF',nomor_spp:'#FFFF00',tanggal_spp:'#FFFF00',nilai_spp:'#FFFF00',nomor_spm:'#E739DF',tanggal_spm:'#92D050',nilai_spm:'#92D050',nomor_sp2d:'#00B0F0',tanggal_sp2d:'#00B0F0',nilai_sp2d:'#00B0F0',bulan:'#00B0F0'};
   columns.forEach((col,index)=>{if(col.key!=='no'&&col.key!=='bulan')put(1,index,col.label,header(fills[String(col.key)]||'#FFFFFF'));});
   merge={
    '0_0':{r:0,c:0,rs:2,cs:1},
    '0_1':{r:0,c:1,rs:1,cs:3},
    '0_4':{r:0,c:4,rs:1,cs:3},
    '0_7':{r:0,c:7,rs:1,cs:3},
    '0_10':{r:0,c:10,rs:2,cs:1}
   };
   rowlen={'0':30,'1':28};
   widths.push(33,348,112,102,348,112,102,348,112,102,73);
  }else{
   // Input 2 keeps its own register format and two-row Bruto header.
   const fill='#FCE4D6';
   columns.forEach((col,index)=>{
    if(index===7)put(0,index,'Nilai (Rp)',header(fill,10,'Calibri'));
    else if(index===8)put(0,index,'Bulan',header(fill,10,'Calibri'));
    else put(0,index,col.label,header(col.key==='nomor_spm'?'#E739DF':fill,10,'Calibri'));
   });
   put(1,7,'Bruto',header(fill,10,'Calibri'));
   merge={
    '0_0':{r:0,c:0,rs:2,cs:1},
    '0_1':{r:0,c:1,rs:2,cs:1},
    '0_2':{r:0,c:2,rs:2,cs:1},
    '0_3':{r:0,c:3,rs:2,cs:1},
    '0_4':{r:0,c:4,rs:2,cs:1},
    '0_5':{r:0,c:5,rs:2,cs:1},
    '0_6':{r:0,c:6,rs:2,cs:1},
    '0_8':{r:0,c:8,rs:2,cs:1}
   };
   rowlen={'0':30,'1':28};
   widths.push(46,109,326,165,96,361,95,137,96);
  }
  const dataCells=rows.flatMap((row,index)=>columns.map((col,c)=>{
   const value=(row as any)[col.key];
   const isNumber=['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(col.key));
   const linked=col.key==='nomor_spm';
   return {r:dataStart+index,c,v:{v:value==null?'':String(value),m:value==null?'':String(value),...(isNumber?{ct:{fa:'@',t:'s'}}:{}),...(linked?{bg:'#FCE7F9',fc:'#581C87'}:{})}};
  }));
  cells.push(...dataCells);
  const formattedRows=Math.max(100,rows.length+30);
  const numberCols=columns.map((col,index)=>['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(col.key))?index:-1).filter(x=>x>=0);
  for(let r=dataStart;r<dataStart+formattedRows;r++)for(const c of numberCols){
   if(!dataCells.some(cell=>cell.r===r&&cell.c===c))cells.push({r,c,v:{v:'',m:'',ct:{fa:'@',t:'s'},...(isOne&&columns[c].key==='nomor_spm'?{bg:'#FCE7F9',fc:'#581C87'}:{})}});
  }
  return [{
   name:isOne?'Input 1':'Input 2',index:isOne?'input1':'input2',status:1,order:0,
   row:dataStart+formattedRows,column:columns.length,defaultRowHeight:isOne?24:25.5,defaultColWidth:110,
   celldata:cells,showGridLines:1,
   config:{merge,rowlen,columnlen:Object.fromEntries(widths.map((width,index)=>[index,width])),borderInfo:[{rangeType:'range',borderType:'border-all',style:'1',color:'#000000',range:[{row:[0,1],column:isOne?[0,10]:[0,8]}]}]}
  }];
 },[columns,dataStart,input2Keys,isOne,rows]);

 useEffect(()=>{baseline.current=rows.map(row=>columns.map(col=>String((row as any)[col.key]??'')));},[rows,columns]);

 const onSelectionChange=useCallback((_sheetId:string,active:any)=>{
  if(!isOne)return;
  const row=active?.row_focus??active?.row?.[0];
  const col=active?.column_focus??active?.column?.[0];
  const keyCol=columns.findIndex(column=>column.key==='nomor_spm');
  if(typeof row==='number'&&col===keyCol&&row>=dataStart){
   const target=rows[row-dataStart];
   if(target)onActiveRowChange?.(target.id,(value:string)=>workbookRef.current?.setCellValue(row,keyCol,value));
   else onActiveRowChange?.('',undefined);
  }else onActiveRowChange?.('',undefined);
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

 return <div className="fortune-wrap"><Workbook key={kind} ref={workbookRef} data={sheetData as any} onChange={onChange} hooks={{afterSelectionChange:onSelectionChange}} showToolbar showFormulaBar showSheetTabs={false} lang="en"/></div>;
}

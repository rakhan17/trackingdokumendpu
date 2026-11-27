import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Workbook, type WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { createRowId } from '../lib/firestoreService';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;
const StableWorkbook = memo(Workbook);

export function SpreadsheetInput({ kind, rows, input2Rows=[], onRowsChange, onActiveRowChange }: {
  kind: Kind;
  rows: Row[];
  input2Rows?: Input2Row[];
  onRowsChange: (rows: Row[]) => void;
  onActiveRowChange?: (id: string, insertValue?: (value:string)=>void, isKeyCell?: boolean) => void;
}) {
  const isOne = kind === 'input_1';
  const columns = isOne ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  // All field labels are on worksheet row 1. Data starts on worksheet row 2.
  const dataStart = 1;
  const baseline = useRef<string[][]>([]);
  const mounted = useRef(false);
  const workbookRef = useRef<WorkbookInstance|null>(null);
  const allowedKeyChange = useRef<string|null>(null);
  const lastLocalSignature = useRef<string|null>(null);
  // Map visible worksheet row indexes to draft array indexes. This lets users
  // type directly into blank spreadsheet rows without pressing Add row first.
  const worksheetRowToDraftIndex = useRef<Map<number,number>>(new Map());
  const [renderRows,setRenderRows] = useState<Row[]>(rows);
  const latestSelection = useRef({isOne,columns,dataStart,rows,onActiveRowChange});
  latestSelection.current={isOne,columns,dataStart,rows,onActiveRowChange};

  useEffect(()=>{
    const signature=JSON.stringify(rows);
    if(lastLocalSignature.current===signature){lastLocalSignature.current=null;return;}
    worksheetRowToDraftIndex.current.clear();
    rows.forEach((_row,index)=>worksheetRowToDraftIndex.current.set(dataStart+index,index));
    setRenderRows(rows);
  },[rows,dataStart]);

  const sheetData = useMemo(() => {
    const cells: any[] = [];
    const put = (r:number, c:number, value:any, style:Record<string,any>={}) => cells.push({r,c,v:{v:value,m:String(value??''),...style}});
    const headerStyle = (bg:string, font='Tahoma', size=9) => ({
      bg, fc:'#111111', bl:1, fs:size, ff:font, ht:0, vt:0, tb:2,
    });
    const widths = isOne
      ? [33,348,112,102,348,112,102,348,112,102,73]
      : [46,109,326,165,96,361,95,137,96];

    if (isOne) {
      const fills:Record<string,string> = {
        no:'#BFBFBF',
        nomor_spp:'#FFFF00', tanggal_spp:'#FFFF00', nilai_spp:'#FFFF00',
        nomor_spm:'#E739DF', tanggal_spm:'#92D050', nilai_spm:'#92D050',
        nomor_sp2d:'#00B0F0', tanggal_sp2d:'#00B0F0', nilai_sp2d:'#00B0F0',
        bulan:'#00B0F0',
      };
      columns.forEach((column,index) => put(0,index,column.label,headerStyle(fills[String(column.key)]||'#FFFFFF')));
    } else {
      columns.forEach((column,index) => {
        const key=String(column.key);
        const label=key==='nilai_bruto'?'Nilai (Rp) Bruto':column.label;
        const fill=key==='nomor_spm'?'#E739DF':'#FCE4D6';
        put(0,index,label,headerStyle(fill,'Calibri',10));
      });
    }

    const dataCells = renderRows.flatMap((row,index) => columns.map((column,c) => {
      const key=String(column.key);
      const raw=(row as any)[key];
      const value=raw==null?'':String(raw);
      const isDocumentNumber=['nomor_spp','nomor_spm','nomor_sp2d'].includes(key);
      const isPrimaryKey=key==='nomor_spm';
      return {
        r:dataStart+index,c,
        v:{
          v:value,m:value,
          ...(isDocumentNumber?{ct:{fa:'@',t:'s'}}:{}),
          ...(isPrimaryKey?{bg:'#FCE7F9',fc:'#581C87'}:{}),
        },
      };
    }));
    cells.push(...dataCells);

    const formattedRows=Math.max(100,renderRows.length+30);
    const textColumns=columns.map((column,index) =>
      ['nomor_spp','nomor_spm','nomor_sp2d'].includes(String(column.key))?index:-1
    ).filter(index=>index>=0);
    for(let r=dataStart;r<dataStart+formattedRows;r++) {
      for(const c of textColumns) {
        if(!dataCells.some(cell=>cell.r===r&&cell.c===c)) {
          cells.push({r,c,v:{v:'',m:'',ct:{fa:'@',t:'s'},...(isOne&&columns[c].key==='nomor_spm'?{bg:'#FCE7F9',fc:'#581C87'}:{})}});
        }
      }
    }

    return [{
      name:isOne?'Input 1':'Input 2',
      index:isOne?'input1':'input2',
      status:1,
      order:0,
      row:dataStart+formattedRows,
      column:columns.length,
      defaultRowHeight:24,
      defaultColWidth:110,
      celldata:cells,
      showGridLines:1,
      config:{
        rowlen:{'0':36},
        columnlen:Object.fromEntries(widths.map((width,index)=>[index,width])),
        borderInfo:[{
          rangeType:'range',
          borderType:'border-all',
          style:1,
          color:'#000000',
          range:[{row:[0,dataStart+formattedRows-1],column:[0,columns.length-1]}],
        }],
      },
    }];
  },[columns,dataStart,isOne,renderRows]);

  useEffect(() => {
    mounted.current=true;
    return () => { mounted.current=false; };
  },[]);

  useEffect(() => {
    baseline.current=rows.map(row=>columns.map(column=>String((row as any)[column.key]??'')));
  },[rows,columns]);

  const onSelectionChange = useCallback((_sheetId:string, active:any) => {
    if(!mounted.current)return;
    const current=latestSelection.current;
    if(!current.isOne)return;
    const row=active?.row_focus??active?.row?.[0];
    const col=active?.column_focus??active?.column?.[0];
    const keyColumn=current.columns.findIndex(column=>column.key==='nomor_spm');
    if(typeof row==='number'&&col===keyColumn&&row>=current.dataStart) {
      const target=current.rows[row-current.dataStart];
      if(target)current.onActiveRowChange?.(target.id,col===keyColumn?(value:string)=>{
        allowedKeyChange.current=value;
        workbookRef.current?.setCellValue(row,keyColumn,value);
      }:undefined,col===keyColumn);
    } else {
      current.onActiveRowChange?.('');
    }
  },[]);

  const onChange = useCallback((workbookData:any[]) => {
    if(!mounted.current) return;
    const sheet=workbookData?.[0];
    let source=sheet?.data;
    if(!Array.isArray(source) && Array.isArray(sheet?.celldata)) {
      const maxRow=Math.max(dataStart, ...sheet.celldata.map((cell:any)=>Number(cell?.r??0)));
      const maxCol=Math.max(columns.length-1, ...sheet.celldata.map((cell:any)=>Number(cell?.c??0)));
      const matrix:any[][]=Array.from({length:maxRow+1},()=>Array(maxCol+1).fill(null));
      sheet.celldata.forEach((cell:any)=>{
        if(typeof cell?.r==='number'&&typeof cell?.c==='number') matrix[cell.r][cell.c]=cell.v;
      });
      source=matrix;
    }
    if(!Array.isArray(source)) return;

    const next=[...latestSelection.current.rows] as Row[];
    let changed=false;
    const makeEmptyRow=(id:string,no:string):Row=>current.isOne
      ? {id,no,nomor_spp:'',tanggal_spp:'',nilai_spp:null,nomor_spm:'',tanggal_spm:'',nilai_spm:null,nomor_sp2d:'',tanggal_sp2d:'',nilai_sp2d:null,bulan:''}
      : {id,no,tanggal_spm:'',nomor_spm:'',unit_skpd:'',nama_penerima:'',keterangan:'',jenis_spm:'',nilai_bruto:null,bulan:''};

    source.forEach((line:any[],rowIndex:number) => {
      if(rowIndex<dataStart||!Array.isArray(line))return;
      const values=columns.map((column,c)=>{
        const cell=line[c];
        if(cell==null)return '';
        if(typeof cell==='object')return String(cell.v??cell.m??'');
        return String(cell);
      });
      const hasContent=values.some(value=>value.trim()!=='');
      let draftIndex=worksheetRowToDraftIndex.current.get(rowIndex);

      // Previously every edit beyond rows.length was discarded here.
      // FortuneSheet renders empty editable rows, so normal direct entry into
      // a blank row never reached the draft or Firebase save pipeline.
      if(draftIndex===undefined){
        if(!hasContent)return;
        const newRow=makeEmptyRow(createRowId(),String(next.length+1));
        draftIndex=next.length;
        next.push(newRow);
        worksheetRowToDraftIndex.current.set(rowIndex,draftIndex);
      }

      const existing=next[draftIndex];
      if(!existing)return;
      const previous=baseline.current[draftIndex]??[];
      if(values.every((value,c)=>value===(previous[c]??'')))return;

      const updated:any={...existing};
      columns.forEach((column,c)=>{
        const key=String(column.key);
        const raw=values[c];
        if(['nilai_spp','nilai_spm','nilai_sp2d','nilai_bruto'].includes(key)){
          const normalized=raw.replace(/[\sRp.]/g,'').replace(/,/g,'.');
          updated[key]=normalized===''?null:Number(normalized);
        }else updated[key]=raw;
      });

      if(isOne&&updated.nomor_spm!==existing.nomor_spm){
        if(allowedKeyChange.current!==updated.nomor_spm){
          const keyColumn=columns.findIndex(column=>column.key==='nomor_spm');
          workbookRef.current?.setCellValue(rowIndex,keyColumn,existing.nomor_spm||'');
          toast.error('Nomor SPM di Input 1 hanya bisa dipilih melalui tombol Insert.');
          return;
        }
        allowedKeyChange.current=null;
      }
      if(isOne&&updated.nomor_spm){
        const linked=input2Rows.find(option=>String(option.nomor_spm).trim()===String(updated.nomor_spm).trim());
        if(linked){
          updated.tanggal_spm=linked.tanggal_spm;
          updated.nilai_spm=linked.nilai_bruto;
          updated.bulan=linked.bulan;
        }
      }
      next[draftIndex]=updated;
      changed=true;
    });
    if(changed) {
      lastLocalSignature.current=JSON.stringify(next);
      onRowsChange(next);
    }
  },[columns,dataStart,input2Rows,isOne,onRowsChange]);

  const changeHandlerRef=useRef(onChange);
  changeHandlerRef.current=onChange;
  const stableOnChange=useCallback((data:any[])=>changeHandlerRef.current(data),[]);
  const hooks=useMemo(()=>({afterSelectionChange:onSelectionChange}),[onSelectionChange]);

  return <div className="fortune-wrap">
    <StableWorkbook
      key={kind}
      ref={workbookRef}
      data={sheetData as any}
      onChange={stableOnChange}
      hooks={hooks}
      showToolbar
      showFormulaBar
      showSheetTabs={false}
      lang="en"
    />
  </div>;
}

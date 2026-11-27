import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { toast } from 'sonner';
import { INPUT1_COLUMNS, INPUT2_COLUMNS, type Input1Row, type Input2Row } from '../types';

type Kind = 'input_1' | 'input_2';
type Row = Input1Row | Input2Row;

export function SpreadsheetInput({ kind, rows, input2Rows=[], onRowsChange, onActiveRowChange }: {
  kind: Kind;
  rows: Row[];
  input2Rows?: Input2Row[];
  onRowsChange: (rows: Row[]) => void;
  onActiveRowChange?: (id: string) => void;
}) {
  const isOne = kind === 'input_1';
  const columns = isOne ? INPUT1_COLUMNS : INPUT2_COLUMNS;
  // All field labels are on worksheet row 1. Data starts on worksheet row 2.
  const dataStart = 1;
  const baseline = useRef<string[][]>([]);
  const mounted = useRef(false);
  const workbookRef = useRef<any>(null);

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

    const dataCells = rows.flatMap((row,index) => columns.map((column,c) => {
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

    const formattedRows=Math.max(100,rows.length+30);
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
  },[columns,dataStart,isOne,rows]);

  useEffect(() => {
    mounted.current=true;
    return () => { mounted.current=false; };
  },[]);

  useEffect(() => {
    baseline.current=rows.map(row=>columns.map(column=>String((row as any)[column.key]??'')));
  },[rows,columns]);

  const onSelectionChange = useCallback((_sheetId:string, active:any) => {
    if(!mounted.current || !isOne) return;
    const row=active?.row_focus??active?.row?.[0];
    const col=active?.column_focus??active?.column?.[0];
    const keyColumn=columns.findIndex(column=>column.key==='nomor_spm');
    if(typeof row==='number'&&col===keyColumn&&row>=dataStart) {
      const target=rows[row-dataStart];
      if(target) onActiveRowChange?.(target.id);
    } else {
      onActiveRowChange?.('');
    }
  },[columns,dataStart,isOne,onActiveRowChange,rows]);

  const onChange = useCallback((workbookData:any[]) => {
    if(!mounted.current) return;
    const sheet=workbookData?.[0];
    const source=sheet?.data;
    if(!Array.isArray(source)) return;

    const next=[...rows];
    let changed=false;
    source.forEach((line:any[],rowIndex:number) => {
      const index=rowIndex-dataStart;
      if(index<0||index>=next.length||!Array.isArray(line)) return;
      const previous=baseline.current[index]??[];
      const values=columns.map((column,c)=>String(line[c]?.v??line[c]?.m??''));
      if(values.every((value,c)=>value===(previous[c]??''))) return;

      const updated:any={...next[index]};
      columns.forEach((column,c) => {
        const key=String(column.key);
        const raw=values[c];
        if(['nilai_spp','nilai_spm','nilai_sp2d','nilai_bruto'].includes(key)) {
          const normalized=raw.replace(/[\sRp.]/g,'').replace(/,/g,'.');
          updated[key]=normalized===''?null:Number(normalized);
        } else updated[key]=raw;
      });

      if(isOne&&updated.nomor_spm!==next[index].nomor_spm) {
        toast.error('Nomor SPM di Input 1 hanya bisa dipilih melalui tombol Insert.');
        return;
      }
      if(isOne&&updated.nomor_spm) {
        const linked=input2Rows.find(option=>String(option.nomor_spm).trim()===String(updated.nomor_spm).trim());
        if(linked) {
          updated.tanggal_spm=linked.tanggal_spm;
          updated.nilai_spm=linked.nilai_bruto;
          updated.bulan=linked.bulan;
        }
      }
      next[index]=updated;
      changed=true;
    });
    if(changed) onRowsChange(next);
  },[columns,dataStart,input2Rows,isOne,onRowsChange,rows]);

  return <div className="fortune-wrap">
    <Workbook
      key={kind}
      ref={workbookRef}
      data={sheetData as any}
      onChange={onChange}
      hooks={{afterSelectionChange:onSelectionChange}}
      showToolbar
      showFormulaBar
      showSheetTabs={false}
      lang="en"
    />
  </div>;
}

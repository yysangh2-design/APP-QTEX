
import React from 'react';
import { SquarePen, ChevronRight, FileText, Send, Sparkles, Loader2, Calculator, ShieldCheck, Users, BookOpen, Scale, PieChart, TrendingUp as TrendingUpIcon, Download, Printer, X as XIcon, Table, FileCheck, Landmark, Receipt, AlertCircle, Wand2, FileSearch, BadgePercent, ChevronDown, CheckCircle2, Save, FileDown, FileType, FileOutput, ArrowRightLeft, Building2, Hash, FileBarChart, Clock, ClipboardList, Zap, ArrowRight, ShieldAlert, Check, Info, Filter, ArrowUpRight, Search, CheckSquare, Square, Tag, MousePointer2, ListFilter } from 'lucide-react';
import { Transaction } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { analyzeBatchTransactions } from '../services/geminiService';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface TaxReportFormProps {
  transactions: Transaction[];
}

type LedgerView = 'none' | 'simple' | 'double' | 'is' | 'adjustment';

interface AdjustmentResult {
  additions: { item: string; amount: number; reason: string }[];
  deductions: { item: string; amount: number; reason: string }[];
  reductions: { item: string; amount: number; description: string }[];
  credits: { item: string; amount: number; description: string }[];
  estimatedFinalProfit: number;
  taxableIncome: number;
  finalEstimatedTax: number;
  expertOpinion: string;
  taxSavingRatio: number;
}

const EXPENSE_ACCOUNTS = ['식대(복리후생비)', '여비교통비', '차량유지비', '소모품비', '지급임차료', '통신비', '수도광열비', '세금과공과', '광고선전비', '수수료비용', '기타'];

const calculateIncomeTax2026 = (profit: number) => {
  if (profit <= 0) return 0;
  if (profit <= 14000000) return profit * 0.06;
  if (profit <= 50000000) return profit * 0.15 - 1260000;
  if (profit <= 88000000) return profit * 0.24 - 5760000;
  if (profit <= 150000000) return profit * 0.35 - 15440000;
  if (profit <= 300000000) return profit * 0.38 - 19940000;
  if (profit <= 500000000) return profit * 0.40 - 25940000;
  if (profit <= 1000000000) return profit * 0.42 - 35940000;
  return profit * 0.45 - 65940000;
};

const TaxReportForm: React.FC<TaxReportFormProps> = ({ transactions: initialTransactions }) => {
  const [step, setStep] = React.useState(1);
  const [activeLedger, setActiveLedger] = React.useState<LedgerView>('none');
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  const [enhancedTransactions, setEnhancedTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [isAdjusting, setIsAdjusting] = React.useState(false);
  const [adjResult, setAdjResult] = React.useState<AdjustmentResult | null>(null);
  const [isExporting, setIsExporting] = React.useState<'pdf' | 'excel' | null>(null);

  const ledgerPrintRef = React.useRef<HTMLDivElement>(null);

  // 화면 리사이즈 감지
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // A4 너비 기준 스케일 계산 (210mm ~ 약 794px)
  const a4WidthPx = 794;
  const scale = windowWidth < a4WidthPx ? (windowWidth - 32) / a4WidthPx : 1;

  const runAiCategorization = async () => {
    const targets = enhancedTransactions.filter(t => 
      t.type === 'expense' && 
      ['세금계산서', '현금', '계산서'].includes(t.subCategory) && 
      (!t.accountName || t.accountName === '기타')
    );
    if (targets.length === 0) return;
    setIsEnhancing(true);
    try {
      const itemsToAnalyze = targets.map(t => ({ description: t.description, amount: t.amount }));
      const aiResults = await analyzeBatchTransactions(itemsToAnalyze);
      const updated = enhancedTransactions.map(t => {
        const targetIdx = targets.findIndex(tgt => tgt.id === t.id);
        if (targetIdx > -1 && aiResults[targetIdx]) {
          return { ...t, accountName: aiResults[targetIdx].suggestedAccount, isVatDeductible: aiResults[targetIdx].isVatDeductible, isIncomeTaxDeductible: aiResults[targetIdx].isIncomeTaxDeductible };
        }
        return t;
      });
      setEnhancedTransactions(updated);
    } catch (error) { console.error(error); } finally { setIsEnhancing(false); }
  };

  const handleUpdateTransactions = (updatedTxs: Transaction[]) => {
    setEnhancedTransactions(updatedTxs);
  };

  const accountingData = React.useMemo(() => {
    const savedLabor = JSON.parse(localStorage.getItem('saved_labor_data') || '[]');
    const txs = enhancedTransactions;
    
    const salesRaw = txs.filter(t => t.type === 'income');
    const totalSalesGross = salesRaw.reduce((sum, t) => sum + Math.floor(t.amount), 0);
    const totalSalesNet = Math.floor(totalSalesGross / 1.1);

    const expenseRaw = txs.filter(t => t.type === 'expense');
    const expensesByAccount = expenseRaw.reduce((acc: any, t) => {
      const accName = t.accountName || '기타일반비용';
      if (!acc[accName]) acc[accName] = { amount: 0, items: [] };
      acc[accName].amount += Math.floor(t.amount);
      acc[accName].items.push(t);
      return acc;
    }, {});

    const totalLaborCost = savedLabor.reduce((sum: number, l: any) => sum + Math.floor(l.totalCost), 0);
    if (totalLaborCost > 0) {
      expensesByAccount['급여 및 임금'] = { amount: totalLaborCost, items: savedLabor.map((l:any) => ({ id: `LABOR-${l.id}`, date: l.date || new Date().toISOString().split('T')[0], description: `[급여] ${l.name}`, amount: l.totalCost, subCategory: '인건비' })) };
    }

    const totalExpenseAmt = Object.values(expensesByAccount).reduce((sum: any, val: any) => sum + val.amount, 0) as number;
    const accrualAdjustment = Math.floor(totalExpenseAmt / 12);
    const totalSgaAmt = totalExpenseAmt + accrualAdjustment;
    const operatingProfit = Math.max(0, totalSalesNet - totalSgaAmt);

    let entries: any[] = [];

    // 매출 분개 (수익 인식)
    salesRaw.forEach(s => {
      const vat = Math.floor((s.amount / 1.1) * 0.1);
      const net = Math.floor(s.amount) - vat;
      entries.push({
        date: s.date || new Date().toISOString().split('T')[0], desc: s.description, type: '매출',
        debit: [{ acc: '보통예금(103)', amt: Math.floor(s.amount) }],
        credit: [{ acc: '상품매출(401)', amt: net }, { acc: '부가세예수금(255)', amt: vat, isVat: true }],
        isIncome: true, subCategory: s.subCategory, accountName: '매출'
      });
    });

    // 매입 분개 (발생주의 + 익월결제 반영)
    expenseRaw.forEach(e => {
      const txDate = e.date || new Date().toISOString().split('T')[0];
      const vat = e.isVatDeductible ? (e.vat ?? Math.floor((e.amount / 1.1) * 0.1)) : 0;
      const net = Math.floor(e.amount) - Math.floor(vat);
      const account = e.accountName || '기타일반비용';
      
      // 1. 거래 시점: 비용 발생 분개 (미지급금 계상)
      entries.push({
        date: txDate, desc: e.description, type: '비용발생',
        debit: [
          { acc: `${account}(비용)`, amt: net },
          ...(vat > 0 ? [{ acc: '부가세대급금(135)', amt: vat, isVat: true }] : [])
        ],
        credit: [{ acc: '미지급금(253)', amt: Math.floor(e.amount) }],
        isIncome: false, subCategory: e.subCategory, accountName: account
      });

      // 2. 결제 시점: 익월 결제 분개 (보통예금 유출)
      const d = new Date(txDate);
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + 1);
        const settlementDate = d.toISOString().split('T')[0];
        entries.push({
          date: settlementDate, desc: `[익월결제] ${e.description}`, type: '결제완료',
          debit: [{ acc: '미지급금(253)', amt: Math.floor(e.amount) }],
          credit: [{ acc: '보통예금(103)', amt: Math.floor(e.amount) }],
          isIncome: false, subCategory: '카드/계좌결제', accountName: '금융거래', isSettlement: true
        });
      }
    });

    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { totalSalesNet, expensesByAccount, totalSgaAmt, operatingProfit, journalEntries: sortedEntries, accrualAdjustment };
  }, [enhancedTransactions]);

  const runAiTaxAdjustment = async () => {
    setIsAdjusting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `대한민국 전문 세무사로서 2026년 최신 조세법을 적용하여 다음 사업장의 세무조정을 수행하라. [매출액: ${accountingData.totalSalesNet}원]...`;
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              additions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: {type: Type.STRING}, amount: {type: Type.NUMBER}, reason: {type: Type.STRING} } } },
              deductions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: {type: Type.STRING}, amount: {type: Type.NUMBER}, reason: {type: Type.STRING} } } },
              reductions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: {type: Type.STRING}, amount: {type: Type.NUMBER}, description: {type: Type.STRING} } } },
              credits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: {type: Type.STRING}, amount: {type: Type.NUMBER}, description: {type: Type.STRING} } } },
              taxableIncome: { type: Type.NUMBER },
              finalEstimatedTax: { type: Type.NUMBER },
              taxSavingRatio: { type: Type.NUMBER },
              expertOpinion: { type: Type.STRING }
            }
          }
        }
      });
      setAdjResult(JSON.parse(response.text));
    } catch (err) { console.error(err); } finally { setIsAdjusting(false); }
  };

  React.useEffect(() => {
    if (activeLedger === 'adjustment' && !adjResult) { runAiTaxAdjustment(); }
  }, [activeLedger]);

  const handleDownloadPDF = async () => {
    if (!ledgerPrintRef.current) return;
    setIsExporting('pdf');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = ledgerPrintRef.current.querySelectorAll('.a4-page');
      for (let i = 0; i < pages.length; i++) {
        // PDF 생성 시에는 원본 크기로 렌더링되도록 스케일 무시
        const canvas = await htmlToImage.toCanvas(pages[i] as HTMLElement, { pixelRatio: 2.5, backgroundColor: '#ffffff', skipFonts: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      pdf.save(`Q-Tex-Ledger-${activeLedger}.pdf`);
    } catch (err) { alert('PDF 생성 오류'); } finally { setIsExporting(null); }
  };

  const handleExportExcel = () => {
    if (accountingData.journalEntries.length === 0) return;
    setIsExporting('excel');
    try {
      const sheetData = accountingData.journalEntries.flatMap(e => {
        const max = Math.max(e.debit.length, e.credit.length);
        return Array.from({length: max}).map((_, i) => ({
          '날짜': i === 0 ? e.date : '',
          '적요': i === 0 ? e.desc : '',
          '차변계정': e.debit[i]?.acc || '',
          '차변금액': e.debit[i]?.amt || 0,
          '대변계정': e.credit[i]?.acc || '',
          '대변금액': e.credit[i]?.amt || 0
        }));
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Journal");
      XLSX.writeFile(wb, "Q-Tex_Journal.xlsx");
    } catch (err) { alert('Excel 생성 오류'); } finally { setIsExporting(null); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-1 md:px-2">
      <header className="space-y-4 no-print text-left">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl"><SquarePen size={24} /></div>
          <div><h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">장부 작성 및 경영 관리</h1><p className="text-slate-500 text-xs md:text-sm font-medium">A4 최적화 및 발생주의 분개 지원</p></div>
        </div>
      </header>

      {step === 1 && (
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 no-print">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Table size={20} className="text-blue-600" /> 표준 장부 데이터</h2>
                <div className="flex gap-2">
                  <button onClick={runAiCategorization} disabled={isEnhancing} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI 정밀 분류
                  </button>
                  {activeLedger !== 'none' && (
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm gap-1">
                      <ToolbarBtn icon={<FileText size={16} />} onClick={handleDownloadPDF} loading={isExporting === 'pdf'} title="PDF" />
                      <ToolbarBtn icon={<FileOutput size={16} />} onClick={handleExportExcel} loading={isExporting === 'excel'} title="EXCEL" />
                    </div>
                  )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 no-print font-sans">
              <AccountingButton active={activeLedger === 'simple'} icon={<FileSearch size={18} />} title="간이장부" desc="표준 A4 출력" onClick={() => setActiveLedger('simple')} />
              <AccountingButton active={activeLedger === 'double'} icon={<Scale size={18} />} title="분개장" desc="월별 합계/발생주의" onClick={() => setActiveLedger('double')} />
              <AccountingButton active={activeLedger === 'is'} icon={<FileBarChart size={18} />} title="손익계산서" desc="비율 분석 및 관리" onClick={() => setActiveLedger('is')} />
              <AccountingButton active={activeLedger === 'adjustment'} icon={<Wand2 size={18} />} title="AI 전문 세무조정" desc="2026년 조세법 기반" isSpecial onClick={() => setActiveLedger('adjustment')} />
            </div>

            {activeLedger !== 'none' && (
              <div className="animate-in slide-in-from-top-2 duration-500 overflow-x-auto pb-10 bg-slate-100 rounded-[2.5rem] p-4 md:p-10 border border-slate-200 shadow-inner overflow-hidden">
                <div ref={ledgerPrintRef} className="flex flex-col items-center gap-8">
                  {activeLedger === 'simple' && <SimplifiedLedgerPaged data={accountingData} scale={scale} />}
                  {activeLedger === 'double' && <DoubleEntryLedgerPaged data={accountingData} scale={scale} />}
                  {activeLedger === 'is' && <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl w-full max-w-4xl"><IncomeStatement data={accountingData} onUpdateTransactions={handleUpdateTransactions} fullTransactions={enhancedTransactions} /></div>}
                  {activeLedger === 'adjustment' && <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl w-full max-w-4xl"><TaxAdjustment result={adjResult} loading={isAdjusting} originalProfit={accountingData.operatingProfit} /></div>}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

// --- Sub Components ---

const ToolbarBtn = ({ icon, onClick, title, loading }: any) => (
  <button onClick={onClick} disabled={loading} className="px-3 py-2 text-slate-500 hover:text-blue-600 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50">
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    <span className="text-[10px] font-black uppercase tracking-tight">{title}</span>
  </button>
);

const AccountingButton = ({ active, icon, title, desc, onClick, isSpecial = false }: any) => (
  <button onClick={onClick} className={`p-5 md:p-7 rounded-[2rem] border-2 transition-all flex flex-col gap-2.5 text-left active:scale-95 group ${active ? isSpecial ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-900 border-slate-900 text-white shadow-xl' : isSpecial ? 'bg-white border-amber-100 text-amber-900 shadow-sm' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}><div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${active ? 'bg-white/10' : isSpecial ? 'bg-amber-50 shadow-inner text-amber-600' : 'bg-slate-50 shadow-inner'}`}>{icon}</div><div><span className="text-[12px] md:text-base font-black block tracking-tight">{title}</span><span className={`text-[10px] md:text-[11px] font-bold mt-0.5 block ${active ? 'opacity-60' : 'text-slate-400'}`}>{desc}</span></div></button>
);

const SimplifiedLedgerPaged = ({ data, scale }: any) => {
  const sortedEntries = [...data.journalEntries].filter(e => !e.isSettlement).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rowsPerPage = 28; 
  const pageCount = Math.ceil(sortedEntries.length / rowsPerPage);
  
  // 스케일이 적용된 높이 계산 (A4 297mm)
  const scaledHeight = 297 * scale;

  return (
    <div className="flex flex-col items-center gap-8 w-full" style={{ height: window.innerWidth < 794 ? `${scaledHeight * pageCount}mm` : 'auto' }}>
      {Array.from({ length: pageCount || 1 }).map((_, pageIdx) => (
        <div key={pageIdx} 
             className="a4-page bg-white shadow-2xl overflow-hidden relative font-sans p-[15mm] origin-top" 
             style={{ 
               width: '210mm', 
               height: '297mm', 
               minHeight: '297mm', 
               boxSizing: 'border-box',
               transform: `scale(${scale})`,
               marginBottom: window.innerWidth < 794 ? `-${297 * (1 - scale)}mm` : '0'
             }}>
          <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-6"><div className="text-left"><h4 className="text-2xl font-black text-slate-900 uppercase">간 이 장 부</h4><p className="text-[9px] font-bold text-slate-400">Certified Accounting Document - FY 2026</p></div><div className="text-right text-[9px] font-bold text-slate-400">Page {pageIdx + 1} / {pageCount}</div></div>
          <table className="w-full text-left border-collapse table-fixed border border-slate-200 text-[9px]">
            <thead className="bg-slate-900 text-white font-black uppercase text-center"><tr className="h-10"><th>날짜</th><th>계정과목</th><th>적요</th><th>수입</th><th>비용</th><th>증빙</th></tr></thead>
            <tbody>
              {sortedEntries.slice(pageIdx * rowsPerPage, (pageIdx + 1) * rowsPerPage).map((e: any, i: number) => (
                <tr key={i} className="h-9 border-b border-slate-100 text-center"><td className="text-slate-400">{e.date.slice(2)}</td><td className="font-black text-left px-2">{e.accountName}</td><td className="text-left px-2 truncate">{e.desc}</td><td className="text-right px-2 text-blue-600">{e.isIncome ? e.debit[0].amt.toLocaleString() : '-'}</td><td className="text-right px-2 text-rose-500">{!e.isIncome ? e.debit[0].amt.toLocaleString() : '-'}</td><td className="text-[7px] font-bold text-slate-400">{e.subCategory}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const DoubleEntryLedgerPaged = ({ data, scale }: any) => {
  const entries = data.journalEntries;
  const renderRows: any[] = [];
  let currentMonth = "";
  let monthDebitSum = 0;
  let monthCreditSum = 0;

  entries.forEach((e: any, idx: number) => {
    const month = e.date && e.date.length >= 7 ? e.date.slice(0, 7) : "Unknown";
    if (currentMonth && currentMonth !== month) {
      renderRows.push({ isTotal: true, label: `${currentMonth} 소계`, debit: monthDebitSum, credit: monthCreditSum });
      monthDebitSum = 0;
      monthCreditSum = 0;
    }
    currentMonth = month;
    renderRows.push({ ...e, isEntry: true });
    
    e.debit.forEach((d: any) => monthDebitSum += d.amt);
    e.credit.forEach((c: any) => monthCreditSum += c.amt);

    if (idx === entries.length - 1) {
      renderRows.push({ isTotal: true, label: `${currentMonth} 소계`, debit: monthDebitSum, credit: monthCreditSum });
    }
  });

  const rowsPerPage = 20; 
  const pageCount = Math.ceil(renderRows.length / rowsPerPage);
  const scaledHeight = 297 * scale;

  return (
    <div className="flex flex-col items-center gap-8 w-full" style={{ height: window.innerWidth < 794 ? `${scaledHeight * pageCount}mm` : 'auto' }}>
      {Array.from({ length: pageCount || 1 }).map((_, pageIdx) => (
        <div key={pageIdx} 
             className="a4-page bg-white shadow-2xl overflow-hidden relative font-sans p-[10mm] origin-top" 
             style={{ 
               width: '210mm', 
               height: '297mm', 
               minHeight: '297mm', 
               boxSizing: 'border-box',
               transform: `scale(${scale})`,
               marginBottom: window.innerWidth < 794 ? `-${297 * (1 - scale)}mm` : '0'
             }}>
          <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-4">
            <div className="text-left"><h4 className="text-xl font-black text-slate-900 uppercase">분 개 장 (Journal Ledger)</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accrual Basis - Settlement Included</p></div>
            <div className="text-right text-[8px] font-bold text-slate-400">Page {pageIdx + 1} / {pageCount}</div>
          </div>
          <table className="w-full text-[8px] text-left border-collapse table-fixed border border-slate-300">
            <thead className="bg-slate-900 text-white"><tr className="h-8 text-[7px] font-black uppercase text-center"><th className="w-14">Date</th><th className="px-2">Debit (차변) / Description</th><th className="w-20 px-2 text-right">Debit Amt</th><th className="px-2">Credit (대변)</th><th className="w-20 px-2 text-right">Credit Amt</th></tr></thead>
            <tbody>
              {renderRows.slice(pageIdx * rowsPerPage, (pageIdx + 1) * rowsPerPage).map((r: any, i: number) => (
                r.isTotal ? (
                  <tr key={i} className="h-8 bg-slate-100 font-black border-y-2 border-slate-300">
                    <td colSpan={2} className="px-2 text-right text-slate-500 uppercase tracking-widest">{r.label}</td>
                    <td className="px-2 text-right text-blue-700">{r.debit.toLocaleString()}</td>
                    <td className="px-2 text-right text-slate-400">Check</td>
                    <td className="px-2 text-right text-rose-700">{r.credit.toLocaleString()}</td>
                  </tr>
                ) : (
                  <tr key={i} className="h-12 border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="text-center font-mono text-[7px] text-slate-400">{r.date ? r.date.slice(5) : '-'}</td>
                    <td className="px-2">
                      <div className="flex flex-col gap-0.5">
                        {r.debit.map((d: any, di: number) => (
                          <div key={di} className={`flex justify-between ${d.isVat ? 'text-blue-500' : 'text-slate-800 font-bold'}`}>
                            <span>{d.acc}</span>
                            <span className="text-[7px]">{d.amt.toLocaleString()}</span>
                          </div>
                        ))}
                        <span className="text-[6px] text-slate-400 truncate mt-0.5">{r.desc}</span>
                      </div>
                    </td>
                    <td className="px-2 text-right font-black bg-blue-50/20">{r.debit.reduce((s:any,d:any)=>s+d.amt,0).toLocaleString()}</td>
                    <td className="px-2">
                      <div className="flex flex-col gap-0.5">
                        {r.credit.map((c: any, ci: number) => (
                          <div key={ci} className={`flex justify-between ${c.isVat ? 'text-blue-500' : 'text-slate-800 font-bold'}`}>
                            <span>{c.acc}</span>
                            <span className="text-[7px]">{c.amt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 text-right font-black bg-rose-50/20">{r.credit.reduce((s:any,c:any)=>s+c.amt,0).toLocaleString()}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          <div className="absolute bottom-[5mm] left-[10mm] opacity-30 text-[7px] font-bold pointer-events-none">Q-Tex Digital Auditing System v9.0</div>
        </div>
      ))}
    </div>
  );
};

const IncomeStatement = ({ data, onUpdateTransactions, fullTransactions }: any) => {
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const totalSales = data.totalSalesNet;
  const totalSga = data.totalSgaAmt;
  const sgaRatio = totalSales > 0 ? ((totalSga / totalSales) * 100).toFixed(1) : "0";
  const expenseItems = Object.entries(data.expensesByAccount).sort((a:any, b:any) => b[1].amount - a[1].amount);

  return (
    <div className="space-y-10 py-4 font-sans text-left relative">
      <div className="text-center space-y-3 mb-12">
        <h4 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">손 익 계 산 서</h4>
        <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.4em]">2026. 01. 01 ~ 2026. 12. 31 | 단위: 원</p>
      </div>
      <div className="border-4 border-slate-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 md:px-10 py-6 border-b border-slate-900 flex justify-between items-center text-white">
          <span className="text-sm md:text-lg font-black tracking-widest uppercase">Ⅰ. 매출액 (Revenue)</span>
          <span className="text-xl md:text-2xl font-black text-emerald-400">{totalSales.toLocaleString()}</span>
        </div>
        <div className="bg-slate-100 px-6 md:px-10 py-6 border-y-2 border-slate-200 flex justify-between items-center">
          <div className="flex flex-col"><span className="text-sm md:text-lg font-black text-slate-800 uppercase">Ⅱ. 판매비와 관리비 (SG&A)</span><span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full mt-1">매출 대비 {sgaRatio}%</span></div>
          <span className="text-xl md:text-2xl font-black text-rose-600">{totalSga.toLocaleString()}</span>
        </div>
        <div className="divide-y divide-slate-100">
            {expenseItems.map(([acc, info]: any) => {
                const ratioOfSga = totalSga > 0 ? ((info.amount / totalSga) * 100).toFixed(1) : "0";
                return (
                    <div key={acc} className="px-8 md:px-12 py-5 flex justify-between items-center group hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /><div className="flex flex-col"><span className="text-xs md:text-sm font-bold text-slate-600">{acc}</span><span className="text-[10px] font-black text-slate-400">판관비 중 {ratioOfSga}%</span></div></div>
                        <button onClick={() => setSelectedAccount(acc)} className="flex flex-col items-end group"><span className="text-sm md:text-base font-black text-slate-800 underline decoration-slate-200 underline-offset-4 group-hover:text-blue-600 transition-all">{info.amount.toLocaleString()}</span><span className="text-[8px] font-black text-slate-300 uppercase">Drill-down</span></button>
                    </div>
                );
            })}
        </div>
        <div className="bg-blue-600 px-6 md:px-10 py-8 flex justify-between items-center text-white shadow-inner">
            <span className="text-sm md:text-xl font-black uppercase">Ⅲ. 영업이익 (Operating Profit)</span>
            <span className="text-2xl md:text-4xl font-black tracking-tighter">{data.operatingProfit.toLocaleString()} <span className="text-sm opacity-70">원</span></span>
        </div>
      </div>
      {/* FIX: Change enhancedTransactions to fullTransactions to match props and avoid 'Cannot find name' error */}
      {selectedAccount && <AccountDetailModal accountName={selectedAccount} data={data.expensesByAccount} allAccountNames={expenseItems.map(i => i[0])} onClose={() => setSelectedAccount(null)} onSelectAccount={setSelectedAccount} onSaveTransactions={onUpdateTransactions} fullTransactions={fullTransactions} />}
    </div>
  );
};

const AccountDetailModal = ({ accountName, data, allAccountNames, onClose, onSelectAccount, onSaveTransactions, fullTransactions }: any) => {
  const accountData = data[accountName];
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [targetAccount, setTargetAccount] = React.useState<string>(EXPENSE_ACCOUNTS[0]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!accountData) return null;

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedItems(next);
  };

  const handleBatchMove = () => {
    if (selectedItems.size === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updated = fullTransactions.map((t: Transaction) => selectedItems.has(t.id) ? { ...t, accountName: targetAccount } : t);
      onSaveTransactions(updated);
      setSelectedItems(new Set());
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[85vh] animate-in zoom-in-95">
        <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 md:gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileSearch size={20} className="md:w-6 md:h-6" /></div><h2 className="text-base md:text-xl font-black text-slate-800">계정과목 상세 분석</h2></div>
          <button onClick={onClose} className="p-2 md:p-3 text-slate-400 hover:text-red-500"><XIcon size={20} /></button>
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* 항목 리스트 - 모바일에서 상단 가로 스크롤, PC에서 왼쪽 사이드바 */}
          <div className="w-full lg:w-64 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 md:p-6 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ListFilter size={12} /> 항목 필터</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto custom-scrollbar pb-2 lg:pb-0 whitespace-nowrap">
              {allAccountNames.map((name: string) => (
                <button 
                  key={name} 
                  onClick={() => onSelectAccount(name)} 
                  className={`flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl transition-all border text-left flex-shrink-0 lg:flex-shrink-1 ${name === accountName ? 'bg-white border-blue-200 shadow-md text-blue-700' : 'bg-transparent border-transparent text-slate-500 hover:bg-white'}`}
                >
                  {name === accountName ? <CheckSquare size={14} className="md:w-4 md:h-4" /> : <Square size={14} className="md:w-4 md:h-4 text-slate-200" />}
                  <span className="text-[11px] md:text-xs font-black truncate">{name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-4 md:p-6 bg-blue-50/30 border-b border-blue-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg md:text-xl font-black text-slate-800">{accountName} <span className="text-xs text-slate-400 font-bold ml-2">총 {accountData.items.length}건</span></h3>
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                  <select value={targetAccount} onChange={e=>setTargetAccount(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 border rounded-xl text-[11px] md:text-xs font-bold outline-none bg-white">{EXPENSE_ACCOUNTS.map(a=><option key={a}>{a}</option>)}</select>
                  <button onClick={handleBatchMove} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] md:text-xs font-black shadow-lg flex items-center gap-1.5 whitespace-nowrap"><Save size={14} /> 이동 및 저장</button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                      <th className="p-3 md:p-4 w-10 text-center"></th>
                      <th className="p-3 md:p-4 w-16 md:w-24">일자</th>
                      <th className="p-3 md:p-4">내용</th>
                      <th className="p-3 md:p-4 text-right w-24 md:w-32">금액</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {accountData.items.map((item: any) => (
                     <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50/30' : ''}`}>
                       <td className="p-3 md:p-4 text-center"><button onClick={() => toggleItem(item.id)} className="flex items-center justify-center mx-auto">{selectedItems.has(item.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-200" />}</button></td>
                       <td className="p-3 md:p-4 text-[10px] md:text-[11px] font-mono text-slate-400 align-top md:align-middle">{item.date.slice(5)}</td>
                       <td className="p-3 md:p-4 align-top md:align-middle"><div className="font-black text-slate-700 text-[11px] md:text-xs leading-snug break-all">{item.description}</div></td>
                       <td className="p-3 md:p-4 text-right font-black text-slate-800 text-[11px] md:text-xs align-top md:align-middle">{item.amount.toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {accountData.items.length === 0 && (
                 <div className="py-20 text-center text-slate-300 font-bold text-sm">해당 항목에 데이터가 없습니다.</div>
               )}
            </div>
          </div>
        </div>
        
        {/* 모바일 하단 닫기 보조 버튼 (선택사항) */}
        <div className="md:hidden p-4 border-t border-slate-100 bg-white shrink-0">
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">확인 및 닫기</button>
        </div>
      </div>
    </div>
  );
};

const TaxAdjustment = ({ result, loading, originalProfit }: any) => (
  <div className="space-y-8 text-left font-sans">
    {loading ? (
      <div className="py-24 flex flex-col items-center gap-8 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
        <div className="relative w-24 h-24"><div className="absolute inset-0 border-4 border-blue-50 rounded-full" /><div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><div className="absolute inset-0 flex items-center justify-center text-blue-600"><Wand2 size={32} className="animate-pulse" /></div></div>
        <p className="font-black text-slate-800 text-xl tracking-tight">AI 전문 세무사가 2026년 조세법 검토 중...</p>
      </div>
    ) : result ? (
      <div className="space-y-10 animate-in fade-in duration-500">
        <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase text-center mb-12">세무조정 전문 검토서 (2026)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">조정 후 과세표준</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-blue-400">{Math.floor(result.taxableIncome).toLocaleString()}</span><span className="text-sm font-bold opacity-60">원</span></div></div>
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-4">최종 예상 납부세액</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black">{Math.floor(result.finalEstimatedTax).toLocaleString()}</span><span className="text-sm font-bold opacity-60">원</span></div></div>
            <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-4">절세 효과(Down)</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black">{result.taxSavingRatio}%</span><span className="text-sm font-bold opacity-60 ml-1">확보</span></div></div>
        </div>
        <div className="bg-white border-2 border-slate-900 rounded-[3rem] overflow-hidden shadow-xl">
            <div className="bg-slate-900 px-8 py-5 text-white font-black flex items-center justify-between">
                <div className="flex items-center gap-3"><Scale size={20} className="text-blue-400" /> 소득금액 세무조정 명세</div>
                <span className="text-[10px] opacity-60 uppercase">Certified by Gemini Pro</span>
            </div>
            <table className="w-full text-sm border-collapse"><tbody className="divide-y divide-slate-100"><tr className="bg-slate-50"><td className="p-6 font-black text-slate-800">결산서상 당기순이익 (A)</td><td className="p-6 text-right font-black text-slate-900">{originalProfit.toLocaleString()} 원</td></tr>{result.additions.map((adj:any, idx:number) => (<tr key={idx}><td className="p-6 font-bold text-rose-600 flex flex-col"><span>익금산입 및 손금불산입 (+)</span><span className="text-[10px] text-slate-400 mt-1">{adj.item}: {adj.reason}</span></td><td className="p-6 text-right font-black text-rose-500">+{adj.amount.toLocaleString()}</td></tr>))}{result.deductions.map((adj:any, idx:number) => (<tr key={idx}><td className="p-6 font-bold text-blue-600 flex flex-col"><span>손금산입 및 익금불산입 (-)</span><span className="text-[10px] text-slate-400 mt-1">{adj.item}: {adj.reason}</span></td><td className="p-6 text-right font-black text-blue-500">-{adj.amount.toLocaleString()}</td></tr>))}<tr className="bg-slate-900 text-white font-black"><td className="p-8 text-lg uppercase tracking-widest">차가감 소득금액 (과세표준)</td><td className="p-8 text-right text-2xl text-blue-400">{result.taxableIncome.toLocaleString()} 원</td></tr></tbody></table>
        </div>
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-lg space-y-8"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BookOpen size={24} className="text-blue-600" /> 세무사 전문 의견서</h3><div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 relative"><p className="text-slate-800 leading-relaxed font-bold whitespace-pre-wrap text-sm">{result.expertOpinion}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><BadgePercent size={16} /> 적용된 세액공제/감면</h4><div className="space-y-2">{result.credits.map((c:any, i:number)=>(<div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center"><span className="text-xs font-black text-emerald-800">{c.item}</span><span className="text-sm font-black text-emerald-600">-{c.amount.toLocaleString()}</span></div>))}</div></div><div className="space-y-4"><h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={16} /> 세무 리스크 권고</h4><div className="space-y-2">{result.additions.slice(0,2).map((a:any, i:number)=>(<div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100"><p className="text-xs font-black text-rose-800">{a.reason}</p></div>))}</div></div></div></div>
      </div>
    ) : null}
  </div>
);

export default TaxReportForm;

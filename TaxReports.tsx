
import React from 'react';
import { FileText, Calculator, Calendar, CheckCircle2, TrendingUp, Users, Receipt, X, BookOpen, Scale, PieChart, Info, ChevronDown, Filter, ArrowUpRight, Clock, Search, Download, Image as ImageIcon, Landmark, BadgePercent, ChevronRight, Shield, Loader2, FileDown, ShieldCheck, History, Award, Check } from 'lucide-react';
import { Transaction } from '../types';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

// 2026년 국세법 소득세율 계산기
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

type ReportTab = 'vat' | 'income' | 'labor';
type QuarterType = '1분기' | '2분기' | '3분기' | '4분기' | '전체';
type MonthType = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '전체';

interface FiledRecord {
  year: string;
  tab: ReportTab;
  period: string;
  filedDate: string;
  receiptNumber: string;
  totalSales: number;
  payableTax: number;
}

interface TaxReportsProps {
  transactions: Transaction[];
}

const TaxReports: React.FC<TaxReportsProps> = ({ transactions: allTransactions }) => {
  const [activeTab, setActiveTab] = React.useState<ReportTab>('vat');
  const [selectedYear, setSelectedYear] = React.useState('2026');
  const [selectedQuarter, setSelectedQuarter] = React.useState<QuarterType>('1분기'); 
  const [selectedMonth, setSelectedMonth] = React.useState<MonthType>('1');
  const [isExporting, setIsExporting] = React.useState<'pdf' | 'image' | null>(null);
  
  const [filedRecords, setFiledRecords] = React.useState<FiledRecord[]>([]);
  const reportRef = React.useRef<HTMLDivElement>(null);

  const years = Array.from({ length: 5 }, (_, i) => (2026 - i).toString());

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('qtex_filed_records') || '[]');
    if (saved.length === 0) {
      const mockPast: FiledRecord[] = [
        { year: '2025', tab: 'vat', period: '전체', filedDate: '2026-01-25', receiptNumber: '2025-VAT-099238', totalSales: 45000000, payableTax: 1200000 },
        { year: '2025', tab: 'income', period: '연간 전체', filedDate: '2026-05-31', receiptNumber: '2025-INC-110293', totalSales: 88000000, payableTax: 4500000 },
      ];
      setFiledRecords(mockPast);
    } else {
      setFiledRecords(saved);
    }
  }, []);

  const currentFiledRecord = React.useMemo(() => {
    const period = activeTab === 'vat' ? selectedQuarter : activeTab === 'labor' ? selectedMonth : '연간 전체';
    return filedRecords.find(r => r.year === selectedYear && r.tab === activeTab && r.period === period);
  }, [filedRecords, selectedYear, activeTab, selectedQuarter, selectedMonth]);

  const isFiled = !!currentFiledRecord;

  const handlePDFSave = async () => {
    if (!reportRef.current) return;
    setIsExporting('pdf');
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, { 
        backgroundColor: '#ffffff', 
        quality: 1,
        pixelRatio: 3 
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`qtex-report-${selectedYear}-${activeTab}-${isFiled ? 'FILED' : 'EST'}.pdf`);
    } catch (e) {
      alert('PDF 생성 실패');
    } finally {
      setIsExporting(null);
    }
  };
  
  const handleImageSave = async () => {
    if (!reportRef.current) return;
    setIsExporting('image');
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, { backgroundColor: '#ffffff', quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `qtex-report-${selectedYear}-${activeTab}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('이미지 생성 실패');
    } finally {
      setIsExporting(null);
    }
  };

  const savedLaborData = JSON.parse(localStorage.getItem('saved_labor_data') || '[]');

  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear().toString() !== selectedYear) return false;
      const month = tDate.getMonth() + 1;
      if (activeTab === 'vat') {
        if (selectedQuarter === '1분기') return month >= 1 && month <= 3;
        if (selectedQuarter === '2분기') return month >= 4 && month <= 6;
        if (selectedQuarter === '3분기') return month >= 7 && month <= 9;
        if (selectedQuarter === '4분기') return month >= 10 && month <= 12;
        return true;
      }
      return true;
    });
  }, [allTransactions, selectedYear, selectedQuarter, activeTab]);

  const vatData = React.useMemo(() => {
    const sales = filteredTransactions.filter(t => t.type === 'income');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totalSales = sales.reduce((sum, t) => sum + t.amount, 0);
    const taxableSales = Math.floor(totalSales / 1.1);
    const salesVat = totalSales - taxableSales;
    const deductibleExpenses = expenses.filter(t => t.isVatDeductible !== false);
    const totalDeductible = deductibleExpenses.reduce((sum, t) => sum + t.amount, 0);
    const purchaseNet = Math.floor(totalDeductible / 1.1);
    const purchaseVat = totalDeductible - purchaseNet;
    return { taxableSales, salesVat, purchaseNet, purchaseVat, totalPayable: Math.max(0, salesVat - purchaseVat) };
  }, [filteredTransactions]);

  const incomeTaxData = React.useMemo(() => {
    const yearTransactions = allTransactions.filter(t => new Date(t.date).getFullYear().toString() === selectedYear);
    const totalSales = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const yearLabor = savedLaborData.filter((l: any) => new Date(l.date).getFullYear().toString() === selectedYear);
    const totalLabor = yearLabor.reduce((sum: number, l: any) => sum + l.totalCost, 0);
    const profit = Math.max(0, totalSales - (totalExpense + totalLabor));
    const estimatedTax = Math.floor(calculateIncomeTax2026(profit));
    return { totalSales, totalExpense, totalLabor, profit, estimatedTax };
  }, [allTransactions, savedLaborData, selectedYear]);

  const filteredLabor = React.useMemo(() => {
    return savedLaborData.filter((l: any) => {
      const lDate = new Date(l.date);
      if (lDate.getFullYear().toString() !== selectedYear) return false;
      const month = (lDate.getMonth() + 1).toString();
      if (selectedMonth === '전체') return true;
      return month === selectedMonth;
    });
  }, [savedLaborData, selectedYear, selectedMonth]);

  const getTabLabel = () => {
    if (activeTab === 'vat') return '부가가치세';
    if (activeTab === 'income') return '종합소득세';
    return '인건비';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-1">
      <header className="flex flex-col gap-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl shadow-xl transition-colors duration-500 ${isFiled ? 'bg-slate-800 text-amber-400 shadow-slate-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>
              {isFiled ? <Award size={26} /> : <FileText size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{isFiled ? '신고 완료 내역 조회' : '세무 리포트 센터'}</h1>
                {isFiled && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Archived</span>}
              </div>
              <p className="text-slate-400 text-sm font-bold">{isFiled ? '확정된 과거 신고 데이터를 불러옵니다.' : '장부 기반 실시간 예상 분석 보고서'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePDFSave} disabled={isExporting !== null} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95 font-black text-xs disabled:opacity-50">
              {isExporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF 리포트
            </button>
            <button onClick={handleImageSave} disabled={isExporting !== null} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm active:scale-95 font-black text-xs disabled:opacity-50">
              {isExporting === 'image' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />} 이미지 저장
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex-1">
            {(['vat', 'income', 'labor'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'vat' ? '부가가치세' : tab === 'income' ? '종합소득세' : '인건비'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
             <div className="relative group"><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="pl-10 pr-8 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-black appearance-none focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer shadow-sm">{years.map(y => <option key={y} value={y}>{y}년</option>)}</select><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={14} /><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} /></div>
             {activeTab === 'vat' && (
                <div className="relative group"><select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value as any)} className="pl-10 pr-8 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-black appearance-none focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer shadow-sm">{['1분기', '2분기', '3분기', '4분기', '전체'].map(q => <option key={q} value={q}>{q}</option>)}</select><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14} /><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} /></div>
             )}
          </div>
        </div>
      </header>

      {/* A4 Container - Optimized for Mobile (Flexible width on mobile, A4 on desktop) */}
      <div className="flex justify-center bg-slate-200/20 py-2 md:py-10 rounded-[2rem] md:rounded-[3rem] no-print overflow-x-hidden">
        <div 
          ref={reportRef} 
          className={`bg-white p-5 md:p-[20mm] shadow-2xl overflow-hidden font-sans flex flex-col transition-colors duration-700 w-full md:w-[210mm] ${isFiled ? 'text-slate-900 border-t-8 md:border-t-[10mm] border-slate-900' : 'text-slate-900'}`}
          style={{ minHeight: 'auto' }}
        >
          {/* Header */}
          <div className={`border-b-2 md:border-b-4 pb-4 md:pb-6 mb-6 md:mb-10 flex justify-between items-end text-left ${isFiled ? 'border-amber-400' : 'border-slate-900'}`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-black text-xs md:text-base ${isFiled ? 'bg-amber-500' : 'bg-slate-900'}`}>Q</div>
                <span className="text-base md:text-xl font-black tracking-tighter uppercase">Q-Tex Reporting</span>
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{isFiled ? 'Official Tax Filing Record' : 'Official AI Tax Analysis Ledger'}</p>
            </div>
            <div className="text-right">
              {isFiled && <p className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase mb-0.5">Status: Filed</p>}
              <p className="text-[10px] md:text-xs font-black text-slate-800">No: {isFiled ? currentFiledRecord?.receiptNumber : `QTX-${Date.now().toString().slice(-6)}`}</p>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400">{isFiled ? '신고일' : '발행일'}: {isFiled ? currentFiledRecord?.filedDate : new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-8 md:space-y-12 flex-1">
            {/* Title Section */}
            <div className="text-center space-y-2 md:space-y-4">
              <div className="space-y-1">
                <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] ${isFiled ? 'text-amber-600' : 'text-blue-500'}`}>
                    {isFiled ? 'Tax Filing Certification' : 'Internal Tax Ledger'}
                </p>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">{selectedYear}년 {getTabLabel()} {isFiled ? '확정' : '분석'}</h2>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 md:px-5 py-1 rounded-full text-[10px] md:text-xs font-black border ${isFiled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                <Calendar size={12} /> 
                {activeTab === 'vat' ? selectedQuarter : activeTab === 'labor' ? (selectedMonth === '전체' ? '전체' : `${selectedMonth}월`) : '연간 전체'}
              </div>
            </div>

            {/* Key Metrics - Compact grid for mobile */}
            <div className="grid grid-cols-2 gap-3 md:gap-8">
              <div className={`${isFiled ? 'bg-slate-800' : 'bg-slate-900'} rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 text-white space-y-2 md:space-y-4 text-left shadow-lg`}>
                 <p className="text-slate-400 font-bold text-[9px] md:text-xs uppercase tracking-widest">
                   {isFiled ? '확정 세액' : activeTab === 'vat' ? '예상 부가세' : activeTab === 'income' ? '사업 순이익' : '총 인건비'}
                 </p>
                 <div className="flex items-baseline gap-1">
                   <span className={`text-xl md:text-5xl font-black tracking-tighter ${isFiled ? 'text-amber-400' : 'text-white'}`}>
                     {isFiled ? currentFiledRecord?.payableTax.toLocaleString() : 
                      activeTab === 'vat' ? vatData.totalPayable.toLocaleString() : 
                      activeTab === 'income' ? incomeTaxData.profit.toLocaleString() : 
                      filteredLabor.reduce((s:number, l:any)=>s+l.totalCost, 0).toLocaleString()}
                   </span>
                   <span className="text-xs md:text-xl font-bold text-slate-500">원</span>
                 </div>
              </div>
              <div className={`${isFiled ? 'bg-amber-500' : 'bg-blue-600'} rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 text-white space-y-2 md:space-y-4 text-left shadow-lg`}>
                 <p className={`${isFiled ? 'text-amber-100' : 'text-blue-100'} font-bold text-[9px] md:text-xs uppercase tracking-widest`}>
                   {isFiled ? '확정 매출' : activeTab === 'vat' ? '총 매출액' : '총 수입액'}
                 </p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl md:text-5xl font-black tracking-tighter">
                     {isFiled ? currentFiledRecord?.totalSales.toLocaleString() : 
                      activeTab === 'vat' ? (vatData.taxableSales + vatData.salesVat).toLocaleString() : incomeTaxData.totalSales.toLocaleString()}
                   </span>
                   <span className={`text-xs md:text-xl font-bold ${isFiled ? 'text-amber-200' : 'text-blue-300'}`}>원</span>
                 </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="space-y-4 md:space-y-6 text-left">
              <h3 className="text-base md:text-xl font-black text-slate-800 flex items-center gap-2 md:gap-3">
                 <div className={`w-1.5 h-5 md:w-2 md:h-7 rounded-full ${isFiled ? 'bg-amber-500' : 'bg-blue-600'}`}></div>
                 {isFiled ? '신고 확정 명세' : '항목별 데이터 요약'}
              </h3>
              <div className="border border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
                {activeTab === 'vat' && (
                  <div className="divide-y divide-slate-100">
                     <SummaryRow label="과세 매출액" value={vatData.taxableSales} />
                     <SummaryRow label="매출 세액" value={vatData.salesVat} isVat />
                     <SummaryRow label="과세 매입액" value={vatData.purchaseNet} />
                     <SummaryRow label="매입 세액" value={vatData.purchaseVat} isVat />
                     <div className={`${isFiled ? 'bg-amber-50' : 'bg-blue-50'} p-5 md:p-8 flex justify-between items-center`}>
                        <span className={`text-sm md:text-lg font-black ${isFiled ? 'text-amber-900' : 'text-blue-900'}`}>{isFiled ? '확정 납부액' : '최종 납부액'}</span>
                        <span className={`text-xl md:text-3xl font-black ${isFiled ? 'text-slate-900' : 'text-blue-600'}`}>{vatData.totalPayable.toLocaleString()} 원</span>
                     </div>
                  </div>
                )}
                {activeTab === 'income' && (
                  <div className="divide-y divide-slate-100">
                     <SummaryRow label="총 수입 (매출)" value={incomeTaxData.totalSales} />
                     <SummaryRow label="필요 경비 (지출)" value={incomeTaxData.totalExpense} />
                     <SummaryRow label="인건비 지출" value={incomeTaxData.totalLabor} />
                     <div className={`${isFiled ? 'bg-amber-50' : 'bg-indigo-50'} p-5 md:p-8 flex justify-between items-center`}>
                        <span className={`text-sm md:text-lg font-black ${isFiled ? 'text-amber-900' : 'text-indigo-900'}`}>당기 순이익</span>
                        <span className={`text-xl md:text-3xl font-black ${isFiled ? 'text-slate-900' : 'text-indigo-600'}`}>{incomeTaxData.profit.toLocaleString()} 원</span>
                     </div>
                  </div>
                )}
                {activeTab === 'labor' && (
                  <div className="divide-y divide-slate-100">
                     <SummaryRow label="급여 지급액" value={filteredLabor.reduce((s:number, l:any)=>s+l.baseSalary, 0)} />
                     <SummaryRow label="사업주 보험료" value={filteredLabor.reduce((s:number, l:any)=>s+l.employerExtra, 0)} />
                     <SummaryRow label="원천징수 세액" value={Math.floor(filteredLabor.reduce((s:number, l:any)=>s+l.incomeTax, 0) * 1.1)} isVat />
                     <div className={`${isFiled ? 'bg-amber-50' : 'bg-emerald-50'} p-5 md:p-8 flex justify-between items-center`}>
                        <span className={`text-sm md:text-lg font-black ${isFiled ? 'text-amber-900' : 'text-emerald-900'}`}>인건비 합계</span>
                        <span className={`text-xl md:text-3xl font-black ${isFiled ? 'text-slate-900' : 'text-emerald-600'}`}>{filteredLabor.reduce((s:number, l:any)=>s+l.totalCost, 0).toLocaleString()} 원</span>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Seal - Compact for mobile */}
          <div className="mt-8 md:mt-auto pt-6 md:pt-10 border-t border-slate-100 flex justify-between items-center text-left">
             <div className="space-y-0.5">
               <p className="text-[8px] md:text-[10px] font-black text-slate-400">Q-Tex Digital Ledger Copy</p>
               <p className="text-[7px] md:text-[10px] font-bold text-slate-300 tracking-tight">Certified Ledger - 2026 All Rights Reserved.</p>
             </div>
             <div className="relative">
                {isFiled ? (
                  <div className="w-16 h-16 md:w-24 md:h-24 border-2 md:border-4 border-amber-400 rounded-full flex flex-col items-center justify-center text-amber-500 font-black text-[8px] md:text-[10px] rotate-12 opacity-60 bg-amber-50 shadow-inner">
                    <Check size={16} className="md:w-5 md:h-5" strokeWidth={4} />
                    <span className="mt-0.5 tracking-widest uppercase">FILED</span>
                  </div>
                ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 border border-red-400 rounded-full flex items-center justify-center text-red-500 font-black text-[8px] md:text-[10px] rotate-12 opacity-40">
                     Q-TEX
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-start gap-3 md:gap-4 no-print text-left border ${isFiled ? 'bg-slate-100 border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
         <Info className="text-slate-400 shrink-0 mt-1" size={16} />
         <div className="space-y-1">
           <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">
             {isFiled 
               ? `이 리포트는 ${currentFiledRecord?.filedDate} 신고된 자료를 바탕으로 합니다.` 
               : `이 수치는 장부 데이터를 기반으로 산출된 '예상' 리포트입니다.`}
           </p>
         </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value, isVat = false, unit = "원" }: any) => (
  <div className="flex justify-between items-center p-4 md:p-6 hover:bg-slate-50 transition-colors">
    <span className={`text-[11px] md:text-sm font-bold text-slate-500 ${isVat ? 'pl-4 md:pl-6 relative before:content-["-"] before:absolute before:left-2 before:text-slate-300' : ''}`}>
      {label}
    </span>
    <div className="flex items-baseline gap-0.5 md:gap-1">
      <span className="text-xs md:text-base font-black text-slate-800">{Math.floor(value).toLocaleString()}</span>
      <span className="text-[8px] md:text-[10px] font-bold text-slate-400">{unit}</span>
    </div>
  </div>
);

export default TaxReports;

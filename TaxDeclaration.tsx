
import React from 'react';
import { ClipboardCheck, FileText, X, Receipt, Landmark, Users, ArrowUpRight, Loader2, FileDown, Sparkles, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ViewState, Transaction } from '../types';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface TaxDeclarationProps {
  onNavigate: (view: ViewState) => void;
  transactions: Transaction[];
}

type DeclarationType = 'vat' | 'income' | 'labor' | null;

const TaxDeclaration: React.FC<TaxDeclarationProps> = ({ onNavigate, transactions }) => {
  const [showFullForm, setShowFullForm] = React.useState(false);
  const [activeFormType, setActiveFormType] = React.useState<DeclarationType>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const formRef = React.useRef<HTMLDivElement>(null);

  // 화면 크기 리사이즈 감지
  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 데이터 계산 로직 ---
  const calculatedData = React.useMemo(() => {
    const savedLabor = JSON.parse(localStorage.getItem('saved_labor_data') || '[]');
    const totalLaborCost = savedLabor.reduce((sum: number, l: any) => sum + Math.floor(l.totalCost), 0);
    const totalLaborBase = savedLabor.reduce((sum: number, l: any) => sum + Math.floor(l.baseSalary), 0);
    const totalLaborTax = savedLabor.reduce((sum: number, l: any) => sum + Math.floor(l.incomeTax * 1.1), 0);

    const incomeTxs = transactions.filter(t => t.type === 'income');
    const totalSalesGross = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    const salesNet = Math.floor(totalSalesGross / 1.1);
    const salesVat = totalSalesGross - salesNet;

    const deductibleTxs = transactions.filter(t => 
      t.type === 'expense' && 
      ['카드', '세금계산서', '현금'].includes(t.subCategory) && 
      t.isVatDeductible === true
    );
    const totalDeductibleGross = deductibleTxs.reduce((sum, t) => sum + t.amount, 0);
    const purchaseDeductibleVat = totalDeductibleGross - Math.floor(totalDeductibleGross / 1.1);

    const exemptTxs = transactions.filter(t => t.type === 'expense' && t.subCategory === '계산서');
    const totalExemptAmt = exemptTxs.reduce((sum, t) => sum + t.amount, 0);
    const deemedInputTax = Math.floor(totalExemptAmt * (9 / 109));

    const totalExpenseOnly = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalBusinessExpense = totalExpenseOnly + totalLaborCost;
    const businessProfit = Math.max(0, totalSalesGross - totalBusinessExpense);

    return {
      salesNet,
      salesVat,
      purchaseDeductibleVat,
      totalExemptAmt,
      deemedInputTax,
      vatPayable: Math.max(0, salesVat - purchaseDeductibleVat - deemedInputTax),
      totalSalesGross,
      totalBusinessExpense,
      businessProfit,
      laborCount: savedLabor.length,
      totalLaborBase,
      totalLaborTax
    };
  }, [transactions]);

  const handleOpenForm = (type: 'vat' | 'income' | 'labor') => {
    setActiveFormType(type);
    setShowFullForm(true);
  };

  const getFormTitle = () => {
    if (activeFormType === 'vat') return '부가가치세 신고서';
    if (activeFormType === 'income') return '종합소득세 신고서';
    if (activeFormType === 'labor') return '원천징수이행상황신고서';
    return '';
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current) return;
    setIsExporting(true);
    try {
      // PDF 저장 시에는 원본 비율로 생성되도록 임시로 스케일 초기화 느낌의 처리가 필요하지만
      // htmlToImage는 현재 렌더링된 모습대로 찍으므로, 스케일이 적용된 상태면 작게 나옵니다.
      // 여기서는 픽셀 비율을 높여 고해상도로 캡처합니다.
      const dataUrl = await htmlToImage.toPng(formRef.current, { 
        backgroundColor: '#ffffff', 
        quality: 1,
        pixelRatio: 3
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(`qtex-${activeFormType}-report.pdf`);
    } catch (err) {
      alert('PDF 생성 실패');
    } finally {
      setIsExporting(false);
    }
  };

  // 스케일 계산 (A4 너비 210mm ~ 794px 기준)
  const a4Width = 794;
  const a4Height = 1123;
  
  // 패딩 및 여백 고려
  const availableWidth = windowSize.width * 0.95;
  const availableHeight = windowSize.height - 200; // 헤더, 푸터 여백

  const scaleW = availableWidth / a4Width;
  const scaleH = availableHeight / a4Height;
  // 너비와 높이 중 더 좁은 쪽의 스케일을 선택하여 화면에 다 들어오게 함
  const finalScale = Math.min(scaleW, scaleH, 1.0); // 최대 1배율

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 no-print font-sans px-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-50">
            <ClipboardCheck size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">세금신고 센터</h1>
            <p className="text-slate-400 text-sm font-bold">국세청 법정 서식 기반 지능형 PDF 신고서 생성</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DeclarationButton 
          title="부가가치세 신고서"
          desc="매출/매입 세액 확정 및 공제"
          icon={<Receipt size={32} />}
          color="blue"
          onClick={() => handleOpenForm('vat')}
        />
        <DeclarationButton 
          title="종합소득세 신고서"
          desc="연간 사업 소득 및 경비 확정"
          icon={<Landmark size={32} />}
          color="emerald"
          onClick={() => handleOpenForm('income')}
        />
        <DeclarationButton 
          title="인건비 신고서"
          desc="원천징수이행상황 및 지급 명세"
          icon={<Users size={32} />}
          color="indigo"
          onClick={() => handleOpenForm('labor')}
        />
      </section>

      {showFullForm && (
        <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 overflow-hidden animate-in fade-in duration-300">
          <div className="bg-[#323639] w-full h-full lg:max-w-[1200px] lg:h-[95vh] lg:rounded-[2rem] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-500">
            
            <div className="px-6 py-4 flex items-center justify-between no-print shrink-0 text-white border-b border-white/5 bg-[#202124]">
               <div className="flex items-center gap-4">
                 <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center shadow-lg"><FileText size={16} /></div>
                 <h2 className="text-sm font-black tracking-tight">{getFormTitle()}</h2>
               </div>
               <button onClick={() => setShowFullForm(false)} className="p-2 text-slate-400 hover:text-white transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#525659] flex flex-col items-center custom-scrollbar">
              {/* 스케일링 컨테이너 */}
              <div 
                style={{ 
                  transform: `scale(${finalScale})`, 
                  transformOrigin: 'top center',
                  width: `${a4Width}px`,
                  height: `${a4Height}px`,
                  minHeight: `${a4Height}px`,
                  marginBottom: `calc(${a4Height}px * (1 - ${finalScale}) * -1 + 20px)` 
                }}
                className="transition-transform duration-300 shadow-2xl"
              >
                <div ref={formRef} className="bg-white p-[15mm] w-[210mm] h-[297mm] font-serif leading-tight text-slate-900 relative overflow-hidden text-left origin-top">
                   <div className="flex justify-between items-start mb-6 border-b border-black pb-2">
                      <div className="text-[9pt] font-sans font-bold">[별지 제21호서식] (2026. 1. 1. 개정)</div>
                      <div className="text-[9pt] font-sans text-right">Q-Tex Digital Reporting Engine</div>
                   </div>
                   
                   <div className="text-center mb-10">
                      <h1 className="text-[26pt] font-black tracking-[0.5em] underline underline-offset-8 decoration-2">{getFormTitle()}</h1>
                      <p className="text-[10pt] font-sans mt-4 text-slate-500">(2026년 귀속분)</p>
                   </div>

                   <section className="mb-8">
                      <h2 className="text-[11pt] font-bold mb-2 flex items-center gap-2"><div className="w-1 h-4 bg-black"></div> 1. 인적 사항</h2>
                      <table className="w-full border-collapse border-[1pt] border-black text-[10pt]">
                          <tbody>
                              <tr className="h-12">
                                <td className="bg-slate-50 border-[0.5pt] border-black w-32 text-center font-bold">성 명 (대표자)</td>
                                <td className="border-[0.5pt] border-black px-4">김택스</td>
                                <td className="bg-slate-50 border-[0.5pt] border-black w-32 text-center font-bold">사업자등록번호</td>
                                <td className="border-[0.5pt] border-black px-4 font-mono tracking-wider">123-45-67890</td>
                              </tr>
                              <tr className="h-12">
                                <td className="bg-slate-50 border-[0.5pt] border-black text-center font-bold">주 소</td>
                                <td colSpan={3} className="border-[0.5pt] border-black px-4">서울특별시 강남구 테헤란로 123, Q-Tex 타워 15층</td>
                              </tr>
                          </tbody>
                      </table>
                   </section>

                   <section className="mb-12">
                      <h2 className="text-[11pt] font-bold mb-2 flex items-center gap-2"><div className="w-1 h-4 bg-black"></div> 2. 신고 내용 요약</h2>
                      <table className="w-full border-collapse border-[1pt] border-black text-[10pt] text-center">
                          <thead className="bg-slate-50">
                              <tr className="h-10">
                                  <th className="border-[0.5pt] border-black font-bold">항목명</th>
                                  <th className="border-[0.5pt] border-black font-bold">금액 (단위: 원)</th>
                                  <th className="border-[0.5pt] border-black font-bold">비고</th>
                              </tr>
                          </thead>
                          <tbody>
                              {activeFormType === 'vat' && (
                                <>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">과세 매출액 (공급가액)</td><td className="border-[0.5pt] border-black text-right px-4">{calculatedData.salesNet.toLocaleString()}</td><td className="border-[0.5pt] border-black text-[8pt]">매출합계 / 1.1</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">매출 세액</td><td className="border-[0.5pt] border-black text-right px-4 text-blue-600 font-bold">{calculatedData.salesVat.toLocaleString()}</td><td className="border-[0.5pt] border-black">10%</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">매입 세액 (공제대상)</td><td className="border-[0.5pt] border-black text-right px-4 text-red-600 font-bold">{calculatedData.purchaseDeductibleVat.toLocaleString()}</td><td className="border-[0.5pt] border-black text-[8pt]">카드/현영/세금계산서</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">의제매입세액 공제</td><td className="border-[0.5pt] border-black text-right px-4 text-emerald-600 font-bold">{calculatedData.deemedInputTax.toLocaleString()}</td><td className="border-[0.5pt] border-black text-[8pt]">면세(계산서) 9/109</td></tr>
                                  <tr className="h-10 bg-slate-50"><td className="border-[0.5pt] border-black font-bold text-slate-400">면세 수입 금액</td><td className="border-[0.5pt] border-black text-right px-4 text-slate-400">{calculatedData.totalExemptAmt.toLocaleString()}</td><td className="border-[0.5pt] border-black text-[8pt]">계산서 수취분</td></tr>
                                </>
                              )}
                              {activeFormType === 'income' && (
                                <>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">총 수입 금액 (매출)</td><td className="border-[0.5pt] border-black text-right px-4">{calculatedData.totalSalesGross.toLocaleString()}</td><td className="border-[0.5pt] border-black">전체 매출액</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">필요 경비 합계</td><td className="border-[0.5pt] border-black text-right px-4">{calculatedData.totalBusinessExpense.toLocaleString()}</td><td className="border-[0.5pt] border-black text-[8pt]">지출 + 인건비</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">당기 사업 소득 금액</td><td className="border-[0.5pt] border-black text-right px-4 font-bold">{calculatedData.businessProfit.toLocaleString()}</td><td className="border-[0.5pt] border-black">결산 이익</td></tr>
                                </>
                              )}
                              {activeFormType === 'labor' && (
                                <>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">총 고용 인원</td><td className="border-[0.5pt] border-black text-right px-4">{calculatedData.laborCount} 명</td><td className="border-[0.5pt] border-black">지급 대상자수</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">총 지급 급여액 (세전)</td><td className="border-[0.5pt] border-black text-right px-4">{calculatedData.totalLaborBase.toLocaleString()}</td><td className="border-[0.5pt] border-black">기본급 합계</td></tr>
                                  <tr className="h-10"><td className="border-[0.5pt] border-black bg-slate-50 font-bold">원천징수 세액</td><td className="border-[0.5pt] border-black text-right px-4 font-bold text-blue-600">{calculatedData.totalLaborTax.toLocaleString()}</td><td className="border-[0.5pt] border-black">소득세+지방세</td></tr>
                                </>
                              )}
                          </tbody>
                          <tfoot>
                            <tr className="h-14 bg-slate-100">
                               <td className="border-[0.5pt] border-black font-black text-[12pt]">
                                  {activeFormType === 'vat' ? '최종 납부 세액' : activeFormType === 'income' ? '과세대상 소득금액' : '총 납부할 원천세'}
                               </td>
                               <td colSpan={2} className="border-[0.5pt] border-black text-right px-6 text-[16pt] font-black tracking-tight">
                                  {activeFormType === 'vat' ? calculatedData.vatPayable.toLocaleString() : activeFormType === 'income' ? calculatedData.businessProfit.toLocaleString() : calculatedData.totalLaborTax.toLocaleString()} 원
                               </td>
                            </tr>
                          </tfoot>
                      </table>
                   </section>

                   <div className="border-[1pt] border-black p-10 text-center space-y-12">
                      <p className="text-[12pt] font-bold leading-relaxed">
                         본 신고서는 장부 데이터 및 인건비 지급 정보를 기반으로<br/>작성되었으며, 위의 내용이 사실과 다름없음을 확인합니다.
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[14pt] font-bold tracking-widest">2026 년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일</p>
                        <div className="flex justify-center items-center gap-12 mt-8 text-[18pt] font-black relative">
                           신고인 (성명) :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;김 택 스&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(서명 또는 인)
                           <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-20 h-20 border-[1.5pt] border-red-500 rounded-full flex items-center justify-center text-red-500 text-[11pt] font-black rotate-12 opacity-60">Q-TEX<br/>REPORT</div>
                        </div>
                      </div>
                      <div className="text-[24pt] font-black tracking-[1em] pt-10">세무서장 귀하</div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#202124] no-print shrink-0 lg:rounded-b-[2rem] flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400"><AlertCircle size={20} /></div>
                 <p className="text-[11px] text-slate-400 leading-relaxed">본 문서는 AI 분석 기반으로 자동 생성되었습니다.<br/>최종 신고 전 반드시 **데이터의 정합성을 재검토**하시기 바랍니다.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowFullForm(false)} className="px-8 py-4 bg-white/10 text-slate-300 rounded-2xl font-black text-sm hover:bg-white/20 transition-all">닫기</button>
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isExporting}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />} 
                  {isExporting ? '생성 중...' : 'PDF 다운로드'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface DeclarationButtonProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'indigo';
  onClick: () => void;
}

const DeclarationButton: React.FC<DeclarationButtonProps> = ({ title, desc, icon, color, onClick }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700', text: 'text-blue-600', border: 'border-blue-100', shadow: 'hover:shadow-blue-200/50' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700', text: 'text-emerald-600', border: 'border-emerald-100', shadow: 'hover:shadow-emerald-200/50' },
    indigo: { bg: 'bg-indigo-50', iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', text: 'text-indigo-600', border: 'border-indigo-100', shadow: 'hover:shadow-indigo-200/50' }
  };
  const style = colorMap[color];
  return (
    <button onClick={onClick} className={`relative group flex flex-col items-center text-center p-10 bg-white rounded-[3.5rem] border-b-8 border-slate-100 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-2 active:translate-y-1 active:border-b-2 transition-all duration-300 ease-out`}>
      <div className={`w-20 h-20 ${style.iconBg} text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
      <div className="space-y-2"><h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3><p className="text-xs text-slate-400 font-bold leading-relaxed">{desc}</p></div>
      <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2 group-hover:bg-white group-hover:border-blue-200 transition-all"><span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">신고서 작성</span><ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-all" /></div>
    </button>
  );
};

export default TaxDeclaration;

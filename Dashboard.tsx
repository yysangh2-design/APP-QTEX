
import React from 'react';
import { TrendingUp, TrendingDown, Sparkles, Bell as BellIcon, CarFront, Users, FileSignature, FileBox, ArrowUpRight, Target, Edit3, Check, X, FileText, ArrowRight, Megaphone, ChevronRight, Pin, Calendar } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { ViewState, Transaction } from '../types';

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

// 다음 주요 세무 신고 D-Day 계산기
const calculateTaxDDay = () => {
  const now = new Date();
  const year = now.getFullYear();
  
  // 주요 신고 마감일 (1월 25일 부가세, 5월 31일 종소세, 7월 25일 부가세)
  const deadlines = [
    new Date(year, 0, 25),  // 1월 25일
    new Date(year, 4, 31),  // 5월 31일
    new Date(year, 6, 25),  // 7월 25일
    new Date(year + 1, 0, 25) // 내년 1월 25일
  ];

  const nextDeadline = deadlines.find(d => d > now) || deadlines[0];
  const diffTime = nextDeadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `D-${diffDays}`;
};

const monthlyChartData = [
  { name: '10월', value: 850000 },
  { name: '11월', value: 1250000 },
  { name: '12월', value: 980000 },
  { name: '1월', value: 2100000 },
];

const RECENT_NOTICES = [
  { id: 1, title: '2026년 1월 부가가치세 확정신고 안내', date: '2026-01-05', category: '세무소식', important: true },
  { id: 2, title: 'Q-Tex 지능형 AI 분석 모델 업데이트 (v3.0)', date: '2025-12-28', category: '업데이트', important: false },
];

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  transactions: Transaction[];
  userName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, transactions, userName }) => {
  const [taxView, setTaxView] = React.useState<'total' | 'income' | 'vat'>('total');
  const [isEditingTarget, setIsEditingTarget] = React.useState(false);
  const [targetRevenue, setTargetRevenue] = React.useState(() => {
    const saved = localStorage.getItem('qtex_target_revenue');
    return saved ? parseInt(saved) : 10000000;
  });
  const [tempTarget, setTempTarget] = React.useState(targetRevenue.toString());

  // 인건비 데이터 로드
  const savedLabor = JSON.parse(localStorage.getItem('saved_labor_data') || '[]');
  const totalLaborCost = savedLabor.reduce((sum: number, l: any) => sum + Math.floor(l.totalCost), 0);

  // 매출 및 매입 요약
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.floor(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.floor(t.amount), 0);
  
  // 1. 부가가치세 정밀 계산 (원단위 절삭)
  const salesVat = Math.floor((totalIncome / 1.1) * 0.1);
  const deductibleExpenseAmt = transactions
    .filter(t => t.type === 'expense' && t.isVatDeductible !== false)
    .reduce((sum, t) => sum + Math.floor(t.amount), 0);
  const purchaseVat = Math.floor((deductibleExpenseAmt / 1.1) * 0.1);
  const estimatedVat = Math.max(0, salesVat - purchaseVat);

  // 2. 종합소득세 정밀 계산 (2026년 누진세율 적용)
  const incomeNet = Math.floor(totalIncome / 1.1);
  const expenseNet = Math.floor(totalExpense / 1.1);
  const businessProfit = Math.max(0, incomeNet - expenseNet - totalLaborCost);
  const estimatedIncomeTax = Math.floor(calculateIncomeTax2026(businessProfit));

  const totalEstimatedTax = estimatedVat + estimatedIncomeTax;

  const displayAmount = taxView === 'total' ? totalEstimatedTax : taxView === 'income' ? estimatedIncomeTax : estimatedVat;
  const displayLabel = taxView === 'total' ? '현재 예상 세액' : taxView === 'income' ? '예상 종소세' : '예상 부가세';

  const achievementRate = Math.min(Math.floor((totalIncome / targetRevenue) * 100), 120);
  const realRate = ((totalIncome / targetRevenue) * 100).toFixed(1);

  const handleSaveTarget = () => {
    const newTarget = parseInt(tempTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      setTargetRevenue(newTarget);
      localStorage.setItem('qtex_target_revenue', newTarget.toString());
      setIsEditingTarget(false);
    }
  };

  const stats = [
    { label: '총 수입', value: `${Math.floor(totalIncome/10000).toLocaleString()}만`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '총 지출', value: `${Math.floor((totalExpense + totalLaborCost)/10000).toLocaleString()}만`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '경비율', value: totalIncome > 0 ? `${(( (totalExpense + totalLaborCost) / totalIncome) * 100).toFixed(0)}%` : '0%', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '신고', value: calculateTaxDDay(), icon: BellIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-10 px-1 no-print text-left">
      <section>
        <h1 className="text-xl lg:text-3xl font-black text-slate-800 mb-1">
          {userName.replace('사장님', '') || '사장'}대표님
        </h1>
        <p className="text-slate-400 font-bold text-xs">스마트한 절세 파트너 Q-Tex입니다.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 리뉴얼된 입체감 있는 메인 카드 */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] border-t border-white/30 relative overflow-hidden transition-all duration-500 hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)]">
          {/* 장식용 유리 질감 아이콘 */}
          <div className="absolute -top-10 -right-10 p-10 opacity-[0.1] rotate-12 transition-transform duration-1000 hover:rotate-45">
            <Sparkles size={200} />
          </div>
          
          <div className="relative z-10 space-y-10">
            <div className="space-y-1">
              <p className="text-blue-100 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.2em] mb-2 opacity-90 drop-shadow-sm">{displayLabel}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl lg:text-7xl font-black tracking-tighter drop-shadow-md">{Math.floor(displayAmount).toLocaleString()}</span>
                <span className="text-xl font-bold opacity-70">원</span>
              </div>
            </div>

            {/* 입체적(3D) 버튼 디자인 */}
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setTaxView('income')} 
                className={`
                  relative px-2 py-4 rounded-[1.2rem] text-[11px] lg:text-[14px] font-black transition-all duration-150
                  ${taxView === 'income' 
                    ? 'bg-white text-blue-700 shadow-[0_5px_0_#d1d5db] translate-y-[-5px] active:translate-y-[0px] active:shadow-none' 
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:translate-y-[2px]'}
                `}
              >
                종소세
              </button>
              <button 
                onClick={() => setTaxView('vat')} 
                className={`
                  relative px-2 py-4 rounded-[1.2rem] text-[11px] lg:text-[14px] font-black transition-all duration-150
                  ${taxView === 'vat' 
                    ? 'bg-white text-blue-700 shadow-[0_5px_0_#d1d5db] translate-y-[-5px] active:translate-y-[0px] active:shadow-none' 
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:translate-y-[2px]'}
                `}
              >
                부가세
              </button>
              <button 
                onClick={() => onNavigate('ai-consultation')} 
                className="
                  relative px-2 py-4 rounded-[1.2rem] text-[11px] lg:text-[14px] font-black 
                  bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950
                  shadow-[0_5px_0_#b45309] translate-y-[-5px]
                  hover:from-amber-200 hover:to-amber-400
                  active:translate-y-[0px] active:shadow-none
                  transition-all duration-150
                "
              >
                AI 상담
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hidden md:flex flex-col justify-between">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-blue-500" /> 월별 세액 추이
            </h3>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {monthlyChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === monthlyChartData.length - 1 ? '#2563eb' : '#e2e8f0'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>

      <section className="bg-white rounded-[2.5rem] p-5 lg:p-7 border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm lg:text-base font-black text-slate-800 flex items-center gap-2">
            <Target size={18} className="text-blue-600" /> 매출 달성 현황
          </h3>
          {isEditingTarget ? (
            <div className="flex items-center gap-1.5 scale-90 origin-right">
              <input 
                type="number" 
                value={tempTarget} 
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-blue-200 rounded-lg text-xs font-black text-blue-600 outline-none"
              />
              <button onClick={handleSaveTarget} className="p-1.5 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
              <button onClick={() => {setIsEditingTarget(false); setTempTarget(targetRevenue.toString());}} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><X size={14} /></button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingTarget(true)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all"
            >
              목표 수정
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-8">
          <div className="flex flex-col items-center shrink-0">
            <div className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
              {achievementRate >= 100 ? "CLEAR" : `${realRate}%`}
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">현재</span>
                <span className="text-sm font-black text-slate-800">{Math.floor(totalIncome).toLocaleString()}원</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">목표</span>
                <span className="text-sm font-black text-slate-400">{Math.floor(targetRevenue).toLocaleString()}원</span>
              </div>
            </div>
            
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2 ${
                  achievementRate >= 100 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-blue-500 to-blue-700'
                }`}
                style={{ width: `${achievementRate}%` }}
              />
            </div>
            
            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1.5 px-1">
              <span className="animate-pulse">✨</span>
              {achievementRate >= 100 
                ? "목표 조기 달성! 대단합니다 🥳" 
                : `달성까지 ${Math.floor(targetRevenue - totalIncome).toLocaleString()}원 남았습니다.`}
            </p>
          </div>
        </div>
      </section>

      {/* 요약 카드 영역 */}
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 lg:p-5 rounded-[2.2rem] border border-slate-100/60 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
            <div className={`${stat.bg} w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center mb-1 shadow-inner`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            
            <div className="text-center space-y-0.5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                {stat.label}
              </p>
              <p className="text-[14px] lg:text-[15px] font-black text-slate-900 tracking-tighter">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-black text-slate-800 mb-4 px-1 text-left">자주 찾는 메뉴</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureItem icon={<FileBox className="text-blue-600" />} title="서류 발급" onClick={() => onNavigate('doc-issuance')} />
          <FeatureItem icon={<CarFront className="text-amber-500" />} title="운행일지" onClick={() => onNavigate('driving-log')} />
          <FeatureItem icon={<Users className="text-purple-500" />} title="인건비 계산" onClick={() => onNavigate('labor-cost')} />
          <FeatureItem icon={<FileSignature className="text-rose-500" />} title="근로계약서" onClick={() => onNavigate('labor-contract')} />
        </div>
      </section>

      {/* 공지사항 섹션 */}
      <section className="space-y-4 px-1 text-left">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Megaphone size={18} className="text-blue-600" /> 최근 공지사항
          </h2>
          <button 
            onClick={() => onNavigate('notices')}
            className="text-[11px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            전체보기 <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          {RECENT_NOTICES.map((notice) => (
            <button
              key={notice.id}
              onClick={() => onNavigate('notices')}
              className="w-full text-left p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notice.important ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                   {notice.important ? <Pin size={18} /> : <FileText size={18} />}
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${notice.category === '세무소식' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {notice.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{notice.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300 ml-14 sm:ml-0">
                <Calendar size={12} />
                <span className="text-[10px] font-bold">{notice.date}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const FeatureItem = ({ icon, title, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{icon}</div>
    <span className="text-xs font-black text-slate-700">{title}</span>
  </button>
);

export default Dashboard;

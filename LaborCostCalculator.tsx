
import React from 'react';
import { Users, Info, TrendingUp, Wallet, Landmark, Clock, CalendarDays, Coins, UserCircle, Save, CheckCircle2, ChevronRight, Calendar, FileSignature, X, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

interface WeekWork {
  days: number;
  hours: number;
}

interface LaborCostCalculatorProps {
  onAddTransaction?: (newTransaction: Transaction) => void;
}

const LaborCostCalculator: React.FC<LaborCostCalculatorProps> = ({ onAddTransaction }) => {
  const [type, setType] = React.useState<'regular' | 'freelancer' | 'parttime'>('regular');
  
  // Personnel Info
  const [name, setName] = React.useState('');
  // 주민번호 분리 상태 관리
  const [resIdFront, setResIdFront] = React.useState('');
  const [resIdBack, setResIdBack] = React.useState('');
  
  // Refs for auto focus
  const resIdFrontRef = React.useRef<HTMLInputElement>(null);
  const resIdBackRef = React.useRef<HTMLInputElement>(null);

  // States for general salary
  const [salary, setSalary] = React.useState<number>(3000000);
  
  // States for part-time (Alba) - 5 weeks data
  // 2026년 예상 최저시급 10,320원 기준
  const [hourlyWage, setHourlyWage] = React.useState<number>(10320); 
  const [weeklyWork, setWeeklyWork] = React.useState<WeekWork[]>(
    Array(5).fill(null).map(() => ({ days: 5, hours: 8 }))
  );

  const [isSaved, setIsSaved] = React.useState(false);

  // Contract Load Modal State
  const [isContractModalOpen, setIsContractModalOpen] = React.useState(false);
  const [availableContracts, setAvailableContracts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isContractModalOpen) {
        const saved = JSON.parse(localStorage.getItem('qtex_contracts') || '[]');
        setAvailableContracts(saved);
    }
  }, [isContractModalOpen]);

  const updateWeeklyWork = (index: number, field: keyof WeekWork, value: number) => {
    const newWork = [...weeklyWork];
    newWork[index] = { ...newWork[index], [field]: value };
    setWeeklyWork(newWork);
  };

  const handleLoadContract = (contract: any) => {
    // 1. 성명 로드
    setName(contract.employeeName || '');
    
    // 2. 주민번호 로드 및 분리
    if (contract.residentIdFront && contract.residentIdBack) {
        setResIdFront(contract.residentIdFront);
        setResIdBack(contract.residentIdBack);
    } else if (contract.residentId && contract.residentId.includes('-')) {
        const parts = contract.residentId.split('-');
        setResIdFront(parts[0] || '');
        setResIdBack(parts[1] || '');
    } else if (contract.residentId && contract.residentId.length === 13) {
        setResIdFront(contract.residentId.slice(0, 6));
        setResIdBack(contract.residentId.slice(6));
    }
    
    // 3. 계약 형태 매핑 및 급여 로드
    const amt = Number(contract.salaryAmount) || 0;

    if (contract.laborType === '단시간' || contract.salaryType === '시급') {
        setType('parttime');
        setHourlyWage(amt);
    } else if (contract.laborType === '프리랜서') {
        setType('freelancer');
        setSalary(amt);
    } else {
        setType('regular');
        setSalary(amt);
    }

    setIsContractModalOpen(false);
    alert(`${contract.employeeName}님의 계약 데이터를 불러왔습니다. ${contract.salaryType === '시급' ? '시급제(알바) 모드로 전환되었습니다.' : ''}`);
  };

  const calculateResult = () => {
    let currentSalary = Math.floor(salary);
    let totalHolidayAllowance = 0;
    let totalBaseWage = 0;
    let totalHours = 0;
    let weeklyBreakdown: any[] = [];

    if (type === 'parttime') {
      weeklyWork.forEach((week, idx) => {
        const weeklyHours = week.days * week.hours;
        const baseWage = weeklyHours * hourlyWage;
        
        let holidayAllowance = 0;
        // 주 15시간 이상 근무 시 주휴수당 발생
        if (weeklyHours >= 15) {
          const ratio = Math.min(weeklyHours, 40) / 40;
          holidayAllowance = Math.floor(ratio * 8 * hourlyWage);
        }
        
        totalBaseWage += baseWage;
        totalHolidayAllowance += holidayAllowance;
        totalHours += weeklyHours;
        
        weeklyBreakdown.push({
          week: idx + 1,
          hours: weeklyHours,
          base: baseWage,
          holiday: holidayAllowance,
          isEligible: weeklyHours >= 15
        });
      });
      currentSalary = Math.floor(totalBaseWage + totalHolidayAllowance);
    }

    if (type === 'freelancer') {
      const nationalTax = Math.floor(currentSalary * 0.03); 
      const localTax = Math.floor(nationalTax * 0.1); 
      
      return {
        baseSalary: currentSalary,
        takeHome: currentSalary - (nationalTax + localTax),
        totalCost: currentSalary,
        incomeTax: nationalTax,
        breakdown: [
          { label: '사업소득세 (3%)', value: nationalTax },
          { label: '지방소득세 (0.3%)', value: localTax },
        ],
        employerExtra: 0,
        holidayAllowance: 0,
        totalHours: 0,
        weeklyBreakdown: []
      };
    }

    if (type === 'parttime') {
      const empInsurance = Math.floor(currentSalary * 0.009);
      const employerEmpIns = Math.floor(currentSalary * 0.0115);
      const employerAccidentIns = Math.floor(currentSalary * 0.01);
      
      return {
        baseSalary: currentSalary,
        takeHome: currentSalary - empInsurance,
        totalCost: currentSalary + employerEmpIns + employerAccidentIns,
        incomeTax: 0,
        breakdown: [
          { label: '기본급 총액', value: Math.floor(totalBaseWage) },
          { label: '주휴수당 총액', value: Math.floor(totalHolidayAllowance) },
          { label: '고용보험 공제 (0.9%)', value: empInsurance },
        ],
        employerExtra: employerEmpIns + employerAccidentIns,
        holidayAllowance: Math.floor(totalHolidayAllowance),
        totalHours: totalHours,
        weeklyBreakdown: weeklyBreakdown
      };
    }

    // 정규직 계산
    const pension = Math.floor(currentSalary * 0.045);
    const health = Math.floor(currentSalary * 0.03545);
    const longTermCare = Math.floor(health * 0.1295 / 2);
    const employment = Math.floor(currentSalary * 0.009);
    const incomeTax = Math.floor(currentSalary * 0.03); 

    const totalDeduction = pension + health + longTermCare + employment + incomeTax;
    const employerContribution = pension + health + longTermCare + Math.floor(currentSalary * 0.0115) + Math.floor(currentSalary * 0.01);

    return {
      baseSalary: currentSalary,
      takeHome: currentSalary - totalDeduction,
      totalCost: currentSalary + employerContribution,
      incomeTax: incomeTax,
      breakdown: [
        { label: '국민연금', value: pension },
        { label: '건강보험', value: health },
        { label: '장기요양보험', value: longTermCare },
        { label: '고용보험', value: employment },
        { label: '근로소득세(국세)', value: incomeTax },
      ],
      employerExtra: employerContribution,
      holidayAllowance: 0,
      totalHours: 0,
      weeklyBreakdown: []
    };
  };

  const result = calculateResult();

  const handleSave = () => {
    if (!name || !resIdFront || !resIdBack) {
      alert('직원 이름과 주민번호를 모두 입력해주세요.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (onAddTransaction) {
      const salaryTx: Transaction = {
        id: `SALARY-${Date.now()}`,
        date: today,
        description: `[급여] ${name}`,
        amount: Math.floor(result.baseSalary),
        category: '매입',
        subCategory: '인건비',
        accountName: '급여/임금',
        method: '계좌',
        type: 'expense',
        isVatDeductible: false,
        isIncomeTaxDeductible: true
      };
      onAddTransaction(salaryTx);

      if (result.employerExtra > 0) {
        const insuranceTx: Transaction = {
          id: `INSUR-${Date.now()}`,
          date: today,
          description: `[보험료] ${name} (사업주 부담)`,
          amount: Math.floor(result.employerExtra),
          category: '매입',
          subCategory: '인건비',
          accountName: '세금과공과',
          method: '계좌',
          type: 'expense',
          isVatDeductible: false,
          isIncomeTaxDeductible: true
        };
        onAddTransaction(insuranceTx);
      }
    }

    const savedData = JSON.parse(localStorage.getItem('saved_labor_data') || '[]');
    const newEntry = {
      id: Date.now(),
      name,
      residentId: `${resIdFront}-${resIdBack}`,
      type: type === 'regular' ? '정규직' : type === 'freelancer' ? '프리랜서' : '알바',
      baseSalary: Math.floor(result.baseSalary),
      takeHome: Math.floor(result.takeHome),
      totalCost: Math.floor(result.totalCost),
      incomeTax: Math.floor(result.incomeTax),
      totalDeduction: Math.floor(result.baseSalary - result.takeHome),
      date: today
    };
    localStorage.setItem('saved_labor_data', JSON.stringify([...savedData, newEntry]));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    
    setName('');
    setResIdFront('');
    setResIdBack('');
    alert('인건비 지급 내역이 확정되어 지출 내역(급여 및 보험료)으로 자동 등록되었습니다.');
  };

  const handleResIdFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setResIdFront(val);
    if (val.length === 6) {
      resIdBackRef.current?.focus();
    }
  };

  const handleResIdBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
    setResIdBack(val);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">인건비 계산기</h1>
            <p className="text-slate-500 text-sm font-medium">2026년 최저시급 및 주휴수당 기준이 적용된 정밀 계산기입니다.</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsContractModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black transition-all bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 shadow-sm active:scale-95"
            >
                <FileSignature size={20} /> 계약서 데이터 불러오기
            </button>
            <button 
                onClick={handleSave}
                className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg ${
                isSaved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
                }`}
            >
                {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                {isSaved ? '내역 저장됨' : '지급 내역 확정'}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><UserCircle size={16} className="text-blue-600" /> 근로자 정보</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">성명</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">주민번호</label>
                  <div className="flex items-center gap-1">
                    <input 
                      ref={resIdFrontRef}
                      type="tel" 
                      value={resIdFront}
                      onChange={handleResIdFrontChange}
                      maxLength={6}
                      placeholder="6자리"
                      className="w-full px-3 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 text-center"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      ref={resIdBackRef}
                      type="password" 
                      value={resIdBack}
                      onChange={handleResIdBackChange}
                      maxLength={7}
                      placeholder="7자리"
                      className="w-full px-3 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">계약 형태</label>
              <div className="flex gap-2">
                {[
                  { id: 'regular', label: '정규직' },
                  { id: 'freelancer', label: '3.3% 프리랜서' },
                  { id: 'parttime', label: '단기 알바' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`flex-1 px-4 py-3 rounded-xl text-[11px] font-black border-2 transition-all ${
                      type === t.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {type === 'parttime' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Coins size={14} className="text-amber-500" /> 적용 시급 (2026 최저 {hourlyWage.toLocaleString()}원)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(Number(e.target.value))}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-xl font-black text-slate-800"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">원</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Calendar size={14} className="text-blue-500" /> 주차별 실 근무 입력
                  </label>
                  <div className="space-y-3">
                    {weeklyWork.map((week, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-4 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-[10px] text-blue-600 shadow-sm border border-blue-50">
                            {idx + 1}주
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-600">실 근로량</span>
                            {week.days * week.hours >= 15 ? (
                                <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5"><CheckCircle2 size={8} /> 주휴발생</span>
                            ) : (
                                <span className="text-[9px] text-slate-300 font-bold flex items-center gap-0.5"><AlertTriangle size={8} /> 주휴미발생</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
                            <input 
                              type="number" 
                              value={week.days}
                              onChange={(e) => updateWeeklyWork(idx, 'days', Number(e.target.value))}
                              className="w-8 text-center bg-transparent border-none text-sm font-black text-slate-800 focus:ring-0 p-0"
                            />
                            <span className="text-[10px] font-bold text-slate-400 ml-1">일</span>
                          </div>
                          <div className="flex items-center bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
                            <input 
                              type="number" 
                              value={week.hours}
                              onChange={(e) => updateWeeklyWork(idx, 'hours', Number(e.target.value))}
                              className="w-8 text-center bg-transparent border-none text-sm font-black text-slate-800 focus:ring-0 p-0"
                            />
                            <span className="text-[10px] font-bold text-slate-400 ml-1">시간</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">월 정액 급여 (세전)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-xl font-black text-slate-800"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <TrendingUp size={160} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">총 급여 합계 (세전)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{Math.floor(result.baseSalary).toLocaleString()}</span>
                    <span className="text-slate-500 font-bold text-xl">원</span>
                  </div>
                </div>
                {type === 'parttime' && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-right">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">한달 총 근로</p>
                    <p className="text-xl font-black text-blue-400">{result.totalHours}시간</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                <div className="space-y-1">
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">직원 실수령액 (세후)</p>
                  <p className="text-3xl font-black text-emerald-400">{Math.floor(result.takeHome).toLocaleString()}원</p>
                </div>
                <div className="space-y-1">
                  <p className="text-blue-400 text-xs font-black uppercase tracking-widest">사업주 실제 지출 비용</p>
                  <p className="text-3xl font-black text-blue-400">{Math.floor(result.totalCost).toLocaleString()}원</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 flex flex-col">
              <h3 className="flex items-center gap-2 font-black text-slate-800 text-sm">
                <Wallet className="text-blue-500" size={18} /> 급여 산출 상세
              </h3>
              <div className="space-y-3 flex-1">
                {result.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold py-1 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={`${item.label.includes('수당') || item.label.includes('총액') ? 'text-slate-800' : 'text-red-500'}`}>
                      {item.label.includes('수당') || item.label.includes('총액') ? '' : '-'}{Math.floor(item.value).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 mt-auto">
                 <div className="flex justify-between text-xs font-black">
                   <span className="text-slate-400">{type === 'parttime' ? '고용+산재보험 비용' : '사업주 4대보험 부담금'}</span>
                   <span className="text-blue-600">+{Math.floor(result.employerExtra).toLocaleString()}원</span>
                 </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-black text-blue-800 text-sm">
                  <Landmark size={18} /> 2026년 노무 정보
                </h3>
                <div className="space-y-3">
                    <div className="bg-white/60 p-3 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-900 mb-1">최저시급 준수</p>
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">2026년 최저임금 {hourlyWage.toLocaleString()}원이 적용되었습니다.</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-900 mb-1">주휴수당 산정</p>
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">1주 15시간 이상 근무 시 주휴수당 발생이 자동으로 합산되었습니다.</p>
                    </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Auto Analysis</span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Selection Modal */}
      {isContractModalOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                  <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                              <FileSignature size={20} />
                          </div>
                          <div>
                              <h2 className="text-lg font-black text-slate-800">계약 데이터 연동</h2>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Employee Data</p>
                          </div>
                      </div>
                      <button onClick={() => setIsContractModalOpen(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl transition-all shadow-sm">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      {availableContracts.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                              {availableContracts.map(contract => (
                                  <button 
                                      key={contract.id}
                                      onClick={() => handleLoadContract(contract)}
                                      className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-blue-50 hover:border-blue-200 transition-all text-left"
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                              {contract.employeeName ? contract.employeeName[0] : '?'}
                                          </div>
                                          <div>
                                              <p className="text-base font-black text-slate-800 group-hover:text-blue-900">{contract.employeeName}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-white rounded-lg text-slate-400 border border-slate-100 uppercase tracking-wider">{contract.laborType}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xs font-bold text-slate-400 mb-0.5">{contract.salaryType}</p>
                                          <p className="text-sm font-black text-slate-800 group-hover:text-blue-600">{Number(contract.salaryAmount).toLocaleString()}원</p>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      ) : (
                          <div className="py-20 text-center space-y-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                  <Search size={32} className="text-slate-200" />
                              </div>
                              <p className="text-slate-400 font-black">연동 가능한 계약서가 없습니다.</p>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed">계약서 관리 메뉴에서 서류를 먼저 작성하세요.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LaborCostCalculator;

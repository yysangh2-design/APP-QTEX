
import React from 'react';
import { FileSignature, Plus, ChevronRight, CheckCircle2, FileText, X, Printer, Scale, UserPlus, UserCircle, Image as ImageIcon, Loader2, Send, Smartphone, Fingerprint, FileCheck, ShieldCheck, FileDown, Save, MapPin, Tag, Calendar, Clock, ChevronDown, Landmark, CreditCard, User, MousePointer2, Sparkles, Hash, Phone, CheckSquare, Square, Coffee, Building2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

type LaborFormType = '표준(무기)' | '표준(유기)' | '단시간' | '프리랜서';

interface DailyWork {
  active: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

interface BonusItem {
  name: string;
  amount: string;
}

interface ContractFormData {
  id?: string;
  laborType: LaborFormType;
  employeeName: string;
  residentIdFront: string;
  residentIdBack: string;
  employeePhoneMid: string;
  employeePhoneLast: string;
  employeeRegion: string;
  employeeDistrict: string;
  employeeDetailAddress: string;
  companyName: string;
  ceoName: string;
  companyAddress: string;
  companyPhone: string;
  startDate: string;
  endDate: string;
  workPlace: string;
  jobDuties: string;
  startTime: string;
  endTime: string;
  breakTimeStart: string;
  breakTimeEnd: string;
  workDaysCount: string;
  payDayWeek: string;
  salaryType: string;
  salaryAmount: string;
  bonusType: '있음' | '없음';
  bonusItems: BonusItem[];
  otherAllowanceType: '있음' | '없음';
  otherAllowanceName: string;
  otherAllowanceAmount: string;
  overtimeRate: string;
  payDay: string;
  payMethod: '직접지급' | '예금통장';
  insurance: string[];
  schedule: Record<string, DailyWork>;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  freelancerRate: string;
  contractDate: string;
  specialTerms: string;
}

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const DISTRICT_MAP: Record<string, string[]> = {
  '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '경기': ['수원시', '고양시', '용인시', '성남시', '부천시', '화성시', '안산시', '남양주시', '안양시', '평택시', '시흥시', '파주시', '의정부시', '김포시', '광주시', '광명시', '군포시', '하남시', '오산시', '양주시', '이천시', '구리시', '의왕시', '포천시', '양평군', '여주시', '동두천시', '가평군', '과천시', '연천군'],
  '인천': ['계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
};

const BANK_LIST = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고', '우체국', '수협은행'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MAJOR_INSURANCES = ['고용보험', '산재보험', '국민연금', '건강보험'];

// 숫자에 콤마를 찍어주는 유틸리티
const formatNum = (val: string | number) => {
  const num = typeof val === 'string' ? val.replace(/[^0-9]/g, '') : val.toString();
  if (!num) return '';
  return Number(num).toLocaleString();
};

const EditableField = ({ name, type = 'text', placeholder = '____', value, onChange, className = "", style = {}, isNumeric = false }: any) => {
  const displayValue = isNumeric ? formatNum(value) : value;

  return (
    <input
      type={type}
      value={displayValue}
      placeholder={placeholder}
      onChange={(e) => {
        const rawValue = isNumeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
        onChange(name, rawValue);
      }}
      className={`bg-transparent hover:bg-blue-50 focus:bg-blue-100 focus:outline-none transition-colors border-b border-transparent focus:border-blue-300 px-1 inline-block ${className}`}
      style={{ color: 'inherit', fontWeight: 'inherit', ...style }}
    />
  );
};

const LaborContractManager: React.FC = () => {
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createStep, setCreateStep] = React.useState<1 | 2>(1);
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const contractRef = React.useRef<HTMLDivElement>(null);
  const resIdFrontRef = React.useRef<HTMLInputElement>(null);
  const resIdBackRef = React.useRef<HTMLInputElement>(null);
  const phoneLastRef = React.useRef<HTMLInputElement>(null);

  const initialSchedule = DAYS.reduce((acc, day) => {
    acc[day] = { active: day !== '토' && day !== '일', start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' };
    return acc;
  }, {} as Record<string, DailyWork>);

  const initialFormData: ContractFormData = {
    laborType: '표준(무기)', 
    employeeName: '', residentIdFront: '', residentIdBack: '', employeePhoneMid: '', employeePhoneLast: '', 
    employeeRegion: '서울', employeeDistrict: '강남구', employeeDetailAddress: '',
    companyName: 'Q-Tex 테크놀로지', ceoName: '김택스', companyAddress: '서울시 강남구 테헤란로 123', companyPhone: '02-123-4567',
    startDate: new Date().toISOString().split('T')[0], endDate: '', workPlace: '본사 사업장 내', jobDuties: '경영지원 서비스',
    startTime: '09:00', endTime: '18:00', breakTimeStart: '12:00', breakTimeEnd: '13:00',
    workDaysCount: '5', payDayWeek: '일',
    salaryType: '월급', salaryAmount: '', bonusType: '없음', 
    bonusItems: Array(5).fill({ name: '', amount: '' }),
    otherAllowanceType: '없음', otherAllowanceName: '', otherAllowanceAmount: '', overtimeRate: '50',
    payDay: '10', payMethod: '예금통장', insurance: ['고용보험', '산재보험', '국민연금', '건강보험'],
    schedule: initialSchedule,
    bankName: '국민은행', accountNumber: '', accountHolder: '', freelancerRate: '3.3',
    contractDate: new Date().toISOString().split('T')[0], specialTerms: ''
  };

  const [formData, setFormData] = React.useState<ContractFormData>(initialFormData);

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('qtex_contracts') || '[]');
    setContracts(saved);
  }, []);

  const handleExport = async (type: 'pdf' | 'png') => {
    if (!contractRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(contractRef.current, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 3 });
      if (type === 'png') {
        const link = document.createElement('a');
        link.download = `계약서_${formData.employeeName || '미입력'}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
        pdf.save(`계약서_${formData.employeeName || '미입력'}.pdf`);
      }
    } catch (err) { alert('이미지 생성에 실패했습니다.'); } finally { setIsDownloading(false); }
  };

  const saveContract = () => {
    const newContract = { ...formData, id: formData.id || `CT-${Date.now()}` };
    const updated = formData.id ? contracts.map(c => c.id === formData.id ? newContract : c) : [newContract, ...contracts];
    localStorage.setItem('qtex_contracts', JSON.stringify(updated));
    setContracts(updated);
    setIsCreateModalOpen(false);
    alert('계약서가 보관함에 저장되었습니다.');
  };

  const handleValueChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBonusItemChange = (index: number, field: keyof BonusItem, value: string) => {
    const newItems = [...formData.bonusItems];
    newItems[index] = { ...newItems[index], [field]: value };
    handleValueChange('bonusItems', newItems);
  };

  const toggleInsurance = (ins: string) => {
    const current = formData.insurance;
    if (current.includes(ins)) {
      handleValueChange('insurance', current.filter(i => i !== ins));
    } else {
      handleValueChange('insurance', [...current, ins]);
    }
  };

  const handlePhoneMidChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 4);
    handleValueChange('employeePhoneMid', clean);
    if (clean.length === 4) phoneLastRef.current?.focus();
  };

  const handlePhoneLastChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 4);
    handleValueChange('employeePhoneLast', clean);
    if (clean.length === 4) resIdFrontRef.current?.focus();
  };

  const handleResIdFrontChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
    handleValueChange('residentIdFront', clean);
    if (clean.length === 6) resIdBackRef.current?.focus();
  };

  const handleDayToggle = (day: string) => {
    const newSchedule = { ...formData.schedule };
    newSchedule[day] = { ...newSchedule[day], active: !newSchedule[day].active };
    handleValueChange('schedule', newSchedule);
  };

  const fullEmployeeAddress = `${formData.employeeRegion} ${formData.employeeDistrict} ${formData.employeeDetailAddress}`;
  const fullEmployeePhone = `010-${formData.employeePhoneMid}-${formData.employeePhoneLast}`;
  const fullResidentId = `${formData.residentIdFront}-${formData.residentIdBack || '*******'}`;

  const renderStandardForm = (isFixed: boolean) => (
    <div className="text-[10pt] leading-[1.5] text-black h-full flex flex-col font-serif text-left">
      <div className="text-center mb-8">
        <h2 className="inline-block border border-black px-12 py-1 text-[20pt] font-black tracking-[0.2em]">
          표준근로계약서({isFixed ? '기간의 정함이 있는 경우' : '기간의 정함이 없는 경우'})
        </h2>
      </div>
      
      <div className="space-y-3">
        <p className="flex items-center gap-1">
          <EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} className="font-bold min-w-[120px]" />(이하 “사업주”라 함)과(와) 
          <span className="font-bold underline underline-offset-4 whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span>(이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
        </p>

        <div className="space-y-2">
          <p className="flex items-center gap-1"><strong>1. 근로계약기간 :</strong> <EditableField name="startDate" type="date" value={formData.startDate} onChange={handleValueChange} className="w-[120px]" /> 부터 {isFixed ? <><EditableField name="endDate" type="date" value={formData.endDate} onChange={handleValueChange} className="w-[120px]" /> 까지</> : '기간의 정함이 없는 것으로 한다.'}</p>
          <p className="flex items-center gap-1"><strong>2. 근 무 장 소 :</strong> <EditableField name="workPlace" value={formData.workPlace} onChange={handleValueChange} className="flex-1" /></p>
          <p className="flex items-center gap-1"><strong>3. 업무의 내용 :</strong> <EditableField name="jobDuties" value={formData.jobDuties} onChange={handleValueChange} className="flex-1" /></p>
          <p className="flex items-center gap-1"><strong>4. 소정근로시간 :</strong> <EditableField name="startTime" type="time" value={formData.startTime} onChange={handleValueChange} /> 부터 <EditableField name="endTime" type="time" value={formData.endTime} onChange={handleValueChange} /> 까지 (휴게시간 : <EditableField name="breakTimeStart" type="time" value={formData.breakTimeStart} onChange={handleValueChange} /> ~ <EditableField name="breakTimeEnd" type="time" value={formData.breakTimeEnd} onChange={handleValueChange} />)</p>
          <p className="flex items-center gap-1 group">
            <strong>5. 근무일/휴일 :</strong> 매주 
            <select value={formData.workDaysCount} onChange={e=>handleValueChange('workDaysCount', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>일 근무, 주휴일 매주 
            <select value={formData.payDayWeek} onChange={e=>handleValueChange('payDayWeek', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>요일
          </p>
          <div className="space-y-0.5">
            <p><strong>6. 임 금</strong></p>
            <p className="pl-4 flex items-center gap-1">- <select value={formData.salaryType} onChange={e=>handleValueChange('salaryType', e.target.value)} className="bg-transparent font-bold"><option>월급</option><option>시급</option><option>일당</option></select> : <EditableField name="salaryAmount" value={formData.salaryAmount} onChange={handleValueChange} className="w-24 text-right" isNumeric={true} /> 원</p>
            <p className="pl-4 flex items-center gap-1">- 상여금 : <select value={formData.bonusType} onChange={e=>handleValueChange('bonusType', e.target.value as any)} className="bg-transparent font-bold"><option>없음</option><option>있음</option></select></p>
            {formData.bonusType === '있음' && (
              <div className="pl-8 grid grid-cols-1 gap-1 text-[8pt]">
                {formData.bonusItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400">{idx + 1}.</span>
                    <input type="text" value={item.name} placeholder="항목명" onChange={e => handleBonusItemChange(idx, 'name', e.target.value)} className="w-20 bg-transparent border-b border-dotted border-slate-300 focus:outline-none" />
                    <input type="text" value={formatNum(item.amount)} placeholder="금액" onChange={e => handleBonusItemChange(idx, 'amount', e.target.value.replace(/[^0-9]/g, ''))} className="w-20 bg-transparent border-b border-dotted border-slate-300 focus:outline-none text-right" />
                    <span>원</span>
                  </div>
                ))}
              </div>
            )}
            <p className="pl-4 flex items-center gap-1">
              - 임금지급일 : 매월 
              <select value={formData.payDay} onChange={e=>handleValueChange('payDay', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
                {Array.from({length: 31}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                <option value="말일">말일</option>
              </select>일 (휴일인 경우 전일 지급)
            </p>
            <p className="pl-4 flex items-center gap-1">- 지급방법 : <select value={formData.payMethod} onChange={e=>handleValueChange('payMethod', e.target.value as any)} className="bg-transparent font-bold"><option>예금통장</option><option>직접지급</option></select> 입금</p>
          </div>
          <p><strong>7. 연차유급휴가 :</strong> 근로기준법에서 정하는 바에 따라 부여함</p>
          <div className="flex items-center gap-2">
            <strong>8. 사회보험 적용여부 :</strong> 
            <div className="flex gap-3 text-[9pt]">
              {MAJOR_INSURANCES.map(ins => (
                <button key={ins} onClick={() => toggleInsurance(ins)} className="flex items-center gap-1 hover:bg-slate-50 px-1 rounded transition-colors">
                  {formData.insurance.includes(ins) ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-slate-300" />}
                  <span>{ins}</span>
                </button>
              ))}
            </div>
          </div>
          <p><strong>9. 근로계약서 교부 :</strong> 사업주는 계약체결과 동시에 본 계약서를 사본하여 근로자에게 교부함</p>
          <div>
            <p><strong>10. 특약사항</strong></p>
            <textarea 
              value={formData.specialTerms} 
              onChange={e => handleValueChange('specialTerms', e.target.value)}
              placeholder="특이사항 및 상호 합의 내용을 입력하세요..."
              className="w-full mt-1 p-2 bg-transparent border border-dashed border-slate-200 rounded min-h-[60px] text-[9pt] focus:outline-none focus:border-blue-300"
            />
          </div>
          <p><strong>11. 기 타 :</strong> 이 계약에 정함이 없는 사항은 근로기준법령에 의함</p>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center space-y-8">
        <p className="text-[11pt] font-bold flex justify-center gap-4"><EditableField name="contractDate" type="date" value={formData.contractDate} onChange={handleValueChange} className="border-none text-center" /></p>
        <div className="grid grid-cols-2 gap-10 text-left">
          <div className="space-y-1">
            <p className="flex items-center gap-1">(사업주) 명칭 : <EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} className="font-bold" /></p>
            <p className="flex items-center gap-1">주소 : <EditableField name="companyAddress" value={formData.companyAddress} onChange={handleValueChange} className="text-[8pt] flex-1" /></p>
            <p className="relative">대표자 : <EditableField name="ceoName" value={formData.ceoName} onChange={handleValueChange} className="w-20" /> (인)<div className="absolute right-10 top-0 w-10 h-10 border-2 border-red-500/20 rounded-full flex items-center justify-center text-red-500/20 font-black text-[8px] rotate-12">인</div></p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1">(근로자) 성명 : <span className="font-bold underline whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span> (인)</p>
            <p className="flex items-center gap-1">주민번호 : <span className="font-bold underline">{fullResidentId}</span></p>
            <p className="flex items-center gap-1">주소 : <span className="text-[8pt] underline decoration-slate-200">{fullEmployeeAddress || '주소 정보 없음'}</span></p>
            <p className="flex items-center gap-1">연락처 : <span className="font-bold underline">{fullEmployeePhone}</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPartTimeForm = () => (
    <div className="text-[9pt] leading-[1.4] text-black h-full flex flex-col font-serif text-left">
      <div className="text-center mb-5">
        <h2 className="inline-block border border-black px-10 py-1 text-[17pt] font-black tracking-tight">단시간근로자 표준근로계약서</h2>
      </div>
      <p className="mb-3 flex items-center gap-1"><EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} className="font-bold" />(이하 “사업주”라 함)과(와) <span className="font-bold underline whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span>(이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.</p>
      
      <div className="space-y-2">
        <p className="flex items-center gap-1"><strong>1. 근로계약기간 :</strong> <EditableField name="startDate" type="date" value={formData.startDate} onChange={handleValueChange} /> 부터 <EditableField name="endDate" type="date" value={formData.endDate} onChange={handleValueChange} /> 까지</p>
        <p className="flex items-center gap-1"><strong>2. 근 무 장 소 :</strong> <EditableField name="workPlace" value={formData.workPlace} onChange={handleValueChange} className="flex-1" /></p>
        <p className="flex items-center gap-1"><strong>3. 업무의 내용 :</strong> <EditableField name="jobDuties" value={formData.jobDuties} onChange={handleValueChange} className="flex-1" /></p>
        <div>
          <p className="mb-1 flex justify-between items-center">
            <strong>4. 근로일 및 근로일별 근로시간</strong>
            <span className="text-[7pt] text-blue-500 font-bold">* 요일을 터치하여 근무일을 선택하세요.</span>
          </p>
          <table className="w-full border-collapse border border-black text-[8pt] text-center table-fixed">
            <thead>
              <tr className="bg-slate-50 h-8">
                <th className="border border-black w-12 bg-slate-100">구분</th>
                {DAYS.map(d => (
                  <th 
                    key={d} 
                    onClick={() => handleDayToggle(d)}
                    className={`border border-black cursor-pointer transition-all active:scale-95 ${formData.schedule[d].active ? 'bg-blue-600 text-white font-black' : 'bg-white text-slate-300'}`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="h-10">
                <td className="border border-black font-bold bg-slate-50">시작</td>
                {DAYS.map(d => (
                  <td key={d} className={`border border-black p-0 h-10 ${!formData.schedule[d].active ? 'bg-slate-50/80' : ''}`}>
                    <input 
                      type="time" 
                      value={formData.schedule[d].active ? formData.schedule[d].start : ""} 
                      onChange={e=>handleValueChange('schedule', {...formData.schedule, [d]: {...formData.schedule[d], start: e.target.value}})} 
                      className="w-full h-full border-none bg-transparent text-center text-[7pt] focus:outline-none"
                      disabled={!formData.schedule[d].active}
                    />
                  </td>
                ))}
              </tr>
              <tr className="h-10">
                <td className="border border-black font-bold bg-slate-50">종료</td>
                {DAYS.map(d => (
                  <td key={d} className={`border border-black p-0 h-10 ${!formData.schedule[d].active ? 'bg-slate-50/80' : ''}`}>
                    <input 
                      type="time" 
                      value={formData.schedule[d].active ? formData.schedule[d].end : ""} 
                      onChange={e=>handleValueChange('schedule', {...formData.schedule, [d]: {...formData.schedule[d], end: e.target.value}})} 
                      className="w-full h-full border-none bg-transparent text-center text-[7pt] focus:outline-none"
                      disabled={!formData.schedule[d].active}
                    />
                  </td>
                ))}
              </tr>
              <tr className="h-10">
                <td className="border border-black font-bold bg-slate-50 text-[7pt]">휴게</td>
                {DAYS.map(d => (
                  <td key={d} className={`border border-black p-0 h-10 ${!formData.schedule[d].active ? 'bg-slate-50/80' : ''}`}>
                    <input 
                      type="text" 
                      value={formData.schedule[d].active ? `${formData.breakTimeStart}~${formData.breakTimeEnd}` : ""} 
                      readOnly
                      className="w-full h-full border-none bg-transparent text-center text-[6.5pt] font-bold text-blue-700 focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-1 flex items-center gap-1">◦ 주휴일 : 매주 
            <select value={formData.payDayWeek} onChange={e=>handleValueChange('payDayWeek', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>요일
          </p>
        </div>
        <div className="space-y-0.5">
          <p><strong>5. 임 금</strong></p>
          <p className="pl-4 flex items-center gap-1">- 시급 : <EditableField name="salaryAmount" value={formData.salaryAmount} onChange={handleValueChange} className="w-20 text-right" isNumeric={true} /> 원</p>
          <p className="pl-4 flex items-center gap-1">- 지급방법 : 매월 
            <select value={formData.payDay} onChange={e=>handleValueChange('payDay', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
              {Array.from({length: 31}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              <option value="말일">말일</option>
            </select>일 / <select value={formData.payMethod} onChange={e=>handleValueChange('payMethod', e.target.value as any)} className="bg-transparent font-bold"><option>예금통장</option><option>직접지급</option></select></p>
          <p className="pl-4 flex items-center gap-1">
            - 기타급여 : <select value={formData.otherAllowanceType} onChange={e=>handleValueChange('otherAllowanceType', e.target.value as any)} className="bg-transparent font-bold"><option>없음</option><option>있음</option></select>
            {formData.otherAllowanceType === '있음' && (
              <span className="flex items-center gap-1 ml-2">
                (<input type="text" value={formData.otherAllowanceName} placeholder="수당명" onChange={e => handleValueChange('otherAllowanceName', e.target.value)} className="w-16 bg-transparent border-b border-dotted border-slate-300 focus:outline-none text-center" /> :
                <input type="text" value={formatNum(formData.otherAllowanceAmount)} placeholder="금액" onChange={e => handleValueChange('otherAllowanceAmount', e.target.value.replace(/[^0-9]/g, ''))} className="w-16 bg-transparent border-b border-dotted border-slate-300 focus:outline-none text-right" />원)
              </span>
            )}
          </p>
          <p className="pl-4 flex items-center gap-1">
            - 초과근로에 대한 가산임금율 : 
            <select value={formData.overtimeRate} onChange={e=>handleValueChange('overtimeRate', e.target.value)} className="bg-transparent font-bold px-1 hover:bg-blue-50 outline-none">
              {['50','60','70','80','90','100'].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </p>
        </div>
        <div>
          <p><strong>6. 특약사항</strong></p>
          <textarea 
            value={formData.specialTerms} 
            onChange={e => handleValueChange('specialTerms', e.target.value)}
            placeholder="추가 합의사항을 적으세요..."
            className="w-full mt-1 p-2 bg-transparent border border-dashed border-slate-200 rounded min-h-[45px] text-[8.5pt] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <strong>7. 사회보험 적용여부 :</strong> 
          <div className="flex gap-3 text-[8.5pt]">
            {MAJOR_INSURANCES.map(ins => (
              <button key={ins} onClick={() => toggleInsurance(ins)} className="flex items-center gap-1 hover:bg-slate-50 px-1 rounded transition-colors">
                {formData.insurance.includes(ins) ? <CheckSquare size={13} className="text-blue-600" /> : <Square size={13} className="text-slate-300" />}
                <span>{ins}</span>
              </button>
            ))}
          </div>
        </div>
        <p><strong>8. 기 타 :</strong> 이 계약에 정함이 없는 사항은 근로기준법령에 의함</p>
      </div>

      <div className="mt-auto pt-5 text-center space-y-5">
        <p className="font-bold flex justify-center gap-4"><EditableField name="contractDate" type="date" value={formData.contractDate} onChange={handleValueChange} className="text-center" /></p>
        <div className="grid grid-cols-2 gap-8 text-left border-t border-slate-200 pt-4">
           <div><p className="font-bold">(사업주) <EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} /></p><p>대표 : <EditableField name="ceoName" value={formData.ceoName} onChange={handleValueChange} /> (인)</p></div>
           <div>
             <p className="font-bold">(근로자) 성명 : <span className="underline whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span> (인)</p>
             <p>주민번호 : <span className="underline">{fullResidentId}</span></p>
             <p>연락처 : <span className="underline">{fullEmployeePhone}</span></p>
           </div>
        </div>
      </div>
    </div>
  );

  const renderFreelancerForm = () => (
    <div className="text-[10pt] leading-[1.6] text-black h-full flex flex-col font-sans px-4 text-left">
      <h2 className="text-[20pt] font-black text-center mb-6 tracking-widest underline underline-offset-8">프리랜서 계약서</h2>
      <div className="mb-6">
         <p className="leading-relaxed">
           <strong>『 <EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} /> 』</strong> 대표이사 <EditableField name="ceoName" value={formData.ceoName} onChange={handleValueChange} />(이하 “갑”이라 한다)와 
           <strong>『 <span className="font-bold underline whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span> 』</strong>(이하 “을”이라 한다)는 아래와 같이 프리랜서계약을 체결한다.
         </p>
      </div>

      <div className="space-y-4">
        <section>
          <h3 className="font-black text-[11pt] mb-1">제 1 조 【 일반사항 】</h3>
          <div className="pl-4 flex items-center gap-2">
            1. 작업형식 : 위탁 / 2. 주 업무 : 
            <EditableField 
              name="jobDuties" 
              value={formData.jobDuties} 
              onChange={handleValueChange} 
              className="font-bold text-blue-700 min-w-[150px] border-b-blue-200" 
              placeholder="업무 내용을 입력하세요"
            />
          </div>
        </section>
        <section><h3 className="font-black text-[11pt] mb-1">제 2 조 【 계약기간 】</h3><p className="pl-4">계약기간은 <EditableField name="startDate" type="date" value={formData.startDate} onChange={handleValueChange} />부터 <EditableField name="endDate" type="date" value={formData.endDate} onChange={handleValueChange} />까지로 한다.</p></section>
        <section>
          <h3 className="font-black text-[11pt] mb-1">제 3 조 【 보 수 】</h3>
          <p className="pl-4">1. 보수액 : <EditableField name="salaryAmount" value={formData.salaryAmount} onChange={handleValueChange} className="w-24 text-right" isNumeric={true} />원 (원천징수 <EditableField name="freelancerRate" value={formData.freelancerRate} onChange={handleValueChange} className="w-8" />% 공제)</p>
          <div className="ml-4 mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2 text-xs">
               은행: 
               <select 
                value={formData.bankName} 
                onChange={(e) => handleValueChange('bankName', e.target.value)}
                className="bg-white border border-slate-200 rounded px-1 py-0.5 font-bold text-blue-700 focus:outline-none"
               >
                 {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
             </div>
             <div className="flex items-center gap-2 text-xs">
               계좌: 
               <EditableField name="accountNumber" value={formData.accountNumber} onChange={handleValueChange} className="flex-1 font-bold text-blue-700" placeholder="계좌번호 입력" />
             </div>
          </div>
        </section>
        <section>
          <h3 className="font-black text-[11pt] mb-1 text-slate-800">제 4 조 【 특약사항 】</h3>
          <textarea 
            value={formData.specialTerms} 
            onChange={e => handleValueChange('specialTerms', e.target.value)}
            className="w-full pl-4 bg-transparent border-none text-[10pt] min-h-[60px] focus:outline-none placeholder:text-slate-300"
            placeholder="추가 협의 내용을 자유롭게 입력하세요..."
          />
        </section>
      </div>

      <div className="mt-auto pt-6 text-center">
         <p className="text-[12pt] font-black mb-8 flex justify-center gap-4"><EditableField name="contractDate" type="date" value={formData.contractDate} onChange={handleValueChange} /></p>
         <div className="grid grid-cols-2 gap-4 border-t border-black pt-6">
            <div className="text-left space-y-1">
              <p className="font-black text-[11pt] mb-2">“갑” (위탁자)</p>
              <p className="text-[9pt]">상호: <EditableField name="companyName" value={formData.companyName} onChange={handleValueChange} className="font-bold" /></p>
              <p className="text-[9pt] relative">성명: <EditableField name="ceoName" value={formData.ceoName} onChange={handleValueChange} className="font-bold" /> (인)
                <div className="absolute right-4 top-0 w-8 h-8 border border-red-400 rounded-full flex items-center justify-center text-red-500 font-black text-[7px] rotate-12 opacity-30">인</div>
              </p>
            </div>
            <div className="text-left space-y-1">
              <p className="font-black text-[11pt] mb-2">“을” (수탁자)</p>
              <p className="text-[9pt]">성명: <span className="font-bold underline whitespace-nowrap min-w-fit flex-shrink-0">{formData.employeeName || '_______'}</span> (인)</p>
              <p className="text-[9pt]">주민번호: <span className="font-bold underline">{fullResidentId}</span></p>
              <p className="text-[9pt]">주소: <span className="text-[8pt] underline decoration-slate-200">{fullEmployeeAddress}</span></p>
            </div>
         </div>
      </div>
    </div>
  );

  const getContractTemplate = () => {
    switch (formData.laborType) {
      case '표준(무기)': return renderStandardForm(false);
      case '표준(유기)': return renderStandardForm(true);
      case '단시간': return renderPartTimeForm();
      case '프리랜서': return renderFreelancerForm();
    }
  };

  const scaleFactor = window.innerWidth < 1200 ? (window.innerWidth * 0.95) / 210 / 4 : 1;
  const scaledHeight = 297 * scaleFactor;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20 px-1">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print px-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><FileSignature size={24} /></div>
          <div><h1 className="text-2xl font-black text-slate-800">근로계약서 관리</h1><p className="text-slate-500 text-xs font-bold uppercase">Smart Contract Engine v7.0</p></div>
        </div>
        <button onClick={() => { setFormData(initialFormData); setCreateStep(1); setIsCreateModalOpen(true); }} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
          <Plus size={20} /> 새 계약서 작성
        </button>
      </header>

      {/* History List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print px-2">
        {contracts.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">{c.employeeName ? c.employeeName[0] : 'N'}</div>
                <div><h3 className="font-black text-slate-800 text-sm">{c.employeeName || '미지정'}</h3><div className="flex gap-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{c.laborType}</span><span className="text-[9px] font-bold text-slate-300">{c.contractDate}</span></div></div>
             </div>
             <div className="flex gap-1">
                <button onClick={() => { setFormData(c); setCreateStep(2); setIsCreateModalOpen(true); }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl"><FileText size={18} /></button>
                <button onClick={() => { if(confirm('삭제하시겠습니까?')){ const up = contracts.filter(x=>x.id !== c.id); setContracts(up); localStorage.setItem('qtex_contracts', JSON.stringify(up)); } }} className="p-2.5 text-slate-300 hover:text-rose-500 rounded-xl"><X size={18} /></button>
             </div>
          </div>
        ))}
      </div>

      {/* STEPPED MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 lg:p-4 overflow-hidden animate-in fade-in duration-300">
           <div className={`bg-white w-full h-full lg:max-w-7xl lg:h-[95vh] lg:rounded-[3rem] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-500`}>
              
              {/* Header - Fixed to top */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 no-print z-[110]">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><UserPlus size={18} /></div>
                    <div>
                       <h2 className="text-sm font-black">{createStep === 1 ? '근로자 기본 정보 입력' : '계약서 상세 완성'}</h2>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Step {createStep} of 2</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors"><X size={18} /></button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
                 {/* STEP 1: FORM INPUT */}
                 {createStep === 1 && (
                    <div className="w-full flex-1 flex flex-col items-center justify-start pt-8 pb-20 px-6 md:px-12 overflow-y-auto custom-scrollbar">
                       <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-[3rem] shadow-xl space-y-10">
                          <section className="space-y-4 text-left">
                             <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Tag size={16} /> 1. 근로 계약 유형 선택</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['표준(무기)', '표준(유기)', '단시간', '프리랜서'].map(t => (
                                   <button key={t} onClick={() => handleValueChange('laborType', t as any)} className={`py-4 rounded-2xl text-[11px] font-black border-2 transition-all ${formData.laborType === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>{t}</button>
                                ))}
                             </div>
                          </section>

                          <section className="space-y-6 text-left">
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><User size={16} className="text-blue-500" /> 2. 근로자 인적 사항</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black text-slate-400 mb-1 block ml-1">성명</label><input type="text" value={formData.employeeName} onChange={e=>handleValueChange('employeeName', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" placeholder="근로자 이름" /></div>
                                <div>
                                   <label className="text-[10px] font-black text-slate-400 mb-1 block ml-1">연락처</label>
                                   <div className="flex items-center gap-2">
                                      <div className="bg-slate-100 px-4 py-4 rounded-2xl text-sm font-black text-slate-500">010</div>
                                      <input type="tel" inputMode="numeric" maxLength={4} value={formData.employeePhoneMid} onChange={e=>handlePhoneMidChange(e.target.value)} className="w-full px-3 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-center" placeholder="0000" />
                                      <input ref={phoneLastRef} type="tel" inputMode="numeric" maxLength={4} value={formData.employeePhoneLast} onChange={e=>handlePhoneLastChange(e.target.value)} className="w-full px-3 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-center" placeholder="0000" />
                                   </div>
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block ml-1">주민등록번호</label>
                                <div className="flex items-center gap-2">
                                   <input ref={resIdFrontRef} type="tel" inputMode="numeric" maxLength={6} value={formData.residentIdFront} onChange={e=>handleResIdFrontChange(e.target.value)} className="w-[140px] px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-center" placeholder="6자리" />
                                   <span className="text-slate-300">-</span>
                                   <input ref={resIdBackRef} type="password" inputMode="numeric" maxLength={7} value={formData.residentIdBack} onChange={e=>handleValueChange('residentIdBack', e.target.value.replace(/[^0-9]/g, ''))} className="w-[140px] px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-center" placeholder="7자리" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 mb-1 block ml-1">거주지 주소</label>
                                <div className="grid grid-cols-2 gap-3">
                                   <div className="relative">
                                      <select value={formData.employeeRegion} onChange={e=>setFormData({...formData, employeeRegion: e.target.value, employeeDistrict: (DISTRICT_MAP[e.target.value] || [])[0] || ''})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black appearance-none outline-none">{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                   </div>
                                   <div className="relative">
                                      <select value={formData.employeeDistrict} onChange={e=>handleValueChange('employeeDistrict', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black appearance-none outline-none">{(DISTRICT_MAP[formData.employeeRegion] || []).map(d=><option key={d} value={d}>{d}</option>)}</select>
                                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                   </div>
                                </div>
                                <input type="text" value={formData.employeeDetailAddress} onChange={e=>handleValueChange('employeeDetailAddress', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" placeholder="상세 주소 (나머지)" />
                             </div>
                          </section>

                          <section className="space-y-6 text-left">
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Coffee size={16} className="text-amber-500" /> 3. 근무 및 휴게 시간 설정</h3>
                             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                <p className="text-[11px] text-slate-500 font-bold mb-2">점심/휴게 시간은 언제인가요?</p>
                                <div className="flex items-center gap-4">
                                   <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block ml-1">휴게 시작</label>
                                      <input 
                                         type="time" 
                                         value={formData.breakTimeStart} 
                                         onChange={e => handleValueChange('breakTimeStart', e.target.value)} 
                                         className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all"
                                      />
                                   </div>
                                   <div className="text-slate-300 mt-5">~</div>
                                   <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block ml-1">휴게 종료</label>
                                      <input 
                                         type="time" 
                                         value={formData.breakTimeEnd} 
                                         onChange={e => handleValueChange('breakTimeEnd', e.target.value)} 
                                         className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all"
                                      />
                                   </div>
                                </div>
                                <p className="text-[10px] text-blue-500 font-medium leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                   * 이 데이터는 계약서 본문에 자동으로 기입됩니다.
                                </p>
                             </div>
                          </section>

                          <button 
                             onClick={() => setCreateStep(2)}
                             disabled={!formData.employeeName || !formData.employeePhoneLast}
                             className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                          >
                             정보 입력 완료 및 계약서 작성 <ChevronRight size={24} />
                          </button>
                       </div>
                    </div>
                 )}

                 {/* STEP 2: WYSIWYG EDITOR */}
                 {createStep === 2 && (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                       {/* Left Sidebar - Controls */}
                       <div className="w-full lg:w-80 bg-white border-r border-slate-100 p-6 space-y-8 no-print overflow-y-auto custom-scrollbar lg:block hidden text-left">
                          <section className="space-y-4">
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-amber-500" /> 지능형 가이드</h3>
                             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">1. **기본 정보**는 입력하신 데이터가 자동 적용되었습니다.</p>
                                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">2. **이미지의 푸른색 칸**을 터치하여 나머지 계약 조건을 완성하세요.</p>
                             </div>
                          </section>
                          <section className="space-y-4">
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><CreditCard size={16} className="text-indigo-500" /> 도구함</h3>
                             <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => handleExport('png')} className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm"><ImageIcon size={14} /> 이미지 저장</button>
                                <button onClick={() => handleExport('pdf')} className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm"><FileDown size={14} /> PDF 저장</button>
                             </div>
                          </section>
                       </div>

                       {/* Main Workspace - Improved Scaling & Button Positioning */}
                       <div className="flex-1 overflow-y-auto p-2 md:p-4 flex flex-col items-center custom-scrollbar relative">
                          <div className="w-full flex flex-col items-center">
                             {/* 컨테이너 높이를 축소 비율에 맞게 조정하여 하단 공백 제거 */}
                             <div 
                                style={{ height: window.innerWidth < 1200 ? `${scaledHeight}mm` : '297mm', width: '100%', overflow: 'hidden' }}
                                className="flex justify-center"
                             >
                                <div 
                                  ref={contractRef} 
                                  className="bg-white shadow-2xl relative box-border origin-top transition-transform duration-500" 
                                  style={{ 
                                      width: '210mm', height: '297mm', padding: '15mm 20mm', minWidth: '210mm', minHeight: '297mm', 
                                      transform: `scale(${scaleFactor})`
                                  }}
                                >
                                    <div className="border-[0.2mm] border-black h-full p-8 flex flex-col relative text-left box-border">
                                      {getContractTemplate()}
                                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center opacity-20 pointer-events-none">
                                          <span className="text-[7pt] font-black uppercase">Q-Tex Digital Legal Engine v7.0 Standard</span>
                                          <span className="text-[7pt] font-black">PAGE 1 / 1</span>
                                      </div>
                                    </div>
                                </div>
                             </div>

                             {/* 버튼 위치를 축소된 계약서 바로 아래로 밀착 (mt-1) */}
                             <div className="mt-1 mb-20 flex flex-col md:flex-row gap-3 w-full max-w-[210mm] px-4 no-print shrink-0">
                                <button onClick={() => setCreateStep(1)} className="flex-1 py-4 md:py-5 bg-white border border-slate-200 rounded-[2rem] font-black text-sm text-slate-500 active:bg-slate-50">근로 정보 수정하기</button>
                                <button onClick={saveContract} className="flex-[2] py-4 md:py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle2 size={18} /> 최종 보관함 저장</button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LaborContractManager;


import React from 'react';
import { User, Mail, Building2, Bell, Shield, CreditCard, LogOut, ChevronRight, Settings, Smartphone, Landmark, CheckCircle2, Lock, X, Loader2, ArrowRight, Save, MapPin, Hash, Briefcase, KeyRound, MonitorSmartphone, SmartphoneIcon, Camera, Crown, CreditCard as CardIcon, Calendar, ArrowUpRight, History, Check, Plus, ShieldAlert } from 'lucide-react';

interface MyPageProps {
  profileImage: string;
  onProfileImageChange: (image: string) => void;
  autoOpenSubscription?: boolean;
  onSubscriptionOpened?: () => void;
}

const PAYMENT_METHODS = [
  { id: 'hyundai', name: '현대카드', color: 'bg-black', lastDigits: '1234' },
  { id: 'samsung', name: '삼성카드', color: 'bg-blue-600', lastDigits: '5678' },
  { id: 'shinhan', name: '신한카드', color: 'bg-blue-800', lastDigits: '9012' },
  { id: 'kb', name: 'KB국민카드', color: 'bg-amber-400', lastDigits: '3456' },
  { id: 'nh', name: 'NH농협카드', color: 'bg-emerald-600', lastDigits: '7890' },
  { id: 'lotte', name: '롯데카드', color: 'bg-red-600', lastDigits: '2345' },
  { id: 'hana', name: '하나카드', color: 'bg-teal-600', lastDigits: '6789' },
  { id: 'woori', name: '우리카드', color: 'bg-sky-500', lastDigits: '0123' },
];

const MyPage: React.FC<MyPageProps> = ({ profileImage, onProfileImageChange, autoOpenSubscription, onSubscriptionOpened }) => {
  const [notifications, setNotifications] = React.useState({
    taxDeadlines: true,
    aiReports: true,
    marketing: false
  });

  const [showPasswordVerify, setShowPasswordVerify] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [pendingAction, setPendingAction] = React.useState<'editInfo' | 'editSecurity' | 'editSubscription' | null>(null);
  
  const [isEditingInfo, setIsEditingInfo] = React.useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = React.useState(false);
  const [isEditingSubscription, setIsEditingSubscription] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const [currentPaymentMethod, setCurrentPaymentMethod] = React.useState(PAYMENT_METHODS[0]);
  const [isChangingPaymentMethod, setIsChangingPaymentMethod] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoOpenSubscription) {
      setIsEditingSubscription(true);
      onSubscriptionOpened?.();
    }
  }, [autoOpenSubscription]);

  const [businessInfo, setBusinessInfo] = React.useState({
    companyName: 'Q-Tex 테크놀로지',
    businessNumber: '123-45-67890',
    ceoName: '김택스',
    address: '서울특별시 강남구 테헤란로 123, 15층',
    category: '서비스업 / 소프트웨어 개발'
  });

  // 모든 주요 메뉴 진입 시 보안 확인을 거치도록 통합
  const triggerSecurityCheck = (action: 'editInfo' | 'editSecurity' | 'editSubscription') => {
    setPendingAction(action);
    setShowPasswordVerify(true);
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowPasswordVerify(false);
      setPassword('');

      if (pendingAction === 'editInfo') setIsEditingInfo(true);
      else if (pendingAction === 'editSecurity') setIsEditingSecurity(true);
      else if (pendingAction === 'editSubscription') setIsEditingSubscription(true);
      
      setPendingAction(null);
    }, 1000);
  };

  const handleSaveInfo = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditingInfo(false);
      alert('사업자 정보가 안전하게 변경되었습니다.');
    }, 1000);
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onProfileImageChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCard = (card: typeof PAYMENT_METHODS[0]) => {
    setIsSaving(true);
    setTimeout(() => {
      setCurrentPaymentMethod(card);
      setIsChangingPaymentMethod(false);
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Profile Header */}
      <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><User size={200} /></div>
        <div className="relative group cursor-pointer" onClick={handleImageClick}>
          <div className="w-32 h-32 rounded-[2rem] border-4 border-blue-50 bg-white shadow-2xl overflow-hidden relative">
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><Camera size={24} className="mb-1" /><span className="text-[10px] font-black">사진 변경</span></div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-white z-10"><Landmark size={18} /></div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-3xl font-black text-slate-800">{businessInfo.ceoName} 사장님</h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">일반과세자</span>
          </div>
          <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2"><Mail size={16} /> tax.king@qtex.com</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">상호명</p><p className="text-sm font-black text-slate-700">{businessInfo.companyName}</p></div>
            <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-blue-50" onClick={() => triggerSecurityCheck('editSubscription')}><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">구독 등급</p><p className="text-sm font-black text-blue-600 flex items-center gap-1.5"><Crown size={14} className="text-amber-500 fill-amber-500" /> Q-Tex PRO</p></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2"><Settings size={20} className="text-slate-400" /> 서비스 설정</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            <div onClick={() => triggerSecurityCheck('editInfo')} className="p-6 flex items-center justify-between group hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Building2 size={20} /></div>
                <div><p className="text-sm font-black text-slate-800">사업자 정보 수정</p><p className="text-[11px] text-slate-400 font-medium">상호, 주소, 업태 정보 관리</p></div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600" />
            </div>
            <div onClick={() => triggerSecurityCheck('editSubscription')} className="p-6 flex items-center justify-between group hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CardIcon size={20} /></div>
                <div><p className="text-sm font-black text-slate-800">구독 및 결제 관리</p><p className="text-[11px] text-slate-400 font-medium">결제 수단 변경 및 영수증 확인</p></div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600" />
            </div>
            <div onClick={() => triggerSecurityCheck('editSecurity')} className="p-6 flex items-center justify-between group hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Shield size={20} /></div>
                <div><p className="text-sm font-black text-slate-800">보안 및 로그인</p><p className="text-[11px] text-slate-400 font-medium">비밀번호 변경 및 2단계 인증</p></div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2"><Bell size={20} className="text-slate-400" /> 알림 설정</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-800">세무 신고 마감 알림</p><p className="text-[11px] text-slate-400 font-medium">주요 세금 신고 7일 전 리마인드</p></div><Toggle checked={notifications.taxDeadlines} onChange={() => setNotifications({...notifications, taxDeadlines: !notifications.taxDeadlines})} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-800">AI 절세 리포트 알림</p><p className="text-[11px] text-slate-400 font-medium">새로운 지출 내역 AI 분석 완료 시</p></div><Toggle checked={notifications.aiReports} onChange={() => setNotifications({...notifications, aiReports: !notifications.aiReports})} /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-800">마케팅 정보 알림</p><p className="text-[11px] text-slate-400 font-medium">혜택 및 이벤트 정보 수신</p></div><Toggle checked={notifications.marketing} onChange={() => setNotifications({...notifications, marketing: !notifications.marketing})} /></div>
          </div>
        </section>
      </div>

      {/* --- Password Verification Modal (Simple & Refreshing) --- */}
      {showPasswordVerify && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 text-center space-y-8">
              {/* Icon & Title */}
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert size={40} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">보안 확인</h2>
                  <p className="text-sm text-slate-400 font-medium mt-2">
                    안전한 정보 보호를 위해<br/>비밀번호를 입력해 주세요.
                  </p>
                </div>
              </div>

              {/* Input & Form */}
              <form onSubmit={handleVerifyPassword} className="space-y-6">
                <div className="relative group">
                   <input
                    type="password"
                    autoFocus
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] focus:ring-4 focus:ring-blue-100 transition-all text-center text-lg font-black text-slate-800 placeholder:text-slate-300 placeholder:font-bold shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isVerifying || !password}
                    className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isVerifying ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} strokeWidth={3} />}
                    {isVerifying ? '본인 확인 중...' : '계속하기'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowPasswordVerify(false); setPendingAction(null); setPassword(''); }}
                    className="w-full py-4 text-xs font-black text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- Business Info Edit Modal --- */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Building2 size={20} /></div>
                <div><h2 className="text-lg font-black text-slate-800">사업자 정보 수정</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Business Profile</p></div>
              </div>
              <button onClick={() => setIsEditingInfo(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">상호 (사업자명)</label><div className="relative"><Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={businessInfo.companyName} onChange={(e) => setBusinessInfo({...businessInfo, companyName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" /></div></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업자 등록번호</label><div className="relative"><Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={businessInfo.businessNumber} onChange={(e) => setBusinessInfo({...businessInfo, businessNumber: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" /></div></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대표자명</label><div className="relative"><User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={businessInfo.ceoName} onChange={(e) => setBusinessInfo({...businessInfo, ceoName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" /></div></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">업태 및 업종</label><div className="relative"><Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={businessInfo.category} onChange={(e) => setBusinessInfo({...businessInfo, category: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" /></div></div>
                <div className="col-span-1 md:col-span-2 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업장 주소</label><div className="relative"><MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={businessInfo.address} onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" /></div></div>
              </div>
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4"><Shield className="text-amber-500 shrink-0 mt-0.5" size={18} /><p className="text-[11px] text-amber-800 leading-relaxed font-medium">사업자 정보 변경 시 기존에 연동된 플랫폼 데이터 일관성을 위해 국세청 정보와 동일한지 확인해 주세요.</p></div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              <button onClick={() => setIsEditingInfo(false)} className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">취소</button>
              <button onClick={handleSaveInfo} disabled={isSaving} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isSaving ? '저장 중...' : '변경사항 저장'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Subscription & Payment Edit Modal --- */}
      {isEditingSubscription && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Crown size={20} /></div>
                <div><h2 className="text-lg font-black text-slate-800">구독 및 멤버십 관리</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription & Billing</p></div>
              </div>
              <button onClick={() => setIsEditingSubscription(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl transition-all shadow-sm"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Crown size={120} /></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left"><p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Current Active Plan</p><h3 className="text-3xl font-black">Q-Tex PRO <span className="text-lg font-bold text-slate-400">멤버십</span></h3><p className="text-xs text-slate-400 font-medium">다음 결제 예정일: <span className="text-white">2026년 02월 15일</span></p></div>
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">정기 결제 금액</p><p className="text-xl font-black text-emerald-400">9,900원 <span className="text-xs font-bold text-slate-400">/ 월</span></p></div>
                </div>
              </div>
              <section className="space-y-6">
                <div className="flex items-center gap-2"><ArrowUpRight size={18} className="text-emerald-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">멤버십 플랜 변경</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between group"><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly</span><div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors"><Calendar size={14} /></div></div><h4 className="text-lg font-black text-slate-800">월간 멤버십</h4><p className="text-2xl font-black text-slate-900">9,900원<span className="text-xs font-bold text-slate-400"> / 월</span></p></div><button className="mt-8 w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-black cursor-not-allowed">현재 이용 중</button></div>
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-emerald-500/10 scale-105 z-10"><div className="absolute top-4 right-4 bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded-lg animate-pulse">BEST VALUE</div><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">12 Months</span><div className="w-8 h-8 bg-white text-emerald-600 rounded-lg flex items-center justify-center shadow-sm"><Shield size={14} /></div></div><h4 className="text-lg font-black text-slate-800">1년 멤버십</h4><div className="space-y-1"><p className="text-xs text-slate-400 line-through font-bold">118,800원</p><p className="text-2xl font-black text-emerald-600">99,000원<span className="text-[10px] font-bold text-emerald-400 ml-1">(-17%)</span></p></div><p className="text-[10px] text-emerald-700 font-bold">연간 결제 시 2개월 무료 혜택!</p></div><button className="mt-8 w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md">변경하기</button></div>
                  <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 hover:border-blue-200 transition-all flex flex-col justify-between group"><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">36 Months</span><div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Crown size={14} /></div></div><h4 className="text-lg font-black text-slate-800">3년 멤버십</h4><div className="space-y-1"><p className="text-xs text-slate-400 line-through font-bold">356,400원</p><p className="text-2xl font-black text-blue-600">220,000원<span className="text-[10px] font-bold text-blue-400 ml-1">(-38%)</span></p></div><p className="text-[10px] text-blue-700 font-bold">장기 고객을 위한 압도적 할인</p></div><button className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all">변경하기</button></div>
                </div>
              </section>
              <section className="space-y-6">
                <div className="flex items-center gap-2"><CardIcon size={18} className="text-emerald-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">결제 수단 관리</h3></div>
                {!isChangingPaymentMethod ? (
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between animate-in fade-in duration-300">
                    <div className="flex items-center gap-4"><div className={`w-14 h-10 ${currentPaymentMethod.color} rounded-lg flex items-center justify-center text-white shadow-md font-black text-[10px] uppercase`}>{currentPaymentMethod.name.replace('카드', '')}</div><div><p className="text-sm font-black text-slate-800">{currentPaymentMethod.name} (**** {currentPaymentMethod.lastDigits})</p><p className="text-[10px] text-slate-400 font-medium leading-relaxed">기본 결제 수단으로 설정되어 있습니다.</p></div></div>
                    <button onClick={() => setIsChangingPaymentMethod(true)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm active:scale-95">변경</button>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-6"><p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest ml-1">결제 카드를 선택해 주세요</p><button onClick={() => setIsChangingPaymentMethod(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-600">취소</button></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {PAYMENT_METHODS.map((card) => (
                        <button key={card.id} onClick={() => handleSelectCard(card)} className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 ${currentPaymentMethod.id === card.id ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'}`}>
                          <div className={`w-12 h-8 ${card.color} rounded-md shadow-sm flex items-center justify-center text-[8px] text-white font-black uppercase`}>{card.name.replace('카드', '')}</div>
                          <span className="text-[11px] font-black text-slate-700">{card.name}</span>
                          {currentPaymentMethod.id === card.id && <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md"><Check size={14} /></div>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-8"><button className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:bg-white hover:border-emerald-300 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"><Plus size={16} /> 새로운 카드 등록하기</button></div>
                  </div>
                )}
              </section>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              <button onClick={() => setIsEditingSubscription(false)} className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">닫기</button>
              <button onClick={() => { setIsSaving(true); setTimeout(() => { setIsSaving(false); alert('변경사항이 반영되었습니다.'); }, 800); }} disabled={isSaving} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isSaving ? '반영 중...' : '변경사항 저장'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Security & Login Edit Modal --- */}
      {isEditingSecurity && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Shield size={20} /></div>
                <div><h2 className="text-lg font-black text-slate-800">보안 및 로그인 설정</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Settings</p></div>
              </div>
              <button onClick={() => setIsEditingSecurity(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl transition-all shadow-sm"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <section className="space-y-4"><div className="flex items-center gap-2"><KeyRound size={18} className="text-indigo-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">비밀번호 변경</h3></div><div className="grid grid-cols-1 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">새 비밀번호</label><input type="password" placeholder="8자리 이상, 영문/숫자 조합" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호 확인</label><input type="password" placeholder="비밀번호를 한 번 더 입력하세요" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" /></div></div></section>
              <section className="space-y-4"><div className="flex items-center gap-2"><SmartphoneIcon size={18} className="text-indigo-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">2단계 인증 설정</h3></div><div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600"><Lock size={20} /></div><div><p className="text-xs font-black text-slate-800">휴대폰 본인인증</p><p className="text-[11px] text-slate-400 font-medium leading-relaxed">로그인 시 등록된 휴대폰으로 인증번호를 보냅니다.</p></div></div><button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">설정하기</button></div></section>
              <section className="space-y-4"><div className="flex items-center gap-2"><MonitorSmartphone size={18} className="text-indigo-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">로그인 기기 관리</h3></div><div className="space-y-2">{[{ device: 'Windows PC (Chrome)', place: '서울, 대한민국', time: '현재 접속 중', isCurrent: true },{ device: 'iPhone 15 Pro', place: '인천, 대한민국', time: '2시간 전', isCurrent: false }].map((item, idx) => (<div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-100 transition-all"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>{item.device.includes('PC') ? <MonitorSmartphone size={18} /> : <SmartphoneIcon size={18} />}</div><div><p className="text-xs font-black text-slate-800">{item.device}</p><p className="text-[10px] text-slate-400 font-medium">{item.place} • {item.time}</p></div></div>{!item.isCurrent && (<button className="text-[10px] font-black text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">원격 로그아웃</button>)}</div>))}</div></section>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              <button onClick={() => setIsEditingSecurity(false)} className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">취소</button>
              <button onClick={() => { setIsSaving(true); setTimeout(() => { setIsSaving(false); setIsEditingSecurity(false); alert('보안 설정이 업데이트되었습니다.'); }, 1000); }} disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isSaving ? '업데이트 중...' : '보안 설정 저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${checked ? 'left-7' : 'left-1'}`}></div></button>
);

export default MyPage;

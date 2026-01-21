
import React from 'react';
import { Orbit, Mail, Lock, ArrowRight, Loader2, User, CheckCircle2, TrendingUp, Building2, ShieldCheck, ChevronDown, Check, Phone, MapPin, Apple } from 'lucide-react';

// Q-TEX 공식 로고 SVG 컴포넌트
const QTexLogoLarge = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-24 h-24 relative">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <circle cx="50" cy="55" r="28" stroke="#1E293B" strokeWidth="12" />
        <path d="M68 73 L82 87" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
        <path d="M72 32 V10 M60 22 L72 10 L84 22" stroke="#38BDF8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="text-center">
      <h1 className="text-4xl font-black text-[#1E293B] tracking-tighter uppercase font-sans">Q-Tex</h1>
      <p className="text-slate-400 font-bold text-sm tracking-tight">AI 지능형 세무 비서 서비스</p>
    </div>
  </div>
);

interface LoginProps {
  onLogin: (name: string) => void;
}

const ANNUAL_SALES_OPTIONS = [
  '1억 미만',
  '1억~2억',
  '2억~3억',
  '3억~4억',
  '4억~5억',
  '5억~6억',
  '6억~7억',
  '7억 이상'
];

const BUSINESS_CATEGORIES = [
  '음식점업',
  '도매 및 소매업',
  '서비스업',
  '정보통신업(IT)',
  '제조업',
  '건설업',
  '부동산 임대업',
  '기타'
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [socialLoading, setSocialLoading] = React.useState<'google' | 'apple' | null>(null);
  const [isSignUpSuccess, setIsSignUpSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '', // 상호
    ceoName: '', // 대표자명
    phoneNumber: '', // 전화번호
    address: '', // 사업장 주소
    email: '',
    password: '',
    annualSales: '',
    businessCategory: '',
    taxType: '일반과세자' as '간이과세자' | '일반과세자' | '면세과세자'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoginView && (!formData.name || !formData.ceoName || !formData.phoneNumber || !formData.address || !formData.annualSales || !formData.businessCategory)) {
      alert('모든 사업자 정보를 정확히 입력해 주세요.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (!isLoginView) {
        setIsSignUpSuccess(true);
        setTimeout(() => {
          onLogin(formData.name || '사장님');
        }, 2000);
      } else {
        onLogin(formData.name || '김택스');
      }
    }, 1500);
  };

  const handleSocialLogin = (platform: 'google' | 'apple') => {
    setSocialLoading(platform);
    setTimeout(() => {
      setSocialLoading(null);
      const socialName = platform === 'apple' ? '애플사장님' : '구글사장님';
      if (!isLoginView) {
        setFormData(prev => ({ ...prev, name: socialName }));
        setIsSignUpSuccess(true);
        setTimeout(() => onLogin(socialName), 2000);
      } else {
        onLogin(socialName);
      }
    }, 1200);
  };

  const isAnyLoading = isLoading || socialLoading !== null;

  if (isSignUpSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative inline-block">
            <div className="w-28 h-28 bg-slate-50 text-[#38BDF8] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-200">
              <CheckCircle2 size={56} className="animate-in zoom-in duration-500 delay-300" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#1E293B] p-2 rounded-xl shadow-lg animate-bounce">
              <ShieldCheck className="text-[#38BDF8] w-5 h-5" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">가입을 축하드립니다!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              <span className="text-[#1E293B] font-black">{formData.ceoName || formData.name}</span> 사장님의 사업장 데이터를 기반으로<br />
              지능형 세무 분석을 시작합니다.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-4">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">과세 유형</p>
              <p className="text-sm font-black text-slate-800">{formData.taxType}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">연매출 규모</p>
              <p className="text-sm font-black text-slate-800">{formData.annualSales || '설정 전'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-slate-400 font-black text-xs pt-4">
            <Loader2 size={16} className="animate-spin text-[#38BDF8]" />
            잠시 후 맞춤 대시보드로 이동합니다...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <QTexLogoLarge />

        <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Building2 size={120} />
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-[#1E293B] tracking-tight mb-2">
              {isLoginView ? '다시 만나서 반가워요!' : '사업자 정보를 입력해 주세요'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {isLoginView ? '이메일 또는 간편로그인으로 접속하세요.' : '맞춤형 절세 분석을 위해 정확한 정보를 입력해 주세요.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isLoginView ? (
              <div className="space-y-5 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">이메일 주소</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      type="email" required disabled={isAnyLoading}
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="example@qtex.com"
                      className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      type="password" required disabled={isAnyLoading}
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">상호 (사업자명)</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text" required disabled={isAnyLoading}
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="예: Q-Tex 카페"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">대표님 성함</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="text" required disabled={isAnyLoading}
                        value={formData.ceoName} onChange={(e) => setFormData({...formData, ceoName: e.target.value})}
                        placeholder="성함을 입력하세요"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">전화번호</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="tel" required disabled={isAnyLoading}
                        value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        placeholder="010-0000-0000"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">과세 유형</label>
                    <div className="flex bg-slate-50 p-1 rounded-[1.5rem] h-[58px]">
                      {(['간이', '일반', '면세'] as const).map((type) => {
                        const fullType = type === '간이' ? '간이과세자' : type === '일반' ? '일반과세자' : '면세과세자';
                        return (
                          <button
                            key={type} type="button"
                            onClick={() => setFormData({...formData, taxType: fullType})}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition-all ${
                              formData.taxType === fullType ? 'bg-white text-[#38BDF8] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {formData.taxType === fullType && <Check size={10} />} {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">사업장 주소</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      type="text" required disabled={isAnyLoading}
                      value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="상세 주소를 입력하세요"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">예상 연매출 규모</label>
                    <div className="relative group">
                      <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 z-10" />
                      <select
                        required
                        value={formData.annualSales}
                        onChange={(e) => setFormData({...formData, annualSales: e.target.value})}
                        className="w-full pl-14 pr-12 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold appearance-none relative z-0 cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>선택하세요</option>
                        {ANNUAL_SALES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">주요 업종</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 z-10" />
                      <select
                        required
                        value={formData.businessCategory}
                        onChange={(e) => setFormData({...formData, businessCategory: e.target.value})}
                        className="w-full pl-14 pr-12 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>선택하세요</option>
                        {BUSINESS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="email" required disabled={isAnyLoading}
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="example@qtex.com"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 block tracking-widest">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input
                        type="password" required disabled={isAnyLoading}
                        value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 pt-4">
              <button
                type="submit"
                disabled={isAnyLoading}
                className="w-full py-5 bg-[#1E293B] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:bg-black hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {isLoginView ? '로그인하기' : '상호 등록 및 가입 완료'} <ArrowRight size={22} className="text-[#38BDF8]" />
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-100"></div>
                </div>
                <span className="relative bg-white px-6 text-[12px] font-black text-[#1E293B] uppercase tracking-[0.2em] shadow-sm py-1 rounded-full border border-slate-50">
                  {isLoginView ? '간편 로그인' : '간편 본인인증 가입'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <button 
                  type="button" onClick={() => handleSocialLogin('apple')}
                  disabled={isAnyLoading}
                  className="flex items-center justify-center gap-3 py-5 bg-black rounded-2xl transition-all duration-150 relative shadow-[0_5px_0_#333333] translate-y-[-5px] hover:translate-y-[-3px] hover:shadow-[0_3px_0_#333333] active:translate-y-[0px] active:shadow-none group"
                >
                  {socialLoading === 'apple' ? (
                    <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                    <>
                      <Apple size={20} className="text-white fill-white" />
                      <span className="text-[14px] font-black text-white">Apple{isLoginView ? '' : ' 가입'}</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" onClick={() => handleSocialLogin('google')}
                  disabled={isAnyLoading}
                  className="flex items-center justify-center gap-3 py-5 bg-white border border-slate-100 rounded-2xl transition-all duration-150 relative shadow-[0_5px_0_#E2E8F0] translate-y-[-5px] hover:translate-y-[-3px] hover:shadow-[0_3px_0_#E2E8F0] active:translate-y-[0px] active:shadow-none group"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="animate-spin text-slate-500" size={20} />
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                      <span className="text-[14px] font-black text-slate-700">Google{isLoginView ? '' : ' 가입'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <p className="text-center text-sm font-bold text-slate-400">
          {isLoginView ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'} 
          <button 
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-[#38BDF8] hover:underline ml-2 font-black transition-colors"
          >
            {isLoginView ? '1분 만에 가입하기' : '로그인으로 이동'}
          </button>
        </p>

        <div className="flex items-center justify-center gap-6 pt-4 opacity-40">
           <div className="flex items-center gap-1.5">
             <ShieldCheck size={14} className="text-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">TLS 보안 연결됨</span>
           </div>
           <div className="flex items-center gap-1.5">
             <CheckCircle2 size={14} className="text-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">NTS 데이터 연동</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


import React from 'react';
import { Lock, ShieldCheck, CreditCard, Building2, CheckCircle2, Loader2, AlertCircle, Store, ShoppingBag, UtensilsCrossed, Globe, Database, Cpu, Search, Sparkles, Clock, RefreshCw, CalendarDays, Zap } from 'lucide-react';

// --- 플랫폼 로고 컴포넌트 ---
const HometaxLogo = () => (
  <svg viewBox="0 0 100 60" className="w-14 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 25L30 10L55 25" stroke="#0066b3" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 25V35" stroke="#0066b3" strokeWidth="6" strokeLinecap="round"/>
    <text x="12" y="45" fill="#0066b3" style={{ font: 'bold 18px Arial' }}>Home</text>
    <text x="58" y="45" fill="#0066b3" style={{ font: 'bold 18px Arial' }}>tax</text>
    <text x="62" y="22" fill="#0066b3" style={{ font: 'bold 10px Pretendard' }}>홈택스</text>
    <path d="M60 48C70 55 85 55 92 48" stroke="#fbb03b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="94" cy="46" r="2.5" fill="#00a651"/>
  </svg>
);

const BaeminLogo = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#2AC1BC" fillOpacity="0.1" />
    <path d="M25 75C25 70 35 65 50 65H80C85 65 90 70 90 75V80H25V75Z" fill="#2AC1BC" />
    <rect x="68" y="48" width="22" height="18" rx="3" fill="#2AC1BC" stroke="white" strokeWidth="1.5" />
    <text x="71" y="60" fill="white" style={{ font: 'bold 8px Arial', letterSpacing: '-0.5px' }}>배민</text>
    <circle cx="35" cy="80" r="8" fill="#333" />
    <circle cx="35" cy="80" r="4" fill="#eee" />
    <circle cx="80" cy="80" r="8" fill="#333" />
    <circle cx="80" cy="80" r="4" fill="#eee" />
    <circle cx="48" cy="35" r="22" fill="#2AC1BC" />
    <circle cx="48" cy="38" r="17" fill="#f9dada" />
    <circle cx="42" cy="38" r="4" stroke="#333" strokeWidth="1.2" />
    <circle cx="54" cy="38" r="4" stroke="#333" strokeWidth="1.2" />
    <path d="M46 38H50" stroke="#333" strokeWidth="1.2" />
    <path d="M45 46C46.5 47.5 49.5 47.5 51 46" stroke="#333" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const YogiyoLogo = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#FA0050"/>
    <text x="50" y="58" fill="white" textAnchor="middle" style={{ font: 'bold 26px Pretendard, sans-serif', letterSpacing: '-1.5px' }}>요기요</text>
    <path d="M16 66C22 72 34 72 40 66" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
    <path d="M60 66C66 72 78 72 84 66" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
  </svg>
);

const CoupangEatsLogo = () => (
  <svg viewBox="0 0 100 80" className="w-16 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="30" style={{ font: 'bold 24px Arial, sans-serif', letterSpacing: '-1px' }}>
      <tspan fill="#f27321">c</tspan>
      <tspan fill="#4cb050">o</tspan>
      <tspan fill="#fdb913">u</tspan>
      <tspan fill="#f27321">p</tspan>
      <tspan fill="#fdb913">a</tspan>
      <tspan fill="#4cb050">n</tspan>
      <tspan fill="#00aeee">g</tspan>
    </text>
    <text x="5" y="65" fill="#7e5233" style={{ font: 'bold 42px Arial, sans-serif', letterSpacing: '-2px' }}>eats</text>
  </svg>
);

type ScrapingStatus = 'idle' | 'auth' | 'scraping' | 'processing' | 'done';

const ConnectData: React.FC = () => {
  // Hometax State
  const [hometaxId, setHometaxId] = React.useState('');
  const [hometaxPw, setHometaxPw] = React.useState('');
  const [isHTLoading, setIsHTLoading] = React.useState(false);
  const [isHTConnected, setIsHTConnected] = React.useState(false);

  // Baemin State
  const [baeminId, setBaeminId] = React.useState('');
  const [baeminPw, setBaeminPw] = React.useState('');
  const [bmStatus, setBmStatus] = React.useState<ScrapingStatus>('idle');
  const [bmProgress, setBmProgress] = React.useState(0);
  const [isBMConnected, setIsBMConnected] = React.useState(false);

  // Yogiyo State
  const [yogiyoId, setYogiyoId] = React.useState('');
  const [yogiyoPw, setYogiyoPw] = React.useState('');
  const [ygStatus, setYgStatus] = React.useState<ScrapingStatus>('idle');
  const [ygProgress, setYgProgress] = React.useState(0);
  const [isYGConnected, setIsYGConnected] = React.useState(false);

  // Coupang Eats State
  const [coupangId, setCoupangId] = React.useState('');
  const [coupangPw, setCoupangPw] = React.useState('');
  const [ceStatus, setCeStatus] = React.useState<ScrapingStatus>('idle');
  const [ceProgress, setCeProgress] = React.useState(0);
  const [isCEConnected, setIsCEConnected] = React.useState(false);

  // Global Refresh State
  const [isRefreshingAll, setIsRefreshingAll] = React.useState(false);

  const handleHTConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hometaxId || !hometaxPw) return;
    setIsHTLoading(true);
    setTimeout(() => {
      setIsHTLoading(false);
      setIsHTConnected(true);
    }, 1500);
  };

  const startScrapingSimulation = (
    setStatus: React.Dispatch<React.SetStateAction<ScrapingStatus>>,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    setConnected: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setConnected(false); // Reset to show animation
    setStatus('auth');
    setProgress(0);

    setTimeout(() => {
      setStatus('scraping');
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setStatus('processing');
          setTimeout(() => {
            setStatus('done');
            setConnected(true);
          }, 1000);
        }
        setProgress(progress);
      }, 200);
    }, 1000);
  };

  // Fix: Added missing handleBMConnect, handleCEConnect, and handleYGConnect handlers
  const handleBMConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baeminId || !baeminPw) return;
    startScrapingSimulation(setBmStatus, setBmProgress, setIsBMConnected);
  };

  const handleCEConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupangId || !coupangPw) return;
    startScrapingSimulation(setCeStatus, setCeProgress, setIsCEConnected);
  };

  const handleYGConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yogiyoId || !yogiyoPw) return;
    startScrapingSimulation(setYgStatus, setYgProgress, setIsYGConnected);
  };

  const handleRefreshAll = () => {
    setIsRefreshingAll(true);
    // 연동된 플랫폼들 순차적으로 리프레시 시뮬레이션
    if (isHTConnected) {
        setIsHTLoading(true);
        setTimeout(() => setIsHTLoading(false), 1500);
    }
    if (isBMConnected) startScrapingSimulation(setBmStatus, setBmProgress, setIsBMConnected);
    if (isCEConnected) startScrapingSimulation(setCeStatus, setCeProgress, setIsCEConnected);
    if (isYGConnected) startScrapingSimulation(setYgStatus, setYgProgress, setIsYGConnected);

    setTimeout(() => setIsRefreshingAll(false), 3000);
  };

  const getStatusText = (status: ScrapingStatus, progress: number, platform: string) => {
    switch(status) {
      case 'auth': return '보안 서버 인증 중...';
      case 'scraping': return `${platform} 실시간 데이터 수집 중... (${progress}%)`;
      case 'processing': return '수집 데이터 AI 분석 중...';
      default: return '';
    }
  };

  const getStatusIcon = (status: ScrapingStatus) => {
    switch(status) {
      case 'auth': return <ShieldCheck className="animate-pulse text-emerald-500" size={32} />;
      case 'scraping': return <Database className="animate-bounce text-blue-500" size={32} />;
      case 'processing': return <Cpu className="animate-spin text-amber-500" size={32} />;
      default: return null;
    }
  };

  const anyConnected = isHTConnected || isBMConnected || isCEConnected || isYGConnected;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">데이터 연동</h1>
          <p className="text-slate-500 font-medium">실시간 데이터 수집을 통해 가장 정확한 세무 분석을 제공합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshAll}
            disabled={!anyConnected || isRefreshingAll}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                !anyConnected 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {isRefreshingAll ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw className={isRefreshingAll ? 'animate-spin' : ''} size={18} />}
            전체 데이터 즉시 수집
          </button>
          <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 hidden md:flex">
            <Clock className="text-emerald-500" size={18} />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Auto Scraping</p>
              <p className="text-xs font-black text-emerald-800">매일 아침 09:00</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Hometax Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#0066b3] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <HometaxLogo />
                </div>
                <div>
                  <h2 className="font-bold text-white">국세청 홈택스</h2>
                  <p className="text-blue-100 text-[10px] font-medium">현금영수증 및 세금계산서 실시간 수집</p>
                </div>
              </div>
              {isHTConnected && <CheckBadge />}
            </div>
            <div className="p-6">
              {isHTConnected ? (
                <ConnectedState 
                    platform="홈택스" 
                    onReset={() => { setIsHTConnected(false); setHometaxId(''); setHometaxPw(''); }} 
                    onRefresh={() => { setIsHTLoading(true); setTimeout(() => setIsHTLoading(false), 1500); }}
                    loading={isHTLoading}
                />
              ) : (
                <ConnectionForm 
                  id={hometaxId} 
                  pw={hometaxPw} 
                  setId={setHometaxId} 
                  setPw={setHometaxPw} 
                  loading={isHTLoading} 
                  onSubmit={handleHTConnect}
                  color="hometax"
                  label="홈택스"
                />
              )}
            </div>
          </div>

          {/* 2. Baedal Minjok Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#2AC1BC] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-2xl flex items-center justify-center border border-white/10 shadow-sm">
                  <BaeminLogo />
                </div>
                <div>
                  <h2 className="font-bold text-white">배달의민족</h2>
                  <p className="text-emerald-50 text-[10px] font-medium">사장님광장 매출 및 정산 내역 수집</p>
                </div>
              </div>
              {isBMConnected && <CheckBadge />}
            </div>
            <div className="p-6">
              {isBMConnected ? (
                <ConnectedState 
                    platform="배민" 
                    onReset={() => { setIsBMConnected(false); setBaeminId(''); setBaeminPw(''); setBmStatus('idle'); }} 
                    onRefresh={() => startScrapingSimulation(setBmStatus, setBmProgress, setIsBMConnected)}
                    loading={bmStatus !== 'idle' && bmStatus !== 'done'}
                />
              ) : bmStatus !== 'idle' ? (
                <ScrapingView status={bmStatus} progress={bmProgress} platform="배민" color="#2AC1BC" icon={getStatusIcon(bmStatus)} text={getStatusText(bmStatus, bmProgress, "배민")} />
              ) : (
                <ConnectionForm 
                  id={baeminId} 
                  pw={baeminPw} 
                  setId={setBaeminId} 
                  setPw={setBaeminPw} 
                  loading={false} 
                  onSubmit={handleBMConnect}
                  color="baemin"
                  label="배민"
                />
              )}
            </div>
          </div>

          {/* 3. Coupang Eats Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#00AEEF] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-2xl flex items-center justify-center border border-white/10 shadow-sm">
                  <CoupangEatsLogo />
                </div>
                <div>
                  <h2 className="font-bold text-white">쿠팡이츠</h2>
                  <p className="text-sky-50 text-[10px] font-medium">쿠팡이츠 스토어 매출 및 정산 내역 수집</p>
                </div>
              </div>
              {isCEConnected && <CheckBadge />}
            </div>
            <div className="p-6">
              {isCEConnected ? (
                <ConnectedState 
                    platform="쿠팡이츠" 
                    onReset={() => { setIsCEConnected(false); setCoupangId(''); setCoupangPw(''); setCeStatus('idle'); }} 
                    onRefresh={() => startScrapingSimulation(setCeStatus, setCeProgress, setIsCEConnected)}
                    loading={ceStatus !== 'idle' && ceStatus !== 'done'}
                />
              ) : ceStatus !== 'idle' ? (
                <ScrapingView status={ceStatus} progress={ceProgress} platform="쿠팡이츠" color="#00AEEF" icon={getStatusIcon(ceStatus)} text={getStatusText(ceStatus, ceProgress, "쿠팡이츠")} />
              ) : (
                <ConnectionForm 
                  id={coupangId} 
                  pw={coupangPw} 
                  setId={setCoupangId} 
                  setPw={setCoupangPw} 
                  loading={false} 
                  onSubmit={handleCEConnect}
                  color="coupang"
                  label="쿠팡이츠"
                />
              )}
            </div>
          </div>

          {/* 4. Yogiyo Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#FA0050] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-2xl flex items-center justify-center border border-white/10 shadow-sm">
                  <YogiyoLogo />
                </div>
                <div>
                  <h2 className="font-bold text-white">요기요</h2>
                  <p className="text-pink-50 text-[10px] font-medium">요기요 사장님 매출 및 정산 데이터 연동</p>
                </div>
              </div>
              {isYGConnected && <CheckBadge />}
            </div>
            <div className="p-6">
              {isYGConnected ? (
                <ConnectedState 
                    platform="요기요" 
                    onReset={() => { setIsYGConnected(false); setYogiyoId(''); setYogiyoPw(''); setYgStatus('idle'); }} 
                    onRefresh={() => startScrapingSimulation(setYgStatus, setYgProgress, setIsYGConnected)}
                    loading={ygStatus !== 'idle' && ygStatus !== 'done'}
                />
              ) : ygStatus !== 'idle' ? (
                <ScrapingView status={ygStatus} progress={ygProgress} platform="요기요" color="#FA0050" icon={getStatusIcon(ygStatus)} text={getStatusText(ygStatus, ygProgress, "요기요")} />
              ) : (
                <ConnectionForm 
                  id={yogiyoId} 
                  pw={yogiyoPw} 
                  setId={setYogiyoId} 
                  setPw={setYogiyoPw} 
                  loading={false} 
                  onSubmit={handleYGConnect}
                  color="yogiyo"
                  label="요기요"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
                <Zap className="text-blue-200 fill-blue-200/20" size={32} />
                <h3 className="text-xl font-black">실시간 즉시 수집</h3>
                <p className="text-sm text-blue-100 leading-relaxed font-medium">
                    플랫폼의 정산 내역이 변경되었나요? '즉시 수집' 버튼을 누르면 Q-Tex AI가 지금 바로 데이터를 갱신합니다.
                </p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <RefreshCw size={150} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-500" /> 스크래핑 일정 안내
            </h3>
            <div className="space-y-5">
                <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                    <div>
                        <p className="text-xs font-black text-slate-800">매일 오전 09:00</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">전날의 누적 매출 및 정산 데이터를 수집하여 장부에 자동 반영합니다.</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="text-blue-400 mb-3" size={24} />
              <h4 className="font-bold text-sm mb-2">데이터 보안 보장</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                모든 수집 데이터는 강력한 보안 암호화를 거쳐 안전하게 관리됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckBadge = () => (
  <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm text-white">
    <CheckCircle2 size={12} /> 연동 완료
  </div>
);

const ConnectedState = ({ platform, onReset, onRefresh, loading }: { platform: string, onReset: () => void, onRefresh: () => void, loading: boolean }) => (
  <div className="py-4 space-y-5">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="font-black text-slate-800 text-sm">성공적으로 연동 중입니다.</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        <Clock size={10} /> 자동 수집 중
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">마지막 수집: 오늘 09:00</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onRefresh}
                disabled={loading}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm ${
                    loading 
                    ? 'bg-slate-100 text-slate-400 border-slate-100' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100 hover:shadow-blue-500/10'
                }`}
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />}
                즉시 수집
            </button>
            <button 
                onClick={onReset} 
                disabled={loading}
                className="px-4 py-2 text-slate-300 hover:text-red-500 text-xs font-black transition-colors disabled:opacity-30"
            >
                연동 해제
            </button>
        </div>
    </div>
  </div>
);

const ScrapingView = ({ status, progress, platform, color, icon, text }: any) => (
  <div className="py-10 text-center space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-center mb-2">
          {icon}
      </div>
      <div className="space-y-3">
          <p className="font-black text-slate-800 text-lg">{text}</p>
          <div className="max-w-md mx-auto h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${status === 'scraping' ? progress : status === 'auth' ? 20 : status === 'processing' ? 95 : 0}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80`
                  }}
              />
          </div>
      </div>
      <div className="flex items-center justify-center gap-4 pt-4">
          <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${status !== 'idle' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-400'}`}>1</div>
              <span className="text-[10px] font-bold text-slate-400">인증</span>
          </div>
          <div className="w-8 h-px bg-slate-200"></div>
          <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${status === 'scraping' || status === 'processing' ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 text-slate-400'}`}>2</div>
              <span className="text-[10px] font-bold text-slate-400">수집</span>
          </div>
          <div className="w-8 h-px bg-slate-200"></div>
          <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${status === 'processing' ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-400'}`}>3</div>
              <span className="text-[10px] font-bold text-slate-400">분석</span>
          </div>
      </div>
  </div>
);

const ConnectionForm = ({ id, pw, setId, setPw, loading, onSubmit, color, label }: any) => {
  const getBtnColor = () => {
    switch(color) {
      case 'hometax': return 'bg-[#0066b3] hover:bg-[#005596] shadow-blue-500/20';
      case 'baemin': return 'bg-[#2AC1BC] hover:bg-[#25aca7] shadow-emerald-500/10';
      case 'yogiyo': return 'bg-[#FA0050] hover:bg-[#e60049] shadow-pink-500/10';
      case 'coupang': return 'bg-[#00AEEF] hover:bg-[#008ec3] shadow-sky-500/10';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{label} 아이디</label>
          <input 
            type="text" 
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm font-bold"
            placeholder="ID 입력"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">{label} 비밀번호</label>
          <input 
            type="password" 
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm font-bold"
            placeholder="PW 입력"
            required
          />
        </div>
      </div>
      <button 
        type="submit"
        disabled={loading || !id || !pw}
        className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-200 shadow-none' : getBtnColor()}`}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
        {loading ? '인증 정보 확인 중...' : `${label} 안전하게 연동하기`}
      </button>
    </form>
  );
};

const PendingItem = ({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) => {
  const bgColors: any = { 
    orange: 'bg-orange-50 text-orange-500', 
    emerald: 'bg-emerald-50 text-emerald-500', 
    pink: 'bg-pink-50 text-pink-500',
    sky: 'bg-sky-50 text-sky-500'
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${bgColors[color] || 'bg-slate-100 text-slate-500'} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">준비 중</span>
    </div>
  );
};

export default ConnectData;

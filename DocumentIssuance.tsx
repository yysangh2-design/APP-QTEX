
import React from 'react';
import { FileBox, Download, FileText, CheckCircle2, Loader2, Clock, History, Search, ArrowRight, Printer, AlertCircle, X, ShieldCheck, Smartphone, User, Calendar, FileSearch, Fingerprint, MousePointer2, FileCheck } from 'lucide-react';

interface DocTemplate {
  id: string;
  title: string;
  desc: string;
  category: string;
}

const AVAILABLE_DOCS: DocTemplate[] = [
  { id: 'biz-reg', title: '사업자 등록증명', desc: '사업자 등록 사실을 증명하는 서류입니다.', category: '기본서류' },
  { id: 'vat-proof', title: '부가가치세 과세표준증명', desc: '신고된 부가가치세 매출액을 증명합니다.', category: '세무증명' },
  { id: 'income-proof', title: '소득금액증명', desc: '종합소득세 신고 소득을 증명하는 서류입니다.', category: '세무증명' },
  { id: 'tax-payment', title: '납세증명서(국세)', desc: '현재 국세 체납 사실이 없음을 증명합니다.', category: '납세증명' },
];

const CATEGORIES = ['전체', '기본서류', '세무증명', '납세증명'];

const AUTH_PROVIDERS = [
  { id: 'kakao', name: '카카오톡', color: 'bg-[#FEE500]', textColor: 'text-black', icon: <span className="font-black text-xs">TALK</span> },
  { id: 'naver', name: '네이버', color: 'bg-[#03C75A]', textColor: 'text-white', icon: <span className="font-black text-lg">N</span> },
  { id: 'toss', name: '토스', color: 'bg-white', textColor: 'text-blue-600', icon: <span className="font-black text-xs italic">toss</span> },
  { id: 'pass', name: 'PASS', color: 'bg-[#FA0029]', textColor: 'text-white', icon: <span className="font-black text-xs">PASS</span> },
];

const DocumentIssuance: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState('전체');
  const [docSearch, setDocSearch] = React.useState('');
  const [issuingId, setIssuingId] = React.useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const [authStep, setAuthStep] = React.useState<'select' | 'input' | 'waiting'>('select');
  
  const [history, setHistory] = React.useState([
    { id: 'REQ-001', name: '부가가치세 과세표준증명', date: '2026-01-20', status: '발급완료' },
    { id: 'REQ-002', name: '사업자 등록증명', date: '2026-01-15', status: '발급완료' },
  ]);

  const filteredDocs = AVAILABLE_DOCS.filter(doc => {
    const matchesCategory = activeCategory === '전체' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAuth = (id: string) => {
    setSelectedDocId(id);
    setShowAuthModal(true);
    setAuthStep('select');
  };

  const handleRequestAuth = () => {
    setAuthStep('waiting');
    setTimeout(() => handleIssuanceComplete(), 1500);
  };

  const handleIssuanceComplete = () => {
    setShowAuthModal(false);
    if (!selectedDocId) return;
    setIssuingId(selectedDocId);
    
    setTimeout(() => {
      const docName = AVAILABLE_DOCS.find(d => d.id === selectedDocId)?.title || '기타 증명서';
      const newEntry = {
        id: `REQ-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: docName,
        date: new Date().toISOString().split('T')[0],
        status: '발급완료'
      };
      setHistory([newEntry, ...history]);
      setIssuingId(null);
    }, 1500);
  };

  // Helper function to split name into two lines based on specific business keywords
  const formatDocName = (fullName: string) => {
    const keywords = ['부가가치세', '사업자', '소득금액', '납세증명서'];
    for (const key of keywords) {
      if (fullName.startsWith(key)) {
        const rest = fullName.replace(key, '').trim();
        return { main: key, sub: rest };
      }
    }
    return { main: fullName, sub: '' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16 px-1">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck size={14} /> Official Government Service
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">민원 서류 발급 센터</h1>
          <p className="text-slate-500 font-medium text-sm">홈택스 연동을 통해 법적 효력 있는 서류를 즉시 발급합니다.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Available Documents Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FileSearch size={20} className="text-blue-500" /> 발급 가능 서류
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="서류 검색..." 
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none w-48 md:w-80 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg uppercase border border-slate-100">{doc.category}</span>
                <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600">{doc.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed h-8 line-clamp-2">{doc.desc}</p>
              </div>
              <button 
                onClick={() => handleOpenAuth(doc.id)}
                disabled={issuingId !== null}
                className="mt-8 w-full py-4 rounded-2xl font-black text-xs bg-slate-900 text-white hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {issuingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {issuingId === doc.id ? '발급 중...' : '발급 신청'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* History Section - Updated Layout */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <History size={20} className="text-slate-400" /> 발급 히스토리
          </h2>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">번호</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">발급일자</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">서류 명칭</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">발급 상태</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((h) => {
                  const parts = formatDocName(h.name);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/30 transition-colors group">
                      {/* 번호: 1줄 */}
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-black text-slate-900 bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                          {h.id}
                        </span>
                      </td>
                      {/* 발급일자: 1줄 */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 whitespace-nowrap">
                          <Calendar size={12} className="text-slate-300" />
                          {h.date}
                        </div>
                      </td>
                      {/* 서류명: 균형있는 2줄 */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col text-left space-y-0.5 min-w-[140px]">
                          <span className="text-sm font-black text-slate-900 tracking-tight">{parts.main}</span>
                          {parts.sub && <span className="text-[11px] font-bold text-slate-500">{parts.sub}</span>}
                        </div>
                      </td>
                      {/* 발급상태: '발급'과 '완료' 2줄 표현 */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col text-left">
                          <div className="text-emerald-600 font-black text-[12px] leading-none mb-1">발급</div>
                          <div className="text-emerald-600 font-black text-[12px] leading-none flex items-center gap-1">
                            완료 <CheckCircle2 size={10} strokeWidth={3} />
                          </div>
                        </div>
                      </td>
                      {/* 관리: 상시 활성화된 버튼 */}
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all shadow-sm active:scale-95" title="인쇄">
                            <Printer size={16} />
                          </button>
                          <button className="p-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95" title="다운로드">
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex items-start gap-5 shadow-sm">
        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-black text-amber-900">서류 발급 안내 사항</h4>
          <p className="text-sm text-amber-700 font-medium leading-relaxed">
            발급된 서류는 국세청 서버의 데이터를 기반으로 생성됩니다. 매일 <span className="font-black underline">00:00 ~ 01:00</span> 사이에는 정부 시스템 점검으로 발급이 제한될 수 있습니다.
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800">본인 인증</h2>
                <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                  <X size={24} />
                </button>
             </div>
             {authStep === 'select' ? (
                <div className="space-y-6 text-center">
                  <p className="text-sm font-bold text-slate-500">인증 수단을 선택해 주세요</p>
                  <div className="grid grid-cols-2 gap-4">
                    {AUTH_PROVIDERS.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setAuthStep('input')} 
                        className={`p-5 rounded-2xl ${p.color} ${p.textColor} flex flex-col items-center gap-2 shadow-md hover:-translate-y-1 transition-all active:scale-95`}
                      >
                        {p.icon}
                        <span className="text-[11px] font-black uppercase tracking-widest">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
             ) : (
                <div className="space-y-8 text-center py-6">
                   <div className="relative w-20 h-20 mx-auto">
                      <Loader2 size={80} className="animate-spin text-blue-600 absolute inset-0" />
                      <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                         <Smartphone size={32} />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <p className="font-black text-slate-800 text-lg">인증 요청 중입니다</p>
                     <p className="text-xs text-slate-400 font-medium">스마트폰에서 승인 버튼을 눌러주세요.</p>
                   </div>
                   <button onClick={handleRequestAuth} className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                     인증 완료 확인
                   </button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentIssuance;

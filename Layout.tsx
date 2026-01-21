
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Receipt, FileText, MessageSquare, Link, Menu, X, Bell, Orbit, Megaphone, Users, FileSignature, TrendingUp, FilePlus, FileBox, UserCircle, CarFront, ChevronRight, Home, Crown, ClipboardCheck, PenTool, SquarePen } from 'lucide-react';

// Q-TEX 공식 로고 SVG 컴포넌트
const QTexLogo = ({ size = 40, showText = true, className = "" }: { size?: number, showText?: boolean, className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div style={{ width: size, height: size }} className="relative shrink-0">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Q Shape - Dark Navy */}
        <circle cx="50" cy="55" r="28" stroke="#1E293B" strokeWidth="11" />
        <path d="M68 73 L82 87" stroke="#1E293B" strokeWidth="11" strokeLinecap="round" />
        {/* Sky Blue Arrow */}
        <path d="M72 32 V10 M60 22 L72 10 L84 22" stroke="#38BDF8" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {showText && (
      <span className="text-xl lg:text-2xl font-black tracking-tight text-[#1E293B] font-sans uppercase">Q-Tex</span>
    )}
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
  onSubscribeClick?: () => void;
  profileImage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, onSubscribeClick, profileImage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // 사용자의 요청에 맞춰 재정렬된 메뉴 순서
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'sales', label: '매출내역', icon: TrendingUp },
    { id: 'expenses', label: '지출내역', icon: Receipt },
    { id: 'tax-report-form', label: '장부 작성', icon: SquarePen },
    { id: 'ai-consultation', label: 'AI 세무상담', icon: MessageSquare },
    { id: 'labor-cost', label: '인건비계산', icon: Users },
    { id: 'labor-contract', label: '근로계약서', icon: FileSignature },
    { id: 'tax-invoice', label: '계산서발행', icon: FilePlus },
    { id: 'doc-issuance', label: '서류발급', icon: FileBox },
    { id: 'driving-log', label: '주행일지', icon: CarFront },
    { id: 'tax-declaration', label: '세금신고', icon: ClipboardCheck },
    { id: 'connect', label: '데이터 연동', icon: Link },
    { id: 'mypage', label: '마이페이지', icon: UserCircle },
    { id: 'notices', label: '공지사항', icon: Megaphone },
    { id: 'reports', label: '세무 리포트', icon: FileText },
  ];

  // 하단 바 메뉴 구성 수정: 장부 작성(tax-report-form)과 세금신고(tax-declaration) 위치 교체
  const bottomNavIds = ['home', 'expenses', 'sales', 'tax-report-form', 'tax-declaration'];
  const bottomNavItems = bottomNavIds.map(id => navItems.find(item => item.id === id)).filter(Boolean);

  const handleViewChange = (id: ViewState) => {
    onViewChange(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] relative overflow-x-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .sidebar-transition {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 sidebar-transition lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/20' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 pb-6 flex items-center justify-between">
            <QTexLogo size={38} />
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 px-4 pb-8 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as ViewState)}
                  className={`
                    w-full flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-300 relative group
                    ${isActive 
                      ? 'bg-[#1E293B] text-white font-black shadow-lg border-t border-white/5' 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 hover:translate-x-1'}
                  `}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-[#38BDF8] scale-110' : 'text-slate-400 group-hover:scale-110'}`} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 w-1.5 h-5 bg-[#38BDF8] rounded-full -translate-x-1 shadow-[0_0_8px_#38BDF8] hidden lg:block" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 lg:bg-transparent lg:border-none">
          <div className="flex items-center gap-2 lg:gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <button 
              onClick={onSubscribeClick}
              className="flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-[#1E293B] text-white rounded-full transition-all shadow-lg active:scale-95 group shrink-0"
            >
              <Crown size={12} className="text-[#38BDF8] fill-[#38BDF8] group-hover:scale-120 transition-transform lg:w-3.5 lg:h-3.5" />
              <span className="text-[10px] lg:text-[11px] font-black tracking-tight whitespace-nowrap">PRO <span className="hidden xs:inline text-[#38BDF8]">멤버십</span></span>
            </button>
          </div>
          
          <div className="hidden lg:block text-sm font-black text-slate-800 bg-white px-6 py-2.5 rounded-full shadow-sm border border-slate-100">
             {navItems.find(i => i.id === activeView)?.label}
          </div>

          <div className="flex items-center gap-1.5 lg:gap-4">
            <button 
              onClick={() => handleViewChange('notices')}
              className="relative p-2 lg:p-3 text-slate-400 hover:bg-white hover:text-[#38BDF8] rounded-xl lg:rounded-2xl transition-all active:scale-90"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 lg:top-3 lg:right-3 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-[#38BDF8] rounded-full border-2 border-white animate-pulse" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button 
              onClick={() => handleViewChange('mypage')}
              className="flex items-center gap-2 lg:gap-3 p-1 bg-white rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
            >
              <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] lg:text-xs font-black text-slate-700 hidden sm:block px-1">마이페이지</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-10 pb-28 lg:pb-10 overflow-y-auto">
          {children}
        </main>

        <nav className="lg:hidden fixed bottom-4 inset-x-4 z-[40]">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-100 flex justify-around items-center h-16 px-2 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
            {bottomNavItems.map((item) => {
              const isActive = activeView === item!.id;
              const Icon = item!.icon;
              return (
                <button
                  key={item!.id}
                  onClick={() => handleViewChange(item!.id as ViewState)}
                  className={`relative flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#1E293B] -translate-y-4 shadow-xl shadow-slate-900/20' 
                      : 'text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                  {isActive && (
                    <div className="absolute -bottom-5 text-[9px] font-black text-[#1E293B] whitespace-nowrap tracking-tighter">
                      {item!.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;

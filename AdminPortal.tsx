
import React from 'react';
import { Users, UserCheck, CreditCard, Activity, Database, Cpu, MessageSquare, AlertCircle, RefreshCw, Search, ChevronRight, Globe, ShieldCheck, TrendingUp, Filter, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const USER_DATA = [
  { id: 'USR-001', name: '김택스', company: 'Q-Tex 테크놀로지', plan: 'PRO', status: 'Active', joined: '2025-11-01', connection: 'OK' },
  { id: 'USR-002', name: '이배민', company: '맛있는식당', plan: 'PRO', status: 'Active', joined: '2025-12-15', connection: 'Error' },
  { id: 'USR-003', name: '박사장', company: '대박카페', plan: 'Free', status: 'Idle', joined: '2026-01-05', connection: 'OK' },
  { id: 'USR-004', name: '최세무', company: '글로벌소프트', plan: 'PRO', status: 'Active', joined: '2026-01-10', connection: 'OK' },
  { id: 'USR-005', name: '정알바', company: '편의점강남', plan: 'Free', status: 'Active', joined: '2026-01-18', connection: 'OK' },
];

const STATS_CHART_DATA = [
  { name: '01/15', users: 400, ai: 240, scrap: 180 },
  { name: '01/16', users: 450, ai: 320, scrap: 210 },
  { name: '01/17', users: 520, ai: 480, scrap: 250 },
  { name: '01/18', users: 610, ai: 510, scrap: 310 },
  { name: '01/19', users: 700, ai: 450, scrap: 350 },
  { name: '01/20', users: 820, ai: 600, scrap: 420 },
];

const AdminPortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800">중앙 관리 대시보드</h1>
          <p className="text-slate-500 font-medium">Q-Tex 서비스의 전체 운영 상태와 데이터를 실시간으로 모니터링합니다.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={14} /> 시스템 리프레시
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg">
            <Activity size={14} /> 실시간 로그 보기
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="전체 사용자" value="1,284" sub="+12% vs last week" icon={<Users className="text-blue-600" />} color="blue" />
        <StatCard title="유료 구독자 (PRO)" value="452" sub="35.2% Conversion" icon={<UserCheck className="text-emerald-600" />} color="emerald" />
        <StatCard title="AI 세무 상담" value="24,592" sub="Gemini API Active" icon={<Cpu className="text-indigo-600" />} color="indigo" />
        <StatCard title="자동 스크래핑" value="98.2%" sub="Success Rate" icon={<Database className="text-amber-600" />} color="amber" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-lg font-black text-slate-800">시스템 트래픽 추이</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Growth & Usage Metrics</p>
               </div>
               <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black"><div className="w-2 h-2 bg-blue-600 rounded-full" /> 신규 가입</div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black"><div className="w-2 h-2 bg-indigo-600 rounded-full" /> AI 상담</div>
               </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={STATS_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="users" stroke="#2563eb" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                  <Area type="monotone" dataKey="ai" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAI)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
               <h3 className="font-black text-slate-800 flex items-center gap-2">
                 <Users size={20} className="text-blue-500" /> 전체 사용자 관리
               </h3>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                  type="text" 
                  placeholder="ID, 상호명 검색..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none w-64 transition-all"
                 />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">사용자 / 상호</th>
                    <th className="px-8 py-4">플랜</th>
                    <th className="px-8 py-4 text-center">연동상태</th>
                    <th className="px-8 py-4 text-right">가입일</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {USER_DATA.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-200 uppercase">{user.name[0]}</div>
                           <div>
                             <p className="text-sm font-black text-slate-800">{user.name}</p>
                             <p className="text-[10px] font-bold text-slate-400">{user.company}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${user.plan === 'PRO' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center">
                          {user.connection === 'OK' ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right text-xs font-bold text-slate-400">{user.joined}</td>
                      <td className="px-8 py-4 text-right">
                        <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><MoreHorizontal size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Platform Health Section */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10"><Database size={100} /></div>
             <div className="relative z-10">
               <h3 className="text-xl font-black">외부 연동 엔진 상태</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Platform Connectivity</p>
             </div>
             <div className="space-y-4 relative z-10">
               <PlatformStatus label="국세청 홈택스" status="stable" uptime="99.9%" />
               <PlatformStatus label="배달의민족" status="stable" uptime="99.5%" />
               <PlatformStatus label="쿠팡이츠" status="stable" uptime="99.2%" />
               <PlatformStatus label="요기요" status="warning" uptime="94.1%" />
             </div>
             <div className="pt-4 border-t border-white/10">
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">전체 연결 테스트 실행</button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <h3 className="font-black text-slate-800 flex items-center gap-2">
               <TrendingUp size={20} className="text-emerald-500" /> 매출 및 매출 비중
             </h3>
             <div className="space-y-5">
               <ProgressBar label="유료 구독 매출" value={72} color="bg-emerald-500" />
               <ProgressBar label="건당 세무 대행" value={18} color="bg-blue-500" />
               <ProgressBar label="기타 광고" value={10} color="bg-slate-200" />
             </div>
             <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">오늘 총 매출</span><span className="text-lg font-black text-slate-800">4,520,000원</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">전일 대비</span><span className="text-xs font-black text-emerald-500">+14.2%</span></div>
             </div>
          </div>

          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Globe size={180} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-xl font-black">글로벌 운영 가이드</h4>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">관리자 전용 보안 가이드를 숙지해 주세요. 모든 사용자 데이터 열람 기록은 로그로 저장됩니다.</p>
              <button className="flex items-center gap-2 text-[10px] font-black underline underline-offset-4 uppercase tracking-widest">운영 원칙 확인하기 <ChevronRight size={12} /></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, color }: { title: string, value: string, sub: string, icon: React.ReactNode, color: string }) => {
  const bgColors: any = { blue: 'bg-blue-50', emerald: 'bg-emerald-50', indigo: 'bg-indigo-50', amber: 'bg-amber-50' };
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-lg transition-all group">
      <div className={`${bgColors[color]} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-800">{value}</h4>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );
};

const PlatformStatus = ({ label, status, uptime }: { label: string, status: 'stable' | 'warning' | 'error', uptime: string }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
    <div className="flex items-center gap-3">
       <div className={`w-2 h-2 rounded-full ${status === 'stable' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 animate-pulse'}`} />
       <span className="text-sm font-black">{label}</span>
    </div>
    <span className="text-[10px] font-black text-slate-500">{uptime}</span>
  </div>
);

const ProgressBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="space-y-1.5">
     <div className="flex justify-between items-center px-1">
       <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
       <span className="text-[10px] font-black text-slate-800">{value}%</span>
     </div>
     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
       <div className={`h-full ${color} rounded-full`} style={{width: `${value}%`}} />
     </div>
  </div>
);

export default AdminPortal;

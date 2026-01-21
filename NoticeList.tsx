
import React from 'react';
import { Megaphone, ChevronRight, Calendar, Pin } from 'lucide-react';

const NOTICES = [
  {
    id: 1,
    title: '2026년 1월 부가가치세 확정신고 안내',
    date: '2026-01-05',
    category: '세무소식',
    important: true,
    content: '1월은 부가가치세 확정 신고의 달입니다. 홈택스 연동을 통해 누락 없는 신고를 준비하세요.'
  },
  {
    id: 2,
    title: 'Q-Tex 지능형 AI 분석 모델 업데이트 (v3.0)',
    date: '2025-12-28',
    category: '업데이트',
    important: false,
    content: '이제 더 정확한 경비 카테고리 분류와 개인화된 절세 팁을 제공합니다.'
  },
  {
    id: 3,
    title: '2026년 귀속 연말정산 미리보기 서비스 오픈',
    date: '2025-12-15',
    category: '서비스',
    important: false,
    content: '내년 예상 환급액을 미리 확인하고 남은 기간 절세 전략을 세워보세요.'
  }
];

const NoticeList: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          <Megaphone size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">공지사항</h1>
          <p className="text-slate-500 text-sm font-medium">Q-Tex의 최신 소식과 세무 정보를 확인하세요.</p>
        </div>
      </header>

      <div className="space-y-4">
        {NOTICES.map((notice) => (
          <button
            key={notice.id}
            className="w-full text-left bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group relative overflow-hidden"
          >
            {notice.important && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    notice.category === '세무소식' ? 'bg-emerald-50 text-emerald-600' : 
                    notice.category === '업데이트' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {notice.category}
                  </span>
                  {notice.important && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-blue-600">
                      <Pin size={10} /> 중요
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {notice.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-1 font-medium">{notice.content}</p>
              </div>
              
              <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={14} />
                  <span className="text-xs font-bold">{notice.date}</span>
                </div>
                <div className="p-2 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-100/50 p-8 rounded-[2.5rem] text-center border border-dashed border-slate-200 mt-12">
        <p className="text-slate-400 text-sm font-bold">더 이전의 공지사항은 고객센터에서 확인하실 수 있습니다.</p>
      </div>
    </div>
  );
};

export default NoticeList;

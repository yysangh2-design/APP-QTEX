
import React from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { analyzeExpense } from '../services/geminiService';

interface AnalysisResult {
  category: string;
  isDeductible: boolean;
  reason: string;
  taxSavingTip: string;
}

const AIAnalysis: React.FC = () => {
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!description || !amount) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeExpense(description, amount);
      setResult(data);
    } catch (err: any) {
      setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-bold mb-2">
          <Sparkles size={16} /> AI 지능형 비서
        </div>
        <h1 className="text-3xl font-black text-slate-800">AI 경비 분석 및 절세 추천</h1>
        <p className="text-slate-500">지출 내역을 입력하면 Gemini AI가 세무 분석을 도와드립니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">거래 명칭</label>
              <input 
                type="text" 
                placeholder="예: 스타벅스 강남점 미팅"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">지출 금액</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">원</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading || !description || !amount}
            className={`
              w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2
              ${loading || !description || !amount ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}
            `}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? '분석 중...' : '분석 시작하기'}
          </button>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-700 leading-relaxed">
              * AI의 분석은 참고용입니다. 실제 세무 신고 시에는 반드시 세무 전문가와 상담하시거나 국세청 기준을 확인하시기 바랍니다.
            </p>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          {!result && !loading && !error && (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Sparkles size={32} />
              </div>
              <p className="font-medium">분석 결과가 여기에 표시됩니다.</p>
            </div>
          )}

          {loading && (
            <div className="h-full bg-white/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <p className="font-bold text-slate-800">Gemini가 세무 데이터를 분석 중입니다...</p>
            </div>
          )}

          {error && (
            <div className="h-full bg-red-50 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4">
              <AlertCircle size={48} className="text-red-500" />
              <p className="font-bold text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-slate-800">분석 리포트</h3>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${result.isDeductible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {result.isDeductible ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {result.isDeductible ? '경비 처리 가능' : '경비 처리 주의'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-xs text-blue-500 font-bold mb-1">추천 카테고리</p>
                  <p className="text-lg font-black text-blue-900">{result.category}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold mb-1">예상 공제율</p>
                  <p className="text-lg font-black text-slate-900">{result.isDeductible ? '100%' : '0%'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                    <TrendingUp className="text-blue-600" size={18} /> 분석 근거
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {result.reason}
                  </p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-amber-600 mb-2">
                    <Sparkles size={18} /> 절세 꿀팁
                  </h4>
                  <p className="text-sm text-amber-900 leading-relaxed bg-amber-50 p-4 rounded-2xl border border-amber-100 font-medium">
                    {result.taxSavingTip}
                  </p>
                </div>
              </div>

              <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                이 결과로 장부 기입하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;

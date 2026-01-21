
import React from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Sparkles, User, MessageSquare, Loader2, Eraser, Info, ArrowUpRight, Calculator, Receipt } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIConsultation: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', text: '안녕하세요! 사장님. Q-Tex 지능형 세무 상담 비서입니다. 궁금하신 세무 관련 질문을 말씀해 주시면, 전문 세무사의 지식을 바탕으로 친절히 답변해 드리겠습니다. 😊' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 챗 세션 생성 (전문 세무사 페르소나 부여)
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `당신은 대한민국 전문 세무사 'Q-Tex AI'입니다. 
          사업자(주로 소상공인, 중소기업)들의 세무 고민을 해결해주는 것이 당신의 역할입니다. 
          당신의 서비스 이름은 'AI 세무상담'입니다.
          답변은 다음 원칙을 따릅니다:
          1. 항상 친절하고 정중한 어조를 유지하세요.
          2. 복잡한 세법 용어는 알기 쉽게 풀어서 설명하세요.
          3. 가능한 경우 구체적인 절세 팁이나 주의사항을 함께 제시하세요.
          4. 근거 법령이 필요한 경우 언급하되, 너무 딱딱하지 않게 전달하세요.
          5. 질문에 대해 마크다운 형식을 사용하여 가독성 있게 답변하세요 (리스트, 볼드체 등 활용).`,
        },
      });

      let fullResponse = "";
      const result = await chat.sendMessageStream({ message: text });
      
      // 스트리밍을 위해 빈 모델 메시지 미리 추가
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        const chunkText = chunk.text;
        fullResponse += chunkText;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'model') {
            return [...prev.slice(0, -1), { role: 'model', text: fullResponse }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("AI Consultation Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: '죄송합니다. 현재 상담이 폭주하여 일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { text: "부가세 절세 방법 알려줘", icon: <Receipt size={14} /> },
    { text: "종합소득세 신고 기간은?", icon: <Calculator size={14} /> },
    { text: "인건비 처리할 때 주의할 점", icon: <User size={14} /> },
    { text: "홈택스 데이터 연동은 왜 해야해?", icon: <ArrowUpRight size={14} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">AI 지능형 세무 상담</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Gemini Pro Powered
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: '대화가 초기화되었습니다. 어떤 내용이 궁금하신가요?' }])}
          className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
          title="대화 초기화"
        >
          <Eraser size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col mb-4">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-4 animate-in ${msg.role === 'user' ? 'flex-row-reverse slide-in-from-right-4' : 'slide-in-from-left-4'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              <div className={`max-w-[85%] lg:max-w-[75%] space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
                  {msg.role === 'user' ? 'You' : 'Q-Tex Tax AI'}
                </p>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                  {msg.role === 'model' && i === messages.length - 1 && loading && (
                    <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-1 align-middle"></span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && !messages[messages.length-1].text && (
            <div className="flex items-center gap-3 text-slate-400 animate-pulse p-4">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-bold tracking-tight">AI가 전문적인 답변을 구성하고 있습니다...</span>
            </div>
          )}
        </div>

        {/* Suggested Chips */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
          {quickQuestions.map((q, i) => (
            <button 
              key={i}
              onClick={() => handleSendMessage(q.text)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[11px] font-black text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              {q.icon} {q.text}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="세무 관련 고민을 무엇이든 물어보세요..."
              disabled={loading}
              className="w-full pl-6 pr-16 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 transition-all placeholder:text-slate-400"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                loading || !input.trim() 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-95'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Info size={14} className="text-slate-300" />
            <p className="text-[10px] text-slate-400 font-medium">AI의 답변은 참고용이며, 법적 효력이 없습니다. 전문 상담은 1:1 세무사 상담을 이용하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultation;

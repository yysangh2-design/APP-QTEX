
import React from 'react';
import { FilePlus, Send, History, Search, Download, CheckCircle2, X, Plus, AlertCircle, Building2, User, Users, Mail, MapPin, Eye, Image as ImageIcon, Share2, Loader2, Save, Calendar, Hash, Calculator, UserPlus } from 'lucide-react';
import { Transaction } from '../types';
import * as htmlToImage from 'html-to-image';

interface Client {
  id: string;
  name: string;
  businessNumber: string;
  ceoName: string;
  email: string;
  address: string;
}

interface InvoiceEntry {
  id: string;
  recipientName: string;
  businessNumber: string;
  amount: number;
  tax: number;
  date: string;
  status: '발송완료' | '승인대기' | '반려';
}

interface TaxInvoiceIssuerProps {
  onAddTransaction: (newTransaction: Transaction) => void;
}

const MOCK_INVOICES: InvoiceEntry[] = [
  { id: 'INV-001', recipientName: '(주)미래소프트', businessNumber: '123-45-67890', amount: 2000000, tax: 200000, date: '2026-01-10', status: '발송완료' },
  { id: 'INV-002', recipientName: '디지털플러스', businessNumber: '987-65-43210', amount: 1500000, tax: 150000, date: '2026-01-12', status: '승인대기' },
];

const TaxInvoiceIssuer: React.FC<TaxInvoiceIssuerProps> = ({ onAddTransaction }) => {
  const [invoices, setInvoices] = React.useState<InvoiceEntry[]>(MOCK_INVOICES);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceEntry | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // 사업자번호 3단 입력을 위한 Ref 및 상태
  const bizNumRef1 = React.useRef<HTMLInputElement>(null);
  const bizNumRef2 = React.useRef<HTMLInputElement>(null);
  const bizNumRef3 = React.useRef<HTMLInputElement>(null);
  const [bizNumParts, setBizNumParts] = React.useState({ p1: '', p2: '', p3: '' });

  // Form States
  const [clientForm, setClientForm] = React.useState({ name: '', businessNumber: '', ceoName: '', email: '', address: '' });
  const [formData, setFormData] = React.useState({ recipientName: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const invoiceRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const savedClients = JSON.parse(localStorage.getItem('qtex_clients') || '[]');
    setClients(savedClients);
  }, []);

  const handleBizNumChange = (part: 'p1' | 'p2' | 'p3', value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newParts = { ...bizNumParts, [part]: cleanValue };
    
    // 자동 포커스 이동
    if (part === 'p1' && cleanValue.length === 3) {
      bizNumRef2.current?.focus();
    } else if (part === 'p2' && cleanValue.length === 2) {
      bizNumRef3.current?.focus();
    }
    
    setBizNumParts(newParts);
  };

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(invoiceRef.current, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 3
      });
      const link = document.createElement('a');
      link.download = `tax-invoice-${selectedInvoice?.id || 'doc'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image generation failed', err);
      alert('이미지 생성에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const target = selectedInvoice || invoices[0];
    const shareData = {
      title: 'Q-Tex 전자세금계산서',
      text: `${target.recipientName}님께 발행된 세금계산서입니다.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('계산서 링크가 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      ...clientForm,
      id: `CLI-${Date.now()}`
    };
    const updatedClients = [newClient, ...clients];
    setClients(updatedClients);
    localStorage.setItem('qtex_clients', JSON.stringify(updatedClients));
    setClientForm({ name: '', businessNumber: '', ceoName: '', email: '', address: '' });
    setIsClientModalOpen(false);
    alert('거래처가 성공적으로 등록되었습니다.');
  };

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 사업자번호 합치기
    const finalBizNum = `${bizNumParts.p1}-${bizNumParts.p2}-${bizNumParts.p3}`;
    if (bizNumParts.p1.length < 3 || bizNumParts.p2.length < 2 || bizNumParts.p3.length < 5) {
      alert("사업자등록번호를 올바르게 입력해 주세요.");
      return;
    }

    const amount = Math.floor(Number(formData.amount));
    const tax = Math.floor(amount * 0.1);
    const totalAmount = amount + tax;
    
    const newInvoice: InvoiceEntry = {
      id: `INV-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      recipientName: formData.recipientName,
      businessNumber: finalBizNum,
      amount: amount,
      tax: tax,
      date: formData.date,
      status: '발송완료',
    };

    setInvoices([newInvoice, ...invoices]);
    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date: formData.date,
      description: formData.recipientName,
      amount: totalAmount,
      category: '매출',
      subCategory: '세금계산서',
      method: '계좌',
      type: 'income',
      merchantBizNum: finalBizNum
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData({ recipientName: '', amount: '', date: new Date().toISOString().split('T')[0] });
      setBizNumParts({ p1: '', p2: '', p3: '' });
    }, 1500);
  };

  const openPreview = (inv: InvoiceEntry) => {
    setSelectedInvoice(inv);
    setIsPreviewOpen(true);
  };

  const totalMonthlyAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print font-sans px-1">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
            <FilePlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">세금계산서 발행</h1>
            <p className="text-slate-500 text-sm font-medium">거래처에 전자세금계산서를 즉시 발행하고 관리하세요.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsClientModalOpen(true)} className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Users size={20} className="text-blue-500" /> 거래처 등록
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <Plus size={20} /> 새 세금계산서 작성
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print px-1">
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이번 달 발행 건수</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{invoices.length}</span>
            <span className="text-slate-400 font-bold">건</span>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2 md:col-span-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이번 달 총 발행액 (공급가액)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">{Math.floor(totalMonthlyAmount).toLocaleString()}</span>
            <span className="text-blue-200 font-bold text-xl">원</span>
          </div>
        </div>
      </div>

      <section className="space-y-4 no-print px-1">
        <div className="flex items-center justify-between ml-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <History size={18} className="text-slate-400" /> 최근 발행 내역
          </h2>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 w-[120px] border-r border-slate-100 text-center whitespace-nowrap">발행일자</th>
                  <th className="px-8 py-4 whitespace-nowrap">공급받는 자 (사업자번호)</th>
                  <th className="px-8 py-4 text-right whitespace-nowrap">공급가액</th>
                  <th className="px-8 py-4 text-right whitespace-nowrap">세액</th>
                  <th className="px-8 py-4 text-center whitespace-nowrap">상태</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5 text-xs font-bold text-slate-500 text-center border-r border-slate-100 whitespace-nowrap">{inv.date}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-800">{inv.recipientName}</span>
                      <span className="text-[10px] text-slate-400 font-medium ml-2">({inv.businessNumber})</span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 text-sm text-right whitespace-nowrap">{Math.floor(inv.amount).toLocaleString()}원</td>
                    <td className="px-8 py-5 font-bold text-slate-400 text-sm text-right whitespace-nowrap">{Math.floor(inv.tax).toLocaleString()}원</td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${inv.status === '발송완료' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {/* Fix: Finalized the truncated code for rendering action buttons */}
                        <button onClick={() => openPreview(inv)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all shadow-sm active:scale-95">
                          <Eye size={18} />
                        </button>
                        <button onClick={handleShare} className="p-2.5 text-slate-400 hover:text-emerald-600 bg-slate-50 rounded-xl transition-all shadow-sm active:scale-95">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Issuance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Plus size={20} /></div>
                  <div><h2 className="text-lg font-black text-slate-800">새 세금계산서 작성</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Tax Invoice</p></div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">공급받는 자 (상호)</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" placeholder="거래처명을 입력하세요" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업자등록번호</label>
                    <div className="flex items-center gap-2">
                      <input ref={bizNumRef1} type="tel" maxLength={3} value={bizNumParts.p1} onChange={e => handleBizNumChange('p1', e.target.value)} className="w-20 px-2 py-4 bg-slate-50 border-none rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-blue-100" placeholder="000" />
                      <span className="text-slate-300">-</span>
                      <input ref={bizNumRef2} type="tel" maxLength={2} value={bizNumParts.p2} onChange={e => handleBizNumChange('p2', e.target.value)} className="w-16 px-2 py-4 bg-slate-50 border-none rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-blue-100" placeholder="00" />
                      <span className="text-slate-300">-</span>
                      <input ref={bizNumRef3} type="tel" maxLength={5} value={bizNumParts.p3} onChange={e => handleBizNumChange('p3', e.target.value)} className="w-28 px-2 py-4 bg-slate-50 border-none rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-blue-100" placeholder="00000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">작성 일자</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">공급가액</label>
                      <div className="relative">
                        <Calculator className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-14 pr-12 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-blue-600" placeholder="0" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">원</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">합계 금액 (VAT 포함)</p>
                    <p className="text-2xl font-black text-blue-900">{formData.amount ? Math.floor(Number(formData.amount) * 1.1).toLocaleString() : '0'} 원</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">세액</p>
                    <p className="text-sm font-bold text-slate-600">{formData.amount ? Math.floor(Number(formData.amount) * 0.1).toLocaleString() : '0'} 원</p>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">취소</button>
               <button onClick={handleIssue} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"><Send size={18} /> 세금계산서 발행 및 발송</button>
            </div>
          </div>
        </div>
      )}

      {/* Client Registration Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg"><UserPlus size={20} /></div>
                  <h2 className="text-lg font-black text-slate-800">거래처 신규 등록</h2>
               </div>
               <button onClick={() => setIsClientModalOpen(false)} className="p-2.5 bg-white text-slate-400 rounded-xl hover:text-slate-600 shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleRegisterClient} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
               <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">상호명</label><input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" placeholder="예: (주)미래소프트" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업자번호</label><input type="text" required value={clientForm.businessNumber} onChange={e => setClientForm({...clientForm, businessNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" placeholder="000-00-00000" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대표자명</label><input type="text" required value={clientForm.ceoName} onChange={e => setClientForm({...clientForm, ceoName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 (수신용)</label><input type="email" required value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업장 주소</label><input type="text" required value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" /></div>
               </div>
               <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">거래처 저장</button>
            </form>
          </div>
        </div>
      )}

      {/* Preview / Download Modal */}
      {isPreviewOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[95vh]">
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between no-print shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg"><Eye size={16} /></div>
                 <h2 className="text-sm font-black">계산서 미리보기</h2>
               </div>
               <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-100 flex justify-center custom-scrollbar">
               <div ref={invoiceRef} className="bg-white shadow-2xl w-[210mm] min-h-[148mm] p-10 font-serif border border-slate-200 text-left">
                  <div className="flex justify-between items-start mb-8">
                     <div className="w-24 h-24 border-4 border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 font-black rotate-12 opacity-50"><span className="text-[10px]">Q-TEX</span><span className="text-[14px]">영수</span></div>
                     <div className="text-center flex-1"><h1 className="text-4xl font-black underline underline-offset-8 tracking-[0.5em]">세금계산서</h1><p className="mt-4 text-slate-400">(공급받는자 보관용)</p></div>
                     <div className="text-right text-xs font-mono">No. {selectedInvoice.id}</div>
                  </div>

                  <div className="grid grid-cols-2 border-2 border-black">
                     <div className="p-4 border-r-2 border-black space-y-4">
                        <p className="font-black border-b border-black pb-1">공급자</p>
                        <div className="text-[10pt] space-y-1">
                           <p>등록번호: 123-45-67890</p>
                           <p>상 호: Q-Tex 테크놀로지</p>
                           <p>성 명: 김 택 스</p>
                        </div>
                     </div>
                     <div className="p-4 space-y-4">
                        <p className="font-black border-b border-black pb-1">공급받는 자</p>
                        <div className="text-[10pt] space-y-1">
                           <p>등록번호: {selectedInvoice.businessNumber}</p>
                           <p>상 호: {selectedInvoice.recipientName}</p>
                           <p>성 명: 귀하</p>
                        </div>
                     </div>
                  </div>

                  <table className="w-full mt-8 border-collapse border-2 border-black text-[10pt]">
                     <thead>
                        <tr className="bg-slate-50 border-b-2 border-black h-10">
                           <th className="border-r border-black">작성일자</th>
                           <th className="border-r border-black">공급가액</th>
                           <th>세액</th>
                        </tr>
                     </thead>
                     <tbody className="text-center">
                        <tr className="h-12">
                           <td className="border-r border-black font-bold">{selectedInvoice.date}</td>
                           <td className="border-r border-black font-black text-right px-4">{Math.floor(selectedInvoice.amount).toLocaleString()}</td>
                           <td className="font-black text-right px-4">{Math.floor(selectedInvoice.tax).toLocaleString()}</td>
                        </tr>
                     </tbody>
                  </table>

                  <div className="mt-8 p-4 border-2 border-black bg-slate-50">
                     <div className="flex justify-between items-center">
                        <span className="font-black text-lg">합계금액</span>
                        <span className="text-2xl font-black">{Math.floor(selectedInvoice.amount + selectedInvoice.tax).toLocaleString()} 원</span>
                     </div>
                  </div>

                  <div className="mt-auto pt-10 text-[8pt] text-slate-400 text-center uppercase tracking-widest">Certified Digital Invoice by Q-Tex Ledger Engine</div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4 shrink-0 no-print">
               <button onClick={handleShare} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"><Share2 size={18} /> 링크 공유</button>
               <button onClick={handleDownloadImage} disabled={isDownloading} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                 {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} 이미지로 저장
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoiceIssuer;

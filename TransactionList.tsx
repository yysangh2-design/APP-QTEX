
import React from 'react';
import { Search, Plus, ChevronRight, X, Loader2, Sparkles, AlertCircle, CreditCard, FileText, Banknote, Store, Receipt as ReceiptIcon, Camera, RefreshCw, FileUp, CheckCircle2, AlertTriangle, CheckSquare, Square, FileCheck, Users, Filter, FlipHorizontal as FlipCamera, FileSpreadsheet, Info, Check, Image as ImageIcon, Building2, User, Hash, AlertOctagon, ShieldCheck, Wallet, Calculator, Heart, Gift, TrendingUp, Printer, Download, Eye, EyeOff, Bot, Trash2, Landmark, BadgePercent, Save, Tag, Edit3, Circle, XCircle, Scale, UserCheck, HeartHandshake, Smile, ImagePlus, Smartphone } from 'lucide-react';
import { TAX_CATEGORIES } from '../constants';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';
import { analyzeReceiptImage, analyzeBatchTransactions, analyzeBankStatement } from '../services/geminiService';

interface TransactionListProps {
  mode: 'income' | 'expense';
  transactions: Transaction[];
  onTransactionsUpdate: (updated: Transaction[]) => void;
}

type TaxFilterType = 'all' | 'vat-ok' | 'vat-no' | 'income-ok' | 'income-no';
type PreviewFilterMode = 'all' | 'duplicate' | 'lowRelevance';

interface PendingExcelTransaction extends Transaction {
  isDuplicate: boolean;
  selected: boolean;
  isLowBusinessRelevance: boolean; 
}

interface PendingBankTransaction {
  id: string;
  date: string;
  depositor: string;
  amount: number;
  isCashSale: boolean; 
}

const VAT_NON_DEDUCTIBLE_KEYWORDS = [
  '오락', '병원', '의원', '약국', '주점', '골프장', '백화점', '금은방', '나이키', '아디다스', 
  '피부샵', '피부과', '안과', '성형외과', '산부인과', '내과', '외과', '치과', '골프', 
  '여행사', '여행', '투어', '발트페이', 'ktx', '놀이공원', '롯데월드', '스키', '스포츠', '테니스'
];

const INCOME_TAX_NON_DEDUCTIBLE_KEYWORDS = [
  '골프장', '백화점', '피부샵', '피부과', '놀이공원', '마트', '금은방', '쇼핑', '의류', '스키', '여행사', '여행', '투어'
];

const EXPENSE_ACCOUNTS = ['식대(복리후생비)', '여비교통비', '차량유지비', '소모품비', '지급임차료', '통신비', '수도광열비', '세금과공과', '광고선전비', '수수료비용', '기타'];

const TransactionList: React.FC<TransactionListProps> = ({ mode, transactions, onTransactionsUpdate }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [subFilter, setSubFilter] = React.useState<string>('전체');
  const [taxFilter, setTaxFilter] = React.useState<TaxFilterType>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = React.useState(false);
  const [isBankAdjustmentOpen, setIsBankAdjustmentOpen] = React.useState(false);
  const [previewFilter, setPreviewFilter] = React.useState<PreviewFilterMode>('all');
  
  const [pendingExcelTxs, setPendingExcelTxs] = React.useState<PendingExcelTransaction[]>([]);
  const [pendingBankTxs, setPendingBankTxs] = React.useState<PendingBankTransaction[]>([]);
  
  const [isAiAnalyzing, setIsAiAnalyzing] = React.useState(false);
  const [isReceiptAnalyzing, setIsReceiptAnalyzing] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const excelInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const bankExcelInputRef = React.useRef<HTMLInputElement>(null);
  const evidenceInputRef = React.useRef<HTMLInputElement>(null);

  const bizNumRef1 = React.useRef<HTMLInputElement>(null);
  const bizNumRef2 = React.useRef<HTMLInputElement>(null);
  const bizNumRef3 = React.useRef<HTMLInputElement>(null);

  const [bizNumParts, setBizNumParts] = React.useState({ p1: '', p2: '', p3: '' });
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    tax: '0',
    category: mode === 'income' ? '매출' : '매입',
    subCategory: '',
    accountName: '기타',
    method: '카드' as const,
    isVatDeductible: true,
    isIncomeTaxDeductible: true,
    cardNumber: '',
    merchantBizNum: '',
    eventPerson: '',
    eventType: '결혼',
    eventRelation: '거래처',
    evidenceImage: '',
    evidenceType: ''
  });

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [mode, subFilter, taxFilter]);

  const taxExpertData = React.useMemo(() => {
    const totalSales = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const deemedQualifyingPurchase = transactions
      .filter(t => t.type === 'expense' && t.subCategory === '계산서')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const limitAmt = totalSales * 0.5;
    const finalQualifyingAmt = Math.min(deemedQualifyingPurchase, limitAmt);
    const deemedInputTax = Math.floor(finalQualifyingAmt * (9 / 109));

    const congratulatoryTxs = transactions.filter(t => t.subCategory === '경조사비');
    const congratulatoryTotal = congratulatoryTxs.reduce((sum, t) => sum + t.amount, 0);
    const congratulatoryViolations = congratulatoryTxs.filter(t => t.amount > 200000).length;

    return {
      totalSales,
      deemedQualifyingPurchase,
      deemedInputTax,
      limitAmt,
      congratulatoryTotal,
      congratulatoryViolations
    };
  }, [transactions]);

  const handleOpenAddModal = (sub: string) => {
    const isVatExempt = ['현금', '계산서', '인건비', '경조사비', '단순현금'].includes(sub);
    setFormData(prev => ({
      ...prev,
      subCategory: sub,
      accountName: sub === '인건비' ? '급여/임금' : sub === '경조사비' ? '기업업무추진비' : '기타',
      category: mode === 'income' ? '매출' : '매입',
      description: '',
      amount: sub === '경조사비' ? '100000' : '',
      tax: '0',
      isVatDeductible: !isVatExempt,
      isIncomeTaxDeductible: true,
      cardNumber: '',
      merchantBizNum: '',
      eventPerson: '',
      eventType: '결혼',
      eventRelation: '거래처',
      evidenceImage: '',
      evidenceType: ''
    }));
    setBizNumParts({ p1: '', p2: '', p3: '' });
    setIsModalOpen(true);
  };

  const handleEvidenceUpload = (type: string) => {
    setFormData(prev => ({ ...prev, evidenceType: type }));
    evidenceInputRef.current?.click();
  };

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, evidenceImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = () => {
    let description = formData.description;
    
    if (formData.subCategory === '경조사비') {
      if (!formData.eventPerson) {
        alert("경조사 대상자를 입력해주세요.");
        return;
      }
      description = `[${formData.eventType}] ${formData.eventPerson} (${formData.eventRelation})`;
    }

    if (!description || !formData.amount) {
      alert("내용과 금액을 입력해주세요.");
      return;
    }

    const finalBizNum = `${bizNumParts.p1}-${bizNumParts.p2}-${bizNumParts.p3}`;
    const cleanBizNum = finalBizNum.replace(/--/g, '').replace(/^-|-$/g, '');
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: formData.date,
      description: description,
      amount: Number(formData.amount),
      vat: Number(formData.tax),
      category: formData.category,
      subCategory: formData.subCategory,
      accountName: formData.accountName,
      method: (formData.subCategory === '카드') ? '카드' : (formData.subCategory === '현금' || formData.subCategory === '현금영수증' || formData.subCategory === '단순현금') ? '현금' : '계좌',
      type: mode,
      isVatDeductible: formData.isVatDeductible,
      isIncomeTaxDeductible: formData.isIncomeTaxDeductible,
      cardNumber: formData.cardNumber,
      merchantBizNum: cleanBizNum || formData.merchantBizNum,
      evidenceImage: formData.evidenceImage,
      evidenceType: formData.evidenceType
    };
    onTransactionsUpdate([newTransaction, ...transactions]);
    setIsModalOpen(false);
  };

  const handleBizNumChange = (part: 'p1' | 'p2' | 'p3', value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newParts = { ...bizNumParts, [part]: cleanValue };
    if (part === 'p1' && cleanValue.length === 3) bizNumRef2.current?.focus();
    else if (part === 'p2' && cleanValue.length === 2) bizNumRef3.current?.focus();
    setBizNumParts(newParts);
  };

  const handleReceiptImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReceiptAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target?.result as string;
      try {
        const result = await analyzeReceiptImage(base64Data);
        if (result) {
          const aiResBatch = await analyzeBatchTransactions([{ description: result.supplierName, amount: result.amount }]);
          const aiRes = aiResBatch[0];
          const desc = result.supplierName || '상호미상';
          const amt = Number(result.amount || 0);
          const vat = Number(result.tax || 0);
          const isLowBusinessRelevance = aiRes ? !aiRes.isIncomeTaxDeductible : false;
          let isVatDeductible = vat > 0;
          if (VAT_NON_DEDUCTIBLE_KEYWORDS.some(k => desc.includes(k))) isVatDeductible = false;
          let isIncomeTaxDeductible = true;
          if (INCOME_TAX_NON_DEDUCTIBLE_KEYWORDS.some(k => desc.includes(k))) isIncomeTaxDeductible = false;
          
          if (isLowBusinessRelevance) { isVatDeductible = false; isIncomeTaxDeductible = false; }

          const newPending: PendingExcelTransaction = {
            id: `IMG-${Date.now()}`,
            date: result.date || new Date().toISOString().split('T')[0],
            description: desc,
            amount: amt,
            vat: vat,
            category: '매입',
            subCategory: aiRes?.suggestedCategory || '카드',
            accountName: aiRes?.suggestedAccount || '기타',
            method: '카드',
            type: 'expense',
            isVatDeductible,
            isIncomeTaxDeductible,
            isDuplicate: false,
            selected: true,
            isLowBusinessRelevance,
            merchantBizNum: result.supplierBizNum || ''
          };
          setPendingExcelTxs([newPending]);
          setIsExcelPreviewOpen(true);
          setIsModalOpen(false);
          setPreviewFilter('all');
        }
      } catch (error) { console.error(error); alert("분석 중 오류가 발생했습니다."); } finally { setIsReceiptAnalyzing(false); }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      setIsAiAnalyzing(true);
      
      if (mode === 'income' && formData.subCategory === '단순현금') {
        try {
          const dataRows = (rawRows[0] && isNaN(Date.parse(rawRows[0][0]))) ? rawRows.slice(1) : rawRows;
          const bankTxs: PendingBankTransaction[] = dataRows.map((row, idx) => ({
            id: `BANK-${Date.now()}-${idx}`,
            date: (row[0] || new Date().toISOString().split('T')[0]).toString(),
            depositor: (row[1] || '미상').toString(),
            amount: Number(row[2] || 0),
            isCashSale: true
          }));
          setPendingBankTxs(bankTxs);
          setIsBankAdjustmentOpen(true);
          setIsModalOpen(false);
        } catch (err) { console.error(err); } finally { setIsAiAnalyzing(false); }
        return;
      }

      const dataRows = (rawRows[0] && isNaN(Date.parse(rawRows[0][0]))) ? rawRows.slice(1) : rawRows;
      const itemsToAnalyze = dataRows.map(row => ({ description: (row[4] || '').toString(), amount: Number(row[1] || 0) }));
      
      try {
        const aiResults = await analyzeBatchTransactions(itemsToAnalyze);
        const seenInBatch = new Set<string>();
        
        const newPendingTxs: PendingExcelTransaction[] = dataRows.map((row, idx) => {
          const dateStr = (row[0] || new Date().toISOString().split('T')[0]).toString();
          const amt = Number(row[1] || 0);
          const vat = Number(row[2] || 0);
          const cardNum = (row[3] || '').toString();
          const desc = (row[4] || '').toString();
          const bizNum = (row[5] || '').toString();
          const aiRes = aiResults[idx];
          
          // 사업무관의심 판단
          const isLowBusinessRelevance = aiRes ? !aiRes.isIncomeTaxDeductible : false;
          
          let isVatDeductible = vat > 0;
          if (VAT_NON_DEDUCTIBLE_KEYWORDS.some(k => desc.toLowerCase().includes(k.toLowerCase()))) isVatDeductible = false;
          
          let isIncomeTaxDeductible = true;
          if (INCOME_TAX_NON_DEDUCTIBLE_KEYWORDS.some(k => desc.toLowerCase().includes(k.toLowerCase()))) isIncomeTaxDeductible = false;
          
          // 요청사항: 사업무관의심은 부가세불공, 종소세불인으로 표현
          if (isLowBusinessRelevance) { 
            isVatDeductible = false; 
            isIncomeTaxDeductible = false; 
          }

          const duplicateKey = `${dateStr}-${desc}-${cardNum}-${amt}`;
          const isExistingDuplicate = transactions.some(t => t.date === dateStr && t.description === desc && (t.cardNumber || '') === cardNum && t.amount === amt);
          let isInternalDuplicate = false;
          if (seenInBatch.has(duplicateKey)) isInternalDuplicate = true;
          else seenInBatch.add(duplicateKey);
          
          const isDuplicate = isExistingDuplicate || isInternalDuplicate;
          
          return {
            id: `EXCEL-${Date.now()}-${idx}`,
            date: dateStr,
            description: desc,
            amount: amt,
            vat: vat,
            cardNumber: cardNum,
            merchantBizNum: bizNum,
            category: '매입',
            subCategory: aiRes?.suggestedCategory || '카드',
            accountName: aiRes?.suggestedAccount || '기타',
            method: '카드',
            type: 'expense',
            isVatDeductible,
            isIncomeTaxDeductible,
            isDuplicate,
            selected: !isDuplicate, // 중복인 경우 자동 선택 해제
            isLowBusinessRelevance
          };
        });
        setPendingExcelTxs(newPendingTxs);
        setIsExcelPreviewOpen(true);
        setIsModalOpen(false);
        setPreviewFilter('all');
      } catch (err) { console.error(err); } finally { setIsAiAnalyzing(false); }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  const handleBulkAddPending = () => {
    const selected = pendingExcelTxs.filter(t => t.selected);
    if (selected.length === 0) { alert("선택된 내역이 없습니다."); return; }
    const cleanSelected = selected.map(({ selected, isDuplicate, isLowBusinessRelevance, ...rest }) => rest as Transaction);
    onTransactionsUpdate([...cleanSelected, ...transactions]);
    setIsExcelPreviewOpen(false);
    setPendingExcelTxs([]);
    alert(`${cleanSelected.length}건의 내역이 장부에 등록되었습니다.`);
  };

  const handleBulkAddBankPending = () => {
    const selected = pendingBankTxs.filter(t => t.isCashSale);
    if (selected.length === 0) { alert("현금매출로 선택된 내역이 없습니다."); return; }
    const newTxs: Transaction[] = selected.map(s => ({ id: s.id, date: s.date, description: s.depositor, amount: s.amount, vat: 0, category: '매출', subCategory: '단순현금', method: '현금', type: 'income' }));
    onTransactionsUpdate([...newTxs, ...transactions]);
    setIsBankAdjustmentOpen(false);
    setPendingBankTxs([]);
    alert(`${newTxs.length}건의 현금매출이 등록되었습니다.`);
  };

  const togglePendingSelect = (id: string) => setPendingExcelTxs(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  const toggleBankCashSale = (id: string) => setPendingBankTxs(prev => prev.map(t => t.id === id ? { ...t, isCashSale: !t.isCashSale } : t));
  const togglePendingTax = (id: string, field: 'isVatDeductible' | 'isIncomeTaxDeductible') => setPendingExcelTxs(prev => prev.map(t => t.id === id ? { ...t, [field]: !t[field] } : t));

  const handleDeleteTransaction = (id: string) => {
    if (confirm('해당 내역을 삭제하시겠습니까?')) {
      onTransactionsUpdate(transactions.filter(t => t.id !== id));
      const nextSel = new Set(selectedIds); nextSel.delete(id); setSelectedIds(nextSel);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`선택한 ${selectedIds.size}건의 내역을 모두 삭제하시겠습니까?`)) {
      onTransactionsUpdate(transactions.filter(t => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
    }
  };

  const filtered = transactions.filter(t => {
    const matchesMode = t.type === mode;
    const matchesSubFilter = subFilter === '전체' || t.subCategory === subFilter;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesTaxFilter = true;
    if (mode === 'expense') {
      if (taxFilter === 'vat-ok') matchesTaxFilter = t.isVatDeductible === true;
      else if (taxFilter === 'vat-no') matchesTaxFilter = t.isVatDeductible === false;
      else if (taxFilter === 'income-ok') matchesTaxFilter = t.isIncomeTaxDeductible === true;
      else if (taxFilter === 'income-no') matchesTaxFilter = t.isIncomeTaxDeductible === false;
    }
    return matchesMode && matchesSubFilter && matchesSearch && matchesTaxFilter;
  });

  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

  const filteredPending = pendingExcelTxs.filter(t => {
    if (previewFilter === 'duplicate') return t.isDuplicate;
    if (previewFilter === 'lowRelevance') return t.isLowBusinessRelevance;
    return true;
  });

  const counts = {
    total: pendingExcelTxs.length,
    duplicate: pendingExcelTxs.filter(t => t.isDuplicate).length,
    lowRelevance: pendingExcelTxs.filter(t => t.isLowBusinessRelevance).length
  };

  const toggleTaxStatus = (id: string, field: 'isVatDeductible' | 'isIncomeTaxDeductible') => {
    const updated = transactions.map(t => t.id === id ? { ...t, [field]: !t[field] } : t);
    onTransactionsUpdate(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-x-hidden">
      <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
      <input type="file" ref={bankExcelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleReceiptImageAnalysis} />
      <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handleReceiptImageAnalysis} />
      <input type="file" ref={evidenceInputRef} className="hidden" accept="image/*" onChange={handleEvidenceFileChange} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div className="space-y-4">
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{mode === 'income' ? '매출 내역' : '지출 내역'}</h1>
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {TAX_CATEGORIES[mode === 'income' ? '매출' : '매입']
              .filter(sub => !(mode === 'income' && sub === '카드'))
              .map((sub) => (
              <button key={sub} onClick={() => handleOpenAddModal(sub)} className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all bg-white text-slate-700 border-2 border-slate-100 hover:border-blue-500 shadow-sm">
                <Plus size={14} /> {sub}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <button onClick={handleBulkDelete} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 text-white font-black text-xs transition-all hover:bg-rose-700 shadow-lg shadow-rose-500/20 active:scale-95 animate-in zoom-in-95">
            <Trash2 size={14} /> 선택 {selectedIds.size}건 삭제하기
          </button>
        )}
      </div>

      <div className="px-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {['전체', ...TAX_CATEGORIES[mode === 'income' ? '매출' : '매입']].map(opt => (
                <button key={opt} onClick={() => setSubFilter(opt)} className={`px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border-2 ${subFilter === opt ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-400'}`}>
                    {opt}
                </button>
            ))}
        </div>

        <div className={`p-6 lg:p-10 rounded-[2.5rem] border shadow-xl relative overflow-hidden transition-all duration-500 ${mode === 'income' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-900 border-slate-800 text-white'}`}>
            {mode === 'expense' && ['전체', '카드', '세금계산서', '현금'].includes(subFilter) && (
              <div className="absolute top-6 right-6 z-20 flex gap-1.5 flex-wrap justify-end max-w-[250px] md:max-w-none">
                <TaxSmallBtn active={taxFilter === 'all'} label="전체" onClick={() => setTaxFilter('all')} type="all" />
                <TaxSmallBtn active={taxFilter === 'vat-ok'} label="부가세공제" onClick={() => setTaxFilter('vat-ok')} type="ok" />
                <TaxSmallBtn active={taxFilter === 'vat-no'} label="부가세불공" onClick={() => setTaxFilter('vat-no')} type="no" />
                <TaxSmallBtn active={taxFilter === 'income-ok'} label="종소세인정" onClick={() => setTaxFilter('income-ok')} type="ok" />
                <TaxSmallBtn active={taxFilter === 'income-no'} label="종소세불인" onClick={() => setTaxFilter('income-no')} type="no" />
              </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${mode === 'income' ? 'text-emerald-600' : 'text-slate-400'}`}>{subFilter} {mode === 'income' ? '매출' : '지출'} 총액</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl lg:text-6xl font-black tracking-tighter ${mode === 'income' ? 'text-emerald-700' : 'text-white'}`}>{totalAmount.toLocaleString()}</span>
                    <span className="font-bold text-lg opacity-60">원</span>
                </div>
              </div>

              {mode === 'expense' && (
                <div className="flex flex-col md:flex-row gap-3 animate-in slide-in-from-right-4 duration-1000 md:ml-auto">
                   {subFilter === '계산서' && (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-blue-400" />
                          <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest">2026 의제매입세액 검토</h4>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium">한도: {Math.floor(taxExpertData.limitAmt/10000).toLocaleString()}만</p>
                            <p className="text-base font-black text-emerald-400">+{taxExpertData.deemedInputTax.toLocaleString()} <span className="text-[9px] font-bold opacity-60">원 예상</span></p>
                          </div>
                          <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">공제 9/109</span>
                        </div>
                    </div>
                   )}
                   
                   {subFilter === '경조사비' && (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-amber-400" />
                          <h4 className="text-[10px] font-black text-amber-200 uppercase tracking-widest">2026 경조사비 관리</h4>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium">총 지출: {taxExpertData.congratulatoryTotal.toLocaleString()}원</p>
                            <p className={`text-base font-black ${taxExpertData.congratulatoryViolations > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                               {taxExpertData.congratulatoryViolations > 0 ? `${taxExpertData.congratulatoryViolations}건 한도초과` : '전건 손금인정'} 
                            </p>
                          </div>
                          <span className="text-[8px] font-black bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">건당 20만限</span>
                        </div>
                    </div>
                   )}
                </div>
              )}
            </div>

            <div className="w-full mt-8 relative z-10">
                <div className="relative">
                    <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`} />
                    <input type="text" placeholder="내역 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-bold outline-none border-none shadow-inner bg-white text-slate-800`} />
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-2 py-2.5 w-8 text-center">
                <button onClick={() => { const ids = filtered.map(t => t.id); if (ids.every(id => selectedIds.has(id))) { const next = new Set(selectedIds); ids.forEach(id => next.delete(id)); setSelectedIds(next); } else { const next = new Set(selectedIds); ids.forEach(id => next.add(id)); setSelectedIds(next); } }} className="text-blue-600">
                  {filtered.length > 0 && filtered.every(t => selectedIds.has(t.id)) ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
              </th>
              <th className="px-2 py-2.5 w-14 text-center">일시</th>
              <th className="px-2 py-2.5 w-24">상호/내용</th>
              <th className="px-2 py-2.5 w-24 text-center">증빙 / 계정과목</th>
              <th className="px-2 py-2.5 text-right w-20">결재금액</th>
              <th className="px-2 py-2.5 text-right w-16">부가세</th>
              {mode === 'expense' && <th className="px-2 py-2.5 text-center w-24">세무상태</th>}
              <th className="px-2 py-2.5 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item) => {
              const isItemSelected = selectedIds.has(item.id);
              return (
                <tr key={item.id} className={`hover:bg-blue-50/20 transition-colors group ${isItemSelected ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => { const next = new Set(selectedIds); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); setSelectedIds(next); }} className={isItemSelected ? 'text-blue-600' : 'text-slate-200'}>
                      {isItemSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-2 py-1 text-[8px] font-bold text-slate-400 text-center whitespace-nowrap tracking-tighter">{item.date.slice(2).replace(/-/g, '.')}</td>
                  <td className="px-2 py-1">
                    <div className="flex flex-col max-w-[80px]">
                      <span className="text-[10px] font-black text-slate-800 truncate leading-tight">{item.description}</span>
                      {item.evidenceImage && (
                        <div className="flex items-center gap-1 mt-0.5">
                           <span className="text-[7px] px-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded font-black">{item.evidenceType} 증빙</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center"><div className="flex items-center justify-center gap-1.5 whitespace-nowrap text-[9px] font-black"><span className="text-slate-500">{item.subCategory}</span>{item.type === 'expense' && <><span className="text-slate-300">/</span><span className="text-indigo-600">{item.accountName || '기타'}</span></>}</div></td>
                  <td className="px-2 py-1 text-right text-[10px] font-black text-slate-900">{item.amount.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-[9px] font-black text-blue-500">{item.vat ? item.vat.toLocaleString() : '0'}</td>
                  {mode === 'expense' && (
                    <td className="px-2 py-1 text-center">
                      <div className="flex gap-1 justify-center items-center">
                        <button onClick={() => toggleTaxStatus(item.id, 'isVatDeductible')} className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black border transition-all ${item.isVatDeductible ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-100 opacity-60'}`}>부가세</button>
                        <button onClick={() => toggleTaxStatus(item.id, 'isIncomeTaxDeductible')} className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black border transition-all ${item.isIncomeTaxDeductible ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-100 opacity-60'}`}>종소세</button>
                      </div>
                    </td>
                  )}
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => handleDeleteTransaction(item.id)} className="p-1 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isExcelPreviewOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><FileSpreadsheet size={20} /></div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">추가 내역 검토</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review & Commit Changes</p>
                  </div>
               </div>
               <button onClick={() => setIsExcelPreviewOpen(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 w-12 text-center">
                      <button onClick={() => {
                        const allSel = filteredPending.every(t => t.selected);
                        const idsToToggle = new Set(filteredPending.map(t=>t.id));
                        setPendingExcelTxs(prev => prev.map(t => idsToToggle.has(t.id) ? { ...t, selected: !allSel } : t));
                      }} className="text-indigo-600">
                        {filteredPending.length > 0 && filteredPending.every(t => t.selected) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="px-4 py-4">일자</th>
                    <th className="px-4 py-4">가맹점 / 계정과목</th>
                    <th className="px-4 py-4 text-right">금액 (VAT)</th>
                    <th className="px-4 py-4 text-center">세무 검토</th>
                    <th className="px-4 py-4 text-center">상태 안내</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPending.map((t) => (
                    <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${t.selected ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-6 py-4 text-center"><button onClick={() => togglePendingSelect(t.id)} className={t.selected ? 'text-indigo-600' : 'text-slate-300'}>{t.selected ? <CheckSquare size={16} /> : <Square size={16} />}</button></td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-400">{t.date}</td>
                      <td className="px-4 py-4">
                        <div className={`flex flex-col ${t.isDuplicate ? 'text-rose-600 font-bold' : t.isLowBusinessRelevance ? 'text-amber-500' : 'text-slate-800'}`}>
                          <span className="text-sm font-black truncate max-w-[180px]">{t.description}</span>
                          <span className="text-[10px] font-bold opacity-60 flex items-center gap-1"><Tag size={10} /> {t.accountName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`flex flex-col ${t.isDuplicate ? 'text-rose-600' : 'text-slate-800'}`}>
                          <span className="text-sm font-black">{t.amount.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-blue-500">VAT: {t.vat?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => togglePendingTax(t.id, 'isVatDeductible')} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all active:scale-95 ${t.isVatDeductible ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                          >
                            {t.isVatDeductible ? '부가세공제' : '부가세불공'}
                          </button>
                          <button 
                            onClick={() => togglePendingTax(t.id, 'isIncomeTaxDeductible')} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all active:scale-95 ${t.isIncomeTaxDeductible ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                          >
                            {t.isIncomeTaxDeductible ? '종소세인정' : '종소세불인'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.isDuplicate ? <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full flex items-center justify-center gap-1 mx-auto w-fit border border-rose-100"><AlertOctagon size={12} /> 중복 내역</span>
                        : t.isLowBusinessRelevance ? <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center justify-center gap-1 mx-auto w-fit border border-amber-100"><Sparkles size={12} /> 사업무관 의심</span>
                        : <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center justify-center gap-1 mx-auto w-fit border border-emerald-100"><CheckCircle2 size={12} /> 정상 분석</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 flex-wrap gap-4">
               <div className="flex gap-4 items-center">
                  <button onClick={() => setPreviewFilter('all')} className={`px-4 py-2 rounded-2xl border transition-all font-black text-[11px] ${previewFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}>
                    총 {counts.total}건
                  </button>
                  <button onClick={() => setPreviewFilter('duplicate')} className={`px-4 py-2 rounded-2xl border transition-all font-black text-[11px] ${previewFilter === 'duplicate' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-rose-500 border-slate-200'}`}>
                    중복(자동해제) {counts.duplicate}건
                  </button>
                  <button onClick={() => setPreviewFilter('lowRelevance')} className={`px-4 py-2 rounded-2xl border transition-all font-black text-[11px] ${previewFilter === 'lowRelevance' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 border-slate-200'}`}>
                    사업무관의심 {counts.lowRelevance}건
                  </button>
               </div>
               <div className="flex gap-3">
                 {/* 수정 버튼: 필터 해제 및 확인 용도 */}
                 <button onClick={() => { setPreviewFilter('all'); alert('수정 사항이 임시 반영되었습니다.'); }} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 shadow-sm">수정</button>
                 <button onClick={handleBulkAddPending} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95"><Save size={18} /> 최종 장부 등록 ({pendingExcelTxs.filter(t=>t.selected).length}건)</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {isBankAdjustmentOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Banknote size={20} /></div>
                  <div><h2 className="text-lg font-black text-slate-800">통장 입금 내역 검토</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify Cash Sales</p></div>
               </div>
               <button onClick={() => setIsBankAdjustmentOpen(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">일자</th>
                    <th className="px-8 py-4">입금자명</th>
                    <th className="px-8 py-4 text-right">입금액</th>
                    <th className="px-8 py-4 text-center">현금매출 체크</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingBankTxs.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 font-mono">{t.date}</td>
                      <td className="px-8 py-5 font-black text-slate-800">{t.depositor}</td>
                      <td className="px-8 py-5 text-right font-black text-slate-900">{t.amount.toLocaleString()}원</td>
                      <td className="px-8 py-5 text-center"><button onClick={() => toggleBankCashSale(t.id)} className={`flex items-center justify-center gap-3 mx-auto px-4 py-2 rounded-2xl border-2 transition-all active:scale-95 ${t.isCashSale ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-300'}`}><span className="text-[10px] font-black">{t.isCashSale ? '현금매출 O' : '현금매출 X'}</span>{t.isCashSale ? <Circle size={18} /> : <XCircle size={18} />}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
               <div className="text-xs font-bold text-slate-500">총 <span className="text-slate-800 font-black">{pendingBankTxs.length}</span>건 중 <span className="text-emerald-600 font-black">{pendingBankTxs.filter(t=>t.isCashSale).length}</span>건 선택됨</div>
               <button onClick={handleBulkAddBankPending} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2"><Save size={18} /> 장부 등록하기</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-500 relative flex flex-col max-h-[95vh]">
            {(isReceiptAnalyzing || isAiAnalyzing) && (
              <div className="absolute inset-0 z-[110] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
                <div className="relative w-24 h-24"><div className="absolute inset-0 border-4 border-blue-50 rounded-full" /><div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><div className="absolute inset-0 flex items-center justify-center text-blue-600"><Sparkles size={32} className="animate-pulse" /></div></div>
                <div className="text-center"><p className="text-lg font-black text-slate-800">AI가 자료를 읽고 있습니다</p><p className="text-sm font-bold text-slate-400">데이터를 추출하여 자동 정리하는 중...</p></div>
              </div>
            )}
            <div className={`px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 ${formData.subCategory === '인건비' ? 'bg-indigo-50/50' : formData.subCategory === '경조사비' ? 'bg-rose-50/50' : 'bg-slate-50/50'}`}>
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${formData.subCategory === '인건비' ? 'bg-indigo-600' : formData.subCategory === '경조사비' ? 'bg-rose-600' : 'bg-blue-600'}`}>
                    {formData.subCategory === '인건비' ? <Users size={20} /> : formData.subCategory === '경조사비' ? <Heart size={20} /> : <Plus size={20} />}
                  </div>
                  <h2 className="text-lg font-black text-slate-800">{formData.subCategory} 추가</h2>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white text-slate-400 rounded-xl shadow-sm hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-24">
               {formData.subCategory === '경조사비' ? (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex gap-4 items-start shadow-sm mb-4">
                       <UserCheck className="text-rose-500 shrink-0" size={24} />
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-rose-900">전문 세무 관리 가이드</h4>
                          <p className="text-xs text-rose-700 leading-relaxed font-medium">경조사비는 법인/개인사업자 모두 **건당 20만원**까지 정규 증빙 없이 지출증빙서류(부고장, 청첩장 등)만으로 비용 인정이 가능합니다.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">거래 일자 (경조사일)</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">경조사 종류</label>
                        <select value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none">
                          {['결혼', '부고(장례)', '회갑/고희', '돌잔치', '기타'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">경조사 대상자 (성명)</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text" value={formData.eventPerson} onChange={e => setFormData({...formData, eventPerson: e.target.value})} placeholder="성명을 입력하세요" className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">관계 (사업 연관성)</label>
                        <select value={formData.eventRelation} onChange={e => setFormData({...formData, eventRelation: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none">
                          {['거래처 임직원', '거래처 대표', '직원 본인/가족', '기타 비즈니스 관계'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">지출 금액 (20만원 이내 권장)</label>
                      <div className="relative">
                        <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                        <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className={`w-full pl-14 pr-12 py-5 bg-slate-50 border-none rounded-2xl text-xl font-black transition-all ${Number(formData.amount) > 200000 ? 'text-amber-600 bg-amber-50 ring-2 ring-amber-100' : 'text-slate-800'}`} />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span>
                      </div>
                      {Number(formData.amount) > 200000 && (
                        <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12} /> 20만원 초과 지출 시, 전액 손금불산입 처리되니 주의하세요!</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">보관 중인 증빙 자료 (PC/모바일 촬영)</label>
                        {formData.evidenceImage && <button onClick={() => setFormData(prev => ({ ...prev, evidenceImage: '' }))} className="text-[10px] font-black text-rose-500 hover:underline">증빙 삭제</button>}
                      </div>
                      
                      {formData.evidenceImage ? (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
                           <img src={formData.evidenceImage} className="w-full h-full object-cover" alt="Evidence" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black flex items-center gap-1">
                                <CheckCircle2 size={12} /> {formData.evidenceType} 업로드 완료
                              </span>
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['청첩장', '부고장', '카톡/문자', '기타문서'].map(doc => (
                            <button 
                              key={doc} 
                              type="button" 
                              onClick={() => handleEvidenceUpload(doc)}
                              className="py-4 px-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:border-rose-500 hover:text-rose-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 group"
                            >
                              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                {doc === '카톡/문자' ? <Smartphone size={16} /> : <FileCheck size={16} />}
                              </div>
                              {doc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {((mode === 'expense' && formData.subCategory === '카드') || (mode === 'income' && formData.subCategory === '단순현금')) && (
                          <button onClick={() => mode === 'income' ? bankExcelInputRef.current?.click() : excelInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                            <FileSpreadsheet size={20} /> <span className="text-[10px]">{mode === 'income' ? '통장내역 엑셀등록' : '엑셀 대량 추가'}</span>
                          </button>
                        )}
                        {['세금계산서', '단순현금', '계산서'].includes(formData.subCategory) && (
                          <><button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-2xl font-black border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"><Camera size={20} /> <span className="text-[10px]">사진 촬영 인식</span></button><button onClick={() => photoInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-purple-50 text-purple-600 rounded-2xl font-black border border-purple-100 hover:bg-purple-600 hover:text-white transition-all"><ImageIcon size={20} /> <span className="text-[10px]">사진첩 자료인식</span></button></>
                        )}
                    </div>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">거래 일자</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all" /></div>
                          {formData.subCategory !== '인건비' && (<div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{formData.subCategory === '카드' ? '카드번호' : '관리 번호'}</label><input type="text" placeholder="번호 입력..." value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all" /></div>)}
                        </div>
                        {mode === 'expense' && ['카드', '세금계산서', '현금', '계산서'].includes(formData.subCategory) && (
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">손익계산서 계정과목</label><div className="relative group"><Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 z-10" size={18} /><select value={formData.accountName} onChange={(e) => setFormData({...formData, accountName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-indigo-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all appearance-none text-indigo-900 cursor-pointer">{EXPENSE_ACCOUNTS.map(acc => (<option key={acc} value={acc}>{acc}</option>))}</select><ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none rotate-90" size={18} /></div></div>
                        )}
                        <div className="grid grid-cols-1 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{formData.subCategory === '인건비' ? '근로자 성명' : '상호/내용'}</label><div className="relative">{formData.subCategory === '인건비' ? <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /> : <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />}<input type="text" placeholder={formData.subCategory === '인건비' ? '예: 김철수' : '가맹점명'} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all" /></div></div></div>
                        
                        {( (mode === 'expense' && ['카드', '세금계산서', '현금', '계산서'].includes(formData.subCategory)) || (mode === 'income' && ['세금계산서', '단순현금', '계산서', '플랫폼매출', '현금영수증'].includes(formData.subCategory)) ) && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">사업자등록번호</label>
                            <div className="flex items-center gap-2">
                              <input ref={bizNumRef1} type="tel" maxLength={3} placeholder="000" value={bizNumParts.p1} onChange={e => handleBizNumChange('p1', e.target.value)} className="w-16 px-2 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 text-center" />
                              <span className="text-slate-300 font-black">-</span>
                              <input ref={bizNumRef2} type="tel" maxLength={2} placeholder="00" value={bizNumParts.p2} onChange={e => handleBizNumChange('p2', e.target.value)} className="w-14 px-2 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 text-center" />
                              <span className="text-slate-300 font-black">-</span>
                              <input ref={bizNumRef3} type="tel" maxLength={5} placeholder="00000" value={bizNumParts.p3} onChange={e => handleBizNumChange('p3', e.target.value)} className="w-24 px-2 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 text-center" />
                            </div>
                          </div>
                        )}

                        <div className={`grid gap-4 ${['인건비', '계산서', '단순현금', '현금'].includes(formData.subCategory) ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">지급 금액</label><div className="relative"><input type="number" placeholder="0" value={formData.amount} onChange={e => { const val = e.target.value; setFormData({...formData, amount: val, tax: Math.floor(Number(val) / 11).toString()}) }} className={`w-full px-5 py-5 bg-slate-50 border-none rounded-2xl lg:text-xl font-black transition-all ${formData.subCategory === '인건비' ? 'text-indigo-600' : 'text-blue-600'}`} /><span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span></div></div>
                          {!['인건비', '계산서', '단순현금', '현금'].includes(formData.subCategory) && (<div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">부가세 (VAT)</label><div className="relative"><input type="number" placeholder="0" value={formData.tax} onChange={e => setFormData({...formData, tax: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl lg:text-xl font-black text-slate-600 transition-all" /><span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span></div></div>)}
                        </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex gap-3 sticky bottom-0 z-20 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm active:scale-95 transition-all">취소</button>
               <button onClick={handleAddSubmit} className={`flex-[2] py-4 text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${formData.subCategory === '인건비' ? 'bg-indigo-600 shadow-indigo-500/20' : formData.subCategory === '경조사비' ? 'bg-rose-600 shadow-rose-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}><Save size={18} /> 장부 등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaxSmallBtn = ({ active, label, onClick, type }: { active: boolean, label: string, onClick: () => void, type: 'ok' | 'no' | 'all' }) => {
  const getStyle = () => {
    if (!active) return "bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white";
    if (type === 'ok') return "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20";
    if (type === 'no') return "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20";
    return "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20";
  };
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all active:scale-95 whitespace-nowrap ${getStyle()}`}>{label}</button>;
};

export default TransactionList;

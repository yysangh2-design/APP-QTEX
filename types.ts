
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  subCategory: string; 
  method: '카드' | '계좌' | '현금';
  type: TransactionType;
  isVatDeductible?: boolean; // 부가세 공제 여부
  isIncomeTaxDeductible?: boolean; // 종소세 공제 여부
  // 추가 필드
  cardNumber?: string;
  vat?: number;
  merchantBizNum?: string;
  accountName?: string; // 손익계산서 계정과목 (예: 식대, 차량유지비 등)
  // 경조사 증빙 필드
  evidenceImage?: string; 
  evidenceType?: string;
}

export interface TaxSummary {
  estimatedTax: number;
  totalIncome: number;
  totalExpense: number;
  deductibleExpense: number;
  period: string;
}

export type ViewState = 'home' | 'expenses' | 'sales' | 'reports' | 'ai-consultation' | 'connect' | 'labor-cost' | 'labor-contract' | 'tax-invoice' | 'doc-issuance' | 'mypage' | 'driving-log' | 'notices' | 'tax-declaration' | 'tax-report-form';

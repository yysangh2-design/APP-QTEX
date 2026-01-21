
import { Transaction } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-11-15', description: '스타벅스 강남점', amount: 5500, category: '매입', subCategory: '카드', method: '카드', type: 'expense', isVatDeductible: true },
  { id: '2', date: '2023-11-14', description: '원고료 입금', amount: 500000, category: '매출', subCategory: '세금계산서', method: '계좌', type: 'income' },
  { id: '3', date: '2023-11-13', description: '네이버 광고비', amount: 30000, category: '매입', subCategory: '세금계산서', method: '계좌', type: 'expense', isVatDeductible: true },
  { id: '4', date: '2023-11-12', description: '사무용품 구입 (다이소)', amount: 12000, category: '매입', subCategory: '카드', method: '카드', type: 'expense', isVatDeductible: true },
  { id: '5', date: '2023-11-10', description: '유튜브 프리미엄 결제', amount: 14900, category: '매입', subCategory: '카드', method: '카드', type: 'expense', isVatDeductible: false },
  { id: '6', date: '2023-11-09', description: '배달의민족 정산금', amount: 2450000, category: '매출', subCategory: '플랫폼매출', method: '계좌', type: 'income' },
  { id: '7', date: '2023-11-05', description: '정규직 임금 지급 (홍길동)', amount: 3200000, category: '매입', subCategory: '인건비', method: '계좌', type: 'expense', isVatDeductible: false },
];

export const TAX_CATEGORIES = {
  '매출': ['카드', '세금계산서', '단순현금', '계산서', '플랫폼매출'],
  '매입': ['카드', '세금계산서', '현금', '계산서', '인건비', '경조사비']
};

export const MAIN_CATEGORIES = Object.keys(TAX_CATEGORIES);

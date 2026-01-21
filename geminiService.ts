
import { GoogleGenAI, Type } from "@google/genai";

export const analyzeExpense = async (description: string, amount: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `다음 거래 내용을 분석하여 '매출' 또는 '매입' 및 상세 하부 카테고리로 분류하고 절세 팁을 알려주세요.
      
      거래명: ${description}
      금액: ${amount}원`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            isDeductible: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            taxSavingTip: { type: Type.STRING },
          },
          required: ["category", "subCategory", "isDeductible", "reason", "taxSavingTip"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

export const analyzeBatchTransactions = async (items: { description: string, amount: number }[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `대한민국 세무 신고 기준으로 다음 ${items.length}건의 카드 내역을 분류해줘.
      
      [분류 원칙]
      1. 식대, 소모품, 비품, 광고비 등 사업 관련 지출은 '카드' 또는 적절한 카테고리로 분류.
      2. '주점', '골프', '마사지' 등 유흥성 지출은 사적 지출로 간주.
      3. 병원, 약국 등 면세 관련 지출은 부가세 불공제로 분류.
      4. 손익계산서 계정과목은 다음 중 가장 적절한 것을 선택: '식대(복리후생비)', '여비교통비', '차량유지비', '소모품비', '지급임차료', '통신비', '수도광열비', '세금과공과', '광고선전비', '수수료비용', '기타'
      
      반드시 입력된 순서대로 ${items.length}개의 결과를 배열로 반환해.
      데이터: ${JSON.stringify(items)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              isVatDeductible: { type: Type.BOOLEAN },
              isIncomeTaxDeductible: { type: Type.BOOLEAN },
              suggestedCategory: { type: Type.STRING, description: "카드, 세금계산서, 현금, 계산서 중 하나" },
              suggestedAccount: { type: Type.STRING, description: "손익계산서 계정과목" }
            },
            required: ["isVatDeductible", "isIncomeTaxDeductible", "suggestedCategory", "suggestedAccount"]
          }
        },
      },
    });
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : items.map(() => ({ isVatDeductible: true, isIncomeTaxDeductible: true, suggestedCategory: "카드", suggestedAccount: "기타" }));
  } catch (error) {
    console.error("Batch AI Analysis Error:", error);
    return items.map(() => ({ isVatDeductible: true, isIncomeTaxDeductible: true, suggestedCategory: "카드", suggestedAccount: "기타" }));
  }
};

export const analyzeReceiptImage = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1],
            },
          },
          {
            text: "이 이미지에서 거래일자, 공급자 사업자번호, 상호, 금액, 부가세를 추출해줘.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            supplierBizNum: { type: Type.STRING },
            supplierName: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            subCategory: { type: Type.STRING }
          },
          required: ["date", "supplierName", "amount", "tax", "subCategory"]
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Receipt Analysis Error:", error);
    throw error;
  }
};

export const analyzeBankStatement = async (data: any, isImage: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let contents;

  if (isImage) {
    contents = {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: data.split(",")[1] } },
        { text: "이 통장 내역 이미지에서 '입금(Deposit)' 항목만 모두 추출해줘. 출금 내역은 무시해. 입금자명, 금액, 날짜를 찾아줘." }
      ]
    };
  } else {
    contents = `다음 통장 엑셀 데이터에서 '입금'된 내역만 추출해서 리스트로 만들어줘. 
    사람 이름이나 상호명이 입금자명으로 되어 있는 항목들을 우선적으로 찾아줘.
    데이터: ${JSON.stringify(data)}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              depositor: { type: Type.STRING },
              amount: { type: Type.NUMBER },
            },
            required: ["date", "depositor", "amount"]
          }
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Bank Statement Analysis Error:", error);
    return [];
  }
};

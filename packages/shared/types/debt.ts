/**
 * 负债相关类型定义
 */

export enum DebtType {
  CREDIT_CARD = 'credit_card',
  CONSUMER_LOAN = 'consumer_loan',
  MORTGAGE = 'mortgage',
  CAR_LOAN = 'car_loan',
  PERSONAL_LOAN = 'personal_loan',
  OTHER = 'other',
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  type: DebtType;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  dueDate?: Date;
  isPaidOff: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  [DebtType.CREDIT_CARD]: '信用卡',
  [DebtType.CONSUMER_LOAN]: '消费贷',
  [DebtType.MORTGAGE]: '房贷',
  [DebtType.CAR_LOAN]: '车贷',
  [DebtType.PERSONAL_LOAN]: '亲友借款',
  [DebtType.OTHER]: '其他',
};

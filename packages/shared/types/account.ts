/**
 * 账户相关类型定义
 */

export enum AccountType {
  CASH = 'cash',
  CHECKING = 'checking',
  SAVINGS = 'savings',
  MONEY_FUND = 'money_fund',
  INVESTMENT = 'investment',
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  RECEIVABLE = 'receivable',
  OTHER = 'other',
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  balance: number;
  currency: string;
  isReserved: boolean;
  includeInNetWorth: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.CASH]: '现金',
  [AccountType.CHECKING]: '活期存款',
  [AccountType.SAVINGS]: '定期存款',
  [AccountType.MONEY_FUND]: '货币基金',
  [AccountType.INVESTMENT]: '投资账户',
  [AccountType.REAL_ESTATE]: '房产',
  [AccountType.VEHICLE]: '车辆',
  [AccountType.RECEIVABLE]: '应收款',
  [AccountType.OTHER]: '其他',
};

import { Ionicons } from "@expo/vector-icons";
import i18n from "../i18n";
// 支付方式的类型
export type PaymentMethodType = 'card' | 'bank' | 'coinbase' | 'paypal' | 'crypto' | 'venmo';

// 支付方式的结构
export type PaymentMethod = {
  type: 'card' | 'bank' | 'crypto' | 'coinbase' | 'paypal';
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  paymentMethod?: string;
};

// 支付方式列表
export const paymentMethods: PaymentMethod[] = [
  {
    type: 'card',
    name: i18n.t('paymentMethods.card'),
    icon: 'card-sharp',
    paymentMethod: 'credit_debit_card'
  },
  {
    type: 'bank',
    name: i18n.t('paymentMethods.bank'),
    icon: 'business-outline',
    paymentMethod: 'sepa_bank_transfer'
  },
  {
    type: 'coinbase',
    name: i18n.t('paymentMethods.coinbase'),
    icon: 'cash-outline',
    paymentMethod: 'coinbase_pay'
  },
  {
    type: 'paypal',
    name: i18n.t('paymentMethods.paypal'),
    icon: 'logo-paypal',
    paymentMethod: 'paypal'
  },
  {
    type: 'crypto',
    name: i18n.t('paymentMethods.crypto'),
    icon: 'logo-bitcoin'
  }
];

// 通过类型查找支付方式
export const findMethodByType = (type: PaymentMethodType) => 
  paymentMethods.find(m => m.type === type); 

// 添加默认支付方式
export const DEFAULT_METHOD = paymentMethods[0]; 

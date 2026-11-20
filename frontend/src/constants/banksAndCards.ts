export interface BankItem {
  id: string;
  shortName: string;
  fullName: string;
  code: string;
  category: 'TOP' | 'COMMERCIAL' | 'E_WALLET';
}

export interface CreditCardItem {
  id: string;
  name: string;
  issuer?: string;
  category: 'INTERNATIONAL' | 'BANK_ISSUED';
  brand: 'VISA' | 'MASTERCARD' | 'JCB' | 'AMEX';
}

export const POPULAR_BANKS: BankItem[] = [
  // Ngân hàng hàng đầu & phổ biến nhất
  { id: 'vcb', shortName: 'Vietcombank', fullName: 'Ngân hàng Ngoại Thương Việt Nam (VCB)', code: 'VCB', category: 'TOP' },
  { id: 'tcb', shortName: 'Techcombank', fullName: 'Ngân hàng Kỹ Thương Việt Nam (TCB)', code: 'TCB', category: 'TOP' },
  { id: 'mb', shortName: 'MB Bank', fullName: 'Ngân hàng Quân Đội (MB)', code: 'MB', category: 'TOP' },
  { id: 'ctg', shortName: 'VietinBank', fullName: 'Ngân hàng Công Thương Việt Nam (CTG)', code: 'CTG', category: 'TOP' },
  { id: 'bidv', shortName: 'BIDV', fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam', code: 'BIDV', category: 'TOP' },
  { id: 'acb', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu', code: 'ACB', category: 'TOP' },
  { id: 'vpb', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', category: 'TOP' },
  { id: 'tpb', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', category: 'TOP' },
  { id: 'stb', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', category: 'TOP' },
  { id: 'vib', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc Tế Việt Nam', code: 'VIB', category: 'TOP' },
  { id: 'vba', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & PTNT Việt Nam', code: 'VBA', category: 'TOP' },
  { id: 'hdb', shortName: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM', code: 'HDB', category: 'TOP' },

  // Ngân hàng thương mại khác
  { id: 'shb', shortName: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB', category: 'COMMERCIAL' },
  { id: 'msb', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam', code: 'MSB', category: 'COMMERCIAL' },
  { id: 'ocb', shortName: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông', code: 'OCB', category: 'COMMERCIAL' },
  { id: 'ssb', shortName: 'SeABank', fullName: 'Ngân hàng TMCP Đông Nam Á', code: 'SSB', category: 'COMMERCIAL' },
  { id: 'lpb', shortName: 'LPBank', fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam', code: 'LPB', category: 'COMMERCIAL' },
  { id: 'nab', shortName: 'Nam A Bank', fullName: 'Ngân hàng TMCP Nam Á', code: 'NAB', category: 'COMMERCIAL' },
  { id: 'bab', shortName: 'Bac A Bank', fullName: 'Ngân hàng TMCP Bắc Á', code: 'BAB', category: 'COMMERCIAL' },
  { id: 'pvc', shortName: 'PVcomBank', fullName: 'Ngân hàng TMCP Đại Chúng Việt Nam', code: 'PVC', category: 'COMMERCIAL' },
  { id: 'shinhan', shortName: 'Shinhan Bank', fullName: 'Ngân hàng Shinhan Việt Nam', code: 'SHINHAN', category: 'COMMERCIAL' },
  { id: 'woori', shortName: 'Woori Bank', fullName: 'Ngân hàng Woori Việt Nam', code: 'WOORI', category: 'COMMERCIAL' },
  { id: 'hsbc', shortName: 'HSBC Vietnam', fullName: 'Ngân hàng TNHH MTV HSBC Việt Nam', code: 'HSBC', category: 'COMMERCIAL' },
  { id: 'scb', shortName: 'Standard Chartered', fullName: 'Standard Chartered Bank Việt Nam', code: 'SCB', category: 'COMMERCIAL' },

  // Ví điện tử & Fintech phổ biến
  { id: 'momo', shortName: 'Ví MoMo', fullName: 'Ví điện tử MoMo', code: 'MOMO', category: 'E_WALLET' },
  { id: 'zalopay', shortName: 'Ví ZaloPay', fullName: 'Ví điện tử ZaloPay', code: 'ZALOPAY', category: 'E_WALLET' },
  { id: 'viettelmoney', shortName: 'Ví Viettel Money', fullName: 'Ví điện tử Viettel Money / ViettelPay', code: 'VIETTEL', category: 'E_WALLET' },
  { id: 'shopeepay', shortName: 'Ví ShopeePay', fullName: 'Ví điện tử ShopeePay', code: 'SHOPEEPAY', category: 'E_WALLET' },
];

export const POPULAR_CREDIT_CARDS: CreditCardItem[] = [
  // Thẻ quốc tế chuẩn & cao cấp
  { id: 'visa-plat', name: 'Visa Platinum Credit', category: 'INTERNATIONAL', brand: 'VISA' },
  { id: 'visa-sign', name: 'Visa Signature Credit', category: 'INTERNATIONAL', brand: 'VISA' },
  { id: 'visa-clas', name: 'Visa Classic Credit', category: 'INTERNATIONAL', brand: 'VISA' },
  { id: 'visa-infi', name: 'Visa Infinite Credit', category: 'INTERNATIONAL', brand: 'VISA' },
  { id: 'mc-world', name: 'Mastercard World Credit', category: 'INTERNATIONAL', brand: 'MASTERCARD' },
  { id: 'mc-titan', name: 'Mastercard Titanium Credit', category: 'INTERNATIONAL', brand: 'MASTERCARD' },
  { id: 'mc-stan', name: 'Mastercard Standard Credit', category: 'INTERNATIONAL', brand: 'MASTERCARD' },
  { id: 'jcb-ulti', name: 'JCB Ultimate Credit', category: 'INTERNATIONAL', brand: 'JCB' },
  { id: 'jcb-plat', name: 'JCB Platinum Credit', category: 'INTERNATIONAL', brand: 'JCB' },
  { id: 'amex-plat', name: 'American Express Platinum', category: 'INTERNATIONAL', brand: 'AMEX' },

  // Thẻ tín dụng theo ngân hàng phát hành
  { id: 'tcb-visa', name: 'Techcombank Visa Platinum', issuer: 'Techcombank', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'vcb-visa', name: 'Vietcombank Visa Platinum', issuer: 'Vietcombank', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'vpb-stepup', name: 'VPBank StepUP Mastercard', issuer: 'VPBank', category: 'BANK_ISSUED', brand: 'MASTERCARD' },
  { id: 'vib-online', name: 'VIB Online Rebate Mastercard', issuer: 'VIB', category: 'BANK_ISSUED', brand: 'MASTERCARD' },
  { id: 'mb-modern', name: 'MB Visa Modern Youth', issuer: 'MB Bank', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'stb-visa', name: 'Sacombank Visa Credit', issuer: 'Sacombank', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'acb-sign', name: 'ACB Visa Signature Credit', issuer: 'ACB', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'hsbc-cashback', name: 'HSBC Visa Cash Back', issuer: 'HSBC', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'shinhan-plat', name: 'Shinhan Bank Visa Platinum', issuer: 'Shinhan Bank', category: 'BANK_ISSUED', brand: 'VISA' },
  { id: 'tpb-evo', name: 'TPBank EVO Visa Credit', issuer: 'TPBank', category: 'BANK_ISSUED', brand: 'VISA' },
];

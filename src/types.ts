export interface CLLRawRow {
  'Số HĐ'?: string | number;
  'Tg hoàn tất'?: any;
  'Tg hoàn tất CLPS'?: any;
  'Ghi chú'?: string;
  '(Cấp 1) Tình trạng đầu vào'?: string;
  '(Cấp 1) Phần tử lỗi'?: string;
  '(Cấp 1) Nguyên nhân lỗi'?: string;
  '(Cấp 1) Hướng xử lý'?: string;
  // Also support alternative names without (Cấp 1) prefix
  'Tình trạng đầu vào'?: string;
  'Phần tử lỗi'?: string;
  'Nguyên nhân lỗi'?: string;
  'Hướng xử lý'?: string;
  [key: string]: any;
}

export interface DungHenRawRow {
  'Số HĐ'?: string | number;
  'TG Hoàn Tất'?: any;
  'Tg hoàn tất'?: any;
  'Ghi chú'?: string;
  '(Cấp 1) Tình trạng đầu vào'?: string;
  '(Cấp 1) Phần tử lỗi'?: string;
  '(Cấp 1) Nguyên nhân lỗi'?: string;
  '(Cấp 1) Hướng xử lý'?: string;
  'Tình trạng đầu vào'?: string;
  'Phần tử lỗi'?: string;
  'Nguyên nhân lỗi'?: string;
  'Hướng xử lý'?: string;
  [key: string]: any;
}

export interface MergedRecord {
  id: string; // Unique index or Số HĐ
  contractNumber: string;
  
  // Lần 1 (L1) - From CLL
  completedTimeL1: string;
  completedTimeL1Raw: any;
  notesL1: string;
  inputStatusL1: string;
  errorElementL1: string;
  errorCauseL1: string;
  handlingL1: string;
  
  // Lần 2 (CLPS) - Merged from Dung Hen T / T-1 using Tg hoàn tất CLPS in CLL
  completedTimeL2: string; // Target: matching closest or exact
  completedTimeL2Raw: any;
  notesL2: string;
  inputStatusL2: string;
  errorElementL2: string;
  errorCauseL2: string;
  handlingL2: string;
  
  // Status of the merger
  status: 'SUCCESS' | 'NOT_FOUND';
  timeDifferenceMinutes?: number;
  
  // Handling Staff
  staffL1?: string;
  staffL2?: string;
  
  // Area / Block
  blockL1?: string;
  blockL2?: string;
}

export interface ChartDataItem {
  name: string;
  'Lần 1': number;
  'Lần 2': number;
}

export interface TransitionRecord {
  from: string;
  to: string;
  count: number;
}

export interface SummaryStats {
  totalCLL: number;
  totalMerged: number;
  totalNotFound: number;
}

export interface CSVRow {
  bigNumber: number;
  smallNumbers: number[];
}

export interface OptimizationResult {
  selectedNumbers: number[];
  sum: number;
  originalRow: CSVRow;
}

export interface PriceComparisonRequest {
  itemNumber: string;
  productName?: string;
}

export interface ProductPrice {
  site: string;
  price: number | null;
  currency: string;
  url?: string;
  available: boolean;
  error?: string;
}

export interface PriceComparisonResult {
  itemNumber: string;
  productName: string;
  prices: ProductPrice[];
  timestamp: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FileUploadState {
  file: File | null;
  isDragActive: boolean;
  uploading: boolean;
}

export interface PriceSearchState {
  itemNumber: string;
  loading: boolean;
  result: PriceComparisonResult | null;
  error: string | null;
}

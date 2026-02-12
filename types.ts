
export interface InvoiceData {
  factureReference: string;
  date: string;
  totalRemise: number;
  totalCommissionsHT: number;
  totalTVASurCommissions: number;
  soldeNetRemise: number;
  locationTPE: number;
}

export interface ExtractionResult extends InvoiceData {
  fileName: string;
}

export interface ExtractionState {
  data: ExtractionResult[];
  isLoading: boolean;
  error: string | null;
}

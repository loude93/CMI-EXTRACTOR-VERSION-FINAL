
import * as XLSX from 'xlsx';
import { ExtractionResult } from '../types';

export const exportToExcel = (data: ExtractionResult[]) => {
  // 1. Create the Main Extraction Sheet (Dashboard Data)
  const dashboardData = data.map(item => ({
    'Nom de la Facture': item.factureReference,
    'Date': item.date,
    'Total Remise (DH)': item.totalRemise,
    'Total Commissions HT': item.totalCommissionsHT,
    'Total TVA Sur Commissions': item.totalTVASurCommissions,
    'Solde Net Remise': item.soldeNetRemise,
    'Location TPE (DH)': item.locationTPE,
    'Fichier Source': item.fileName,
  }));
  const worksheetDashboard = XLSX.utils.json_to_sheet(dashboardData);

  // 2. Create the Accounting Sheet (Écritures Comptables)
  const accountingEntries: any[] = [];

  data.forEach(item => {
    // --- Standard Facture Entries ---
    
    // Row 1: Commissions HT (Debit)
    accountingEntries.push({
      'DATE': item.date,
      'COMPTE GENERALE': '61473001',
      'COMPTE TIER': '',
      'LIBELLE': `COMMISSIONS HT - ${item.factureReference}`,
      'DEBIT': item.totalCommissionsHT,
      'CREDIT': 0
    });

    // Row 2: TVA sur Commissions (Debit)
    accountingEntries.push({
      'DATE': item.date,
      'COMPTE GENERALE': '34552010',
      'COMPTE TIER': '',
      'LIBELLE': `TVA SUR COMMISSIONS - ${item.factureReference}`,
      'DEBIT': item.totalTVASurCommissions,
      'CREDIT': 0
    });

    // Row 3: Solde Net Remise (Debit)
    accountingEntries.push({
      'DATE': item.date,
      'COMPTE GENERALE': '34210000',
      'COMPTE TIER': '',
      'LIBELLE': `SOLDE NET - ${item.factureReference}`,
      'DEBIT': item.soldeNetRemise,
      'CREDIT': 0
    });

    // Row 4: Total Remise (Credit)
    accountingEntries.push({
      'DATE': item.date,
      'COMPTE GENERALE': '34210000',
      'COMPTE TIER': '',
      'LIBELLE': `TOTAL REMISE - ${item.factureReference}`,
      'DEBIT': 0,
      'CREDIT': item.totalRemise
    });

    // --- Location TPE Entry (If exists) ---
    if (item.locationTPE > 0) {
      // Row 5: Location TPE (Debit)
      accountingEntries.push({
        'DATE': item.date,
        'COMPTE GENERALE': '61315000',
        'COMPTE TIER': '',
        'LIBELLE': `LOCATION TPE - ${item.factureReference}`,
        'DEBIT': item.locationTPE,
        'CREDIT': 0
      });

      // Row 6: Location TPE (Credit)
      accountingEntries.push({
        'DATE': item.date,
        'COMPTE GENERALE': '44110000',
        'COMPTE TIER': '4411CMI',
        'LIBELLE': `LOCATION TPE - ${item.factureReference}`,
        'DEBIT': 0,
        'CREDIT': item.locationTPE
      });
    }
  });

  const worksheetAccounting = XLSX.utils.json_to_sheet(accountingEntries, {
    header: ['DATE', 'COMPTE GENERALE', 'COMPTE TIER', 'LIBELLE', 'DEBIT', 'CREDIT']
  });

  // 3. Assemble Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheetDashboard, 'Extractions');
  XLSX.utils.book_append_sheet(workbook, worksheetAccounting, 'Comptabilité');

  // 4. Trigger Download
  const filename = `CMI_EXTRACTOR_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

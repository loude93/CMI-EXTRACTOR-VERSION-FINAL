
import React, { useState } from 'react';
import { 
  FileUp, 
  Download, 
  Trash2, 
  Wallet, 
  Receipt, 
  Percent, 
  Calendar, 
  Calculator,
  Loader2,
  AlertCircle,
  FileText,
  Layers,
  Heart,
  Linkedin,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { ExtractionResult, ExtractionState } from './types';
import { extractDataFromPdf } from './services/geminiService';
import { exportToExcel } from './utils/excelExport';
import StatsCard from './components/StatsCard';

const App: React.FC = () => {
  const [state, setState] = useState<ExtractionState>({
    data: [],
    isLoading: false,
    error: null,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let allNewInvoices: ExtractionResult[] = [];
      const apiKey = process.env.API_KEY || '';
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') continue;
        
        const results = await extractDataFromPdf(file, apiKey);
        allNewInvoices = [...allNewInvoices, ...results];
      }

      setState(prev => ({
        ...prev,
        data: [...prev.data, ...allNewInvoices],
        isLoading: false,
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to extract data. Ensure the PDF contains the financial variables requested.",
      }));
    }
  };

  const removeEntry = (index: number) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter((_, i) => i !== index),
    }));
  };

  const clearAll = () => {
    setState(prev => ({ ...prev, data: [] }));
  };

  const handleExport = () => {
    if (state.data.length === 0) return;
    exportToExcel(state.data);
  };

  const totals = state.data.reduce((acc, curr) => ({
    remise: acc.remise + curr.totalRemise,
    commHT: acc.commHT + curr.totalCommissionsHT,
    tva: acc.tva + curr.totalTVASurCommissions,
    solde: acc.solde + curr.soldeNetRemise,
    tpe: acc.tpe + curr.locationTPE
  }), { remise: 0, commHT: 0, tva: 0, solde: 0, tpe: 0 });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">CMI EXTRACTOR</h1>
              <p className="text-xs text-slate-500 font-medium">Capture de Factures PDF</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-all transform active:scale-95 font-medium shadow-md">
              <FileUp className="w-4 h-4" />
              <span>Charger PDF</span>
              <input 
                type="file" 
                className="hidden" 
                accept="application/pdf" 
                multiple 
                onChange={handleFileUpload}
                disabled={state.isLoading}
              />
            </label>
            {state.data.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Excel</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-grow">
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 animate-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        {state.isLoading && (
          <div className="mb-8 p-12 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center space-y-4 shadow-inner">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Analyse en cours...</p>
              <p className="text-slate-500">Extraction de toutes les données des factures via Gemini AI</p>
            </div>
          </div>
        )}

        {!state.isLoading && state.data.length === 0 && (
          <div className="mt-12 text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Aucune donnée extraite</h2>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              Glissez vos factures PDF ici pour extraire automatiquement les montants, les dates et les références.
            </p>
          </div>
        )}

        {state.data.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Aggregate Summary */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Résumé Global</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatsCard 
                  label="Cumul Remise (DH)" 
                  value={totals.remise} 
                  icon={<Wallet className="w-5 h-5" />} 
                  color="bg-emerald-500"
                />
                <StatsCard 
                  label="Commissions HT" 
                  value={totals.commHT} 
                  icon={<Receipt className="w-5 h-5" />} 
                  color="bg-indigo-500"
                />
                <StatsCard 
                  label="Cumul TVA" 
                  value={totals.tva} 
                  icon={<Percent className="w-5 h-5" />} 
                  color="bg-orange-500"
                />
                <StatsCard 
                  label="Solde Net" 
                  value={totals.solde} 
                  icon={<Calculator className="w-5 h-5" />} 
                  color="bg-blue-600"
                />
                <StatsCard 
                  label="Location TPE" 
                  value={totals.tpe} 
                  icon={<Cpu className="w-5 h-5" />} 
                  color="bg-slate-700"
                />
              </div>
            </section>

            {/* Master Table */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-slate-900">Détails de toutes les Factures</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded-md font-semibold">
                    {state.data.length} Factures trouvées
                  </span>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Réinitialiser</span>
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Référence</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Remise (DH)</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Comm. HT</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">TVA</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Solde Net</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Loc. TPE</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.data.map((item, idx) => (
                        <tr key={`${item.factureReference}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span>{item.factureReference}</span>
                              <span className="text-[10px] text-slate-400 font-normal uppercase truncate max-w-[150px]">{item.fileName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{item.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                            {item.totalRemise.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 text-right">
                            {item.totalCommissionsHT.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 text-right">
                            {item.totalTVASurCommissions.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-right">
                            {item.soldeNetRemise.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 text-right">
                            {item.locationTPE.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => removeEntry(idx)}
                              className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-full transition-all"
                              title="Supprimer cette ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="py-12 mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 text-slate-600 font-bold text-lg">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>CMI EXTRACTOR</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400 font-medium">
              <span>MADE BY MAISSINE Mohammed</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400 animate-pulse" />
            </div>
          </div>

          <a 
            href="https://www.linkedin.com/in/mohammed-maissine-15b654100/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center space-x-3 bg-white hover:bg-slate-50 border-2 border-[#0a66c2] text-[#0a66c2] px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-md active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#0a66c2] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0 opacity-10"></div>
            <Linkedin className="w-5 h-5 shrink-0" />
            <span className="relative z-10">Connect with me on LinkedIn</span>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
          </a>

          <div className="pt-4 border-t border-slate-100 w-full max-w-md text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-300">
              SECURE FINANCIAL DATA EXTRACTION ENGINE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

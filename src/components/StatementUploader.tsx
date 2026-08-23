import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileType,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BankStatement, Transaction } from '../types';
import {
  downloadExcelBudgetTemplate,
  generateRetroactiveSampleData,
} from '../utils/excelHelper';

interface StatementUploaderProps {
  onStatementLoaded: (statement: BankStatement) => void;
  onMultipleStatementsLoaded?: (statements: BankStatement[]) => void;
  currentStatementId?: string;
}

export const StatementUploader: React.FC<StatementUploaderProps> = ({
  onStatementLoaded,
  onMultipleStatementsLoaded,
  currentStatementId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'excel' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Handle standard single statement files
  const handleFile = async (file: File) => {
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.docx', '.doc', '.csv', '.txt', '.xlsx', '.xls'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Unsupported file format. Please upload a PDF, PNG, JPG, DOCX, or Excel file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setStatusMessage('Reading bank statement file...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultString = reader.result as string;
          const base64Content = resultString.split(',')[1];

          setStatusMessage('AI analyzing statement & categorizing transactions...');

          const response = await fetch('/api/parse-statement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || 'application/pdf',
              fileBase64: base64Content,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with status ${response.status}`);
          }

          const resData = await response.json();
          if (!resData.success || !resData.data) {
            throw new Error(resData.error || 'Failed to extract transactions from statement.');
          }

          setStatusMessage('Finalizing monthly spending report...');

          const parsed = resData.data;
          const statementId = `stmt-${Date.now()}`;
          const rawTxs = Array.isArray(parsed.transactions) ? parsed.transactions : [];
          const newStatement: BankStatement = {
            id: statementId,
            fileName: file.name,
            fileType: fileNameLower.endsWith('.pdf')
              ? 'pdf'
              : fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg')
              ? 'png'
              : fileNameLower.endsWith('.docx')
              ? 'docx'
              : fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')
              ? 'xlsx'
              : 'other',
            uploadedAt: new Date().toISOString(),
            bankName: parsed.bankName || 'Imported Bank Statement',
            accountNumberMasked: parsed.accountNumberMasked || '...8899',
            statementPeriod: parsed.statementPeriod || `${new Date().toLocaleString('default', { month: 'long' })} 2026`,
            statementMonth: parsed.statementMonth || new Date().toISOString().slice(0, 7),
            startingBalance: parsed.startingBalance,
            endingBalance: parsed.endingBalance,
            totalIncome: parsed.totalIncome || rawTxs.filter((t: any) => t?.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0),
            totalExpenses: parsed.totalExpenses || rawTxs.filter((t: any) => t?.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0),
            transactions: rawTxs.map((tx: any, idx: number) => ({
              ...tx,
              id: tx.id || `tx-imp-${idx}-${Date.now()}`,
              statementId,
            })),
          };

          onStatementLoaded(newStatement);
          setIsLoading(false);
          setStatusMessage('');
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || 'Error processing bank statement with AI.');
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read file.');
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  // Handle previous budget tracker Excel import (multi-month retroactive integration)
  const handleExcelTrackerFile = async (file: File) => {
    const fileNameLower = file.name.toLowerCase();
    const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.csv');

    if (!isExcel) {
      setErrorMessage('Please upload a valid Excel spreadsheet (.xlsx, .xls) or CSV budget tracker.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setStatusMessage('Reading historical Excel budget tracker...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultString = reader.result as string;
          const base64Content = resultString.split(',')[1];

          setStatusMessage('AI parsing sheets, extracting historical months & categorizing transactions...');

          const response = await fetch('/api/parse-excel-budget', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileBase64: base64Content,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with status ${response.status}`);
          }

          const resData = await response.json();
          if (!resData.success || !resData.data) {
            throw new Error(resData.error || 'Failed to parse Excel budget data.');
          }

          const rawData = resData.data;
          const monthlyStatementsRaw = rawData.monthlyStatements || [];

          if (monthlyStatementsRaw.length === 0) {
            throw new Error('No monthly records found in the uploaded spreadsheet.');
          }

          const reconstructedStatements: BankStatement[] = monthlyStatementsRaw.map((mStmt: any, mIdx: number) => {
            const statementId = `stmt-retro-${mStmt.statementMonth || `m${mIdx}`}-${Date.now()}`;
            return {
              id: statementId,
              fileName: file.name,
              fileType: 'xlsx',
              uploadedAt: new Date().toISOString(),
              bankName: mStmt.bankName || rawData.trackerTitle || `Previous Budget Tracker (${mStmt.statementMonth})`,
              accountNumberMasked: mStmt.accountNumberMasked,
              statementPeriod: mStmt.statementPeriod || mStmt.statementMonth,
              statementMonth: mStmt.statementMonth,
              totalIncome: mStmt.totalIncome || 0,
              totalExpenses: mStmt.totalExpenses || 0,
              isRetroactive: true,
              sourceTrackerName: file.name,
              transactions: (mStmt.transactions || []).map((tx: any, txIdx: number) => ({
                ...tx,
                id: tx.id || `tx-retro-${mIdx}-${txIdx}-${Date.now()}`,
                statementId,
              })),
            };
          });

          if (onMultipleStatementsLoaded) {
            onMultipleStatementsLoaded(reconstructedStatements);
          } else {
            // fallback: load first
            onStatementLoaded(reconstructedStatements[0]);
          }

          const totalTxCount = reconstructedStatements.reduce((sum, s) => sum + s.transactions.length, 0);
          setSuccessMessage(
            `Successfully integrated ${reconstructedStatements.length} historical months with ${totalTxCount} transactions into your budget retroactively!`
          );
          setIsLoading(false);
          setStatusMessage('');
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || 'Error processing Excel budget tracker.');
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read spreadsheet file.');
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error processing file.');
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste bank statement transactions or statement text.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setStatusMessage('AI analyzing pasted text & categorizing transactions...');

    try {
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: pastedText,
          fileName: 'Pasted_Statement_Text.txt',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.error || 'Failed to extract transactions.');
      }

      const parsed = resData.data;
      const statementId = `stmt-pasted-${Date.now()}`;
      const rawTxs = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      const newStatement: BankStatement = {
        id: statementId,
        fileName: 'Pasted Bank Statement Data',
        fileType: 'other',
        uploadedAt: new Date().toISOString(),
        bankName: parsed.bankName || 'Pasted Statement Data',
        statementPeriod: parsed.statementPeriod || 'Current Period',
        statementMonth: parsed.statementMonth || new Date().toISOString().slice(0, 7),
        totalIncome: parsed.totalIncome || rawTxs.filter((t: any) => t?.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0),
        totalExpenses: parsed.totalExpenses || rawTxs.filter((t: any) => t?.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0),
        transactions: rawTxs.map((tx: any, idx: number) => ({
          ...tx,
          id: tx.id || `tx-paste-${idx}-${Date.now()}`,
          statementId,
        })),
      };

      onStatementLoaded(newStatement);
      setIsLoading(false);
      setPastedText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing statement text.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 transition-all">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Bank Statement & Historical Data</h2>
              <p className="text-xs text-slate-500">
                Upload PDF, PNG, DOCX statements or import previous Excel budget trackers retroactively
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto flex-wrap gap-1">
          <button
            type="button"
            id="tab-upload-btn"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Upload Statement
          </button>

          <button
            type="button"
            id="tab-excel-btn"
            onClick={() => setActiveTab('excel')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'bg-white text-slate-900 shadow-xs font-semibold text-emerald-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Import Excel Tracker
          </button>

          <button
            type="button"
            id="tab-samples-btn"
            onClick={() => setActiveTab('sample')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'sample'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Sample Statements
          </button>

          <button
            type="button"
            id="tab-paste-btn"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Text
          </button>
        </div>
      </div>

      {/* Success display */}
      {successMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Error: </span>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab 1: Standard Bank Statement File Dropzone */}
      {activeTab === 'upload' && (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.doc,.csv,.txt,.xlsx,.xls"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
            id="statement-file-input"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 bg-slate-50/30'
            } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin flex items-center justify-center" />
                  <Sparkles className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">{statusMessage}</p>
                  <p className="text-xs text-slate-500">
                    Extracting amounts, dates, and auto-classifying into 5 core budget categories...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="p-2.5 rounded-xl bg-pink-100 text-pink-700 shadow-xs">
                    <ImageIcon className="w-5 h-5" />
                  </span>
                  <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shadow-xs">
                    <FileType className="w-5 h-5" />
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drag & drop your bank statement
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports <span className="font-semibold text-slate-700">PDF, PNG, JPG, DOCX, DOC, CSV</span> statements up to 25MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Recurring Subscriptions
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Groceries & Dining
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Utilities & Entertainment
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Excel Previous Budget Tracker Import */}
      {activeTab === 'excel' && (
        <div className="mt-4 space-y-4">
          <input
            ref={excelFileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleExcelTrackerFile(e.target.files[0]);
              }
            }}
            className="hidden"
            id="excel-tracker-file-input"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleExcelTrackerFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => !isLoading && excelFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.005]'
                : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/40'
            } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-emerald-200 border-t-emerald-600 animate-spin flex items-center justify-center" />
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">{statusMessage}</p>
                  <p className="text-xs text-slate-500">
                    Extracting historical sheets, monthly columns, and reconciling retroactive categories...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Previous Budget Tracker Spreadsheet (.xlsx / .xls)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Upload your old Excel spreadsheet or previous budget tracker. AI will extract multi-month history, reconstruct previous transactions, and integrate data retroactively into your Month and Year analytics.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-700">
                    Browse Excel File
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="pt-2">
            <button
              type="button"
              id="download-excel-template-btn"
              onClick={downloadExcelBudgetTemplate}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-start gap-3 w-full"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Download Excel Budget Tracker Template (.xlsx)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Get a formatted Excel file with sample monthly tabs and categories ready for editing.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Paste Text */}
      {activeTab === 'paste' && (
        <div className="mt-4 space-y-3">
          <textarea
            id="statement-paste-textarea"
            rows={4}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Paste transaction rows or bank export here...
Example:
08/01/2026 AVALON BAY RENT -$1,250.00
08/04/2026 NETFLIX.COM -$22.99
08/05/2026 WHOLE FOODS MARKET -$142.35
08/06/2026 DOORDASH*CHIPOTLE -$34.20
08/07/2026 ALAMO DRAFTHOUSE CINEMA -$42.00
08/10/2026 PG&E ELECTRIC BILL -$114.30`}
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none bg-slate-50/50"
          />
          <div className="flex justify-end">
            <button
              type="button"
              id="analyze-pasted-btn"
              disabled={isLoading || !pastedText.trim()}
              onClick={handlePasteSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

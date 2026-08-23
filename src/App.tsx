/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Sparkles,
  Sliders,
  Upload,
  PieChart,
  FileText,
  BarChart3,
  TrendingDown,
  ShieldCheck,
  Building2,
  ChevronRight,
  Layers,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  CalendarRange,
} from 'lucide-react';
import {
  BankStatement,
  BudgetConfig,
  Transaction,
  ViewScope,
} from './types';
import { DEFAULT_BUDGET_CONFIG } from './data/categories';
import {
  generateMonthlyReport,
  generateAggregateMonthReport,
  generateYearlyReport,
  formatCurrency,
  getMonthLabel,
} from './utils/budgetCalculations';

// Extracted Subcomponents
import { StatementUploader } from './components/StatementUploader';
import { StatementSelector } from './components/StatementSelector';
import { ViewScopeSwitcher } from './components/ViewScopeSwitcher';
import { DashboardOverview } from './components/DashboardOverview';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { VisualCharts } from './components/VisualCharts';
import { TransactionLedger } from './components/TransactionLedger';
import { YearlyDashboardView } from './components/YearlyDashboardView';
import { BudgetPlannerModal } from './components/BudgetPlannerModal';
import { AiInsightsModal } from './components/AiInsightsModal';

const STORAGE_KEY_STATEMENTS = 'smart_budget_statements_v2';
const STORAGE_KEY_CONFIG = 'smart_budget_config_v2';
const STORAGE_KEY_CURRENT_ID = 'smart_budget_active_id_v2';
const STORAGE_KEY_SCOPE = 'smart_budget_view_scope_v2';
const STORAGE_KEY_MONTH = 'smart_budget_selected_month_v2';
const STORAGE_KEY_YEAR = 'smart_budget_selected_year_v2';

export default function App() {
  // 1. Statements State
  const [statements, setStatements] = useState<BankStatement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => ({
            ...s,
            transactions: Array.isArray(s?.transactions) ? s.transactions : [],
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load statements from storage', e);
    }
    return [];
  });

  // 2. Active Statement ID (for single statement view)
  const [activeStatementId, setActiveStatementId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_ID);
      if (savedId && statements.some((s) => s?.id === savedId)) return savedId;
    } catch (e) {}
    return statements[0]?.id || '';
  });

  // 3. View Scope: 'month' | 'year' | 'statement'
  const [viewScope, setViewScope] = useState<ViewScope>(() => {
    try {
      const savedScope = localStorage.getItem(STORAGE_KEY_SCOPE) as ViewScope;
      if (savedScope === 'month' || savedScope === 'year' || savedScope === 'statement') {
        return savedScope;
      }
    } catch (e) {}
    return 'month';
  });

  // 4. Selected Month (e.g. '2026-08')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      const savedMonth = localStorage.getItem(STORAGE_KEY_MONTH);
      if (savedMonth) return savedMonth;
    } catch (e) {}
    return '2026-08';
  });

  // 5. Selected Year (e.g. '2026')
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    try {
      const savedYear = localStorage.getItem(STORAGE_KEY_YEAR);
      if (savedYear) return savedYear;
    } catch (e) {}
    return '2026';
  });

  // 6. Budget Config State
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BUDGET_CONFIG;
  });

  // Modals & Drawers
  const [showUploader, setShowUploader] = useState(false);
  const [showBudgetPlanner, setShowBudgetPlanner] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);

  // Derive available months & years from all statements
  const { availableMonths, availableYears, hasRetroactiveData } = useMemo(() => {
    const monthSet = new Set<string>();
    const yearSet = new Set<string>();
    let hasRetro = false;

    (statements || []).forEach((stmt) => {
      if (stmt?.isRetroactive) hasRetro = true;

      // Extract from statementMonth if available
      if (stmt?.statementMonth && stmt.statementMonth.match(/^\d{4}-\d{2}$/)) {
        monthSet.add(stmt.statementMonth);
        yearSet.add(stmt.statementMonth.slice(0, 4));
      }

      // Also scan transactions
      (stmt?.transactions || []).forEach((tx) => {
        if (tx?.date && tx.date.length >= 7) {
          const mKey = tx.date.slice(0, 7);
          if (mKey.match(/^\d{4}-\d{2}$/)) {
            monthSet.add(mKey);
            yearSet.add(tx.date.slice(0, 4));
          }
        }
      });
    });

    // Default fallbacks if empty
    if (monthSet.size === 0) monthSet.add('2026-08');
    if (yearSet.size === 0) yearSet.add('2026');

    const sortedMonths = Array.from(monthSet).sort().reverse();
    const sortedYears = Array.from(yearSet).sort().reverse();

    return {
      availableMonths: sortedMonths,
      availableYears: sortedYears,
      hasRetroactiveData: hasRetro,
    };
  }, [statements]);

  // Ensure selectedMonth & selectedYear are valid
  useEffect(() => {
    if (!availableMonths.includes(selectedMonth) && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Active statement object
  const activeStatement = useMemo(() => {
    return (
      (statements || []).find((s) => s?.id === activeStatementId) ||
      statements?.[0] ||
      {
        id: 'empty',
        fileName: '',
        bankName: 'No Statement',
        statementPeriod: 'N/A',
        statementMonth: new Date().toISOString().slice(0, 7),
        startingBalance: 0,
        endingBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        transactions: [],
      }
    );
  }, [statements, activeStatementId]);

  // Derived Single Statement Report
  const singleStatementReport = useMemo(() => {
    return generateMonthlyReport(activeStatement, budgetConfig);
  }, [activeStatement, budgetConfig]);

  // Derived Aggregate Monthly Report (for selected month)
  const aggregateMonthReport = useMemo(() => {
    return generateAggregateMonthReport(statements, selectedMonth, budgetConfig);
  }, [statements, selectedMonth, budgetConfig]);

  // Derived Yearly Spending Report (for selected year)
  const yearlyReport = useMemo(() => {
    return generateYearlyReport(statements, selectedYear, budgetConfig);
  }, [statements, selectedYear, budgetConfig]);

  // Active Display Report based on current view scope
  const activeReport = useMemo(() => {
    if (viewScope === 'statement') return singleStatementReport;
    return aggregateMonthReport;
  }, [viewScope, singleStatementReport, aggregateMonthReport]);

  // Active transactions for ledger
  const activeTransactions = useMemo(() => {
    if (viewScope === 'statement') {
      return activeStatement?.transactions || [];
    }
    if (viewScope === 'month') {
      return aggregateMonthReport?.transactions || [];
    }
    return yearlyReport?.transactions || [];
  }, [viewScope, activeStatement, aggregateMonthReport, yearlyReport]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATEMENTS, JSON.stringify(statements));
    } catch (e) {}
  }, [statements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_ID, activeStatementId);
      localStorage.setItem(STORAGE_KEY_SCOPE, viewScope);
      localStorage.setItem(STORAGE_KEY_MONTH, selectedMonth);
      localStorage.setItem(STORAGE_KEY_YEAR, selectedYear);
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(budgetConfig));
    } catch (e) {}
  }, [activeStatementId, viewScope, selectedMonth, selectedYear, budgetConfig]);

  // Handler: Single Statement Loaded
  const handleStatementLoaded = (newStatement: BankStatement) => {
    const normalized: BankStatement = {
      ...newStatement,
      transactions: Array.isArray(newStatement?.transactions) ? newStatement.transactions : [],
    };
    setStatements((prev) => {
      const existingIdx = prev.findIndex((s) => s?.id === normalized.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = normalized;
        return updated;
      }
      return [normalized, ...prev];
    });
    setActiveStatementId(normalized.id);
    if (normalized.statementMonth) {
      setSelectedMonth(normalized.statementMonth);
      setSelectedYear(normalized.statementMonth.slice(0, 4));
    }
    setShowUploader(false);
  };

  // Handler: Multiple Retroactive Statements Loaded (from Excel Tracker)
  const handleMultipleStatementsLoaded = (newStatements: BankStatement[]) => {
    const normalizedList = (newStatements || []).map((s) => ({
      ...s,
      transactions: Array.isArray(s?.transactions) ? s.transactions : [],
    }));

    setStatements((prev) => {
      const map = new Map<string, BankStatement>();
      // Keep existing non-duplicate
      prev.forEach((s) => {
        if (s?.id) map.set(s.id, s);
      });
      // Overwrite / add new
      normalizedList.forEach((s) => {
        if (s?.id) map.set(s.id, s);
      });
      return Array.from(map.values());
    });

    if (normalizedList.length > 0) {
      setActiveStatementId(normalizedList[0].id);
      if (normalizedList[0].statementMonth) {
        setSelectedMonth(normalizedList[0].statementMonth);
        setSelectedYear(normalizedList[0].statementMonth.slice(0, 4));
      }
    }
    setShowUploader(false);
  };

  // Handler: Update transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setStatements((prev) =>
      prev.map((stmt) => {
        const txs = Array.isArray(stmt?.transactions) ? stmt.transactions : [];
        const hasTx = txs.some((tx) => tx?.id === updatedTx.id);
        if (!hasTx) return stmt;

        const updatedTxs = txs.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx));
        const totalExpenses = updatedTxs
          .filter((t) => t?.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalIncome = updatedTxs
          .filter((t) => t?.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          ...stmt,
          transactions: updatedTxs,
          totalExpenses,
          totalIncome,
        };
      })
    );
  };

  // Handler: Delete transaction
  const handleDeleteTransaction = (txId: string) => {
    setStatements((prev) =>
      prev.map((stmt) => {
        const txs = Array.isArray(stmt?.transactions) ? stmt.transactions : [];
        const hasTx = txs.some((tx) => tx?.id === txId);
        if (!hasTx) return stmt;

        const updatedTxs = txs.filter((tx) => tx.id !== txId);
        const totalExpenses = updatedTxs
          .filter((t) => t?.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalIncome = updatedTxs
          .filter((t) => t?.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          ...stmt,
          transactions: updatedTxs,
          totalExpenses,
          totalIncome,
        };
      })
    );
  };

  // Handler: Add transaction
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const targetStatementId =
      viewScope === 'statement'
        ? activeStatement.id
        : statements.find((s) => s?.statementMonth === selectedMonth)?.id || activeStatement.id;

    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      statementId: targetStatementId,
    };

    setStatements((prev) =>
      prev.map((stmt) => {
        if (stmt.id !== targetStatementId) return stmt;
        const txs = Array.isArray(stmt?.transactions) ? stmt.transactions : [];
        const updatedTxs = [newTx, ...txs];
        const totalExpenses = updatedTxs
          .filter((t) => t?.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalIncome = updatedTxs
          .filter((t) => t?.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          ...stmt,
          transactions: updatedTxs,
          totalExpenses,
          totalIncome,
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Smart Budget & Statement Analyzer
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" /> AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Automated Bank Statement Categorization, Retroactive Excel Import & Multi-Year Budget Variance
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="header-budget-btn"
              onClick={() => setShowBudgetPlanner(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Set</span> Budget Limits
            </button>

            <button
              type="button"
              id="header-ai-insights-btn"
              onClick={() => setShowAiInsights(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">AI</span> Insights
            </button>

            <button
              type="button"
              id="header-upload-btn"
              onClick={() => setShowUploader(!showUploader)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                showUploader
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{showUploader ? 'Close Upload' : 'Upload / Import'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Horizon / View Scope Switcher (Month vs Year vs Statement) */}
        <ViewScopeSwitcher
          currentScope={viewScope}
          onChangeScope={(scope) => setViewScope(scope)}
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
          availableYears={availableYears}
          selectedYear={selectedYear}
          onSelectYear={(y) => setSelectedYear(y)}
          statements={statements}
          activeStatementId={activeStatement.id}
          onSelectStatementId={(id) => setActiveStatementId(id)}
          hasRetroactiveData={hasRetroactiveData}
        />

        {/* Statement Selector / Metadata Bar (shown in Statement view or when statement details are needed) */}
        {viewScope === 'statement' && (
          <StatementSelector
            statements={statements}
            currentStatement={activeStatement}
            onSelectStatement={(stmt) => setActiveStatementId(stmt.id)}
            onUploadClick={() => setShowUploader(true)}
          />
        )}

        {/* Upload Statement & Excel Import Drawer */}
        {showUploader && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <StatementUploader
              onStatementLoaded={handleStatementLoaded}
              onMultipleStatementsLoaded={handleMultipleStatementsLoaded}
              currentStatementId={activeStatement.id}
            />
          </div>
        )}

        {/* View Mode: YEARLY DASHBOARD */}
        {viewScope === 'year' ? (
          <YearlyDashboardView
            yearlyReport={yearlyReport}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onSelectYear={(y) => setSelectedYear(y)}
            onSelectMonthToView={(mKey) => {
              setSelectedMonth(mKey);
              setViewScope('month');
            }}
            onOpenBudgetPlanner={() => setShowBudgetPlanner(true)}
            onOpenAiInsights={() => setShowAiInsights(true)}
          />
        ) : (
          /* View Mode: MONTHLY or STATEMENT DASHBOARD */
          <>
            {/* 1. Dashboard Overview Metrics & Over/Under Banner */}
            <DashboardOverview
              report={activeReport}
              statement={
                viewScope === 'statement'
                  ? activeStatement
                  : {
                      ...activeStatement,
                      bankName: `All Statements & Historical Trackers (${getMonthLabel(selectedMonth)})`,
                      statementPeriod: getMonthLabel(selectedMonth),
                    }
              }
              onOpenBudgetPlanner={() => setShowBudgetPlanner(true)}
              onOpenAiInsights={() => setShowAiInsights(true)}
            />

            {/* 2. Visual Analytics & Charts (Budget vs Actual, Category Share, Burn-down) */}
            <VisualCharts report={activeReport} />

            {/* 3. Category Breakdown (Recurring, Groceries, Dining, Entertainment, Utilities, Other) */}
            <CategoryBreakdown report={activeReport} />

            {/* 4. Categorized Transactions Ledger */}
            <TransactionLedger
              transactions={activeTransactions}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
        <p>
          Smart Budget & Statement Analyzer — Automatic categorization across Recurring Expenses, Groceries, Dining, Entertainment, & Utilities.
        </p>
        <p className="text-[11px] text-slate-400">
          Supports Bank Statement uploads in PDF, PNG, JPG, DOCX & Retroactive Excel Budget Tracker imports (.xlsx, .xls, .csv).
        </p>
      </footer>

      {/* Modals */}
      <BudgetPlannerModal
        isOpen={showBudgetPlanner}
        onClose={() => setShowBudgetPlanner(false)}
        budgetConfig={budgetConfig}
        onSaveBudget={(newConfig) => setBudgetConfig(newConfig)}
      />

      <AiInsightsModal
        isOpen={showAiInsights}
        onClose={() => setShowAiInsights(false)}
        report={activeReport}
        budgetConfig={budgetConfig}
      />
    </div>
  );
}

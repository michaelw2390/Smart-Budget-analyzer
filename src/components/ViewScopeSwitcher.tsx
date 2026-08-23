import React from 'react';
import {
  Calendar,
  CalendarRange,
  FileText,
  TrendingUp,
  Layers,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { ViewScope, BankStatement } from '../types';
import { getMonthLabel } from '../utils/budgetCalculations';

interface ViewScopeSwitcherProps {
  currentScope: ViewScope;
  onChangeScope: (scope: ViewScope) => void;
  availableMonths: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableYears: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  statements: BankStatement[];
  activeStatementId: string;
  onSelectStatementId: (id: string) => void;
  hasRetroactiveData: boolean;
}

export const ViewScopeSwitcher: React.FC<ViewScopeSwitcherProps> = ({
  currentScope,
  onChangeScope,
  availableMonths,
  selectedMonth,
  onSelectMonth,
  availableYears,
  selectedYear,
  onSelectYear,
  statements,
  activeStatementId,
  onSelectStatementId,
  hasRetroactiveData,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Primary Scope Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 mr-1 uppercase tracking-wider">
          View Scope:
        </span>

        {/* 1. Monthly Spending Button */}
        <button
          type="button"
          id="scope-month-btn"
          onClick={() => onChangeScope('month')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs ${
            currentScope === 'month'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Spending by Month
        </button>

        {/* 2. Yearly Spending Button */}
        <button
          type="button"
          id="scope-year-btn"
          onClick={() => onChangeScope('year')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs ${
            currentScope === 'year'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Spending by Year
        </button>

        {/* 3. Statement Detail Button */}
        <button
          type="button"
          id="scope-statement-btn"
          onClick={() => onChangeScope('statement')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs ${
            currentScope === 'statement'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Single Statement
        </button>
      </div>

      {/* Scope Sub-Pickers */}
      <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
        {currentScope === 'month' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing:</span>
            <div className="relative">
              <select
                id="scope-month-select"
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none shadow-2xs"
              >
                {(availableMonths || []).map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {getMonthLabel(mKey)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {currentScope === 'year' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing Year:</span>
            <div className="relative">
              <select
                id="scope-year-select"
                value={selectedYear}
                onChange={(e) => onSelectYear(e.target.value)}
                className="text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none shadow-2xs"
              >
                {(availableYears || []).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Year
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {currentScope === 'statement' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Statement:</span>
            <div className="relative">
              <select
                id="scope-statement-select"
                value={activeStatementId}
                onChange={(e) => onSelectStatementId(e.target.value)}
                className="text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none shadow-2xs max-w-[220px] truncate"
              >
                {(statements || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.bankName} ({s.statementMonth || s.statementPeriod})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {hasRetroactiveData && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="w-3 h-3" /> Retroactive Excel History Active
          </span>
        )}
      </div>
    </div>
  );
};

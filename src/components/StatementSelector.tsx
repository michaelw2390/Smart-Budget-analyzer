import React from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  Layers,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { BankStatement } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';

interface StatementSelectorProps {
  statements: BankStatement[];
  currentStatement: BankStatement;
  onSelectStatement: (stmt: BankStatement) => void;
  onDeleteStatement?: (stmtId: string) => void;
  onUploadClick: () => void;
}

export const StatementSelector: React.FC<StatementSelectorProps> = ({
  statements,
  currentStatement,
  onSelectStatement,
  onDeleteStatement,
  onUploadClick,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Statement Details */}
      <div className="flex items-start md:items-center gap-3.5 min-w-0">
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 shrink-0 shadow-2xs">
          <Building2 className="w-5 h-5" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {currentStatement.bankName}
            </h2>
            {currentStatement.accountNumberMasked && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Acct {currentStatement.accountNumberMasked}
              </span>
            )}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {(currentStatement?.transactions || []).length} Transactions
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {currentStatement.statementPeriod}
            </span>
            <span>•</span>
            <span>File: <span className="font-mono text-slate-600 truncate">{currentStatement.fileName}</span></span>
          </div>
        </div>
      </div>

      {/* Statement Switcher Dropdown & Upload Action */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
        {statements.length > 1 && (
          <div className="relative">
            <select
              id="statement-picker-select"
              value={currentStatement.id}
              onChange={(e) => {
                const found = statements.find((s) => s.id === e.target.value);
                if (found) onSelectStatement(found);
              }}
              className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer appearance-none"
            >
              {statements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.bankName} ({s.statementPeriod})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        <button
          type="button"
          id="upload-another-stmt-btn"
          onClick={onUploadClick}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Statement
        </button>
      </div>
    </div>
  );
};

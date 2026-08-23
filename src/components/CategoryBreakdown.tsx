import React, { useState } from 'react';
import {
  Repeat,
  ShoppingCart,
  UtensilsCrossed,
  Film,
  Zap,
  Package,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MonthlySpendingReport, CategorySpendingReport, Transaction } from '../types';
import { formatCurrency, formatPercent } from '../utils/budgetCalculations';

interface CategoryBreakdownProps {
  report: MonthlySpendingReport;
  onSelectCategory?: (categoryKey: string) => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  report,
  onSelectCategory,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'recurring_expenses':
        return <Repeat className="w-4 h-4" />;
      case 'groceries':
        return <ShoppingCart className="w-4 h-4" />;
      case 'dining':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'entertainment':
        return <Film className="w-4 h-4" />;
      case 'utilities':
        return <Zap className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const toggleExpand = (catKey: string) => {
    setExpandedCategory(expandedCategory === catKey ? null : catKey);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Category Spending vs. Expected Budget</h3>
          <p className="text-xs text-slate-500">
            Breakdown across recurring expenses, groceries, dining, entertainment, and utilities
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Under Budget
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Approaching Limit
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Over Budget
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(report?.categories || []).map((catReport: CategorySpendingReport) => {
          const isOver = catReport.variance < 0;
          const varianceAbs = Math.abs(catReport.variance);
          const isExpanded = expandedCategory === catReport.category;

          // Status colors
          let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let progressColor = 'bg-emerald-500';

          if (catReport.percentUsed > 100) {
            statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            progressColor = 'bg-rose-500';
          } else if (catReport.percentUsed >= 85) {
            statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            progressColor = 'bg-amber-500';
          }

          return (
            <div
              key={catReport.category}
              id={`cat-card-${catReport.category}`}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-slate-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Top Row: Category Title & Over/Under Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: catReport.color }}
                    >
                      {getCategoryIcon(catReport.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{catReport.label}</h4>
                      <p className="text-xs text-slate-500">{catReport.transactionCount} transactions</p>
                    </div>
                  </div>

                  {/* Over/Under Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${statusBadgeClass}`}
                  >
                    {isOver ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Over by {formatCurrency(varianceAbs)}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Saved {formatCurrency(varianceAbs)}
                      </>
                    )}
                  </span>
                </div>

                {/* Numbers row: Actual vs Expected */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Actual Spent</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(catReport.actual)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Expected Budget</span>
                    <span className="font-semibold text-slate-700 text-sm">
                      {formatCurrency(catReport.budget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Difference</span>
                    <span
                      className={`font-bold text-sm flex items-center gap-0.5 ${
                        isOver ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isOver ? '-' : '+'}
                      {formatCurrency(varianceAbs)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Budget Consumption</span>
                    <span className={`font-semibold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatPercent(catReport.percentUsed)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor}`}
                      style={{ width: `${Math.min(catReport.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expand / View Transactions Toggle */}
                <button
                  type="button"
                  id={`toggle-tx-${catReport.category}`}
                  onClick={() => toggleExpand(catReport.category)}
                  className="w-full pt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Hide {catReport.transactions.length} Transactions <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      View {catReport.transactions.length} Transactions <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Transactions List */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/80 p-3 space-y-2 max-h-72 overflow-y-auto">
                  {catReport.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No transactions in this category</p>
                  ) : (
                    catReport.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-200 transition-all"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 truncate">{tx.merchant}</span>
                            {tx.isRecurring && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Repeat className="w-2.5 h-2.5" /> Subscription
                              </span>
                            )}
                            {tx.subcategory && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600">
                                {tx.subcategory}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{tx.date}</p>
                          {tx.aiReasoning && (
                            <p className="text-[10px] text-slate-500 italic truncate max-w-xs">
                              AI: {tx.aiReasoning}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 block">
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

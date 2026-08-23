import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { MonthlySpendingReport, BankStatement } from '../types';
import { formatCurrency, formatPercent } from '../utils/budgetCalculations';

interface DashboardOverviewProps {
  report: MonthlySpendingReport;
  statement: BankStatement;
  onOpenBudgetPlanner: () => void;
  onOpenAiInsights: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  report,
  statement,
  onOpenBudgetPlanner,
  onOpenAiInsights,
}) => {
  const isOverBudget = report.netVariance < 0;
  const varianceAmount = Math.abs(report.netVariance);
  const percentOfBudget = report.totalBudget > 0 ? (report.totalActualExpenses / report.totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner Status Bar */}
      <div
        className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isOverBudget
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex items-start md:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl shadow-xs shrink-0 ${
              isOverBudget ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isOverBudget ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isOverBudget
                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                    : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                }`}
              >
                {isOverBudget ? 'Over Budget' : 'Under Budget'}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Statement Period: {statement.statementPeriod}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold mt-1 text-slate-900">
              {isOverBudget ? (
                <>
                  Spending is{' '}
                  <span className="text-rose-600">
                    {formatCurrency(varianceAmount)} ({formatPercent(percentOfBudget - 100)} over)
                  </span>{' '}
                  expected budget
                </>
              ) : (
                <>
                  You are{' '}
                  <span className="text-emerald-700">
                    {formatCurrency(varianceAmount)} ({formatPercent(100 - percentOfBudget)} under)
                  </span>{' '}
                  your expected budget!
                </>
              )}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Actual spent: <span className="font-semibold text-slate-900">{formatCurrency(report.totalActualExpenses)}</span> of expected{' '}
              <span className="font-semibold text-slate-900">{formatCurrency(report.totalBudget)}</span> budget target.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            id="adjust-budget-btn"
            onClick={onOpenBudgetPlanner}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Adjust Budget
          </button>
          <button
            type="button"
            id="ai-insights-btn"
            onClick={onOpenAiInsights}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Insights
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Actual Spending */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Actual Spending</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(report.totalActualExpenses)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-slate-500">Target: {formatCurrency(report.totalBudget)}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                percentOfBudget > 100
                  ? 'bg-rose-500'
                  : percentOfBudget > 85
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Expected Budget & Net Difference */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Budget Difference</span>
            <div
              className={`p-2 rounded-xl ${
                isOverBudget ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isOverBudget ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold tracking-tight ${
                isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {isOverBudget ? `-$${varianceAmount.toFixed(2)}` : `+$${varianceAmount.toFixed(2)}`}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span
                className={`font-semibold ${
                  isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {isOverBudget ? 'Over Budget' : 'Under Budget'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{formatPercent(percentOfBudget)} used</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {isOverBudget
              ? 'Exceeded monthly budget threshold'
              : 'Safely within allocated monthly budget'}
          </div>
        </div>

        {/* Metric 3: Total Income & Net Savings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Income & Cash Flow</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(report.totalIncome)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-700 font-semibold">
                +{formatCurrency(report.netSavings)} net saved
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Savings rate:{' '}
            <span className="font-semibold text-slate-700">
              {report.totalIncome > 0
                ? `${Math.round((report.netSavings / report.totalIncome) * 100)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Metric 4: Recurring Expenses Overhead */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recurring Overhead</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(report.recurringExpensesTotal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-indigo-700 font-semibold">
                {formatPercent(report.recurringExpensesPercentage)} of total spend
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Fixed rent, insurance, and recurring subscriptions
          </div>
        </div>
      </div>
    </div>
  );
};

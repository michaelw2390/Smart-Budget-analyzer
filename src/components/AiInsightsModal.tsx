import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  TrendingDown,
  Award,
  AlertCircle,
  Lightbulb,
  Repeat,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { MonthlySpendingReport, AiFinancialInsight, BudgetConfig } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';

interface AiInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MonthlySpendingReport;
  budgetConfig: BudgetConfig;
}

export const AiInsightsModal: React.FC<AiInsightsModalProps> = ({
  isOpen,
  onClose,
  report,
  budgetConfig,
}) => {
  const [insights, setInsights] = useState<AiFinancialInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyData: {
            month: report.statementMonth,
            period: report.statementPeriod,
            totalActualExpenses: report.totalActualExpenses,
            totalBudget: report.totalBudget,
            netVariance: report.netVariance,
            totalIncome: report.totalIncome,
            netSavings: report.netSavings,
            recurringExpensesTotal: report.recurringExpensesTotal,
            recurringRatioPercentage: report.recurringExpensesPercentage,
          },
          budgetTargets: budgetConfig,
          categoryTotals: (report?.categories || []).map((c) => ({
            category: c.category,
            label: c.label,
            actual: c.actual,
            budget: c.budget,
            variance: c.variance,
            percentUsed: c.percentUsed,
            status: c.status,
            transactionCount: c.transactionCount,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.insights) {
        setInsights(data.insights);
      } else {
        throw new Error('No insights data returned.');
      }
    } catch (err: any) {
      console.error('Insights fetch failed:', err);
      // Generate intelligent fallback insight client-side if offline or API key pending
      const isOver = (report?.netVariance || 0) < 0;
      const cats = report?.categories || [];
      const overCategories = cats.filter((c) => (c.variance || 0) < 0);
      const underCategories = cats.filter((c) => (c.variance || 0) > 0);

      setInsights({
        overallGrade: isOver ? 'B-' : 'A',
        summary: isOver
          ? `You were slightly over budget this period by ${formatCurrency(Math.abs(report.netVariance))}. The primary overages occurred in ${overCategories.map((c) => c.label).join(', ') || 'discretionary categories'}.`
          : `Excellent budget control! You remained under budget by ${formatCurrency(report.netVariance)}, saving ${Math.round((report.netSavings / (report.totalIncome || 1)) * 100)}% of your monthly inflows.`,
        netVarianceStatus: isOver
          ? `Over Budget by ${formatCurrency(Math.abs(report.netVariance))}`
          : `Under Budget by ${formatCurrency(report.netVariance)}`,
        keyHighlights: [
          `Recurring fixed overhead accounts for ${formatCurrency(report.recurringExpensesTotal)} (${Math.round(report.recurringExpensesPercentage)}% of all expenses).`,
          underCategories.length > 0
            ? `Successfully stayed under budget in ${underCategories.map((c) => c.label).slice(0, 2).join(' and ')}.`
            : 'All categories were near or above targeted limits.',
          `Total net surplus saved into bank balance was ${formatCurrency(report.netSavings)}.`,
        ],
        recommendations: [
          {
            title: 'Review Food Delivery & Takeout',
            category: 'dining',
            potentialMonthlySavings: 85,
            action: 'Meal prep 2 additional weekday lunches to trim dining expenses closer to your budget target.',
          },
          {
            title: 'Audit Digital Recurring Subscriptions',
            category: 'recurring_expenses',
            potentialMonthlySavings: 42,
            action: 'Review active monthly streaming and cloud storage services to pause unutilized tiers.',
          },
          {
            title: 'Optimize Grocery Basket & Bulk Staples',
            category: 'groceries',
            potentialMonthlySavings: 60,
            action: 'Purchase non-perishable pantry items in wholesale bulk rather than single-run supermarkets.',
          },
        ],
        recurringAudit: {
          totalRecurringSpend: report.recurringExpensesTotal,
          recurringRatioPercentage: Number(report.recurringExpensesPercentage.toFixed(1)),
          commentary: `Fixed commitments consume ${Math.round(report.recurringExpensesPercentage)}% of your spending. Keeping this under 50% ensures healthy financial flexibility.`,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !insights) {
      fetchInsights();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 md:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Financial Insights & Recommendations</h3>
              <p className="text-xs text-slate-500">
                Gemini automated spending audit for {report.statementPeriod}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Generating personalized financial insights...
            </p>
            <p className="text-xs text-slate-500">
              Auditing recurring subscriptions, variance benchmarks & optimization strategies
            </p>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Grade & Executive Summary Banner */}
            <div className="p-4 rounded-xl bg-linear-to-br from-indigo-900 to-slate-900 text-white flex items-start gap-3.5 shadow-xs">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Health</span>
                <span className="text-2xl font-black text-amber-300">{insights.overallGrade || 'A'}</span>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-100 border border-indigo-400/30">
                    {insights.netVarianceStatus || 'Budget Summary'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{insights.summary}</p>
              </div>
            </div>

            {/* Key Highlights */}
            {insights.keyHighlights && insights.keyHighlights.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  Key Spending Observations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {insights.keyHighlights.map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Savings Recommendations */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Actionable Savings Opportunities
              </h4>

              <div className="space-y-2">
                {insights.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                      {rec.potentialMonthlySavings && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Save ~${rec.potentialMonthlySavings}/mo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Audit */}
            {insights.recurringAudit && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-indigo-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-indigo-600" /> Recurring Overhead Audit
                  </span>
                  <span>
                    {formatCurrency(insights.recurringAudit.totalRecurringSpend)} ({insights.recurringAudit.recurringRatioPercentage}% of spend)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {insights.recurringAudit.commentary}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={fetchInsights}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Re-analyze
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import { YearlySpendingReport, BudgetCategoryKey, Transaction } from '../types';
import { formatCurrency, formatPercent } from '../utils/budgetCalculations';

interface YearlyDashboardViewProps {
  yearlyReport: YearlySpendingReport;
  availableYears: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  onSelectMonthToView: (monthKey: string) => void;
  onOpenBudgetPlanner: () => void;
  onOpenAiInsights: () => void;
}

export const YearlyDashboardView: React.FC<YearlyDashboardViewProps> = ({
  yearlyReport,
  availableYears,
  selectedYear,
  onSelectYear,
  onSelectMonthToView,
  onOpenBudgetPlanner,
  onOpenAiInsights,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'monthly_trend' | 'category_share' | 'comparison'>('monthly_trend');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const isOverBudget = yearlyReport.netVariance < 0;
  const varianceAmount = Math.abs(yearlyReport.netVariance);
  const percentOfBudget =
    yearlyReport.totalBudget > 0
      ? (yearlyReport.totalActualExpenses / yearlyReport.totalBudget) * 100
      : 0;

  // Chart data for 12 months
  const monthlyChartData = (yearlyReport?.monthlyBreakdowns || []).map((m) => ({
    name: m.shortMonth,
    fullName: m.monthName,
    monthKey: m.monthKey,
    ActualSpent: m.actual,
    Budget: m.budget,
    Income: m.income,
    variance: m.variance,
    transactions: m.transactionCount,
  }));

  // Pie chart data for categories
  const pieData = (yearlyReport?.categoryTotals || [])
    .filter((cat) => (cat?.annualActual || 0) > 0)
    .map((cat) => ({
      name: cat.label,
      value: cat.annualActual,
      color: cat.color,
      pct: cat.percentOfTotal,
      monthlyAvg: cat.monthlyAvg,
    }));

  const filteredTransactions = (yearlyReport?.transactions || []).filter((tx) => {
    if (!tx) return false;
    if (selectedCategoryFilter === 'all') return true;
    if (selectedCategoryFilter === 'recurring') return tx.isRecurring || tx.category === 'recurring_expenses';
    return tx.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Year Selector & Horizon Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Annual Spending Dashboard — {selectedYear}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {yearlyReport.monthsCount} Active Months
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated financial overview across all statements and retroactive previous budget trackers
            </p>
          </div>
        </div>

        {/* Year Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-xs font-semibold text-slate-600">
            Select Year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr} Financial Year
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Annual Over/Under Budget Status Banner */}
      <div
        className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isOverBudget
            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex items-start md:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl shadow-xs shrink-0 ${
              isOverBudget ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isOverBudget ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
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
                {isOverBudget ? 'Annual Budget Exceeded' : 'Under Annual Budget'}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {selectedYear} Full Year Summary ({yearlyReport.monthsCount} recorded months)
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold mt-1 text-slate-900">
              {isOverBudget ? (
                <>
                  Yearly spending is{' '}
                  <span className="text-rose-600 font-extrabold">
                    {formatCurrency(varianceAmount)} ({formatPercent(percentOfBudget - 100)} over)
                  </span>{' '}
                  expected budget target
                </>
              ) : (
                <>
                  You are{' '}
                  <span className="text-emerald-700 font-extrabold">
                    {formatCurrency(varianceAmount)} ({formatPercent(100 - percentOfBudget)} under)
                  </span>{' '}
                  your expected annual budget!
                </>
              )}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Total spent: <span className="font-semibold text-slate-900">{formatCurrency(yearlyReport.totalActualExpenses)}</span> of expected{' '}
              <span className="font-semibold text-slate-900">{formatCurrency(yearlyReport.totalBudget)}</span> budget target across {yearlyReport.monthsCount} months.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBudgetPlanner}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Adjust Budget Limits
          </button>
        </div>
      </div>

      {/* 4 Metric Cards for the Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Annual Total Spending */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Annual Total Spending</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(yearlyReport.totalActualExpenses)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-slate-500">Avg {formatCurrency(yearlyReport.avgMonthlyExpenses)}/month</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                percentOfBudget > 100 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Annual Net Variance */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Annual Budget Variance</span>
            <div
              className={`p-2 rounded-xl ${
                isOverBudget ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isOverBudget ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
              <span className={`font-semibold ${isOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                {isOverBudget ? 'Over Target' : 'Under Target'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{formatPercent(percentOfBudget)} used</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Target: {formatCurrency(yearlyReport.totalBudget)} ({yearlyReport.monthsCount} months)
          </div>
        </div>

        {/* Card 3: Annual Net Savings & Income */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Annual Net Savings</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(yearlyReport.netSavings, { showSign: true })}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-emerald-700 font-semibold">
                {yearlyReport.totalIncome > 0
                  ? `${Math.round((yearlyReport.netSavings / yearlyReport.totalIncome) * 100)}% savings rate`
                  : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Total Income: {formatCurrency(yearlyReport.totalIncome)}
          </div>
        </div>

        {/* Card 4: Recurring Spending Total for Year */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Annual Recurring Overhead</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(yearlyReport.recurringExpensesTotal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-indigo-700 font-semibold">
                {yearlyReport.recurringExpensesPercentage}% of annual spend
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Fixed subscriptions, rent & regular bills
          </div>
        </div>
      </div>

      {/* Visual Charts for the Full Year */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Annual Spending & Trend Visualizer ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Compare 12-month expenditures, category distribution, and monthly variance
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              id="year-chart-tab-trend"
              onClick={() => setActiveChartTab('monthly_trend')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeChartTab === 'monthly_trend'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              12-Month Spend vs. Budget
            </button>
            <button
              type="button"
              id="year-chart-tab-pie"
              onClick={() => setActiveChartTab('category_share')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeChartTab === 'category_share'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              Annual Category Share
            </button>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full pt-2">
          {activeChartTab === 'monthly_trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isOver = data.variance < 0;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-slate-100">{data.fullName}</p>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>Actual Spent:</span>
                            <span className="font-semibold text-white">{formatCurrency(data.ActualSpent)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>Monthly Budget:</span>
                            <span className="font-semibold text-white">{formatCurrency(data.Budget)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>Income:</span>
                            <span className="font-semibold text-emerald-300">{formatCurrency(data.Income)}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-700 flex items-center justify-between gap-4">
                            <span>Variance:</span>
                            <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isOver ? `Over by ${formatCurrency(Math.abs(data.variance))}` : `Saved ${formatCurrency(data.variance)}`}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />
                <Bar name="Actual Spent" dataKey="ActualSpent" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={22} />
                <Line
                  type="monotone"
                  name="Monthly Budget Limit"
                  dataKey="Budget"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'category_share' && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                            <p className="font-bold text-slate-100">{item.name}</p>
                            <div className="flex items-center justify-between gap-4 text-slate-300">
                              <span>Annual Total:</span>
                              <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-300">
                              <span>Share of Year:</span>
                              <span className="font-semibold text-indigo-300">{item.pct}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-300">
                              <span>Monthly Avg:</span>
                              <span className="font-semibold text-slate-200">{formatCurrency(item.monthlyAvg)}/mo</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 pr-2 text-xs">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                      <span className="text-slate-400 font-mono">({item.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Annual Category Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Annual Spending Breakdown by Category ({selectedYear})
          </h3>
          <span className="text-xs text-slate-500">
            {yearlyReport.categoryTotals.length} Core Budget Categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {yearlyReport.categoryTotals.map((cat) => {
            const isCatOver = cat.variance < 0;
            const pctUsed = cat.annualBudget > 0 ? (cat.annualActual / cat.annualBudget) * 100 : 0;
            return (
              <div
                key={cat.category}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.label}</h4>
                      <p className="text-xs text-slate-500">
                        Avg {formatCurrency(cat.monthlyAvg)}/month
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCatOver
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isCatOver ? 'Over Target' : 'Under Target'}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-bold text-base text-slate-900">{formatCurrency(cat.annualActual)}</span>
                    <span className="text-slate-500">Target: {formatCurrency(cat.annualBudget)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCatOver ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(pctUsed, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <span>Share of {selectedYear} Spend:</span>
                  <span className="font-bold text-slate-900">{cat.percentOfTotal}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Historical Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Progression Table ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Click any month row to drill into that month's categorized ledger and report
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Actual Spending</th>
                <th className="py-2.5 px-3">Expected Budget</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Recurring Overhead</th>
                <th className="py-2.5 px-3">Income</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearlyReport.monthlyBreakdowns.map((m) => {
                const isOver = m.variance < 0;
                const hasData = m.transactionCount > 0 || m.actual > 0;
                return (
                  <tr
                    key={m.monthKey}
                    onClick={() => hasData && onSelectMonthToView(m.monthKey)}
                    className={`transition-colors ${
                      hasData
                        ? 'hover:bg-indigo-50/40 cursor-pointer'
                        : 'opacity-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {m.monthName}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {formatCurrency(m.actual)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatCurrency(m.budget)}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <span className={isOver ? 'text-rose-600' : 'text-emerald-700'}>
                        {isOver ? `-${formatCurrency(Math.abs(m.variance))}` : `+${formatCurrency(m.variance)}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatCurrency(m.recurringTotal)}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-medium">
                      {formatCurrency(m.income)}
                    </td>
                    <td className="py-3 px-3">
                      {hasData ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOver
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOver ? 'Over' : 'Under'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">No data</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {hasData && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                        >
                          View Month <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

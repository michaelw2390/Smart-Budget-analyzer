import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Info } from 'lucide-react';
import { MonthlySpendingReport, CategorySpendingReport } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';

interface VisualChartsProps {
  report: MonthlySpendingReport;
}

export const VisualCharts: React.FC<VisualChartsProps> = ({ report }) => {
  const [activeChartTab, setActiveChartTab] = useState<'comparison' | 'distribution' | 'timeline'>('comparison');

  // Prepare Bar chart data: Expected Budget vs Actual per Category
  const categoriesList = report?.categories || [];
  const comparisonData = categoriesList.map((cat: CategorySpendingReport) => ({
    name: (cat?.label || '').replace(' & Takeout', '').replace(' & Bills', '').replace(' Spending', ''),
    fullName: cat?.label || '',
    ExpectedBudget: cat?.budget || 0,
    ActualSpent: cat?.actual || 0,
    variance: cat?.variance || 0,
    color: cat?.color || '#64748B',
  }));

  // Prepare Pie chart data: Category spending distribution
  const pieData = categoriesList
    .filter((cat) => (cat?.actual || 0) > 0)
    .map((cat) => ({
      name: cat.label,
      value: Number((cat.actual || 0).toFixed(2)),
      color: cat.color,
      count: cat.transactionCount || 0,
    }));

  // Prepare Timeline data: Cumulative daily spend
  const timelineData = report?.dailySpending || [];

  // Custom tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOver = data.variance < 0;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-100">{data.fullName}</p>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Expected Budget:</span>
            <span className="font-semibold text-white">{formatCurrency(data.ExpectedBudget)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Actual Spent:</span>
            <span className="font-semibold text-white">{formatCurrency(data.ActualSpent)}</span>
          </div>
          <div className="pt-1 border-t border-slate-700 flex items-center justify-between gap-4">
            <span>Status:</span>
            <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOver ? `Over by ${formatCurrency(Math.abs(data.variance))}` : `Saved ${formatCurrency(data.variance)}`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const total = report.totalActualExpenses;
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-100">{item.name}</p>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Spent:</span>
            <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Share of Total:</span>
            <span className="font-semibold text-indigo-300">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Area Chart
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-100">Date: {label}</p>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Daily Spend:</span>
            <span className="font-semibold text-white">{formatCurrency(payload[0].payload.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Cumulative Total:</span>
            <span className="font-semibold text-indigo-300">{formatCurrency(payload[0].payload.cumulative)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
      {/* Chart Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Visual Spending Analytics</h3>
          <p className="text-xs text-slate-500">
            Interactive visual charts comparing budget thresholds and category distributions
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            id="chart-tab-comparison"
            onClick={() => setActiveChartTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeChartTab === 'comparison'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Budget vs. Actual
          </button>
          <button
            type="button"
            id="chart-tab-distribution"
            onClick={() => setActiveChartTab('distribution')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeChartTab === 'distribution'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Category Share
          </button>
          <button
            type="button"
            id="chart-tab-timeline"
            onClick={() => setActiveChartTab('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeChartTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            Daily Burn Rate
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {activeChartTab === 'comparison' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Bar
                name="Expected Budget"
                dataKey="ExpectedBudget"
                fill="#94A3B8"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
              <Bar
                name="Actual Spent"
                dataKey="ActualSpent"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChartTab === 'distribution' && (
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
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Pie Legend */}
            <div className="space-y-2 pr-2 text-xs">
              {pieData.map((item) => {
                const total = report.totalActualExpenses;
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                      <span className="text-slate-400 font-mono">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeChartTab === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip content={<CustomTimelineTooltip />} />
              <Area
                type="monotone"
                name="Cumulative Spend"
                dataKey="cumulative"
                stroke="#6366F1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

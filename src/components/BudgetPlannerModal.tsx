import React, { useState } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  Repeat,
  ShoppingCart,
  UtensilsCrossed,
  Film,
  Zap,
  Package,
  DollarSign,
  Check,
  RotateCcw,
} from 'lucide-react';
import { BudgetConfig } from '../types';
import { CATEGORY_META, DEFAULT_BUDGET_CONFIG } from '../data/categories';
import { formatCurrency } from '../utils/budgetCalculations';

interface BudgetPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetConfig: BudgetConfig;
  onSaveBudget: (newConfig: BudgetConfig) => void;
}

export const BudgetPlannerModal: React.FC<BudgetPlannerModalProps> = ({
  isOpen,
  onClose,
  budgetConfig,
  onSaveBudget,
}) => {
  const [config, setConfig] = useState<BudgetConfig>({ ...budgetConfig });

  if (!isOpen) return null;

  const totalMonthlyBudget = (Object.values(config) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleApplyPreset = (preset: 'balanced' | 'frugal' | 'student' | 'default') => {
    switch (preset) {
      case 'balanced':
        setConfig({
          recurring_expenses: 1450,
          groceries: 600,
          dining: 350,
          entertainment: 200,
          utilities: 280,
          other_expenses: 300,
        });
        break;
      case 'frugal':
        setConfig({
          recurring_expenses: 1300,
          groceries: 450,
          dining: 150,
          entertainment: 80,
          utilities: 220,
          other_expenses: 150,
        });
        break;
      case 'student':
        setConfig({
          recurring_expenses: 900,
          groceries: 350,
          dining: 180,
          entertainment: 100,
          utilities: 140,
          other_expenses: 120,
        });
        break;
      case 'default':
        setConfig({ ...DEFAULT_BUDGET_CONFIG });
        break;
    }
  };

  const handleSave = () => {
    onSaveBudget(config);
    onClose();
  };

  const categoryIcons: Record<string, any> = {
    recurring_expenses: Repeat,
    groceries: ShoppingCart,
    dining: UtensilsCrossed,
    entertainment: Film,
    utilities: Zap,
    other_expenses: Package,
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Configure Expected Budget</h3>
              <p className="text-xs text-slate-500">
                Set monthly spending limits for each category to track over/under variance
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

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Quick Budget Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              id="preset-balanced-btn"
              onClick={() => handleApplyPreset('balanced')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs font-medium text-center transition-colors"
            >
              Balanced Urban
            </button>
            <button
              type="button"
              id="preset-frugal-btn"
              onClick={() => handleApplyPreset('frugal')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs font-medium text-center transition-colors"
            >
              Frugal Saver
            </button>
            <button
              type="button"
              id="preset-student-btn"
              onClick={() => handleApplyPreset('student')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs font-medium text-center transition-colors"
            >
              Lean / Student
            </button>
            <button
              type="button"
              id="preset-reset-btn"
              onClick={() => handleApplyPreset('default')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Category Inputs & Sliders */}
        <div className="space-y-4 pt-1">
          {Object.entries(config).map(([catKey, budgetVal]) => {
            const meta = CATEGORY_META[catKey as keyof typeof CATEGORY_META];
            const Icon = categoryIcons[catKey] || Package;

            return (
              <div key={catKey} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="p-1.5 rounded-lg text-white shadow-2xs"
                      style={{ backgroundColor: meta?.color || '#6366F1' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900">{meta?.label || catKey}</span>
                      <p className="text-[10px] text-slate-500">{meta?.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-500">$</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      max="10000"
                      value={budgetVal}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          [catKey]: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-24 text-right text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Range Slider for quick fine tuning */}
                <input
                  type="range"
                  min="0"
                  max={catKey === 'recurring_expenses' ? 3000 : 1500}
                  step="25"
                  value={budgetVal}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      [catKey]: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            );
          })}
        </div>

        {/* Total Target Budget Summary */}
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-indigo-900">Total Expected Monthly Budget</span>
            <p className="text-[11px] text-indigo-700">Sum of all 6 budget categories</p>
          </div>
          <span className="text-xl font-black text-indigo-950">
            {formatCurrency(totalMonthlyBudget)}
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-budget-config-btn"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Budget Limits
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Repeat,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Transaction, BudgetCategoryKey } from '../types';
import { CATEGORY_META, CORE_BUDGET_CATEGORIES } from '../data/categories';
import { formatCurrency } from '../utils/budgetCalculations';

interface TransactionLedgerProps {
  transactions: Transaction[];
  onUpdateTransaction: (updatedTx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id'>) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Transaction Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [newCategory, setNewCategory] = useState<BudgetCategoryKey>('groceries');
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      if (!tx) return false;
      // Search
      const merchantStr = (tx.merchant || '').toLowerCase();
      const descStr = (tx.description || '').toLowerCase();
      const subcatStr = (tx.subcategory || '').toLowerCase();
      const query = (searchQuery || '').toLowerCase();

      const matchesSearch =
        merchantStr.includes(query) ||
        descStr.includes(query) ||
        subcatStr.includes(query);

      // Category filter
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'income'
          ? tx.type === 'income'
          : tx.category === selectedCategory;

      // Recurring filter
      const matchesRecurring = recurringOnly ? tx.isRecurring || tx.category === 'recurring_expenses' : true;

      return matchesSearch && matchesCategory && matchesRecurring;
    });
  }, [transactions, searchQuery, selectedCategory, recurringOnly]);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newMerchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      date: newDate,
      description: newMerchant,
      merchant: newMerchant,
      amount: parsedAmount,
      type: newType,
      category: newType === 'income' ? 'income' : newCategory,
      subcategory: newSubcategory || undefined,
      isRecurring: newIsRecurring,
      confidence: 1.0,
      aiReasoning: 'Manually added by user',
    });

    // Reset
    setNewMerchant('');
    setNewAmount('');
    setNewSubcategory('');
    setShowAddModal(false);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Merchant', 'Description', 'Amount', 'Type', 'Category', 'Subcategory', 'Is Recurring', 'AI Reasoning'];
    const rows = filteredTransactions.map((tx) => [
      `"${tx.date}"`,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.type,
      tx.category,
      `"${tx.subcategory || ''}"`,
      tx.isRecurring ? 'Yes' : 'No',
      `"${(tx.aiReasoning || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `statement_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
      {/* Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Categorized Transactions Ledger</h3>
          <p className="text-xs text-slate-500">
            {filteredTransactions.length} of {transactions.length} transactions extracted & categorized
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="export-csv-btn"
            onClick={exportToCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
          <button
            type="button"
            id="add-tx-btn"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-transactions-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, description, or subcategory..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Categories</option>
            <option value="recurring_expenses">Recurring Expenses</option>
            <option value="groceries">Groceries</option>
            <option value="dining">Dining & Takeout</option>
            <option value="entertainment">Entertainment</option>
            <option value="utilities">Utilities & Bills</option>
            <option value="other_expenses">Other Spending</option>
            <option value="income">Income & Deposits</option>
          </select>

          {/* Recurring Only Filter */}
          <button
            type="button"
            id="toggle-recurring-filter"
            onClick={() => setRecurringOnly(!recurringOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border ${
              recurringOnly
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Recurring Only
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Merchant / Payee</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Tags & AI Reason</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const meta = CATEGORY_META[tx.category] || CATEGORY_META.other_expenses;
                const isIncome = tx.type === 'income';

                return (
                  <tr
                    key={tx.id}
                    id={`tx-row-${tx.id}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Merchant */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{tx.merchant}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                        {tx.description}
                      </div>
                    </td>

                    {/* Category Selector */}
                    <td className="py-2.5 px-3">
                      <select
                        id={`category-select-${tx.id}`}
                        value={tx.category}
                        onChange={(e) =>
                          onUpdateTransaction({
                            ...tx,
                            category: e.target.value as BudgetCategoryKey,
                            type: e.target.value === 'income' ? 'income' : 'expense',
                          })
                        }
                        className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        <option value="recurring_expenses">Recurring Expenses</option>
                        <option value="groceries">Groceries</option>
                        <option value="dining">Dining & Takeout</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="utilities">Utilities & Bills</option>
                        <option value="other_expenses">Other Spending</option>
                        <option value="income">Income</option>
                      </select>
                    </td>

                    {/* Tags & AI Reason */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {tx.isRecurring && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Repeat className="w-2.5 h-2.5" /> Sub
                          </span>
                        )}
                        {tx.subcategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-medium">
                            {tx.subcategory}
                          </span>
                        )}
                        {tx.aiReasoning && (
                          <span
                            title={tx.aiReasoning}
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 max-w-[140px] truncate"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            {tx.aiReasoning}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                      <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        id={`delete-tx-${tx.id}`}
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Add New Transaction</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('expense')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      newType === 'expense'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('income')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      newType === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant / Payee Name
                </label>
                <input
                  type="text"
                  required
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  placeholder="e.g. Trader Joe's or Netflix"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="45.50"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {newType === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BudgetCategoryKey)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="recurring_expenses">Recurring Expenses</option>
                    <option value="groceries">Groceries</option>
                    <option value="dining">Dining & Takeout</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="utilities">Utilities & Bills</option>
                    <option value="other_expenses">Other Spending</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subcategory (Optional)
                </label>
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="e.g. Supermarket, Coffee, Electricity"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new-tx-recurring"
                  checked={newIsRecurring}
                  onChange={(e) => setNewIsRecurring(e.target.checked)}
                  className="rounded-md text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="new-tx-recurring" className="text-xs text-slate-700 cursor-pointer">
                  Is recurring subscription / monthly bill
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

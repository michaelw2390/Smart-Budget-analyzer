import {
  BankStatement,
  BudgetConfig,
  BudgetCategoryKey,
  MonthlySpendingReport,
  YearlySpendingReport,
  CategorySpendingReport,
  Transaction,
} from '../types';
import { CATEGORY_META, CORE_BUDGET_CATEGORIES } from '../data/categories';

export function formatCurrency(amount: number, options?: { showSign?: boolean; decimals?: number }): string {
  const decimals = options?.decimals !== undefined ? options.decimals : 2;
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options?.showSign) {
    if (isPositive) return `+$${absVal}`;
    if (isNegative) return `-$${absVal}`;
    return `$${absVal}`;
  }

  return isNegative ? `-$${absVal}` : `$${absVal}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getMonthLabel(monthKey: string): string {
  // e.g. "2026-08" -> "August 2026"
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch (e) {
    return monthKey;
  }
}

export function getShortMonthLabel(monthKey: string): string {
  // e.g. "2026-08" -> "Aug"
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  } catch (e) {
    return monthKey;
  }
}

export function getAvailableYears(statements: BankStatement[]): string[] {
  const yearsSet = new Set<string>();
  (statements || []).forEach((stmt) => {
    if (stmt?.statementMonth && stmt.statementMonth.includes('-')) {
      yearsSet.add(stmt.statementMonth.split('-')[0]);
    }
    (stmt?.transactions || []).forEach((tx) => {
      if (tx?.date && tx.date.length >= 4) {
        yearsSet.add(tx.date.slice(0, 4));
      }
    });
  });
  const years = Array.from(yearsSet).sort().reverse();
  return years.length > 0 ? years : [new Date().getFullYear().toString()];
}

export function getAvailableMonths(statements: BankStatement[]): string[] {
  const monthsSet = new Set<string>();
  (statements || []).forEach((stmt) => {
    if (stmt?.statementMonth) {
      monthsSet.add(stmt.statementMonth);
    }
    (stmt?.transactions || []).forEach((tx) => {
      if (tx?.date && tx.date.length >= 7) {
        const mKey = tx.date.slice(0, 7);
        if (mKey.match(/^\d{4}-\d{2}$/)) {
          monthsSet.add(mKey);
        }
      }
    });
  });
  const months = Array.from(monthsSet).sort().reverse();
  return months.length > 0 ? months : [new Date().toISOString().slice(0, 7)];
}

export function generateMonthlyReport(
  statement: BankStatement,
  budgetConfig: BudgetConfig
): MonthlySpendingReport {
  const safeTransactions = Array.isArray(statement?.transactions) ? statement.transactions : [];
  const expenseTransactions = safeTransactions.filter((tx) => tx && tx.type === 'expense');
  const incomeTransactions = safeTransactions.filter((tx) => tx && tx.type === 'income');

  const totalActualExpenses = expenseTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const totalIncome = incomeTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const totalBudget = CORE_BUDGET_CATEGORIES.reduce((acc, cat) => acc + (budgetConfig?.[cat as keyof BudgetConfig] || 0), 0);
  const netVariance = totalBudget - totalActualExpenses;

  // Category breakdown
  const categoryReports: CategorySpendingReport[] = CORE_BUDGET_CATEGORIES.map((catKey) => {
    const meta = CATEGORY_META[catKey] || { label: catKey, color: '#64748B', bgColor: 'bg-slate-50' };
    const catTxs = expenseTransactions.filter((tx) => tx.category === catKey);
    const actual = catTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const budget = budgetConfig?.[catKey as keyof BudgetConfig] || 0;
    const variance = budget - actual;
    const percentUsed = budget > 0 ? (actual / budget) * 100 : 0;

    let status: 'under' | 'over' | 'warning' | 'on_track';
    if (percentUsed > 100) {
      status = 'over';
    } else if (percentUsed >= 85) {
      status = 'warning';
    } else if (percentUsed >= 70) {
      status = 'on_track';
    } else {
      status = 'under';
    }

    return {
      category: catKey,
      label: meta.label,
      budget,
      actual,
      variance,
      percentUsed,
      status,
      transactionCount: catTxs.length,
      transactions: catTxs,
      color: meta.color,
      bgColor: meta.bgColor,
    };
  });

  // Recurring breakdown
  const recurringTxs = expenseTransactions.filter((tx) => tx.isRecurring || tx.category === 'recurring_expenses');
  const recurringExpensesTotal = recurringTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const recurringExpensesPercentage = totalActualExpenses > 0 ? (recurringExpensesTotal / totalActualExpenses) * 100 : 0;

  // Largest expense
  const sortedExpenses = [...expenseTransactions].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const largestExpense = sortedExpenses[0];

  // Daily spending timeline
  const dateMap: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    if (tx?.date) {
      const day = tx.date;
      dateMap[day] = (dateMap[day] || 0) + (tx.amount || 0);
    }
  });

  const sortedDates = Object.keys(dateMap).sort();
  let cumulative = 0;
  const dailySpending = sortedDates.map((date) => {
    cumulative += dateMap[date];
    return {
      date: date.length >= 5 ? date.slice(5) : date, // MM-DD
      amount: Number(dateMap[date].toFixed(2)),
      cumulative: Number(cumulative.toFixed(2)),
    };
  });

  let overallStatus: 'under' | 'over' | 'on_track' = 'on_track';
  if (netVariance < 0) {
    overallStatus = 'over';
  } else if (netVariance > totalBudget * 0.05) {
    overallStatus = 'under';
  }

  return {
    statementMonth: statement?.statementMonth || new Date().toISOString().slice(0, 7),
    statementPeriod: statement?.statementPeriod || 'Current Period',
    totalBudget: Number(totalBudget.toFixed(2)),
    totalActualExpenses: Number(totalActualExpenses.toFixed(2)),
    totalIncome: Number(totalIncome.toFixed(2)),
    netSavings: Number((totalIncome - totalActualExpenses).toFixed(2)),
    netVariance: Number(netVariance.toFixed(2)),
    overallStatus,
    categories: categoryReports,
    recurringExpensesTotal: Number(recurringExpensesTotal.toFixed(2)),
    recurringExpensesPercentage: Number(recurringExpensesPercentage.toFixed(1)),
    largestExpense,
    dailySpending,
    transactions: safeTransactions,
  };
}

export function generateAggregateMonthReport(
  statements: BankStatement[],
  monthKey: string,
  budgetConfig: BudgetConfig
): MonthlySpendingReport {
  const safeStatements = Array.isArray(statements) ? statements : [];
  // Filter all statements or transactions matching this month
  const matchingStatements = safeStatements.filter((s) => s?.statementMonth === monthKey);

  // Collect transactions
  let allTxs: Transaction[] = [];
  if (matchingStatements.length > 0) {
    matchingStatements.forEach((stmt) => {
      if (Array.isArray(stmt?.transactions)) {
        allTxs.push(...stmt.transactions);
      }
    });
  } else {
    // Search across all statements for transactions in this month
    safeStatements.forEach((stmt) => {
      if (Array.isArray(stmt?.transactions)) {
        stmt.transactions.forEach((tx) => {
          if (tx?.date && tx.date.startsWith(monthKey)) {
            allTxs.push(tx);
          }
        });
      }
    });
  }

  // Deduplicate by tx.id if needed
  const uniqueMap = new Map<string, Transaction>();
  allTxs.forEach((tx) => {
    if (tx?.id) uniqueMap.set(tx.id, tx);
  });
  allTxs = Array.from(uniqueMap.values());

  const virtualStmt: BankStatement = {
    id: `aggregate-${monthKey}`,
    fileName: `Aggregate_${monthKey}.data`,
    fileType: 'other',
    uploadedAt: new Date().toISOString(),
    bankName: `All Accounts (${getMonthLabel(monthKey)})`,
    statementPeriod: getMonthLabel(monthKey),
    statementMonth: monthKey,
    totalIncome: allTxs.filter((t) => t?.type === 'income').reduce((s, t) => s + (t.amount || 0), 0),
    totalExpenses: allTxs.filter((t) => t?.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0),
    transactions: allTxs,
  };

  return generateMonthlyReport(virtualStmt, budgetConfig);
}

export function generateYearlyReport(
  statements: BankStatement[],
  year: string,
  budgetConfig: BudgetConfig
): YearlySpendingReport {
  const safeStatements = Array.isArray(statements) ? statements : [];
  // Collect all transactions for the given year
  const allTxs: Transaction[] = [];
  safeStatements.forEach((stmt) => {
    if (Array.isArray(stmt?.transactions)) {
      stmt.transactions.forEach((tx) => {
        if (tx?.date && tx.date.startsWith(year)) {
          allTxs.push(tx);
        }
      });
    }
  });

  // Group by month
  const monthMap: Record<string, { actual: number; income: number; txs: Transaction[]; recurring: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const mKey = `${year}-${mStr}`;
    monthMap[mKey] = { actual: 0, income: 0, txs: [], recurring: 0 };
  }

  allTxs.forEach((tx) => {
    if (tx?.date) {
      const mKey = tx.date.slice(0, 7);
      if (monthMap[mKey]) {
        monthMap[mKey].txs.push(tx);
        if (tx.type === 'expense') {
          monthMap[mKey].actual += (tx.amount || 0);
          if (tx.isRecurring || tx.category === 'recurring_expenses') {
            monthMap[mKey].recurring += (tx.amount || 0);
          }
        } else if (tx.type === 'income') {
          monthMap[mKey].income += (tx.amount || 0);
        }
      }
    }
  });

  const monthlyBudget = CORE_BUDGET_CATEGORIES.reduce((acc, cat) => acc + (budgetConfig?.[cat as keyof BudgetConfig] || 0), 0);

  const monthlyBreakdowns = Object.keys(monthMap)
    .sort()
    .map((mKey) => {
      const data = monthMap[mKey];
      const variance = monthlyBudget - data.actual;
      let status: 'under' | 'over' | 'on_track' = 'on_track';
      if (variance < 0) status = 'over';
      else if (variance > monthlyBudget * 0.05) status = 'under';

      return {
        monthKey: mKey,
        monthName: getMonthLabel(mKey),
        shortMonth: getShortMonthLabel(mKey),
        actual: Number(data.actual.toFixed(2)),
        budget: monthlyBudget,
        income: Number(data.income.toFixed(2)),
        variance: Number(variance.toFixed(2)),
        transactionCount: data.txs.length,
        recurringTotal: Number(data.recurring.toFixed(2)),
        status,
      };
    });

  // Active months with transactions
  const activeMonths = monthlyBreakdowns.filter((m) => m.transactionCount > 0 || m.actual > 0);
  const monthsCount = activeMonths.length > 0 ? activeMonths.length : 1;

  const totalActualExpenses = allTxs.filter((t) => t?.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalIncome = allTxs.filter((t) => t?.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalBudget = monthlyBudget * monthsCount;
  const netVariance = totalBudget - totalActualExpenses;

  // Category Annual Totals
  const categoryTotals = CORE_BUDGET_CATEGORIES.map((catKey) => {
    const meta = CATEGORY_META[catKey] || { label: catKey, color: '#64748B' };
    const catTxs = allTxs.filter((tx) => tx?.type === 'expense' && tx?.category === catKey);
    const annualActual = catTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const monthlyCatBudget = budgetConfig?.[catKey as keyof BudgetConfig] || 0;
    const annualBudget = monthlyCatBudget * monthsCount;
    const variance = annualBudget - annualActual;
    const percentOfTotal = totalActualExpenses > 0 ? (annualActual / totalActualExpenses) * 100 : 0;
    const monthlyAvg = monthsCount > 0 ? annualActual / monthsCount : 0;

    return {
      category: catKey,
      label: meta.label,
      annualActual: Number(annualActual.toFixed(2)),
      annualBudget: Number(annualBudget.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      percentOfTotal: Number(percentOfTotal.toFixed(1)),
      monthlyAvg: Number(monthlyAvg.toFixed(2)),
      color: meta.color,
    };
  });

  const recurringExpensesTotal = allTxs
    .filter((t) => t?.type === 'expense' && (t.isRecurring || t.category === 'recurring_expenses'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const recurringExpensesPercentage = totalActualExpenses > 0 ? (recurringExpensesTotal / totalActualExpenses) * 100 : 0;

  // Highest and lowest spending months among active months
  const sortedMonths = [...activeMonths].sort((a, b) => b.actual - a.actual);
  const highestSpendMonth = sortedMonths[0] ? { monthName: sortedMonths[0].monthName, amount: sortedMonths[0].actual } : undefined;
  const lowestSpendMonth = sortedMonths[sortedMonths.length - 1]
    ? { monthName: sortedMonths[sortedMonths.length - 1].monthName, amount: sortedMonths[sortedMonths.length - 1].actual }
    : undefined;

  let overallStatus: 'under' | 'over' | 'on_track' = 'on_track';
  if (netVariance < 0) overallStatus = 'over';
  else if (netVariance > totalBudget * 0.05) overallStatus = 'under';

  return {
    year,
    totalActualExpenses: Number(totalActualExpenses.toFixed(2)),
    totalBudget: Number(totalBudget.toFixed(2)),
    totalIncome: Number(totalIncome.toFixed(2)),
    netSavings: Number((totalIncome - totalActualExpenses).toFixed(2)),
    netVariance: Number(netVariance.toFixed(2)),
    overallStatus,
    monthsCount,
    monthlyBreakdowns,
    categoryTotals,
    recurringExpensesTotal: Number(recurringExpensesTotal.toFixed(2)),
    recurringExpensesPercentage: Number(recurringExpensesPercentage.toFixed(1)),
    avgMonthlyExpenses: Number((totalActualExpenses / monthsCount).toFixed(2)),
    avgMonthlyIncome: Number((totalIncome / monthsCount).toFixed(2)),
    highestSpendMonth,
    lowestSpendMonth,
    transactions: allTxs,
  };
}

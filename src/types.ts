export type BudgetCategoryKey =
  | 'recurring_expenses'
  | 'groceries'
  | 'dining'
  | 'entertainment'
  | 'utilities'
  | 'other_expenses'
  | 'income';

export type ViewScope = 'statement' | 'month' | 'year' | 'trends';

export interface CategoryMeta {
  key: BudgetCategoryKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconName: string;
  defaultBudget: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  type: 'expense' | 'income';
  category: BudgetCategoryKey;
  subcategory?: string;
  isRecurring: boolean;
  aiReasoning?: string;
  confidence?: number;
  statementId?: string;
}

export interface BankStatement {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'png' | 'docx' | 'xlsx' | 'sample' | 'other';
  uploadedAt: string;
  bankName: string;
  accountNumberMasked?: string;
  statementPeriod: string;
  statementMonth: string; // e.g. "2026-08"
  startingBalance?: number;
  endingBalance?: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
  isRetroactive?: boolean;
  sourceTrackerName?: string;
}

export interface BudgetConfig {
  recurring_expenses: number;
  groceries: number;
  dining: number;
  entertainment: number;
  utilities: number;
  other_expenses: number;
}

export interface CategorySpendingReport {
  category: BudgetCategoryKey;
  label: string;
  budget: number;
  actual: number;
  variance: number; // positive = under budget (saved), negative = over budget
  percentUsed: number;
  status: 'under' | 'over' | 'warning' | 'on_track';
  transactionCount: number;
  transactions: Transaction[];
  color: string;
  bgColor: string;
}

export interface MonthlySpendingReport {
  statementMonth: string;
  statementPeriod: string;
  totalBudget: number;
  totalActualExpenses: number;
  totalIncome: number;
  netSavings: number;
  netVariance: number; // totalBudget - totalActualExpenses
  overallStatus: 'under' | 'over' | 'on_track';
  categories: CategorySpendingReport[];
  recurringExpensesTotal: number;
  recurringExpensesPercentage: number;
  largestExpense?: Transaction;
  dailySpending: { date: string; amount: number; cumulative: number }[];
  transactions?: Transaction[];
  previousMonthComparison?: {
    prevMonthName: string;
    totalExpensesDelta: number;
    percentChange: number;
  };
}

export interface YearlySpendingReport {
  year: string; // e.g. "2026", "2025"
  totalActualExpenses: number;
  totalBudget: number;
  totalIncome: number;
  netSavings: number;
  netVariance: number;
  overallStatus: 'under' | 'over' | 'on_track';
  monthsCount: number;
  monthlyBreakdowns: {
    monthKey: string; // "2026-08"
    monthName: string; // "Aug 2026"
    shortMonth: string; // "Aug"
    actual: number;
    budget: number;
    income: number;
    variance: number;
    transactionCount: number;
    recurringTotal: number;
    status: 'under' | 'over' | 'on_track';
  }[];
  categoryTotals: {
    category: BudgetCategoryKey;
    label: string;
    annualActual: number;
    annualBudget: number;
    variance: number;
    percentOfTotal: number;
    monthlyAvg: number;
    color: string;
  }[];
  recurringExpensesTotal: number;
  recurringExpensesPercentage: number;
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
  highestSpendMonth?: { monthName: string; amount: number };
  lowestSpendMonth?: { monthName: string; amount: number };
  transactions: Transaction[];
}

export interface AiFinancialInsight {
  overallGrade: string;
  summary: string;
  netVarianceStatus: string;
  keyHighlights: string[];
  recommendations: {
    title: string;
    category: string;
    potentialMonthlySavings?: number;
    action: string;
  }[];
  recurringAudit?: {
    totalRecurringSpend: number;
    recurringRatioPercentage: number;
    commentary: string;
  };
}

export interface ExcelBudgetImportResult {
  trackerTitle: string;
  sourceFileName: string;
  detectedYears: string[];
  monthlyStatements: BankStatement[];
  totalMonths: number;
  totalTransactionsCount: number;
}

import * as XLSX from 'xlsx';
import { BankStatement, Transaction } from '../types';

/**
 * Generate a sample downloadable Excel Budget Tracker template
 */
export function downloadExcelBudgetTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Instructions Sheet
  const instructionsData = [
    ['SMART BUDGET TRACKER - EXCEL IMPORT TEMPLATE'],
    [''],
    ['Instructions:'],
    ['1. Fill in your historical budget transactions in the "Transactions" tab or monthly budget summaries in "Monthly_Summary".'],
    ['2. The AI will automatically parse the dates, amounts, categories, and merchants retroactively.'],
    ['3. Standard Categories: recurring_expenses, groceries, dining, entertainment, utilities, other_expenses, income'],
    [''],
    ['Supported date formats: YYYY-MM-DD, MM/DD/YYYY, or Month YYYY'],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // 2. Transactions Sheet
  const transactionsData = [
    ['Date', 'Merchant / Description', 'Category', 'Amount', 'Type', 'Is Recurring', 'Notes'],
    ['2025-01-01', 'Direct Deposit Payroll', 'income', 4600.0, 'income', 'Yes', 'Monthly direct deposit'],
    ['2025-01-01', 'Avalon Bay Apartments', 'recurring_expenses', 1250.0, 'expense', 'Yes', 'Rent'],
    ['2025-01-04', 'Netflix Streaming', 'recurring_expenses', 22.99, 'expense', 'Yes', 'Monthly sub'],
    ['2025-01-05', 'Whole Foods Market', 'groceries', 155.4, 'expense', 'No', 'Weekly groceries'],
    ['2025-01-08', 'PG&E Electric & Gas', 'utilities', 145.2, 'expense', 'Yes', 'Utility bill'],
    ['2025-01-12', 'Blue Bottle Coffee', 'dining', 32.5, 'expense', 'No', 'Weekend brunch'],
    ['2025-01-18', 'Steam Games Video Game', 'entertainment', 59.99, 'expense', 'No', 'Game purchase'],
    ['2025-01-22', 'Trader Joes Groceries', 'groceries', 112.8, 'expense', 'No', 'Pantry restock'],
    ['2025-01-28', 'Target Retail Store', 'other_expenses', 65.4, 'expense', 'No', 'Household essentials'],
    ['2025-02-01', 'Direct Deposit Payroll', 'income', 4600.0, 'income', 'Yes', 'Monthly direct deposit'],
    ['2025-02-01', 'Avalon Bay Apartments', 'recurring_expenses', 1250.0, 'expense', 'Yes', 'Rent'],
    ['2025-02-05', 'Whole Foods Market', 'groceries', 168.9, 'expense', 'No', 'Groceries'],
    ['2025-02-14', 'Valentines Dinner Italian', 'dining', 145.0, 'expense', 'No', 'Dinner reservation'],
  ];
  const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // 3. Monthly Summary Sheet
  const summaryData = [
    ['Month', 'Total Income', 'Recurring', 'Groceries', 'Dining', 'Entertainment', 'Utilities', 'Other', 'Total Spent', 'Net Savings'],
    ['2025-01', 4600, 1420, 540, 380, 190, 260, 210, 3000, 1600],
    ['2025-02', 4600, 1420, 560, 410, 180, 275, 230, 3075, 1525],
    ['2025-03', 4600, 1420, 520, 360, 210, 240, 190, 2940, 1660],
    ['2025-04', 4600, 1420, 580, 395, 175, 250, 240, 3060, 1540],
    ['2025-05', 4600, 1420, 530, 420, 220, 230, 260, 3080, 1520],
    ['2025-06', 4600, 1420, 590, 440, 250, 260, 280, 3240, 1360],
    ['2025-07', 4600, 1420, 610, 460, 270, 290, 310, 3360, 1240],
    ['2025-08', 4600, 1420, 550, 400, 190, 280, 220, 3060, 1540],
    ['2025-09', 4600, 1420, 535, 370, 180, 245, 195, 2945, 1655],
    ['2025-10', 4600, 1420, 570, 390, 230, 255, 240, 3105, 1495],
    ['2025-11', 4600, 1420, 620, 430, 210, 270, 350, 3300, 1300],
    ['2025-12', 5200, 1420, 680, 510, 320, 285, 480, 3695, 1505],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly_Summary');

  // Trigger download
  XLSX.writeFile(wb, 'Previous_Budget_Tracker_Template.xlsx');
}

/**
 * Creates rich retroactive multi-month sample bank statements (2025 - 2026)
 * to simulate previously imported Excel budget trackers.
 */
export function generateRetroactiveSampleData(): BankStatement[] {
  const months = [
    { key: '2025-01', name: 'January 2025', days: 31, factor: 0.96 },
    { key: '2025-02', name: 'February 2025', days: 28, factor: 0.98 },
    { key: '2025-03', name: 'March 2025', days: 31, factor: 0.94 },
    { key: '2025-04', name: 'April 2025', days: 30, factor: 0.99 },
    { key: '2025-05', name: 'May 2025', days: 31, factor: 1.02 },
    { key: '2025-06', name: 'June 2025', days: 30, factor: 1.05 },
    { key: '2025-07', name: 'July 2025', days: 31, factor: 1.08 },
    { key: '2025-08', name: 'August 2025', days: 31, factor: 0.97 },
    { key: '2025-09', name: 'September 2025', days: 30, factor: 0.95 },
    { key: '2025-10', name: 'October 2025', days: 31, factor: 1.01 },
    { key: '2025-11', name: 'November 2025', days: 30, factor: 1.06 },
    { key: '2025-12', name: 'December 2025', days: 31, factor: 1.18 },
    // 2026 previous months
    { key: '2026-01', name: 'January 2026', days: 31, factor: 0.95 },
    { key: '2026-02', name: 'February 2026', days: 28, factor: 0.97 },
    { key: '2026-03', name: 'March 2026', days: 31, factor: 0.96 },
    { key: '2026-04', name: 'April 2026', days: 30, factor: 0.98 },
    { key: '2026-05', name: 'May 2026', days: 31, factor: 1.01 },
    { key: '2026-06', name: 'June 2026', days: 30, factor: 1.04 },
  ];

  return months.map((m, mIdx) => {
    const stmtId = `stmt-retro-${m.key}`;
    const txs: Transaction[] = [
      // Income
      {
        id: `tx-retro-${m.key}-inc-1`,
        date: `${m.key}-01`,
        description: 'EMPLOYER DIRECT DEP ACME CORP',
        merchant: 'Acme Corp Payroll',
        amount: 2400.0,
        type: 'income',
        category: 'income',
        subcategory: 'Salary',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-inc-2`,
        date: `${m.key}-15`,
        description: 'EMPLOYER DIRECT DEP ACME CORP',
        merchant: 'Acme Corp Payroll',
        amount: m.key === '2025-12' ? 3000.0 : 2400.0, // year end bonus
        type: 'income',
        category: 'income',
        subcategory: 'Salary',
        isRecurring: true,
        statementId: stmtId,
      },

      // Recurring
      {
        id: `tx-retro-${m.key}-rec-1`,
        date: `${m.key}-01`,
        description: 'APARTMENT RENT ACH RESIDENT PORTAL',
        merchant: 'Avalon Bay Housing',
        amount: 1250.0,
        type: 'expense',
        category: 'recurring_expenses',
        subcategory: 'Rent/Housing',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-rec-2`,
        date: `${m.key}-04`,
        description: 'NETFLIX STREAMING SUBSCRIPTION',
        merchant: 'Netflix',
        amount: 22.99,
        type: 'expense',
        category: 'recurring_expenses',
        subcategory: 'Streaming Video',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-rec-3`,
        date: `${m.key}-05`,
        description: 'SPOTIFY USA PREMIUM FAMILY',
        merchant: 'Spotify',
        amount: 19.99,
        type: 'expense',
        category: 'recurring_expenses',
        subcategory: 'Music',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-rec-4`,
        date: `${m.key}-08`,
        description: 'EQUINOX FITNESS MEMBERSHIP',
        merchant: 'Equinox Gym',
        amount: 125.0,
        type: 'expense',
        category: 'recurring_expenses',
        subcategory: 'Fitness & Gym',
        isRecurring: true,
        statementId: stmtId,
      },

      // Groceries
      {
        id: `tx-retro-${m.key}-groc-1`,
        date: `${m.key}-03`,
        description: 'WHOLE FOODS MARKET OAKLAND',
        merchant: 'Whole Foods Market',
        amount: Number((140 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'groceries',
        subcategory: 'Supermarket',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-groc-2`,
        date: `${m.key}-10`,
        description: 'TRADER JOES GROCERIES',
        merchant: "Trader Joe's",
        amount: Number((95 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'groceries',
        subcategory: 'Supermarket',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-groc-3`,
        date: `${m.key}-17`,
        description: 'COSTCO WHOLESALE BULK FOOD',
        merchant: 'Costco Wholesale',
        amount: Number((180 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'groceries',
        subcategory: 'Bulk Pantry',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-groc-4`,
        date: `${m.key}-24`,
        description: 'BERKELEY BOWL ORGANIC PRODUCE',
        merchant: 'Berkeley Bowl West',
        amount: Number((110 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'groceries',
        subcategory: 'Fresh Produce',
        isRecurring: false,
        statementId: stmtId,
      },

      // Dining
      {
        id: `tx-retro-${m.key}-din-1`,
        date: `${m.key}-06`,
        description: 'BLUE BOTTLE COFFEE & PASTRIES',
        merchant: 'Blue Bottle Coffee',
        amount: Number((24.5 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'dining',
        subcategory: 'Coffee Shop',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-din-2`,
        date: `${m.key}-12`,
        description: 'CHIPOTLE ONLINE ORDER DOORDASH',
        merchant: 'Chipotle',
        amount: Number((36.8 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'dining',
        subcategory: 'Fast Casual',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-din-3`,
        date: `${m.key}-19`,
        description: 'RESTAURANT DINNER BISTRO',
        merchant: 'Local Kitchen & Bar',
        amount: Number((135 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'dining',
        subcategory: 'Dinner',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-din-4`,
        date: `${m.key}-26`,
        description: 'SWEETGREEN SOUTH PARK LUNCH',
        merchant: 'Sweetgreen',
        amount: Number((22.4 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'dining',
        subcategory: 'Lunch',
        isRecurring: false,
        statementId: stmtId,
      },

      // Entertainment
      {
        id: `tx-retro-${m.key}-ent-1`,
        date: `${m.key}-09`,
        description: 'ALAMO DRAFTHOUSE MOVIE TICKETS',
        merchant: 'Alamo Drafthouse Cinema',
        amount: Number((45 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'entertainment',
        subcategory: 'Movies',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-ent-2`,
        date: `${m.key}-21`,
        description: 'STEAM DIGITAL VIDEO GAME / STORE',
        merchant: 'Steam Games',
        amount: Number((59.99 * (mIdx % 2 === 0 ? 1 : 0.5)).toFixed(2)),
        type: 'expense',
        category: 'entertainment',
        subcategory: 'Gaming',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-ent-3`,
        date: `${m.key}-27`,
        description: 'CONCERT & CULTURAL TICKETS',
        merchant: 'Live Events',
        amount: Number((75 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'entertainment',
        subcategory: 'Events',
        isRecurring: false,
        statementId: stmtId,
      },

      // Utilities
      {
        id: `tx-retro-${m.key}-util-1`,
        date: `${m.key}-07`,
        description: 'PACIFIC GAS & ELECTRIC PG&E BILL',
        merchant: 'PG&E Electric & Gas',
        amount: Number((130 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'utilities',
        subcategory: 'Electricity & Gas',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-util-2`,
        date: `${m.key}-11`,
        description: 'SONIC GIGABIT FIBER BROADBAND',
        merchant: 'Sonic Fiber Internet',
        amount: 60.0,
        type: 'expense',
        category: 'utilities',
        subcategory: 'Internet',
        isRecurring: true,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-util-3`,
        date: `${m.key}-18`,
        description: 'T-MOBILE WIRELESS CELLULAR',
        merchant: 'T-Mobile',
        amount: 55.0,
        type: 'expense',
        category: 'utilities',
        subcategory: 'Cellular',
        isRecurring: true,
        statementId: stmtId,
      },

      // Other Expenses
      {
        id: `tx-retro-${m.key}-oth-1`,
        date: `${m.key}-14`,
        description: 'AMAZON.COM RETAIL ORDER',
        merchant: 'Amazon Marketplace',
        amount: Number((85 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'other_expenses',
        subcategory: 'Retail Shopping',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-oth-2`,
        date: `${m.key}-22`,
        description: 'SHELL OIL GASOLINE VEHICLE FUEL',
        merchant: 'Shell Gas Station',
        amount: Number((54.5 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'other_expenses',
        subcategory: 'Gasoline Fuel',
        isRecurring: false,
        statementId: stmtId,
      },
      {
        id: `tx-retro-${m.key}-oth-3`,
        date: `${m.key}-29`,
        description: 'CVS PHARMACY HEALTHCARE',
        merchant: 'CVS Pharmacy',
        amount: Number((32.1 * m.factor).toFixed(2)),
        type: 'expense',
        category: 'other_expenses',
        subcategory: 'Healthcare',
        isRecurring: false,
        statementId: stmtId,
      },
    ];

    const totalIncome = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      id: stmtId,
      fileName: `Previous_Budget_Tracker_${m.key}.xlsx`,
      fileType: 'xlsx',
      uploadedAt: new Date(2026, 0, 1).toISOString(),
      bankName: `Previous Budget Tracker (${m.name})`,
      statementPeriod: `${m.name} 1 – ${m.days}, ${m.key.slice(0, 4)}`,
      statementMonth: m.key,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      transactions: txs,
      isRetroactive: true,
      sourceTrackerName: 'Legacy Excel Budget Master.xlsx',
    };
  });
}

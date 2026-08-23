import { BudgetCategoryKey, CategoryMeta, BudgetConfig } from '../types';

export const CATEGORY_META: Record<BudgetCategoryKey, CategoryMeta> = {
  recurring_expenses: {
    key: 'recurring_expenses',
    label: 'Recurring Expenses',
    shortLabel: 'Recurring',
    description: 'Subscriptions, rent, gym, insurance & fixed recurring memberships',
    color: '#6366F1', // Indigo
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    textColor: '#4338CA',
    iconName: 'Repeat',
    defaultBudget: 1450,
  },
  groceries: {
    key: 'groceries',
    label: 'Groceries',
    shortLabel: 'Groceries',
    description: 'Supermarkets, food stores, weekly kitchen essentials & farmer markets',
    color: '#10B981', // Emerald
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#047857',
    iconName: 'ShoppingCart',
    defaultBudget: 600,
  },
  dining: {
    key: 'dining',
    label: 'Dining & Takeout',
    shortLabel: 'Dining',
    description: 'Restaurants, coffee shops, delivery services, fast food & cafes',
    color: '#F59E0B', // Amber
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#B45309',
    iconName: 'UtensilsCrossed',
    defaultBudget: 350,
  },
  entertainment: {
    key: 'entertainment',
    label: 'Entertainment',
    shortLabel: 'Entertainment',
    description: 'Cinema, concerts, gaming, live events, streaming rentals & hobbies',
    color: '#EC4899', // Pink
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    textColor: '#BE185D',
    iconName: 'Film',
    defaultBudget: 200,
  },
  utilities: {
    key: 'utilities',
    label: 'Utilities & Bills',
    shortLabel: 'Utilities',
    description: 'Electricity, gas/heat, water/sewer, home fiber internet & cellular',
    color: '#06B6D4', // Cyan
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    textColor: '#0E7490',
    iconName: 'Zap',
    defaultBudget: 280,
  },
  other_expenses: {
    key: 'other_expenses',
    label: 'Other Spending',
    shortLabel: 'Other',
    description: 'Shopping, vehicle fuel/transit, health/wellness & misc purchases',
    color: '#8B5CF6', // Purple
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    textColor: '#6D28D9',
    iconName: 'Package',
    defaultBudget: 300,
  },
  income: {
    key: 'income',
    label: 'Income & Deposits',
    shortLabel: 'Income',
    description: 'Payroll direct deposits, consulting income, refunds & investments',
    color: '#059669', // Green
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    textColor: '#15803D',
    iconName: 'ArrowDownLeft',
    defaultBudget: 0,
  },
};

export const CORE_BUDGET_CATEGORIES: BudgetCategoryKey[] = [
  'recurring_expenses',
  'groceries',
  'dining',
  'entertainment',
  'utilities',
  'other_expenses',
];

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  recurring_expenses: 1450,
  groceries: 600,
  dining: 350,
  entertainment: 200,
  utilities: 280,
  other_expenses: 300,
};

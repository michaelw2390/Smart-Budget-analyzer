import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing large JSON payloads (bank statement files / images / spreadsheets)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Google Gen AI client helper
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Category definition for AI guidance
const CATEGORY_DEFINITIONS = `
You must categorize transactions into one of these exact categories:
1. "recurring_expenses" : Subscriptions (Netflix, Spotify, Apple, gym), Insurance, Rent/Mortgage, Loan payments, Software memberships, Scheduled recurring fees.
2. "groceries" : Supermarkets, Grocery stores (Whole Foods, Trader Joe's, Kroger, Costco groceries, Safeway, ALDI, local food markets).
3. "dining" : Restaurants, Cafes, Fast food, Bars, Coffee shops (Starbucks, DoorDash, UberEats, Chipotle, McDonald's, local bistros, bakeries).
4. "entertainment" : Movies, Concerts, Video games (Steam, PlayStation), Events, Bowling, Museums, Hobbies, Theme parks, Books, Streaming rentals.
5. "utilities" : Electric bill, Gas/Heating, Water/Sewer, Trash collection, Home Internet, Mobile/Cell Phone (AT&T, Verizon, T-Mobile, PG&E, ConEd).
6. "other_expenses" : Shopping/Retail (Amazon goods, Clothing), Pharmacy/Medical, Gas/Transit/Rideshare (Uber non-food, Lyft, Shell gas), Home improvements, Transfers out, ATM withdrawals, Miscellaneous.
7. "income" : Paycheck, Direct Deposit, Freelance client payments, Interest, Refunds, Transfers in, Dividends.
`;

// Helper to parse Excel buffer to text/JSON representation
function parseExcelToStructuredText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  let output = "";
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    output += `--- SHEET: ${sheetName} ---\n${csv}\n\n`;
  }
  return output;
}

// API endpoint to parse bank statements
app.post("/api/parse-statement", async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, rawText } = req.body;

    if (!fileBase64 && !rawText) {
      return res.status(400).json({ error: "Missing file content or text." });
    }

    const ai = getAiClient();
    const contents: any[] = [];

    let extractedText = rawText || "";

    // If DOCX format, extract text using mammoth
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      (fileName && (fileName.endsWith(".docx") || fileName.endsWith(".doc")))
    ) {
      if (fileBase64) {
        const buffer = Buffer.from(fileBase64, "base64");
        const mammothResult = await mammoth.extractRawText({ buffer });
        extractedText = mammothResult.value;
      }
    }

    // If XLSX / XLS format, extract text using xlsx
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "text/csv" ||
      (fileName && (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")))
    ) {
      if (fileBase64) {
        const buffer = Buffer.from(fileBase64, "base64");
        extractedText = parseExcelToStructuredText(buffer);
      }
    }

    // System prompt explaining task and rules
    const systemPrompt = `You are an expert financial forensic accountant and budget analyst.
Your task is to parse a bank statement (which can be a PDF, Image, Word document text, Excel sheet, or raw text), extract every single transaction accurately, and categorize them strictly into the requested budget categories.

${CATEGORY_DEFINITIONS}

Important Parsing Rules:
1. Extract the bank name, statement month/year or date range, starting balance, ending balance, total deposits/income, and total withdrawals/expenses if visible.
2. For each transaction:
   - Identify transaction date in YYYY-MM-DD format (if only month/day given, deduce year from statement period or use current year 2026).
   - Clean up merchant name (e.g. "SQ *BLUE BOTTLE COFFEE SAN FRANCISCO CA" -> "Blue Bottle Coffee").
   - Extract the exact dollar amount (always positive number in 'amount' field).
   - Determine if it's an 'expense' or 'income'.
   - Assign the most fitting 'category' strictly from: "recurring_expenses", "groceries", "dining", "entertainment", "utilities", "other_expenses", "income".
   - Assign a specific 'subcategory' (e.g. "Electricity Bill", "Coffee Shop", "Organic Groceries", "Streaming Subscription", "Gym Membership", "Salary").
   - Identify 'isRecurring' (true if it appears to be a monthly recurring subscription, bill, rent, utility, or periodic payment).
   - Provide a brief 1-sentence 'aiReasoning' for why this category was chosen.
   - Assign a confidence score from 0.0 to 1.0.
3. Be comprehensive: extract all debits, credits, card purchases, deposits, fees, and checks.
4. Output strictly valid JSON matching the schema.`;

    if (extractedText) {
      contents.push({
        text: `${systemPrompt}\n\nBank Statement Document Content:\n"""\n${extractedText}\n"""\n\nPlease extract all transactions and statement summary now.`,
      });
    } else if (fileBase64) {
      // PDF or Image directly supported by Gemini 3.7 Flash
      let effectiveMime = mimeType || "application/pdf";
      if (fileName) {
        if (fileName.endsWith(".png")) effectiveMime = "image/png";
        else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) effectiveMime = "image/jpeg";
        else if (fileName.endsWith(".webp")) effectiveMime = "image/webp";
        else if (fileName.endsWith(".pdf")) effectiveMime = "application/pdf";
      }

      contents.push({
        parts: [
          {
            inlineData: {
              mimeType: effectiveMime,
              data: fileBase64,
            },
          },
          {
            text: `${systemPrompt}\n\nPlease analyze this bank statement file (${fileName || "statement"}), extract all transactions, categorize them accurately, and return the structured JSON data.`,
          },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents.length === 1 && contents[0].parts ? contents[0] : contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: { type: Type.STRING, description: "Name of the financial institution" },
            accountNumberMasked: { type: Type.STRING, description: "Masked account number e.g. ...1234" },
            statementPeriod: { type: Type.STRING, description: "e.g. August 1, 2026 - August 31, 2026" },
            statementMonth: { type: Type.STRING, description: "e.g. 2026-08" },
            startingBalance: { type: Type.NUMBER, description: "Beginning balance if available" },
            endingBalance: { type: Type.NUMBER, description: "Ending balance if available" },
            totalIncome: { type: Type.NUMBER, description: "Sum of all deposits and credits" },
            totalExpenses: { type: Type.NUMBER, description: "Sum of all withdrawals and debits" },
            currency: { type: Type.STRING, description: "e.g. USD" },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique identifier for transaction" },
                  date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD" },
                  description: { type: Type.STRING, description: "Original raw description text from statement" },
                  merchant: { type: Type.STRING, description: "Cleaned merchant or payee name" },
                  amount: { type: Type.NUMBER, description: "Positive numerical transaction amount" },
                  type: {
                    type: Type.STRING,
                    description: "expense or income",
                  },
                  category: {
                    type: Type.STRING,
                    description: "One of: recurring_expenses, groceries, dining, entertainment, utilities, other_expenses, income",
                  },
                  subcategory: { type: Type.STRING, description: "Specific subcategory" },
                  isRecurring: { type: Type.BOOLEAN, description: "True if regular subscription/bill/rent" },
                  aiReasoning: { type: Type.STRING, description: "Why this category was chosen" },
                  confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
                },
                required: ["date", "description", "merchant", "amount", "type", "category"],
              },
            },
          },
          required: ["transactions", "totalExpenses"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "Failed to receive text from AI model." });
    }

    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error parsing statement:", error);
    return res.status(500).json({
      error: error.message || "Failed to process bank statement",
    });
  }
});

// API endpoint to parse multi-month Excel budget trackers retroactively
app.post("/api/parse-excel-budget", async (req, res) => {
  try {
    const { fileBase64, fileName, rawText } = req.body;

    if (!fileBase64 && !rawText) {
      return res.status(400).json({ error: "Missing spreadsheet file content." });
    }

    let extractedText = rawText || "";
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      extractedText = parseExcelToStructuredText(buffer);
    }

    const ai = getAiClient();

    const systemPrompt = `You are a financial engineering specialist. You are analyzing an Excel spreadsheet from a user's previous budget tracker.
The spreadsheet may contain multiple sheets, monthly columns, historical transaction logs, or monthly category summaries across multiple months or years (e.g., 2025, 2026, or earlier).

Your goal is to parse and reconstruct RETROACTIVE monthly budget statement objects grouped by month (YYYY-MM), extracting all transactions and mapping legacy categories to our standard budget schema:

${CATEGORY_DEFINITIONS}

Rules:
1. Identify all months present in the spreadsheet (e.g. "2025-01", "2025-02", ..., "2026-08").
2. For each month found, generate a distinct Statement object with:
   - statementMonth: "YYYY-MM"
   - statementPeriod: e.g. "January 1, 2025 – January 31, 2025"
   - bankName: e.g. "Excel Budget Tracker (Retroactive)" or name extracted from sheet
   - totalIncome: total income recorded for that month
   - totalExpenses: total expenses recorded for that month
   - transactions: array of transactions extracted for that month (or reconstructed from category entries if only summary table exists).
3. For each transaction:
   - Ensure amount is a positive number.
   - Clean up merchant/payee name.
   - Map category to one of: "recurring_expenses", "groceries", "dining", "entertainment", "utilities", "other_expenses", "income".
   - Assign 'isRecurring' (true for recurring subscriptions, rent, insurance, bills).
4. Output strictly valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          text: `${systemPrompt}\n\nPrevious Budget Tracker Excel Content:\n"""\n${extractedText}\n"""\n\nReconstruct all monthly statements retroactively now.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trackerTitle: { type: Type.STRING, description: "Title or name of previous tracker" },
            sourceFileName: { type: Type.STRING, description: "Original file name" },
            detectedYears: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of years detected e.g. ['2025', '2026']",
            },
            monthlyStatements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statementMonth: { type: Type.STRING, description: "YYYY-MM format e.g. 2025-01" },
                  statementPeriod: { type: Type.STRING, description: "e.g. January 1, 2025 - January 31, 2025" },
                  bankName: { type: Type.STRING, description: "e.g. Excel Budget Tracker 2025" },
                  accountNumberMasked: { type: Type.STRING },
                  totalIncome: { type: Type.NUMBER },
                  totalExpenses: { type: Type.NUMBER },
                  transactions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING, description: "YYYY-MM-DD" },
                        description: { type: Type.STRING },
                        merchant: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        type: { type: Type.STRING, description: "expense or income" },
                        category: { type: Type.STRING, description: "One of: recurring_expenses, groceries, dining, entertainment, utilities, other_expenses, income" },
                        subcategory: { type: Type.STRING },
                        isRecurring: { type: Type.BOOLEAN },
                        aiReasoning: { type: Type.STRING },
                      },
                      required: ["date", "description", "merchant", "amount", "type", "category"],
                    },
                  },
                },
                required: ["statementMonth", "statementPeriod", "totalExpenses", "transactions"],
              },
            },
          },
          required: ["monthlyStatements"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error parsing Excel budget tracker:", error);
    return res.status(500).json({
      error: error.message || "Failed to process previous Excel budget tracker",
    });
  }
});

// API endpoint for AI Financial Insights & Advice
app.post("/api/financial-insights", async (req, res) => {
  try {
    const { monthlyData, budgetTargets, categoryTotals } = req.body;
    const ai = getAiClient();

    const prompt = `You are a certified financial planner and smart budget advisor.
Analyze the following user's monthly spending breakdown and budget targets.

Monthly Breakdown:
${JSON.stringify({ monthlyData, budgetTargets, categoryTotals }, null, 2)}

Provide:
1. Executive Summary: 2-3 sentences overview of how well they kept to their budget this month, highlighting key over/under areas.
2. Category Breakdown Analysis: Highlights for Recurring Expenses, Groceries, Dining, Entertainment, and Utilities.
3. Top 3 Actionable Savings Recommendations: Specific steps with estimated monthly savings amounts to cut costs.
4. Recurring Subscriptions Audit: Observations on recurring charges and potential subscription waste.
5. Overall Financial Health Grade (A+, A, B, C, D) with short justification.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallGrade: { type: Type.STRING, description: "e.g. A-, B+, etc." },
            summary: { type: Type.STRING, description: "Executive summary" },
            netVarianceStatus: { type: Type.STRING, description: "e.g. 'Under Budget by $245.50' or 'Over Budget by $180.20'" },
            keyHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 bullet points highlighting biggest wins and spending leaks",
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  potentialMonthlySavings: { type: Type.NUMBER },
                  action: { type: Type.STRING },
                },
                required: ["title", "category", "action"],
              },
            },
            recurringAudit: {
              type: Type.OBJECT,
              properties: {
                totalRecurringSpend: { type: Type.NUMBER },
                recurringRatioPercentage: { type: Type.NUMBER },
                commentary: { type: Type.STRING },
              },
            },
          },
          required: ["overallGrade", "summary", "recommendations"],
        },
      },
    });

    const parsedInsights = JSON.parse(response.text || "{}");
    return res.json({ success: true, insights: parsedInsights });
  } catch (error: any) {
    console.error("Error generating insights:", error);
    return res.status(500).json({ error: error.message || "Failed to generate insights." });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Budget App server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

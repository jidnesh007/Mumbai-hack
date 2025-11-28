import mongoose from "mongoose";

// Sub-schema for detailed fixed expenses (reserved for future feature expansion)
const fixedExpenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  isLoan: { type: Boolean, default: false },
});

// NEW Sub-schema for 7-Day Cashflow Forecast
const cashflowDaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  projectedBalance: { type: Number, required: true },
  pressureEvent: { type: String, default: null }, // e.g., 'Fixed Expense Due', 'Income Day'
});

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Onboarding Data (Input) - Feature 8
  incomeType: { type: String }, // monthly / weekly / irregular
  incomeAmount: { type: Number },
  fixedExpenses: { type: Number, default: 0 }, // Non-loan fixed expenses (simplified)
  weeklyEssentials: { type: Number, default: 0 }, // Will be overwritten by F-6 analysis
  monthlySavings: { type: Number, default: 0 },
  hasLoans: { type: Boolean, default: false },
  loansAmount: { type: Number, default: 0 }, // Total monthly EMI/Loan amount
  primaryGoal: { type: String }, // Financial Goal - Feature 7 // Calculated / Engine Output Data (Stored by FinancialEngine Service)

  weeklyFlexBudget: { type: Number, default: 0 }, // Feature 1
  safeToSpendDaily: { type: Number, default: 0 }, // Feature 2
  safeToSpendWeekly: { type: Number, default: 0 }, // Feature 2 // FEATURE 3: Updated to store the detailed array
  cashflowForecast: { type: [cashflowDaySchema], default: [] },
  lowBalanceRisk: { type: String, default: "Low" },
  spendingPressure: { type: String, default: "Low" },

  financialHealthScore: { type: Number, default: 0 }, // Feature 14

  // FEATURE 6: Spending Pattern Data
  actualWeeklyEssentials: { type: Number, default: 0 },
  nonEssentialRatio: { type: Number, default: 0 }, // 0.0 to 1.0 (0% to 100%) // AI Data

  groqWelcome: { type: String }, // Initial LLM-generated message - Feature 4

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Using ES Module export default to ensure compatibility with `import Profile from "../models/Profile.js"`
export default mongoose.model("Profile", profileSchema);

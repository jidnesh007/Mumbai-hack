import Profile from "../models/Profile.js";
import Transaction from "../models/Transaction.js"; // Import the Transaction model
import { callGroq } from "../utils/groqClient.js";

// Constants
const WEEKS_IN_MONTH = 4.33;
const DAYS_IN_WEEK = 7;
const FORECAST_DAYS = 7;
const LOOKBACK_DAYS = 30; // Look back 30 days for spending patterns
const LOW_BALANCE_THRESHOLD = 2000; // Define what constitutes 'low risk'

/**
 * Executes the core financial calculations (Features 1, 2, 3, 6, 14)
 * and updates the user's Profile with the results.
 * @param {string} userId - ID of the user.
 */
export async function runFinancialEngine(userId) {
  const profile = await Profile.findOne({ userId });

  if (!profile) {
    throw new Error("Profile not found for engine run.");
  }

  // Date range for pattern analysis
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - LOOKBACK_DAYS);

  // Fetch all relevant transactions for analysis
  const transactions = await Transaction.find({
    userId,
    date: { $gte: lookbackDate },
  });

  const P_INC = profile.incomeAmount || 0;
  const P_FIX = profile.fixedExpenses || 0;
  const P_LOAN = profile.loansAmount || 0;
  const P_SAV = profile.monthlySavings || 0;

  // -----------------------------------------------------------------
  // --- 1. Spending Pattern Detection (Feature 6) ---
  // -----------------------------------------------------------------

  let totalEssentialSpending = 0;
  let totalNonEssentialSpending = 0;
  let totalSpending = 0;

  transactions.forEach((t) => {
    if (t.aiClassification === "Essential" && t.amount > 0) {
      totalEssentialSpending += t.amount;
    } else if (t.aiClassification === "Non-Essential" && t.amount > 0) {
      totalNonEssentialSpending += t.amount;
    }
  });
  totalSpending = totalEssentialSpending + totalNonEssentialSpending;

  // Calculate actual average weekly essential spending (F-6)
  const actualWeeklyEssentialAverage =
    totalEssentialSpending / (LOOKBACK_DAYS / DAYS_IN_WEEK);
  const nonEssentialRatio =
    totalSpending > 0 ? totalNonEssentialSpending / totalSpending : 0;

  // Save pattern data to profile
  profile.actualWeeklyEssentials = actualWeeklyEssentialAverage;
  profile.nonEssentialRatio = nonEssentialRatio;

  // -----------------------------------------------------------------
  // --- 2. Smart AI-Generated Weekly Budget (Feature 1) ---
  // -----------------------------------------------------------------

  // Total Fixed Monthly Burden: P_FIX (non-loan fixed) + P_LOAN (EMIs) + P_SAV (Savings)
  const monthlyBurden = P_FIX + P_LOAN + P_SAV;

  // Monthly Disposable Income: Income - Burden
  const monthlyFlexIncome = P_INC - monthlyBurden;

  // Weekly Disposable Income baseline
  const weeklyFlexIncomeBaseline = Math.max(
    0,
    monthlyFlexIncome / WEEKS_IN_MONTH
  );

  // Final Smart Flex Budget (after deducting the *actual* average weekly essentials)
  const smartWeeklyFlexBudget = Math.max(
    0,
    weeklyFlexIncomeBaseline - actualWeeklyEssentialAverage
  );

  // -----------------------------------------------------------------
  // --- 3. 7-Day Cashflow Forecast (Feature 3) ---
  // -----------------------------------------------------------------

  // *APPROXIMATION: Calculate current balance by taking last month's income minus fixed burden.*
  // *In a real app, you would fetch the live bank balance.*
  let currentBalance = monthlyFlexIncome / WEEKS_IN_MONTH; // Starting point (simplified)

  // Apply net effect of the last 7 days of transactions to the starting balance
  const lastWeekNet = transactions
    .filter(
      (t) => t.date >= new Date(Date.now() - DAYS_IN_WEEK * 24 * 60 * 60 * 1000)
    )
    .reduce((net, t) => net - t.amount, 0);

  currentBalance = Math.max(0, currentBalance + lastWeekNet);

  const cashflowForecast = [];
  let lowestBalance = currentBalance;
  let lowBalanceRisk = "Low";
  let spendingPressure = "Medium";
  let projectedBalance = currentBalance;

  for (let i = 0; i < FORECAST_DAYS; i++) {
    const date = new Date(Date.now());
    date.setDate(date.getDate() + i);

    let netChange = 0;
    let pressureEvent = null;

    // Model Income/Fixed Expenses (Simplified: Assuming monthly payments on the 1st)
    if (date.getDate() === 1) {
      // Example: If Income/Loans hit on the 1st
      netChange += P_INC;
      netChange -= monthlyBurden;
      pressureEvent = "Income/Fixed Expenses Day";
    }

    // Model Essential Spending (daily average)
    netChange -= actualWeeklyEssentialAverage / DAYS_IN_WEEK;

    projectedBalance += netChange;

    // Record the forecast point
    cashflowForecast.push({
      date: date,
      projectedBalance: projectedBalance,
      pressureEvent: pressureEvent,
    });

    // Track lowest balance
    lowestBalance = Math.min(lowestBalance, projectedBalance);
  }

  // Determine Low Balance Risk and Spending Pressure
  if (lowestBalance < LOW_BALANCE_THRESHOLD) {
    lowBalanceRisk = "High";
    spendingPressure = "High (Low Cash Buffer)";
  } else if (nonEssentialRatio > 0.4) {
    spendingPressure = "High (High Non-Essential Spending)";
  }

  // -----------------------------------------------------------------
  // --- 4. Safe-to-Spend & Health Score (Features 2, 14) ---
  // -----------------------------------------------------------------

  // Safe-to-Spend (F-2): For simplicity, based on projected weekly flex budget
  const safeToSpendWeekly = smartWeeklyFlexBudget;
  const safeToSpendDaily = safeToSpendWeekly / DAYS_IN_WEEK;

  // Financial Health Score (F-14)
  let score = 100;
  // Penalty for high loan burden
  if (P_LOAN > P_INC * 0.3) score -= 30;
  // Penalty for high non-essential spending
  score -= Math.round(nonEssentialRatio * 30);
  // Bonus for high low-balance risk (stability)
  if (lowBalanceRisk === "High") score -= 20;

  const financialHealthScore = Math.min(100, Math.max(10, score)); // Keep score between 10 and 100

  // -----------------------------------------------------------------
  // --- 5. Save Results to Profile ---
  // -----------------------------------------------------------------
  profile.weeklyFlexBudget = smartWeeklyFlexBudget;
  profile.safeToSpendWeekly = safeToSpendWeekly;
  profile.safeToSpendDaily = safeToSpendDaily;
  profile.financialHealthScore = financialHealthScore;

  // Save new pattern data
  profile.actualWeeklyEssentials = actualWeeklyEssentialAverage;
  profile.nonEssentialRatio = nonEssentialRatio;

  // Save forecast results
  profile.cashflowForecast = cashflowForecast;
  profile.lowBalanceRisk = lowBalanceRisk;
  profile.spendingPressure = spendingPressure;

  await profile.save();

  return {
    profile,
    smartWeeklyBudget: smartWeeklyFlexBudget,
    safeToSpendWeekly,
    safeToSpendDaily,
    financialHealthScore,
    cashflowForecast,
    lowBalanceRisk,
    spendingPressure,
    actualWeeklyEssentialAverage,
  };
}

/**
 * Generates Adaptive AI Nudges (Feature 5) based on the latest budget data.
 * NOTE: Using Groq client from the previous step.
 * @param {object} summaryData - Output from runFinancialEngine.
 */
export async function generateNudges(summaryData) {
  const {
    smartWeeklyBudget,
    actualWeeklyEssentialAverage,
    lowBalanceRisk,
    spendingPressure,
    profile,
  } = summaryData;

  const goal = profile.primaryGoal;

  const prompt = `You are a rule-based AI Nudge generator. Based on the user's weekly flex budget of ₹${Math.round(
    smartWeeklyBudget
  )}, actual weekly essential average of ₹${Math.round(
    actualWeeklyEssentialAverage
  )}, financial goal to ${goal}, and current status: Low Balance Risk: ${lowBalanceRisk}, Spending Pressure: ${spendingPressure}.

Generate a single, short, actionable sentence (Personalized Behavioral Nudge - Feature 5). Use the currency symbol '₹'.

- If Low Balance Risk is High, prioritize a warning to hold spending.
- If Spending Pressure is High due to high non-essential ratio, suggest a specific cut (e.g., ₹300 on food).
- If the budget is healthy and risk is Low, give a positive affirmation relating to their goal.
`;

  try {
    // Use the Groq utility call from previous steps
    const nudge = await callGroq(prompt, { max_tokens: 100 });
    return nudge;
  } catch (e) {
    console.error("Groq Nudge generation failed:", e);
    return "Good job keeping track! Check back tomorrow for more personalized tips.";
  }
}

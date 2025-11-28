import express from "express";
import auth from "../middleware/auth.js";
import Profile from "../models/Profile.js";
import {
  runFinancialEngine,
  generateNudges,
} from "../services/FinancialEngine.js";

const summaryRouter = express.Router();

// Get the full dashboard summary
summaryRouter.get("/", auth, async (req, res) => {
  try {
    const userId = req.user; // 1. Run the core financial calculations (Features 1, 2, 3, 14, 6)

    const summary = await runFinancialEngine(userId); // 2. Generate the adaptive nudge (Feature 5)

    const nudge = await generateNudges(summary); // 3. Get the latest profile data for AI Coach insights

    const profile = summary.profile; // Profile object comes directly from the engine output // Return a clean data structure for the dashboard

    res.json({
      ok: true,
      dashboardData: {
        smartWeeklyBudget: summary.smartWeeklyBudget,
        safeToSpendWeekly: summary.safeToSpendWeekly,
        safeToSpendDaily: summary.safeToSpendDaily,
        // Use the actual calculated average essential spending
        weeklyEssentials: summary.actualWeeklyEssentialAverage,
        financialHealthScore: summary.financialHealthScore,
        cashflowForecast: {
          // Structure the forecast data for the frontend
          forecast: summary.cashflowForecast,
          lowBalanceRisk: summary.lowBalanceRisk,
          spendingPressure: summary.spendingPressure,
          upcomingBalance:
            summary.cashflowForecast[summary.cashflowForecast.length - 1]
              .projectedBalance,
        },
        aiCoachInsight: profile.groqWelcome, // Re-use initial insight or fetch weekly insight here later
        personalizedNudge: nudge,
      },
    });
  } catch (err) {
    console.error("Dashboard Summary GET failed:", err);
    res.status(500).json({ error: "Server error or profile missing." });
  }
});

export default summaryRouter;

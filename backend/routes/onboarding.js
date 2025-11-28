import express from "express";
import Profile from "../models/Profile.js";
import { callGroq } from "../utils/groqClient.js";
import auth from "../middleware/auth.js";

const onboardingRouter = express.Router();

// Create or update onboarding profile (CRITICAL: NOW PROTECTED WITH 'auth')
onboardingRouter.post("/", auth, async (req, res) => {
  try {
    // CRITICAL FIX: Get userId from the authenticated token
    const uid = req.user;

    const {
      incomeType,
      incomeAmount,
      fixedExpenses,
      weeklyEssentials,
      monthlySavings,
      hasLoans,
      loansAmount,
      primaryGoal,
    } = req.body;

    if (!uid)
      return res.status(401).json({ error: "Unauthorized: User ID missing" });

    let profile = await Profile.findOne({ userId: uid });
    if (!profile) {
      profile = new Profile({ userId: uid });
    }

    // Basic input validation (omitted for brevity, but still recommended)

    profile.incomeType = incomeType;
    profile.incomeAmount = incomeAmount;
    profile.fixedExpenses = fixedExpenses;
    profile.weeklyEssentials = weeklyEssentials;
    profile.monthlySavings = monthlySavings;
    profile.hasLoans = hasLoans;
    profile.loansAmount = loansAmount;
    profile.primaryGoal = primaryGoal;
    profile.updatedAt = new Date();

    // 1. Generate welcome message from Groq
    const prompt = `You are a friendly financial coach. User profile:
- incomeType: ${incomeType}
- incomeAmount: ${incomeAmount}
- fixedExpenses: ${fixedExpenses}
- weeklyEssentials: ${weeklyEssentials}
- monthlySavings: ${monthlySavings}
- hasLoans: ${hasLoans} ${hasLoans ? `loansAmount: ${loansAmount}` : ""}
- primaryGoal: ${primaryGoal}

Write a short 2-3 sentence welcome message that:
1) summarizes the user's financial situation in plain language,
2) gives 2 simple first actions the user can take this week to improve cash flow or reach the goal.
Keep it friendly and concise.`;

    let groqResp = "";
    try {
      // Note: The Groq client utility must be updated to handle the expected response object.
      groqResp = await callGroq(prompt, { max_tokens: 400 });
    } catch (err) {
      console.error("Groq call failed", err.message || err);
      groqResp =
        "Welcome — your financial profile is saved. Your AI coach will provide tips here soon.";
    }

    profile.groqWelcome = groqResp;
    await profile.save();

    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("Onboarding POST failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET profile (for initial dashboard load) - Should also be protected
onboardingRouter.get("/", auth, async (req, res) => {
  // CRITICAL FIX: Get userId from the authenticated token
  const userId = req.user;
  if (!userId)
    return res.status(401).json({ error: "Unauthorized: User ID missing" });

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json({ ok: true, profile });
  } catch (err) {
    console.error("Onboarding GET failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default onboardingRouter;

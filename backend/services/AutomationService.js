import cron from "node-cron";
import User from "../models/User.js";
import { runFinancialEngine } from "./FinancialEngine.js"; // Import your core engine
import { generateWeeklySummaryGroq } from "./AISummaryService.js"; // Import Groq summary generator
import { sendEmail } from "../utils/emailClient.js"; // Import email utility

// --- Scheduled Task (Feature F-12) ---
export function startWeeklySummaryJob() {
  // Schedule the task to run every Monday at 9:00 AM (0 9 * * 1)
  // NOTE: For testing, you can change this to run every minute: '* * * * *'
  cron.schedule(
    "0 9 * * 1",
    async () => {
      console.log("🤖 Running Weekly Financial Summary Job...");

      // Find all users who are onboarded (optional check, depends on your setup)
      const users = await User.find({});

      for (const user of users) {
        try {
          // 1. Recalculate and fetch the latest summary data
          const summary = await runFinancialEngine(user._id);

          // 2. Generate the personalized AI summary text
          const summaryText = await generateWeeklySummaryGroq(summary);

          // 3. Prepare and send the email
          const emailSubject = `Weekly AI Financial Summary for ${user.email}`;
          const emailHtml = `
                    <h2>Hello ${user.email.split("@")[0]},</h2>
                    <p>Here is your personalized summary and score for the past week:</p>
                    <div style="background:#f0f4ff; padding:15px; border-radius:10px; border-left: 5px solid #4f46e5;">
                        <p style="font-weight:bold; color:#4f46e5;">Score: ${
                          summary.financialHealthScore
                        }/100</p>
                        <p>${summaryText}</p>
                        <p style="margin-top:10px;">Your Safe-to-Spend limit for this week is: ₹${Math.round(
                          summary.safeToSpendWeekly
                        ).toLocaleString()}.</p>
                    </div>
                    <p>Log into CoachAI to see your full cashflow forecast!</p>
                `;

          await sendEmail(user.email, emailSubject, emailHtml);
          console.log(`✅ Weekly summary sent to ${user.email}`);
        } catch (error) {
          console.error(
            `❌ Failed to process weekly summary for ${user.email}:`,
            error.message
          );
        }
      }
    },
    {
      timezone: "Asia/Kolkata", // Use your preferred timezone
    }
  );
}

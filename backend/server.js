import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { startWeeklySummaryJob } from "./services/AutomationService.js";

import authRoutes from "./routes/auth.js";
import onboardingRoutes from "./routes/onboarding.js";
import summaryRoutes from "./routes/summary.js";
import transactionsRoutes from "./routes/transactions.js";
import trendsRoutes from "./routes/trends.js"; // ⬅️ NEW IMPORT

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// DB
connectDB();

// Start the cron job
startWeeklySummaryJob();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/trends", trendsRoutes); // ⬅️ NEW ROUTE REGISTRATION

// Health check (optional)
app.get("/", (req, res) => {
  res.send("CoachAI API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at ${PORT}`));

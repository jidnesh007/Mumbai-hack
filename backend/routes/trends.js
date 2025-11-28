import express from "express";
import auth from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

const trendsRouter = express.Router();

/**
 * GET /api/trends/heatmap
 * Feature F-13: Aggregates the last 3 months of spending by Essential/Non-Essential classification.
 */
trendsRouter.get("/heatmap", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    // Calculate the date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // MongoDB Aggregation Pipeline
    const aggregationPipeline = [
      // 1. Filter: Select only the current user's expenses from the last 3 months
      {
        $match: {
          userId: userId,
          date: { $gte: threeMonthsAgo },
          amount: { $gt: 0 }, // Exclude income/zero entries
        },
      },
      // 2. Group: Group transactions by Year, Month, and AI Classification
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            classification: "$aiClassification",
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      // 3. Project: Reshape the output for cleaner processing on the frontend
      {
        $project: {
          _id: 0, // Exclude default _id
          year: "$_id.year",
          month: "$_id.month",
          classification: "$_id.classification",
          totalAmount: 1,
        },
      },
      // 4. Sort: Order chronologically
      {
        $sort: { year: 1, month: 1 },
      },
    ];

    const aggregatedData = await Transaction.aggregate(aggregationPipeline);

    // 5. Final Reformat: Convert array to chart-friendly structure
    const heatmapData = aggregatedData.reduce((acc, item) => {
      const monthKey = `${item.month}/${item.year % 100}`; // e.g., 11/25

      // Find or create the monthly entry
      let monthEntry = acc.find((e) => e.monthKey === monthKey);
      if (!monthEntry) {
        monthEntry = {
          monthKey: monthKey,
          Essential: 0,
          NonEssential: 0,
          Total: 0,
        };
        acc.push(monthEntry);
      }

      // Populate essential or non-essential fields
      if (item.classification === "Essential") {
        monthEntry.Essential = item.totalAmount;
      } else if (item.classification === "Non-Essential") {
        monthEntry.NonEssential = item.totalAmount;
      }
      monthEntry.Total = monthEntry.Essential + monthEntry.NonEssential;

      return acc;
    }, []);

    res.json({ heatmap: heatmapData });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ msg: "Failed to aggregate trend data." });
  }
});

export default trendsRouter;

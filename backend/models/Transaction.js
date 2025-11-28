import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "Uncategorized",
  },
  // F-6: AI Classification for Pattern Detection
  aiClassification: {
    type: String,
    enum: ["Essential", "Non-Essential", "Fixed", "Income", "Loan"],
    default: "Non-Essential",
  },
  source: {
    type: String,
    enum: ["Manual", "OCR", "Bank"],
    default: "Manual",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Transaction", transactionSchema);

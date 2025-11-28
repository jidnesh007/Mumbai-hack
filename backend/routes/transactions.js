import express from "express";
import multer from "multer";
import fs from "fs";
import auth from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import { analyzeReceiptImage } from "../utils/groqVision.js";

// Setup Multer for handling file uploads (saving to a temporary folder)
const upload = multer({ dest: "uploads/" });
const router = express.Router();

// --- F-6 CLASSIFICATION LOGIC (Robust against null/undefined) ---
function determineAiClassification(groqCategory) {
  const safeCategory = groqCategory || "";
  const essentialKeywords = [
    "grocer",
    "food",
    "fuel",
    "medical",
    "rent",
    "utilities",
    "transport",
  ];
  const lowerCategory = safeCategory.toLowerCase();

  if (essentialKeywords.some((keyword) => lowerCategory.includes(keyword))) {
    return "Essential";
  }
  return "Non-Essential";
}
// ------------------------------------------------------------------

// F-11: OCR Transaction Extraction Endpoint
router.post("/ocr", auth, upload.single("receipt"), async (req, res) => {
  const userId = req.user;

  if (!req.file) {
    return res.status(400).json({ msg: "No image file uploaded." });
  }

  const filePath = req.file.path;

  try {
    // 1. Call Groq Vision to analyze the image
    const extractedData = await analyzeReceiptImage(filePath);

    // 2. CRITICAL FIXES: Clean data and ensure required fields are present

    // Fix 1: Clean the amount string into a number
    const cleanedAmount = extractedData.cleanAmount(extractedData.total_amount);

    // Fix 2: Provide a fallback for required description if Groq misses it
    const safeDescription =
      extractedData.description ||
      extractedData.category_suggestion ||
      `OCR Transaction - ${new Date().toLocaleDateString()}`;

    const aiClassification = determineAiClassification(
      extractedData.category_suggestion
    );

    // 3. Save the transaction
    const newTransaction = new Transaction({
      userId,
      date: extractedData.date ? new Date(extractedData.date) : new Date(),
      amount: cleanedAmount,
      description: safeDescription, // Use the safe description
      category: extractedData.category_suggestion || "Uncategorized",
      aiClassification: aiClassification,
      source: "OCR",
    });
    await newTransaction.save();

    // 4. Clean up the temporary file
    fs.unlinkSync(filePath);

    // 5. Trigger the Financial Engine recalculation (Uncomment when ready)
    // await runFinancialEngine(userId);

    res.json({
      msg: "Receipt processed and transaction saved successfully.",
      transaction: newTransaction,
    });
  } catch (error) {
    // Fix 3: Improved error handling for Mongoose validation and OCR failure
    let errorMessage = "OCR failed or server error.";
    if (error.name === "ValidationError") {
      const missingField = Object.keys(error.errors)[0];
      errorMessage = `Mongoose Validation Error: Path '${missingField}' is invalid or missing.`;
    } else if (error.message.includes("Cast to Number failed")) {
      errorMessage = `Data Cleaning Error: Could not convert amount to a valid number.`;
    } else {
      errorMessage = error.message;
    }

    console.error("OCR Processing Error:", errorMessage);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res
      .status(500)
      .json({ msg: "OCR failed or server error.", error: errorMessage });
  }
});

// Manual Transaction Entry (Remains the same)
router.post("/", auth, async (req, res) => {
  const userId = req.user;
  const { date, amount, description, category } = req.body;

  const aiClassification = determineAiClassification(category);

  try {
    const newTransaction = new Transaction({
      userId,
      date: new Date(date),
      amount,
      description,
      category,
      aiClassification,
      source: "Manual",
    });
    await newTransaction.save();

    res.json({ msg: "Transaction saved.", transaction: newTransaction });
  } catch (error) {
    res.status(500).json({ msg: "Error saving manual transaction." });
  }
});

// Add this route for testing transaction fetching
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user })
      .sort({ date: -1 })
      .limit(30);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching transactions." });
  }
});

export default router;

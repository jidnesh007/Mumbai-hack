import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Camera,
  RefreshCcw,
  FileText,
  Loader2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Tag,
  PlusCircle,
  DollarSign,
} from "lucide-react";

const API = "http://localhost:5000/api";

// --- Component to display the list of transactions ---
function TransactionListDisplay({ transactions, loading, error, onRefresh }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <p className="text-center py-8 text-indigo-600">
        Fetching transactions...
      </p>
    );
  if (error)
    return (
      <p className="text-center py-8 text-red-500">
        Error loading history: {error}
      </p>
    );
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
        <PlusCircle className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
        <p>
          No transactions recorded yet. Upload a receipt or add one manually!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">
          Recent Spending History
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh List
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classification
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((t) => {
              // Note: Assuming t.amount is positive for expense based on backend logic
              const isExpense = t.amount > 0;
              const isEssential = t.aiClassification === "Essential";

              return (
                <tr
                  key={t._id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {t.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div
                      className={`flex items-center font-bold ${
                        isExpense ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isExpense ? (
                        <ArrowDown className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowUp className="w-4 h-4 mr-1" />
                      )}
                      ₹
                      {Math.abs(t.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1 text-purple-400" />
                      {t.category}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${
                                              isEssential
                                                ? "bg-indigo-100 text-indigo-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                    >
                      {t.aiClassification}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(t.date)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t.source}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main unified component ---
export default function TransactionManager({ onEngineRecalculate }) {
  // OCR Upload States
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Transaction List States
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);

  // Manual Entry States (Placeholder values)
  const [manualForm, setManualForm] = useState({
    amount: "",
    description: "",
    category: "Groceries",
    date: new Date().toISOString().substring(0, 10),
  });
  const [loadingManual, setLoadingManual] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch transactions function (Memoized)
  const fetchTransactions = useCallback(async () => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const res = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err.response?.data || err);
      setErrorList("Failed to load transactions history.");
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorUpload(null);
      setSuccessMsg("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorUpload("Please select an image of a receipt first.");
      return;
    }

    setLoadingUpload(true);
    setErrorUpload(null);
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await axios.post(`${API}/transactions/ocr`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(
        `Success! Saved transaction: ₹${res.data.transaction.amount.toFixed(
          2
        )} for ${res.data.transaction.description}`
      );

      await fetchTransactions();
      if (onEngineRecalculate) {
        onEngineRecalculate(); // Trigger dashboard/engine update
      }

      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("OCR Upload Failed:", err.response?.data || err);
      setErrorUpload(
        err.response?.data?.error ||
          err.response?.data?.msg ||
          "Failed to process receipt. Try a clearer image."
      );
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoadingManual(true);
    setErrorUpload(null);
    setSuccessMsg("");

    if (!manualForm.amount || !manualForm.description || !manualForm.date) {
      setErrorUpload("All manual fields are required.");
      setLoadingManual(false);
      return;
    }

    try {
      const res = await axios.post(`${API}/transactions`, manualForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg(
        `Manual entry saved: ₹${res.data.transaction.amount.toFixed(2)} for ${
          res.data.transaction.description
        }`
      );

      await fetchTransactions();
      if (onEngineRecalculate) {
        onEngineRecalculate();
      }

      setManualForm({
        amount: "",
        description: "",
        category: "Groceries",
        date: new Date().toISOString().substring(0, 10),
      });
    } catch (err) {
      console.error("Manual Entry Failed:", err);
      setErrorUpload(
        err.response?.data?.msg || "Failed to save manual transaction."
      );
    } finally {
      setLoadingManual(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* --- OCR UPLOADER SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Camera className="h-6 w-6 text-indigo-500 mr-2" /> OCR Transaction
          Capture (F-11)
        </h3>

        {/* File Input and Upload Logic */}
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="file"
            id="receipt-upload"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="receipt-upload"
            className="flex-shrink-0 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150"
          >
            {file ? (
              <FileText className="inline mr-2 h-5 w-5" />
            ) : (
              <RefreshCcw className="inline mr-2 h-5 w-5" />
            )}
            {file ? "Change File" : "Choose Receipt Image"}
          </label>
          {file && (
            <span className="text-sm text-gray-600 truncate max-w-xs">
              Selected: **{file.name}**
            </span>
          )}
        </div>

        {/* Preview and Upload Button */}
        <div className="mt-4 flex flex-col items-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Receipt Preview"
              className="max-h-64 max-w-full rounded-lg object-contain border border-gray-200 mb-4"
              onLoad={() => URL.revokeObjectURL(previewUrl)}
            />
          )}
          <button
            onClick={handleUpload}
            disabled={!file || loadingUpload}
            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition duration-150 disabled:opacity-50 flex items-center justify-center"
          >
            {loadingUpload ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Analyzing with
                AI...
              </>
            ) : (
              "Analyze & Save Transaction"
            )}
          </button>
        </div>
      </div>

      {/* --- MANUAL ENTRY SECTION (New) --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <DollarSign className="h-6 w-6 text-yellow-500 mr-2" /> Manual
          Transaction Entry
        </h3>
        <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={manualForm.amount}
              onChange={handleManualChange}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={manualForm.date}
              onChange={handleManualChange}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={manualForm.description}
              onChange={handleManualChange}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={manualForm.category}
              onChange={handleManualChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            >
              <option value="Groceries">Groceries</option>
              <option value="Food">Dining/Takeout</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Subscription">Subscription</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loadingManual}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition duration-150 disabled:opacity-50 flex items-center justify-center"
            >
              {loadingManual ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Saving...
                </>
              ) : (
                "Add Manual Entry"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* --- STATUS MESSAGES --- */}
      {(errorUpload || successMsg) && (
        <div
          className={`p-3 rounded-lg flex items-center ${
            errorUpload
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {errorUpload ? (
            <XCircle className="h-5 w-5 mr-2" />
          ) : (
            <FileText className="h-5 w-5 mr-2" />
          )}
          {errorUpload || successMsg}
        </div>
      )}

      {/* --- TRANSACTION LIST SECTION --- */}
      <TransactionListDisplay
        transactions={transactions}
        loading={loadingList}
        error={errorList}
        onRefresh={fetchTransactions}
      />
    </div>
  );
}

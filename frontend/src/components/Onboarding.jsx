import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// CRITICAL FIX: Replace import.meta.env with a static placeholder URL
const API = "http://localhost:5000/api";

export default function Onboarding() {
  const navigate = useNavigate();
  // CRITICAL FIX: Get the token from local storage
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const [form, setForm] = useState({
    incomeType: "monthly",
    incomeAmount: "",
    fixedExpenses: "",
    weeklyEssentials: "",
    monthlySavings: "",
    hasLoans: false,
    loansAmount: "",
    primaryGoal: "save_more",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure token exists before sending
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      // CRITICAL FIX: Send JWT token in the Authorization header
      const res = await axios.post(`${API}/onboarding`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.profile) {
        setAiMessage(res.data.profile.groqWelcome);
        localStorage.setItem("onboarding_done", "1");

        // CRITICAL: Now run the Financial Engine immediately after onboarding
        await axios.get(`${API}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      console.error(err.response?.data || err);
      // Replaced alert() with state message display
      setAiMessage("Error saving profile. Please check the console.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Set Up Your Financial Profile
        </h2>
        <p className="text-gray-500 mb-8">
          Your Smart AI Coach needs this data to personalize your budget.
        </p>

        <form className="grid grid-cols-1 gap-6" onSubmit={submit}>
          {/* Input Fields (No changes needed here for functionality) */}
          {/* ... (Keep your existing form structure here) ... */}

          <div>
            <label className="font-medium text-gray-700">Income Type</label>
            <select
              name="incomeType"
              value={form.incomeType}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="monthly">Monthly Salary</option>
              <option value="weekly">Weekly / Gig</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-gray-700">
              Income Amount (Monthly Estimate)
            </label>
            <input
              type="number"
              name="incomeAmount"
              value={form.incomeAmount}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="font-medium text-gray-700">
              Fixed Monthly Expenses (Non-Loan, e.g., Rent, Bills)
            </label>
            <input
              type="number"
              name="fixedExpenses"
              value={form.fixedExpenses}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="font-medium text-gray-700">
              Estimated Weekly Essentials (Food, Travel, etc.)
            </label>
            <input
              type="number"
              name="weeklyEssentials"
              value={form.weeklyEssentials}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="font-medium text-gray-700">
              Monthly Savings Contribution Goal
            </label>
            <input
              type="number"
              name="monthlySavings"
              value={form.monthlySavings}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="hasLoans"
              checked={form.hasLoans}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 rounded"
            />
            <label className="text-gray-700">Do you have Loans/EMIs?</label>
          </div>

          {form.hasLoans && (
            <div>
              <label className="font-medium text-gray-700">
                Total Monthly Loan/EMI Amount
              </label>
              <input
                type="number"
                name="loansAmount"
                value={form.loansAmount}
                onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>
          )}

          <div>
            <label className="font-medium text-gray-700">
              Primary Financial Goal
            </label>
            <select
              name="primaryGoal"
              value={form.primaryGoal}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="save_more">Save More Monthly</option>
              <option value="reduce_spending">Reduce Overspending</option>
              <option value="emergency_fund">Build Emergency Fund</option>
              <option value="plan_budget">Better Budgeting</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-semibold transition shadow-lg disabled:opacity-50"
          >
            {loading
              ? "Calculating & Generating AI Coach..."
              : "Analyze My Finances"}
          </button>
        </form>

        {aiMessage && (
          <div className="mt-8 bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-xl">
            <p className="font-extrabold text-indigo-700 text-lg mb-1">
              🤖 AI Coach Response:
            </p>
            <p className="text-gray-700">{aiMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Zap,
  Sun,
  Clock,
  Heart,
  Loader2,
  RefreshCcw,
  LogOut,
  Home,
  UploadCloud,
  Settings,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"; // ⬅️ NEW IMPORTS FOR CASHFLOW CHART

// Import Components
import TransactionManager from "../components/TransactionManager";
import SpendingHeatmap from "../components/SpendingHeatmap"; // ⬅️ NEW IMPORT

const API = "http://localhost:5000/api";

// Initial state structure (unchanged)
const initialDashboardData = {
  smartWeeklyBudget: 0,
  safeToSpendWeekly: 0,
  safeToSpendDaily: 0,
  weeklyEssentials: 0,
  financialHealthScore: 0,
  cashflowForecast: {
    forecast: [],
    lowBalanceRisk: "Unknown",
    spendingPressure: "N/A",
    upcomingBalance: 0,
  },
  aiCoachInsight: "Loading personalized insights...",
  personalizedNudge: "Checking your patterns...",
};

// Component for a styled Stat Card (unchanged)
const StatCard = ({
  icon: Icon,
  title,
  value,
  unit = "₹",
  colorClass = "text-indigo-600",
}) => (
  <div className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-100">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-500 uppercase">{title}</h3>
      <Icon className={`h-6 w-6 ${colorClass}`} />
    </div>
    <p className="mt-1 text-3xl font-bold text-gray-900">
      {unit}
      {Math.round(value).toLocaleString("en-IN")}
    </p>
  </div>
);

// Component for the Forecast/Score Card (unchanged)
const ForecastCard = ({ title, value, description, color }) => (
  <div
    className="bg-white rounded-xl p-6 shadow-lg border-t-4"
    style={{ borderColor: color }}
  >
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p
      className={`text-3xl font-extrabold mb-2 ${
        color === "#10B981"
          ? "text-green-600"
          : color === "#F59E0B"
          ? "text-yellow-600"
          : "text-red-600"
      }`}
    >
      {value}
    </p>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

// Sidebar Component Logic (Inline - unchanged)
const SidebarContent = ({ onNavigate, activeSection }) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("onboarding_done");
    window.location.href = "/login";
  };

  const navItems = [
    { name: "Overview", icon: Home, section: "overview" },
    { name: "Safe-to-Spend", icon: Sun, section: "safe-to-spend" },
    { name: "Transactions/OCR", icon: UploadCloud, section: "transactions" },
    { name: "Heatmap & Trends", icon: TrendingUp, section: "trends" },
    { name: "Settings", icon: Settings, section: "settings" },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-full fixed top-0 left-0 z-10">
      <div className="p-6 text-2xl font-extrabold text-indigo-400 border-b border-gray-800">
        CoachAI 🚀
      </div>
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => onNavigate(item.section)}
            className={`
                            w-full flex items-center p-3 rounded-xl font-medium transition-all duration-200
                            ${
                              activeSection === item.section
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }
                        `}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 text-red-400 hover:bg-gray-700 hover:text-red-300 rounded-xl transition"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// INTEGRATED DASHBOARD CHART LOGIC (NOW USING RECHARTS)
// ------------------------------------------------------------------
const IntegratedDashboardChart = ({ forecastData }) => {
  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <TrendingUp className="w-8 h-8 mb-2" />
        <p>No forecast data available to display trend.</p>
      </div>
    );
  }

  const chartData = forecastData.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
    "Projected Balance": Math.round(day.projectedBalance), // Renamed for chart key
    Event: day.pressureEvent,
  }));

  const minBalance = Math.min(...chartData.map((d) => d["Projected Balance"]));
  const isRisk = minBalance < 2000;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-96">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        7-Day Projected Cashflow
      </h3>
      <p
        className={`text-sm font-semibold mb-4 ${
          isRisk ? "text-red-500" : "text-green-600"
        }`}
      >
        {isRisk
          ? "Risk: Low balance detected!"
          : "Status: Stable flow projected."}
      </p>

      {/* Recharts Line Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e0e0e0"
            />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              unit="₹"
              domain={["dataMin - 1000", "dataMax + 1000"]}
              tickFormatter={(value) => value / 1000 + "k"}
            />
            <Tooltip
              formatter={(value, name, props) => [
                `₹${value.toLocaleString()}`,
                name,
              ]}
              labelFormatter={(label) => `Day: ${label}`}
              contentStyle={{ borderRadius: "8px", border: "none" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Projected Balance"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
            {/* You can add custom dots for events if desired */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
// ------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const sidebarWidth = "256px";

  const loadDashboard = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.dashboardData;
      setDashboardData({
        ...data,
        cashflowForecast:
          data.cashflowForecast || initialDashboardData.cashflowForecast,
      });
    } catch (err) {
      console.error("Dashboard Load Failed:", err.response?.data || err);

      if (err.response?.status === 404) {
        navigate("/onboarding");
      } else if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDashboardRefresh = () => {
    setLoading(true);
    loadDashboard();
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mr-3" />
        <p className="text-xl text-indigo-600">
          Running Financial Engine & Loading Dashboard...
        </p>
      </div>
    );

  const scoreHex =
    dashboardData.financialHealthScore >= 70
      ? "#10B981"
      : dashboardData.financialHealthScore >= 40
      ? "#F59E0B"
      : "#EF4444";

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <section>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              🎯 Overview & Scores
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={TrendingUp}
                title="Total Weekly Budget"
                value={
                  dashboardData.smartWeeklyBudget +
                  dashboardData.weeklyEssentials
                }
                colorClass="text-indigo-600"
              />
              <StatCard
                icon={DollarSign}
                title="Flexible Spend (Weekly)"
                value={dashboardData.smartWeeklyBudget}
                colorClass="text-purple-600"
              />
              <StatCard
                icon={Sun}
                title="Safe-to-Spend (Today)"
                value={dashboardData.safeToSpendDaily}
                colorClass="text-green-600"
              />
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">
                    Financial Health Score
                  </h3>
                  <p
                    className={`mt-1 text-4xl font-extrabold`}
                    style={{ color: scoreHex }}
                  >
                    {dashboardData.financialHealthScore}
                  </p>
                </div>
                <Heart className={`h-8 w-8`} style={{ color: scoreHex }} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-2xl mb-8">
              <div className="flex items-start mb-4">
                <Zap className="h-8 w-8 text-yellow-500 mr-3 mt-1" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Adaptive AI Coach Insights
                </h2>
              </div>
              <p className="text-lg font-semibold bg-blue-50 text-blue-800 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
                🚨 Nudge: {dashboardData.personalizedNudge}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {dashboardData.aiCoachInsight}
              </p>
            </div>
          </section>
        );

      case "safe-to-spend":
        return (
          <section>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              💵 Safe-to-Spend & Cashflow Forecast
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                icon={Sun}
                title="Safe-to-Spend (Weekly Limit)"
                value={dashboardData.safeToSpendWeekly}
                colorClass="text-green-600"
              />
              <ForecastCard
                title="Cashflow Forecast (7-Day)"
                value={`₹${Math.round(
                  dashboardData.cashflowForecast.upcomingBalance
                ).toLocaleString("en-IN")}`}
                description={`Upcoming balance prediction. Risk: ${dashboardData.cashflowForecast.lowBalanceRisk}.`}
                color={
                  dashboardData.cashflowForecast.lowBalanceRisk === "High"
                    ? "#EF4444"
                    : "#10B981"
                }
              />
              <ForecastCard
                title="Spending Pressure"
                value={dashboardData.cashflowForecast.spendingPressure}
                description="Current pressure on your flex budget, influenced by fixed expenses and goals."
                color={
                  dashboardData.cashflowForecast.spendingPressure.includes(
                    "High"
                  )
                    ? "#F59E0B"
                    : "#10B981"
                }
              />
              <ForecastCard
                title="Actual Weekly Essentials"
                value={`₹${Math.round(
                  dashboardData.weeklyEssentials
                ).toLocaleString("en-IN")}`}
                description="Your actual spending average on necessities, derived from transaction patterns."
                color={"#6B7280"}
              />
            </div>
          </section>
        );

      case "transactions":
        return (
          <section>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              📸 Transaction Manager
            </h2>
            <TransactionManager onEngineRecalculate={handleDashboardRefresh} />
          </section>
        );

      case "trends":
        return (
          <section>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              📈 Spending Heatmap & Trends
            </h2>

            {/* 1. Cashflow Chart */}
            <IntegratedDashboardChart
              forecastData={dashboardData.cashflowForecast.forecast}
            />

            {/* 2. Spending Heatmap Component */}
            <div className="mt-8">
              <SpendingHeatmap />
            </div>
          </section>
        );

      case "settings":
        return (
          <section>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              ⚙️ Profile Settings
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-gray-700">
                This section allows users to update their **Onboarding
                Intelligence (F-8)** data (income, loans, goals). Saving changes
                here should also trigger `handleDashboardRefresh`.
              </p>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Component (Inline) */}
      <SidebarContent
        onNavigate={setActiveSection}
        activeSection={activeSection}
      />

      {/* Main Content Area */}
      <main
        className="flex-grow p-8 md:p-10"
        style={{ marginLeft: sidebarWidth }}
      >
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>
          <button
            onClick={handleDashboardRefresh}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </header>

        {renderSection()}

        <footer className="mt-10 pt-4 text-center text-gray-400 text-sm border-t border-gray-200">
          CoachAI Financial Engine | Data Powered by Transactions & Groq
        </footer>
      </main>
    </div>
  );
}

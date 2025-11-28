import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BarChart as BarChartIcon, PiggyBank, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API = "http://localhost:5000/api";

export default function SpendingHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calls the GET /api/trends/heatmap route
      const res = await axios.get(`${API}/trends/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHeatmapData(res.data.heatmap || []);
    } catch (err) {
      console.error("Error fetching heatmap data:", err.response?.data || err);
      setError("Failed to load spending trend data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  if (loading) {
    return (
      <p className="text-indigo-600 text-center py-6">
        Analyzing 3 months of spending...
      </p>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
        <XCircle className="h-5 w-5 mr-2" /> {error}
      </div>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
        <PiggyBank className="h-5 w-5 mr-2" /> No recorded expenses in the last
        3 months.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <BarChartIcon className="h-6 w-6 text-purple-500 mr-2" /> Spending
        Heatmap (Last 3 Months)
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        This tracks your **Essential vs. Non-Essential** spending over time.
      </p>

      {/* Recharts Stacked Bar Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={heatmapData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e0e0e0"
            />
            <XAxis dataKey="monthKey" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              unit="₹"
              tickFormatter={(value) => value / 1000 + "k"}
            />
            <Tooltip
              formatter={(value) => [
                `₹${Math.round(value).toLocaleString()}`,
                "Spending",
              ]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{ borderRadius: "8px", border: "none" }}
            />
            <Legend />
            <Bar
              dataKey="Essential"
              stackId="a"
              fill="#4f46e5"
              name="Essential Spending"
            />
            <Bar
              dataKey="NonEssential"
              stackId="a"
              fill="#ef4444"
              name="Non-Essential Spending"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

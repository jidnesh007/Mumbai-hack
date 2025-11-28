import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// CRITICAL FIX: Replace import.meta.env with a static placeholder URL
const API = "http://localhost:5000/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      // CRITICAL FIX: Use the hasProfile flag from the backend
      if (res.data.hasProfile) {
        console.log(
          "Login Successful. Profile exists. Redirecting to dashboard."
        );
        window.location.href = "/dashboard";
      } else {
        // New user flow: profile doesn't exist, redirect to onboarding questions
        console.log("Login Successful. New user, redirecting to onboarding.");
        window.location.href = "/onboarding";
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("Invalid Credentials. Please try again.");
    }
  };

  // ... (rest of the component remains the same)
  return (
    <div className="h-screen w-full bg-gradient-to-r from-gray-900 to-gray-700 flex justify-center items-center">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Login to CoachAI
        </h2>

        {errorMsg && (
          <div className="bg-red-500 text-white p-2 rounded-lg mb-4 text-center text-sm">
            {errorMsg}
          </div>
        )}

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 mb-4 bg-white/20 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-3 mb-4 bg-white/20 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg font-semibold shadow-lg"
        >
          Login
        </button>

        <p className="text-center text-gray-300 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

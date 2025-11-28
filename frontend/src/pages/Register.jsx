import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// CRITICAL FIX: Replace import.meta.env with a static placeholder URL
const API = "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async () => {
    setErrorMsg("");
    try {
      await axios.post(`${API}/auth/register`, {
        email,
        password,
      });

      console.log("Registered Successfully. Redirecting to login.");
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      setErrorMsg(
        err.response?.data?.msg || "User already exists or server error."
      );
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-r from-gray-900 to-gray-700 flex justify-center items-center">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Register for CoachAI
        </h2>

        {errorMsg && (
          <div className="bg-red-500 text-white p-2 rounded-lg mb-4 text-center text-sm">
            {errorMsg}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter your email"
          className="w-full p-3 mb-4 bg-white/20 text-white rounded-lg outline-none focus:ring-2 focus:ring-green-400 transition"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create a password"
          className="w-full p-3 mb-4 bg-white/20 text-white rounded-lg outline-none focus:ring-2 focus:ring-green-400 transition"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full py-3 bg-green-600 hover:bg-green-700 transition text-white rounded-lg font-semibold shadow-lg"
        >
          Register
        </button>

        <p className="text-center text-gray-300 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      if (!isExpired) router.push("/leads");
      else localStorage.removeItem("token");
    } catch {
      localStorage.removeItem("token");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        router.push("/leads");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-zinc-100 w-full max-w-md">
        <div className="text-center mb-8">
           <img src="/Techwell.png" alt="Logo" className="h-10 mx-auto mb-4 brightness-0" />
           <h2 className="text-2xl font-bold text-black">Admin Login</h2>
           <p className="text-zinc-500 text-sm mt-2">Enter your credentials to access the dashboard</p>
        </div>

        {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-center mb-6 text-sm border border-red-100">{error}</p>}

        <form onSubmit={handleLogin}>
          <label className="block mb-2 text-sm font-semibold text-zinc-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl mb-5 focus:outline-none focus:border-black transition-all"
            required
          />

          <label className="block mb-2 text-sm font-semibold text-zinc-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl mb-8 focus:outline-none focus:border-black transition-all"
            required
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

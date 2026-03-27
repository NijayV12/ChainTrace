import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      const user = res.user as { id: string; name: string; email: string; role: string };
      if (user.role !== "SUPER_ADMIN") {
        toast.error("Super Admin access required.");
        setLoading(false);
        return;
      }
      login(res.token, user);
      toast.success("Admin access granted");
      navigate("/admin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-xl backdrop-blur"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="font-mono text-2xl font-semibold text-teal-400">CHAINTRACE</Link>
          <p className="mt-2 text-slate-400">Super Admin Login</p>
          <p className="mt-1 text-xs text-slate-500">
            User and access management. Restricted to Super Admins only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white focus:border-teal-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white focus:border-teal-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-500 py-3 font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-50"
          >
            {loading ? "..." : "Login as Super Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/login/investigator" className="text-teal-400 hover:underline">Investigator</Link>
          {" · "}
          <Link to="/login/analyst" className="text-teal-400 hover:underline">Analyst</Link>
        </p>
      </motion.div>
    </div>
  );
}

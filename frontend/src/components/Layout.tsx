import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const investigatorNav = [
  { to: "/dashboard", label: "Investigation Dashboard" },
  { to: "/verify", label: "Add Suspected Account" },
  { to: "/cases", label: "Cases" },
  { to: "/blockchain", label: "Blockchain Explorer" },
];

const analyticsNav = [
  { to: "/admin", label: "Risk & Analytics" },
  { to: "/cases", label: "Cases" },
  { to: "/blockchain", label: "Blockchain Explorer" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark") || true;
  });

  const toggleDark = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark", !dark);
  };

  const links =
    user?.role === "SUPER_ADMIN" || user?.role === "ANALYST"
      ? analyticsNav
      : investigatorNav;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-700/50 bg-slate-900/95 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-4">
          <span className="font-mono text-lg font-semibold text-teal-400">CHAINTRACE</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                location.pathname === to
                  ? "bg-teal-500/20 text-teal-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">{user?.email}</span>
            <button
              type="button"
              onClick={toggleDark}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Toggle dark mode"
            >
              {dark ? "🌙" : "☀️"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-slate-700/50 bg-slate-900/90 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded p-2 text-slate-400 hover:bg-slate-800"
        >
          ☰
        </button>
        <span className="font-mono font-semibold text-teal-400">CHAINTRACE</span>
        <div className="w-10" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-xl md:hidden"
          >
            <div className="flex h-14 items-center justify-end border-b border-slate-700/50 px-4">
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400">✕</button>
            </div>
            <nav className="space-y-1 p-4">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`block rounded-lg px-3 py-2 ${location.pathname === to ? "bg-teal-500/20 text-teal-400" : "text-slate-400"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="p-4">
              <button
                type="button"
                onClick={() => { handleLogout(); setSidebarOpen(false); }}
                className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-400"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="flex-1 pt-14 md:pt-0 md:pl-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

type NavLink = {
  to: string;
  label: string;
  hint: string;
};

const investigatorNav: NavLink[] = [
  { to: "/dashboard", label: "Dashboard", hint: "Verification queue and trust overview" },
  { to: "/verify", label: "Verify Account", hint: "Submit a profile for scoring" },
  { to: "/cases", label: "Cases", hint: "Track active investigations" },
  { to: "/blockchain", label: "Chain Explorer", hint: "View on-chain anchors" },
];

const analystNav: NavLink[] = [
  { to: "/admin", label: "Risk Console", hint: "Platform risk and alert intelligence" },
  { to: "/cases", label: "Case Review", hint: "Assess reports and decisions" },
  { to: "/blockchain", label: "Chain Explorer", hint: "Inspect verification anchors" },
];

const superAdminNav: NavLink[] = [
  { to: "/admin", label: "Command Center", hint: "Risk analytics and operational summary" },
  { to: "/admin/users/new", label: "Create Account", hint: "Provision investigators and analysts" },
  { to: "/cases", label: "Case Review", hint: "Monitor investigations and escalations" },
  { to: "/blockchain", label: "Chain Explorer", hint: "Audit chain integrity and anchors" },
];

function NavItems({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map(({ to, label, hint }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className={`block rounded-2xl border px-4 py-3 transition ${
            pathname === to
              ? "border-teal-400/40 bg-teal-400/10 text-white shadow-[0_0_30px_rgba(45,212,191,0.1)]"
              : "border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"
          }`}
        >
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </Link>
      ))}
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links =
    user?.role === "SUPER_ADMIN"
      ? superAdminNav
      : user?.role === "ANALYST"
      ? analystNav
      : investigatorNav;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className="relative flex min-h-screen overflow-hidden bg-[#07111d] text-slate-100"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(7,17,29,0.92), rgba(7,17,29,0.98)), url('/bg-grid.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_36%)]" />

      <aside className="relative z-10 hidden w-80 flex-col border-r border-slate-800/70 bg-slate-950/70 backdrop-blur-xl md:flex">
        <div className="border-b border-slate-800/80 px-6 py-6">
          <p className="font-mono text-lg font-semibold tracking-[0.2em] text-teal-300">CHAINTRACE</p>
          <p className="mt-3 text-sm text-slate-300">
            {user?.role === "SUPER_ADMIN"
              ? "Executive oversight for platform risk, access, and investigation operations."
              : user?.role === "ANALYST"
              ? "Evidence review and risk monitoring for supervisory analysts."
              : "Operational workspace for investigators handling suspicious profiles."}
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          <NavItems links={links} pathname={location.pathname} />
        </nav>

        <div className="border-t border-slate-800/80 p-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Active session</p>
            <p className="mt-2 text-sm font-medium text-slate-100">{user?.name}</p>
            <p className="mt-1 text-xs text-slate-400">{user?.email}</p>
            <p className="mt-3 inline-flex rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-teal-200">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-slate-700 py-2.5 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/70 bg-slate-950/85 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300"
        >
          Menu
        </button>
        <span className="font-mono text-sm font-semibold tracking-[0.24em] text-teal-300">CHAINTRACE</span>
        <div className="w-10" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="fixed inset-y-0 left-0 z-50 w-80 border-r border-slate-800 bg-slate-950 shadow-xl md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
              <span className="font-mono text-sm font-semibold tracking-[0.24em] text-teal-300">CHAINTRACE</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
            <nav className="space-y-2 p-4">
              <NavItems
                links={links}
                pathname={location.pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            </nav>
            <div className="p-4">
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="w-full rounded-xl border border-slate-700 py-2 text-sm text-slate-300"
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

      <main className="relative z-10 flex-1 pt-20 md:pt-0">
        <div className="border-b border-slate-800/60 bg-slate-950/35 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Operational workspace</p>
              <p className="mt-1 text-sm text-slate-300">
                Unified verification, reporting, and audit tooling for agency teams.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Access tier</p>
              <p className="mt-1 text-sm font-medium text-slate-100">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

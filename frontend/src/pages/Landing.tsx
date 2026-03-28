import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div
      className="min-h-screen bg-[#07111d]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(7,17,29,0.88), rgba(7,17,29,0.98)), url('/bg-grid.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="border-b border-slate-800/70 px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-mono text-xl font-semibold tracking-[0.24em] text-teal-300">CHAINTRACE</span>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/login/investigator"
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Investigator
            </Link>
            <Link
              to="/login/analyst"
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              Analyst
            </Link>
            <Link
              to="/admin/login"
              className="rounded-xl border border-teal-400/40 bg-teal-400/10 px-4 py-2 text-sm text-teal-200 hover:bg-teal-400/20"
            >
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/65 px-7 py-10 shadow-[0_0_80px_rgba(8,15,26,0.8)] backdrop-blur-xl md:px-10 md:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(45,212,191,0.2),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(56,189,248,0.16),transparent_35%)]" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                Social Identity Risk Intelligence
              </p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-5 text-4xl font-bold tracking-tight text-white md:text-6xl"
              >
                Detect coordinated fake profiles with a professional verification workspace.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6 text-lg text-slate-400 md:text-xl"
              >
                ChainTrace combines investigator workflows, analyst review, role-based access,
                and tamper-evident blockchain anchoring into one operational console for trusted teams.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <Link
                  to="/login/investigator"
                  className="rounded-xl bg-teal-400 px-5 py-3 font-medium text-slate-950 hover:bg-teal-300"
                >
                  Investigator Login
                </Link>
                <Link
                  to="/login/analyst"
                  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-900"
                >
                  Analyst Login
                </Link>
                <Link
                  to="/admin/login"
                  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-900"
                >
                  Super Admin
                </Link>
                <Link
                  to="/blockchain"
                  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-900"
                >
                  Explore Blockchain
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 grid gap-6 text-left md:grid-cols-3"
              >
                {[
                  { title: "Verify", desc: "Submit accounts for deterministic scoring, case linking, and review." },
                  { title: "Anchor", desc: "Record identity hashes on-chain for tamper-evident auditability." },
                  { title: "Escalate", desc: "Coordinate investigators, analysts, and admins through shared evidence." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur"
                  >
                    <div className="mb-2 h-1.5 w-14 rounded-full bg-gradient-to-r from-teal-400 to-sky-400" />
                    <h3 className="font-semibold text-teal-200">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="space-y-6"
          >
            <div className="overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/55 p-4 shadow-[0_0_50px_rgba(8,15,26,0.7)] backdrop-blur">
              <img
                src="/hero-circuit.svg"
                alt="Abstract blockchain investigation dashboard"
                className="w-full rounded-[1.5rem] border border-slate-800/60 object-cover"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Role-separated access</p>
                <p className="mt-3 text-sm text-slate-300">Super admins provision users, analysts review risk, investigators manage cases.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Professional reporting</p>
                <p className="mt-3 text-sm text-slate-300">Structured reports, recommendations, and decisions support operational handoffs.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Audit-ready blockchain</p>
                <p className="mt-3 text-sm text-slate-300">Explore verification anchors with context designed for review and evidence presentation.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <header className="border-b border-slate-700/50 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-mono text-xl font-semibold text-teal-400">CHAINTRACE</span>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/login/investigator"
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Investigator
            </Link>
            <Link
              to="/login/analyst"
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Analyst
            </Link>
            <Link
              to="/admin/login"
              className="rounded-lg bg-teal-500/20 px-4 py-2 text-sm text-teal-400 hover:bg-teal-500/30"
            >
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-20 text-center md:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 px-6 py-10 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.25),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(59,130,246,0.25),transparent_55%)] opacity-80" />
          <div className="relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold tracking-tight text-white md:text-6xl"
        >
          Blockchain Powered
          <br />
          <span className="text-teal-400">Identity Verification</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-lg text-slate-400 md:text-xl"
        >
          Restricted investigation platform for law-enforcement and accredited investigative agencies to detect fake profiles and verify social identities with an immutable audit trail.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/login/investigator"
            className="rounded-xl bg-teal-500 px-5 py-3 font-medium text-slate-900 hover:bg-teal-400"
          >
            Investigator Login
          </Link>
          <Link
            to="/login/analyst"
            className="rounded-xl border border-slate-600 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800"
          >
            Analyst Login
          </Link>
          <Link
            to="/admin/login"
            className="rounded-xl border border-slate-600 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800"
          >
            Super Admin
          </Link>
          <Link
            to="/blockchain"
            className="rounded-xl border border-slate-600 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800"
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
            { icon: "🔍", title: "Verify", desc: "Submit social accounts for AI-powered trust scoring." },
            { icon: "⛓", title: "Immutable", desc: "Verified identities stored on a lightweight blockchain." },
            { icon: "🛡", title: "Investigate", desc: "Admin dashboard for risk analytics and alerts." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur"
            >
              <div className="mb-2 flex items-center gap-2 text-teal-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/10 text-base">
                  {item.icon}
                </span>
                <h3 className="font-semibold text-teal-300">{item.title}</h3>
              </div>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

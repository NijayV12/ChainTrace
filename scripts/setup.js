// One-time local setup for CHAINTRACE
// - installs backend & frontend deps
// - pushes Prisma schema to SQLite
// - seeds demo data

const { execSync } = require("child_process");
const path = require("path");

function run(cmd, cwd) {
  console.log(`\n$ ${cmd} (cwd=${cwd})`);
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

const root = path.resolve(__dirname, "..");
const fs = require("fs");

try {
  // Use .env at runtime; create from .env.example if missing
  const envPath = path.join(root, ".env");
  const envExamplePath = path.join(root, ".env.example");
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log("==> Creating .env from .env.example");
    fs.copyFileSync(envExamplePath, envPath);
  }
  // Prisma runs from backend/ and reads backend/.env; keep in sync with root .env
  const backendEnvPath = path.join(root, "backend", ".env");
  if (fs.existsSync(envPath) && !fs.existsSync(backendEnvPath)) {
    console.log("==> Syncing backend/.env from root .env");
    fs.copyFileSync(envPath, backendEnvPath);
  }

  console.log("==> Installing root dependencies (concurrently, etc.)");
  run("npm install", root);

  console.log("==> Installing backend dependencies");
  run("npm install", path.join(root, "backend"));

  console.log("==> Applying Prisma schema to SQLite");
  run("npx prisma db push", path.join(root, "backend"));

  console.log("==> Seeding demo data (admin and user)");
  run("npx prisma db seed", path.join(root, "backend"));

  console.log("==> Installing frontend dependencies");
  run("npm install", path.join(root, "frontend"));

  console.log("\n✓ Setup complete.");
  console.log(
    "\nNext steps:\n  1) cd",
    root,
    "\n  2) npm run dev  # starts API (4000) and frontend (5173)"
  );
} catch (err) {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
}


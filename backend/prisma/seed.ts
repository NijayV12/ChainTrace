import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@chaintrace.io" },
    update: {
      // Ensure existing admin user is promoted to SUPER_ADMIN
      role: "SUPER_ADMIN",
      passwordHash: hash,
    },
    create: {
      name: "Super Admin Demo",
      email: "admin@chaintrace.io",
      passwordHash: hash,
      role: "SUPER_ADMIN",
    },
  });

  const investigator = await prisma.user.upsert({
    where: { email: "investigator@demo.com" },
    update: {
      role: "INVESTIGATOR",
      passwordHash: hash,
    },
    create: {
      name: "Demo Investigator",
      email: "investigator@demo.com",
      phone: "+1234567890",
      passwordHash: hash,
      role: "INVESTIGATOR",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@demo.com" },
    update: {
      role: "ANALYST",
      passwordHash: hash,
    },
    create: {
      name: "Demo Analyst",
      email: "analyst@demo.com",
      phone: "+1234567890",
      passwordHash: hash,
      role: "ANALYST",
    },
  });

  console.log("Seeded admin:", admin.email);
  console.log("Seeded investigator:", investigator.email);
  console.log("Seeded analyst:", analyst.email);
  console.log("Demo password for all: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

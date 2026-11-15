import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

// Pravi (ili vraća) administratorski nalog sa novom, nasumičnom lozinkom koja se ispiše samo jednom.
// Pokretanje: npm run admin:create -- office@monahome.rs

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Upotreba: npm run admin:create -- vas@mejl.rs");
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL nije podešen u .env");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: { email, role: "ADMIN", passwordHash },
    update: { role: "ADMIN", passwordHash, isActive: true, sessionVersion: { increment: 1 } },
  });

  console.log(`\nAdministrator: ${email}\nLozinka:       ${password}\n`);
  console.log("Lozinka se prikazuje samo sada. Prijavite se na /prijava; promenu lozinke radite preko „Zaboravljena lozinka“.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
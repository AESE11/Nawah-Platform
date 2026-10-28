import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getAdminSeedCredentials } from "../lib/security/admin-seed-config";

const prisma = new PrismaClient();

async function main() {
  const { email, password } = getAdminSeedCredentials(process.env);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Platform Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch(() => {
    console.error("Failed to seed admin. Check its configuration and database availability.");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

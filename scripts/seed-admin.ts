import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@arabic-course-platform.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeThisStrongPassword123!";

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
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

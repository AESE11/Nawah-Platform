import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input, output });

  const email = (await rl.question("Admin email: ")).trim();
  const password = await rl.question("Admin password: ");
  const nameInput = await rl.question("Admin name (optional): ");

  rl.close();

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error(`A user with this email already exists: ${email}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: nameInput.trim() || "Platform Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

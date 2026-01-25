import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin User";
  const role = process.argv[5] || "admin";

  if (!email || !password) {
    console.error("Usage: tsx scripts/create-user.ts <email> <password> [name] [role]");
    console.error("Example: tsx scripts/create-user.ts admin@example.com password123 Admin admin");
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: role as "admin" | "developer" | "general",
      },
    });

    console.log("✅ User created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
  } catch (error: any) {
    if (error.code === "P2002") {
      console.error("❌ Error: User with this email already exists");
    } else {
      console.error("❌ Error creating user:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


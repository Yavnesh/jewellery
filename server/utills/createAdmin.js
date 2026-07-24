const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@vamikajewels.com";
  const password = "Admin123!";
  const hashedPassword = await bcrypt.hash(password, 14);

  // Clean up existing admin if any
  await prisma.user.deleteMany({
    where: { email }
  });

  const adminUser = await prisma.user.create({
    data: {
      id: nanoid(),
      email,
      password: hashedPassword,
      role: "admin",
    }
  });

  console.log("Admin user created successfully!");
  console.log("Email: ", email);
  console.log("Password: ", password);
}

createAdmin()
  .catch((err) => {
    console.error("Error creating admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

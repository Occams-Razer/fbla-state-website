import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const DEMO_ITEMS = [
  {
    title: "Black Hydro Flask",
    description: "24oz black bottle with two college stickers near the base.",
    category: "Accessories",
    location: "Main Cafeteria",
    dateFound: "2026-04-02",
    imageUrl: "/uploads/demo-hydroflask.jpg",
    status: "APPROVED",
  },
  {
    title: "TI-84 Plus Calculator",
    description: "Graphing calculator with initials 'M.R.' scratched on the back.",
    category: "School Supplies",
    location: "Room 214",
    dateFound: "2026-04-01",
    imageUrl: "/uploads/demo-calculator.jpg",
    status: "PENDING",
  },
  {
    title: "Navy Nike Hoodie",
    description: "Medium hoodie with white drawstrings and a small front logo.",
    category: "Clothing",
    location: "Gym Bleachers",
    dateFound: "2026-03-29",
    imageUrl: "/uploads/demo-hoodie.jpg",
    status: "PENDING",
  },
  {
    title: "AirPods Pro Case",
    description: "White charging case with a blue silicone cover.",
    category: "Electronics",
    location: "Library Front Desk",
    dateFound: "2026-03-28",
    imageUrl: "/uploads/demo-airpods.jpg",
    status: "APPROVED",
  },
  {
    title: "Red Adidas Drawstring Bag",
    description: "Red drawstring bag with PE clothes and a name tag inside.",
    category: "Sports",
    location: "Locker Room",
    dateFound: "2026-03-25",
    imageUrl: "/uploads/demo-bag.jpg",
    status: "REJECTED",
  },
] as const;

async function main() {
  // Hash the password before saving (10 "rounds" of scrambling)
  const hashedAdminPassword = await bcrypt.hash("fbla_password2026", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedAdminPassword, 
    },
  });

  await prisma.claim.deleteMany();
  await prisma.item.deleteMany();

  await prisma.item.createMany({
    data: DEMO_ITEMS.map((item, index) => ({
      ...item,
      createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
      isDeleted: false,
    })),
  });

  console.log("Database seeded with admin and demo items.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

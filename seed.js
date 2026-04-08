import bcrypt from "bcryptjs";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

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
];

async function main() {
  const db = await open({
    filename: "./dev.db",
    driver: sqlite3.Database,
  });

  const hashedAdminPassword = await bcrypt.hash("fbla_password2026", 10);

  await db.run(`
    INSERT INTO "Admin" ("id", "username", "password")
    VALUES (lower(hex(randomblob(4))) || lower(hex(randomblob(4))), 'admin', ?)
    ON CONFLICT("username")
    DO UPDATE SET "password" = excluded."password";
  `, hashedAdminPassword);

  await db.exec(`DELETE FROM "Claim";`);
  await db.exec(`DELETE FROM "Item";`);

  const insertItemSql = `
    INSERT INTO "Item"
      ("id", "title", "description", "category", "location", "dateFound", "imageUrl", "status", "createdAt", "isDeleted")
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  for (const [index, item] of DEMO_ITEMS.entries()) {
    const createdAtIso = new Date(Date.now() - index * 1000 * 60 * 60 * 6).toISOString();

    await db.run(insertItemSql, [
      `item_${index + 1}`,
      item.title,
      item.description,
      item.category,
      item.location,
      item.dateFound,
      item.imageUrl,
      item.status,
      createdAtIso,
      0,
    ]);
  }

  await db.close();

  console.log("Database seeded with admin and demo items.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

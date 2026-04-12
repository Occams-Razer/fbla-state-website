/**
 * Seeds realistic school lost-and-found items. Run: npx tsx seed-items.ts
 * WARNING: This deletes ALL existing claims and items first.
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./src/generated/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ITEMS = [
  {
    title: "Apple AirPods (3rd Generation)",
    description:
      "White AirPods with MagSafe charging case. Both earbuds present. Case has a small scuff on the lid. Faint initials 'J.R.' scratched on the left earbud. Found near the weight room benches.",
    category: "Electronics",
    location: "Gym / Weight Room",
    dateFound: "2026-01-15",
    imageUrl:
      "https://images.unsplash.com/photo-1605464315542-bac679cbaf78?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Samsung Galaxy S23 (Midnight Black)",
    description:
      "Black Samsung phone in a clear TPU case. No screen cracks. Lock screen shows two dogs. Found between cafeteria tables after lunch period.",
    category: "Electronics",
    location: "Cafeteria",
    dateFound: "2026-01-20",
    imageUrl:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: 'HP Laptop 15" (Silver)',
    description:
      "Silver HP 15-inch laptop with a blue-and-white wave sticker on the lid. No power adapter. Small dent on the bottom-left corner. Left in room 204 after 3rd period.",
    category: "Electronics",
    location: "Room 204 (Math)",
    dateFound: "2026-01-22",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "JanSport Backpack (Forest Green)",
    description:
      "Green JanSport backpack with a red mushroom keychain clipped to the main zipper. Contains a few pencils and a copy of The Great Gatsby. Found near the trophy case in the main hallway.",
    category: "Accessories",
    location: "Main Hallway",
    dateFound: "2026-01-24",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "TI-84 Plus Graphing Calculator",
    description:
      "Black TI-84 Plus CE graphing calculator. Name 'Maya Chen' written in silver marker on the back. Has a custom gold case with star pattern. Found on a desk in room 112 after class.",
    category: "School Supplies",
    location: "Room 112 (Science)",
    dateFound: "2026-01-27",
    imageUrl:
      "https://images.unsplash.com/photo-1611125025531-2cfca9cf4fdc?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Champion Hoodie (Gray, Size M)",
    description:
      "Gray Champion pullover hoodie, women's size medium. Small bleach stain near the left cuff. School logo on the left chest. Found in the east wing girls' locker room.",
    category: "Clothing",
    location: "Locker Room (East Wing)",
    dateFound: "2026-01-28",
    imageUrl:
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Nike Air Force 1 Low (White, Size 10)",
    description:
      "White Nike Air Force 1 Low sneakers, men's size 10. Both shoes present. Small red pen mark near the right toe. Left lace is partially frayed. Found in the PE storage closet.",
    category: "Sports",
    location: "PE Storage Room",
    dateFound: "2026-02-01",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Black-Framed Prescription Glasses",
    description:
      "Rectangular black-framed prescription glasses in a soft gray pouch. One temple arm has a small strip of black electrical tape. Found on a chair in the library study area.",
    category: "Accessories",
    location: "Library",
    dateFound: "2026-02-03",
    imageUrl:
      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Hydro Flask 32 oz (Navy Blue)",
    description:
      "Navy blue Hydro Flask wide-mouth bottle. Stickers: sunflower, mountain outline, and 'Middleton XC'. Found near the bleachers after the home track meet.",
    category: "Accessories",
    location: "Track / Bleachers",
    dateFound: "2026-02-05",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    status: "APPROVED",
  },
  {
    title: "Adidas Gym Bag (Black/White Stripe)",
    description:
      "Black Adidas gym bag with white stripes. Contains workout clothes and a combo lock. Name tag on handle reads 'T. Wilson'. Found in the west wing boys' locker room.",
    category: "Sports",
    location: "Locker Room (West Wing)",
    dateFound: "2026-02-06",
    imageUrl:
      "https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&q=80",
    status: "APPROVED",
  },
] as const;

async function main() {
  console.log("Clearing existing claims and items...");
  await prisma.claim.deleteMany({});
  await prisma.item.deleteMany({});
  console.log("Cleared.");

  console.log("Seeding items...");
  for (const item of ITEMS) {
    await prisma.item.create({ data: item });
    console.log(`  ✓ ${item.title}`);
  }

  console.log(`\nDone. ${ITEMS.length} items created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- Reset child rows first to satisfy foreign keys.
DELETE FROM "Claim";
DELETE FROM "Item";

-- Ensure demo admin exists with known password: fbla_password2026
INSERT INTO "Admin" ("id", "username", "password")
VALUES (
  'admin_demo',
  'admin',
  '$2b$10$75gdAgRtTPHLBPUhhw/HyeZRW.YawQJToBNDQyeYyLQ87eOSpiW/S'
)
ON CONFLICT("username")
DO UPDATE SET "password" = excluded."password";

INSERT INTO "Item"
  ("id", "title", "description", "category", "location", "dateFound", "imageUrl", "status", "createdAt", "isDeleted")
VALUES
  (
    'item_1',
    'Black Hydro Flask',
    '24oz black bottle with two college stickers near the base.',
    'Accessories',
    'Main Cafeteria',
    '2026-04-02',
    '/uploads/demo-hydroflask.jpg',
    'APPROVED',
    '2026-04-07T14:00:00.000Z',
    0
  ),
  (
    'item_2',
    'TI-84 Plus Calculator',
    'Graphing calculator with initials M.R. scratched on the back.',
    'School Supplies',
    'Room 214',
    '2026-04-01',
    '/uploads/demo-calculator.jpg',
    'PENDING',
    '2026-04-07T08:00:00.000Z',
    0
  ),
  (
    'item_3',
    'Navy Nike Hoodie',
    'Medium hoodie with white drawstrings and a small front logo.',
    'Clothing',
    'Gym Bleachers',
    '2026-03-29',
    '/uploads/demo-hoodie.jpg',
    'PENDING',
    '2026-04-06T20:00:00.000Z',
    0
  ),
  (
    'item_4',
    'AirPods Pro Case',
    'White charging case with a blue silicone cover.',
    'Electronics',
    'Library Front Desk',
    '2026-03-28',
    '/uploads/demo-airpods.jpg',
    'APPROVED',
    '2026-04-06T14:00:00.000Z',
    0
  ),
  (
    'item_5',
    'Red Adidas Drawstring Bag',
    'Red drawstring bag with PE clothes and a name tag inside.',
    'Sports',
    'Locker Room',
    '2026-03-25',
    '/uploads/demo-bag.jpg',
    'REJECTED',
    '2026-04-06T08:00:00.000Z',
    0
  );

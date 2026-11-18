require("dotenv").config();
const mongoose = require("mongoose");
const { Product, Category, User, Coupon } = require("./models");

const items = [
  ["p1", "Everyday Tote", "Accessories", 68, 84, 34, "photo-1590874103328-eac38a683ce7"],
  ["p2", "Studio Ceramic Set", "Home", 54, null, 28, "photo-1493106641515-6b5631de4bb9"],
  ["p3", "Cloud Knit Sweater", "Apparel", 128, null, 20, "photo-1576566588028-4147f3842f27"],
  ["p4", "Sculptural Table Lamp", "Home", 146, 180, 15, "photo-1507473885765-e6ed057f782c"],
  ["p5", "Weekend Leather Bag", "Accessories", 189, null, 12, "photo-1553062407-98eeb64c6a62"],
  ["p6", "Linen Lounge Set", "Apparel", 112, 140, 25, "photo-1598033129183-c4f50c736f10"],
  ["p7", "Ribbed Glass Tumblers", "Home", 38, null, 40, "photo-1514228742587-6b1558fcca3d"],
  ["p8", "Form Leather Slides", "Apparel", 92, null, 18, "photo-1543163521-1bf539c55dd2"]
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be set before seeding.");
  await mongoose.connect(process.env.MONGODB_URI);
  for (const [slug, name, category, price, oldPrice, stock, photo] of items) {
    await Product.updateOne({ slug }, { $setOnInsert: {
      slug, name, category, brand: "AUREL", price, oldPrice: oldPrice || undefined, stock,
      imageUrl: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`,
      description: `Thoughtfully considered ${category.toLowerCase()} for everyday life.`,
      colors: ["Natural"], rating: 4.8
    } }, { upsert: true });
  }
  for (const name of ["Apparel", "Home", "Accessories"]) {
    await Category.updateOne({ name }, { $setOnInsert: { name, slug: name.toLowerCase() } }, { upsert: true });
  }
  await Coupon.updateOne(
    { code: "WELCOME10" },
    { $setOnInsert: { code: "WELCOME10", discountType: "percentage", value: 10, minimumOrder: 0, active: true } },
    { upsert: true }
  );
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (!admin) await User.create({ name: "AUREL Admin", email: process.env.ADMIN_EMAIL.toLowerCase(), password: process.env.ADMIN_PASSWORD, role: "admin" });
  }
  console.log("Seed data is ready.");
}

seed().then(() => mongoose.disconnect()).catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Product } from "../src/models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pollen_db";

async function seedDatabase() {
  console.log("==================================================");
  console.log("🌱 Pollen Database Seeder - Products");
  console.log(`📡 Connecting to MongoDB at: ${MONGO_URI}`);
  console.log("==================================================");

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Successfully connected to MongoDB database.");

    const jsonPath = path.join(__dirname, "products.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`products.json not found at: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const products = JSON.parse(rawData);

    console.log(`📦 Found ${products.length} products to seed.`);

    // Clear existing products
    const deleted = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing products.`);

    // Insert all products
    const inserted = await Product.insertMany(products);
    console.log(`✨ Successfully seeded ${inserted.length} products into MongoDB:`);
    inserted.forEach((p, idx) => {
      console.log(
        `   ${idx + 1}. [ID: ${p.productId}] ${p.name} — ₹${p.price} (${p.volume || "50ML"})`
      );
    });

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔒 Disconnected from MongoDB.");
  }
}

seedDatabase();

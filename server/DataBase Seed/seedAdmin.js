import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "../src/models/User.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pollen_db";

async function seedAdmin() {
  try {
    console.log("[Seeder] Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("[Seeder] Connected successfully to MongoDB.");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@pollen.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Remove existing admin if any
    await User.deleteMany({ email: adminEmail });

    // Create fresh Super Admin user with full permissions
    const admin = await User.create({
      name: "Master Perfumer & Admin",
      email: adminEmail,
      password: adminPassword, // Pre-save hook will hash with bcrypt
      phone: "+91 98765 43210",
      role: "superadmin",
      isVerified: true,
      isActive: true,
      referralCode: "POLLENADMIN",
      loyaltyPoints: 10000,
      loyaltyTier: "platinum",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      permissions: [
        "all",
        "orders:read",
        "orders:write",
        "products:read",
        "products:write",
        "users:read",
        "users:write",
        "returns:manage",
        "coupons:manage",
        "shipping:manage",
        "analytics:view",
        "settings:manage",
      ],
      lastLogin: new Date(),
    });

    console.log("\n================================================");
    console.log("✨ Admin profile seeded successfully in MongoDB!");
    console.log("================================================");
    console.log(`🆔 ID:          ${admin._id}`);
    console.log(`👤 Name:        ${admin.name}`);
    console.log(`📧 Email:       ${admin.email}`);
    console.log(`🔑 Password:    ${adminPassword}`);
    console.log(`👑 Role:        ${admin.role}`);
    console.log(`📱 Phone:       ${admin.phone}`);
    console.log(`💎 Tier:        ${admin.loyaltyTier} (${admin.loyaltyPoints} pts)`);
    console.log("================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[Seeder] Error seeding admin profile:", err);
    process.exit(1);
  }
}

seedAdmin();

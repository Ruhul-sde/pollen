import mongoose from "mongoose";

/**
 * Connect to MongoDB database using Mongoose
 */
export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pollen_db";

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Drop legacy unique index on trackingId if present to avoid E11000 duplicate key error on checkout
    try {
      const ordersCol = mongoose.connection.collection("orders");
      const indexes = await ordersCol.indexes();
      const uniqueTrackingIndexes = indexes.filter(
        (i) => (i.name === "trackingId_1" || (i.key && i.key.trackingId)) && i.unique
      );
      for (const idx of uniqueTrackingIndexes) {
        await ordersCol.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped legacy unique index "${idx.name}" on orders collection`);
      }
    } catch (dropErr) {
      if (dropErr.code !== 26 && !dropErr.message?.includes("ns not found")) {
        console.warn(`[MongoDB] Tracking index cleanup note: ${dropErr.message}`);
      }
    }
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Do not exit process immediately so server can still serve health check / helpful errors
  }

  mongoose.connection.on("error", (err) => {
    console.error(`[MongoDB] Runtime error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected from database");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected to database");
  });
}

/**
 * Helper to check connection status
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export function getDBStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const readyState = mongoose.connection.readyState;
  return {
    stateCode: readyState,
    state: states[readyState] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

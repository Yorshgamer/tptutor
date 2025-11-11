// src/db/mongoose.js
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const log = (...args) => {
  if (process.env.MONGODB_LOG_LEVEL !== "silent") console.log("[MongoDB]", ...args);
};

export async function connectMongo() {
  if (!uri) throw new Error("MONGODB_URI no está definido en .env");
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  log("Conectado");
}

export function handleProcessSignals() {
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    log("Conexión cerrada por SIGINT");
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await mongoose.connection.close();
    log("Conexión cerrada por SIGTERM");
    process.exit(0);
  });
}

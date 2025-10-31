// backend/src/db/mongoose.js
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;
const log = (...args) => {
  if (process.env.MONGODB_LOG_LEVEL !== "silent") console.log("[MongoDB]", ...args);
};

async function connectMongo() {
  if (!uri) throw new Error("MONGODB_URI no está definido en .env");

  // Opciones recomendadas
  await mongoose.connect(uri, {
    // desde Mongoose 6+ no necesitas muchas opciones legacy
    // pero puedes ajustar socketTimeoutMS si tu red es inestable
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  log("Conectado");
}

function handleProcessSignals() {
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

module.exports = { connectMongo, handleProcessSignals };
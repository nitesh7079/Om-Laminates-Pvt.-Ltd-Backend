const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting in-memory MongoDB fallback for local development...");
      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri("om_veneer");
      await mongoose.connect(memoryUri);
      console.log("In-memory MongoDB connected successfully");
    } else {
      console.error("Production MongoDB connection failed. Exiting...");
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

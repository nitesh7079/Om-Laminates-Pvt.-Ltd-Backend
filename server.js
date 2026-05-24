const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB, disconnectDB } = require("./config/db");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Dynamically allow all origins to support any localhost port and production website
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

// ── Existing Om routes ──
const productRoutes = require("./routes/productRoutes");
app.use("/api", productRoutes);

// ── ERP routes ──
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const groupRoutes = require("./routes/groupRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const gstRoutes = require("./routes/gstRoutes");
const reportRoutes = require("./routes/reportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/ledgers", ledgerRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/reports", reportRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
    errors: err.errors || [],
  });
});

const PORT = process.env.PORT || 5000;

const seedDefaultData = async () => {
  const User = require("./models/User");
  const Company = require("./models/Company");

  const adminExists = await User.findOne({ username: "admin" });
  if (!adminExists) {
    console.log("No admin user found. Seeding default admin user and company...");

    // Create default company
    let defaultCompany = await Company.findOne();
    if (!defaultCompany) {
      defaultCompany = await Company.create({
        name: "Om Veneer Udhyog",
        email: "info@omveneer.com",
        phone: "+977-1234567890",
        address: {
          street: "Birtamod",
          city: "Jhapa",
          state: "Province 1",
          country: "Nepal",
          pincode: "57204",
        },
        financialYear: {
          startDate: new Date("2025-04-01"),
          endDate: new Date("2026-03-31"),
        },
        booksBeginningFrom: new Date("2025-04-01"),
      });
      console.log("Default company created.");
    }

    // Create admin user
    await User.create({
      username: "admin",
      email: "admin@erp.com",
      password: "password123",
      role: "admin",
      company: defaultCompany._id,
    });
    console.log("Admin user created (admin@erp.com / password123)");
  }
};

const startServer = async () => {
  await connectDB();
  await seedDefaultData();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

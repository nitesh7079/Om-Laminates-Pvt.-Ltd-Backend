const dotenv = require("dotenv");
const { connectDB, disconnectDB } = require("./config/db");
const Product = require("./models/Product");
const Company = require("./models/Company");
const User = require("./models/User");
const productImageLinks = require("./config/productImageLinks");

dotenv.config();

const seedProducts = [
  {
    name: "2.5mm Core",
    description: "Premium 2.5mm core veneer for strong plywood structure and durability.",
    image: productImageLinks["2.5mm Core"],
  },
  {
    name: "2.5mm Fali",
    description: "High-quality 2.5mm fali veneer for consistent finish and reliable bonding.",
    image: productImageLinks["2.5mm Fali"],
  },
  {
    name: "1.8mm Core",
    description: "Refined 1.8mm core material ideal for lightweight and precise plywood manufacturing.",
    image: productImageLinks["1.8mm Core"],
  },
  {
    name: "1.8mm Fali",
    description: "Uniform 1.8mm fali veneer designed for clean lamination and smooth board surface.",
    image: productImageLinks["1.8mm Fali"],
  },
  {
    name: "Door Board Ply",
    description: "Durable door board plywood raw material for robust and long-lasting door solutions.",
    image: productImageLinks["Door Board Ply"],
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Seed Products
    await Product.deleteMany();
    await Product.insertMany(seedProducts);
    console.log("Products seeded successfully");

    // Seed Default Company
    await Company.deleteMany();
    const defaultCompany = await Company.create({
      name: "Om Veneer Udhyog",
      email: "info@omveneer.com",
      phone: "+977-1234567890",
      address: {
        street: "Birtamod",
        city: "Jhapa",
        state: "Province 1",
        country: "Nepal",
        pincode: "57204"
      },
      financialYear: {
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31")
      },
      booksBeginningFrom: new Date("2025-04-01")
    });
    console.log("Default company seeded successfully");

    // Seed Admin User
    await User.deleteMany();
    await User.create({
      username: "admin",
      email: "admin@erp.com",
      password: "password123",
      role: "admin",
      company: defaultCompany._id
    });
    console.log("Admin user (admin@erp.com / password123) seeded successfully");

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    await disconnectDB();
    process.exit(1);
  }
};

seed();

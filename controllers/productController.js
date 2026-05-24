const Product = require("../models/Product");
const productImageLinks = require("../config/productImageLinks");

const fallbackProducts = [
  {
    _id: "fallback-1",
    name: "2.5mm Core",
    description: "Premium 2.5mm core veneer for strong plywood structure and long service life.",
    image: productImageLinks["2.5mm Core"],
  },
  {
    _id: "fallback-2",
    name: "2.5mm Fali",
    description: "High-quality 2.5mm fali veneer for consistent finish and reliable bonding.",
    image: productImageLinks["2.5mm Fali"],
  },
  {
    _id: "fallback-3",
    name: "1.8mm Core",
    description: "Refined 1.8mm core material ideal for lightweight and precise plywood manufacturing.",
    image: productImageLinks["1.8mm Core"],
  },
  {
    _id: "fallback-4",
    name: "1.8mm Fali",
    description: "Uniform 1.8mm fali veneer designed for clean lamination and smooth board surface.",
    image: productImageLinks["1.8mm Fali"],
  },
];

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    if (products.length === 0) {
      return res.status(200).json(fallbackProducts);
    }
    res.status(200).json(products);
  } catch (error) {
    res.status(200).json(fallbackProducts);
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !description || !image) {
      return res.status(400).json({ message: "name, description and image are required" });
    }

    const product = await Product.create({ name, description, image });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

module.exports = { getProducts, createProduct };

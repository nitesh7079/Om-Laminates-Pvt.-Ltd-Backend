const dotenv = require("dotenv");
const { connectDB, disconnectDB } = require("./config/db");
const Product = require("./models/Product");
const productImageLinks = require("./config/productImageLinks");

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Updating product images...");
    
    // Delete Door Board Ply
    await Product.deleteOne({ name: "Door Board Ply" });
    console.log("Removed Door Board Ply.");
    
    const products = await Product.find({});
    for (let product of products) {
      if (productImageLinks[product.name]) {
        product.image = productImageLinks[product.name];
        await product.save();
        console.log(`Updated image for ${product.name}`);
      }
    }
    
    // Add missing products
    const existingNames = products.map(p => p.name);
    for (const [name, link] of Object.entries(productImageLinks)) {
      if (!existingNames.includes(name) && name !== "Door Board Ply") {
        await Product.create({
          name: name,
          description: `Premium quality ${name}.`,
          image: link
        });
        console.log(`Created new product: ${name}`);
      }
    }

    console.log("Database update complete!");
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("Error updating DB:", err);
    process.exit(1);
  }
};

run();

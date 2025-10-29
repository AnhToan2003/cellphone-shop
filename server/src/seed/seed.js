#!/usr/bin/env node
import "dotenv/config";

import { connectDB, disconnectDB } from "../db.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

const seedProducts = [
  {
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    price: 33990000,
    discountPercent: 6,
    stock: 20,
    rating: 4.9,
    ratingCount: 128,
    description:
      "iPhone 15 Pro Max with titanium frame, A17 Pro chip, and upgraded triple camera for flagship performance.",
    images: [
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/i/p/iphone_15_pro_max_256gb_moi_100-_1.jpg",
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/i/p/iphone-15-pro-max-titan-tu-nhien.jpg",
    ],
    specs: {
      Display: '6.7" Super Retina XDR',
      Chipset: "Apple A17 Pro",
      Camera: "48MP main + 12MP tele + 12MP ultra-wide",
      Battery: "4422 mAh",
    },
    featured: true,
  },
  {
    name: "Samsung Galaxy S24 Ultra 256GB",
    brand: "Samsung",
    price: 32990000,
    discountPercent: 10,
    stock: 30,
    rating: 4.8,
    ratingCount: 96,
    description:
      "Galaxy S24 Ultra brings S Pen support, Dynamic AMOLED 2X display, and Galaxy AI tools for premium users.",
    images: [
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/g/a/galaxy-s24-ultra-256gb-1.jpg",
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/g/a/galaxy-s24-ultra-256gb-2.jpg",
    ],
    specs: {
      Display: '6.8" Dynamic AMOLED 2X',
      Chipset: "Snapdragon 8 Gen 3 for Galaxy",
      Camera: "200MP quad camera system",
      Battery: "5000 mAh",
    },
    featured: true,
  },
  {
    name: "Xiaomi 14 Ultra 512GB",
    brand: "Xiaomi",
    price: 23990000,
    discountPercent: 12,
    stock: 18,
    rating: 4.7,
    ratingCount: 72,
    description:
      "Xiaomi 14 Ultra co-engineered with Leica optics, powered by Snapdragon 8 Gen 3 for outstanding mobile photography.",
    images: [
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/1/4/14-ultra.png",
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/1/4/14-ultra-2.png",
    ],
    specs: {
      Display: '6.73" AMOLED WQHD+ 120Hz',
      Chipset: "Snapdragon 8 Gen 3",
      Camera: "50MP quad Leica system",
      Battery: "5000 mAh 90W HyperCharge",
    },
  },
  {
    name: "OPPO Find X7 Ultra 256GB",
    brand: "OPPO",
    price: 19990000,
    discountPercent: 8,
    stock: 25,
    rating: 4.6,
    ratingCount: 54,
    description:
      "OPPO Find X7 Ultra delivers premium build, Hasselblad tuned cameras, and a fluid 120Hz display for tech lovers.",
    images: [
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/f/i/find-x7-ultra.jpg",
      "https://cdn2.cellphones.com.vn/358x/media/catalog/product/f/i/find-x7-ultra-2.jpg",
    ],
    specs: {
      Display: '6.82" AMOLED 120Hz',
      Chipset: "Snapdragon 8 Gen 3",
      Camera: "50MP main + 64MP periscope + 50MP ultra-wide",
      Battery: "5000 mAh SUPERVOOC 100W",
    },
  },
];

const runSeed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
    ]);

    const admin = await User.create({
      name: "Cellphone Shop Admin",
      username: "Admin",
      email: "admin@cellphones-shop.dev",
      password: "Admin123!",
      role: "admin",
    });

    const customer = await User.create({
      name: "Minh Nguyen",
      username: "minhnguyen",
      email: "minh.nguyen@example.com",
      password: "Customer123!",
    });

    await Product.create(seedProducts);

    console.log("Seed completed.");
    console.log("Admin credentials:");
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email: ${admin.email}`);
    console.log("  Password: Admin123!");
    console.log("Sample customer:");
    console.log(`  Username: ${customer.username}`);
    console.log(`  Email: ${customer.email}`);
    console.log("  Password: Customer123!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runSeed();


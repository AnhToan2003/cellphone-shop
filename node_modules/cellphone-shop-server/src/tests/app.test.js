import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { createServer } from "../app.js";
import { connectDB, disconnectDB } from "../db.js";
import { Product } from "../models/Product.js";

let mongoServer;
let testApp;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
  testApp = createServer();
});

afterAll(async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

describe("API smoke tests", () => {
  test("GET /api/health returns ok", async () => {
    const response = await request(testApp).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, status: "ok" });
  });

  test("POST /api/auth/register and login", async () => {
    const payload = {
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const registerRes = await request(testApp)
      .post("/api/auth/register")
      .send(payload);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.email).toBe(payload.email);
    expect(registerRes.body.data.user.username).toBe(payload.username);
    expect(registerRes.body.data.token).toBeDefined();

    const loginRes = await request(testApp)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();

    const loginByUsernameRes = await request(testApp)
      .post("/api/auth/login")
      .send({ identifier: payload.username, password: payload.password });

    expect(loginByUsernameRes.status).toBe(200);
    expect(loginByUsernameRes.body.data.token).toBeDefined();
  });

  test("GET /api/products returns created product", async () => {
    await Product.create({
      name: "iPhone 15 Pro",
      brand: "Apple",
      price: 28990000,
      discountPercent: 5,
      stock: 10,
      imageUrl: "https://example.com/iphone15pro.jpg",
      images: ["https://example.com/iphone15pro.jpg"],
      specs: { capacity: "256GB" },
    });

    const response = await request(testApp).get("/api/products");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("iPhone 15 Pro");
  });
});

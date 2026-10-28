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

  test("concurrent orders reserve variant stock atomically at its own price", async () => {
    const registration = await request(testApp)
      .post("/api/auth/register")
      .send({
        name: "Order Test User",
        username: "order-test-user",
        email: "orders@example.com",
        password: "password123",
      });

    const product = await Product.create({
      name: "Variant Stock Test",
      brand: "Test",
      price: 100,
      stock: 1,
      imageUrl: "https://example.com/product.jpg",
      variants: [{ color: "Blue", capacity: "128GB", price: 250, stock: 1 }],
    });

    const body = {
      items: [{ productId: product.id, quantity: 1, color: "Blue", capacity: "128GB" }],
      shippingInfo: { fullName: "Order Test User", phone: "0900000000", address: "1 Test Street" },
      paymentMethod: "cod",
    };
    const placeOrder = () =>
      request(testApp)
        .post("/api/orders")
        .set("Authorization", `Bearer ${registration.body.data.token}`)
        .send(body);

    const responses = await Promise.all([placeOrder(), placeOrder()]);
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);

    const acceptedOrder = responses.find(({ status }) => status === 201);
    expect(acceptedOrder.body.data.items[0]).toMatchObject({
      price: 250,
      color: "Blue",
      capacity: "128GB",
    });

    const updatedProduct = await Product.findById(product.id).lean();
    expect(updatedProduct.stock).toBe(0);
    expect(updatedProduct.variants[0].stock).toBe(0);
  });
});

import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models/User.js";

const usernameRegex = /^[a-zA-Z0-9._-]{3,40}$/;

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must not exceed 120 characters"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must contain at least 8 characters")
    .max(30, "Phone number must not exceed 30 characters")
    .optional()
    .or(z.literal("").transform(() => "")),
  address: z
    .string()
    .trim()
    .min(5, "Address must contain at least 5 characters")
    .max(255, "Address must not exceed 255 characters")
    .optional()
    .or(z.literal("").transform(() => "")),
  username: z
    .string()
    .min(3, "Username must contain at least 3 characters")
    .max(40, "Username must not exceed 40 characters")
    .regex(
      usernameRegex,
      "Username may only contain letters, numbers, dots, underscores, and hyphens"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must contain at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

const loginSchema = z
  .object({
    identifier: z
      .string()
      .min(1, "Email or username is required")
      .optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine(
    (value) =>
      Boolean(value.identifier?.trim()) || Boolean(value.email?.trim()),
    {
      message: "Email or username is required",
      path: ["identifier"],
    }
  );

const buildToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const buildProfile = (user) => ({
  id: user._id.toString(),
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  address: user.address || "",
  lifetimeSpend: user.lifetimeSpend || 0,
  customerTier: user.customerTier,
});

const profileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(120, "Name must not exceed 120 characters")
      .optional(),
    phone: z
      .string()
      .trim()
      .min(8, "Phone number must contain at least 8 characters")
      .max(30, "Phone number must not exceed 30 characters")
      .optional()
      .or(z.literal("").transform(() => "")),
    address: z
      .string()
      .trim()
      .min(5, "Address must contain at least 5 characters")
      .max(255, "Address must not exceed 255 characters")
      .optional()
      .or(z.literal("").transform(() => "")),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided"
  );

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);

  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedUsername = payload.username.trim();
  const usernameLower = normalizedUsername.toLowerCase();

  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ usernameLower }),
  ]);

  if (emailExists) {
    return res.status(409).json({
      success: false,
      message: "Email is already registered",
    });
  }

  if (usernameExists) {
    return res.status(409).json({
      success: false,
      message: "Username is already taken",
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase?.();
  const adminUsername = process.env.ADMIN_USERNAME?.toLowerCase?.();

  const role =
    (adminEmail && normalizedEmail === adminEmail) ||
    (adminUsername && usernameLower === adminUsername)
      ? "admin"
      : "user";

  const user = await User.create({
    name: payload.name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: payload.password,
    phone: payload.phone?.trim() || "",
    address: payload.address?.trim() || "",
    role,
  });
  const token = buildToken(user);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: buildProfile(user),
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);

  const identifier =
    payload.identifier?.trim() || payload.email?.trim() || "";

  const normalized = identifier.toLowerCase();
  const query = identifier.includes("@")
    ? { email: normalized }
    : { usernameLower: normalized };

  const user = await User.findOne(query);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Email/username or password is incorrect",
    });
  }

  const isValid = await user.comparePassword(payload.password);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Email/username or password is incorrect",
    });
  }

  res.json({
    success: true,
    message: "Login successful",
    data: {
      token: buildToken(user),
      user: buildProfile(user),
    },
  });
});

export const currentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  res.json({
    success: true,
    data: {
      user: buildProfile(req.user),
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const payload = profileUpdateSchema.parse(req.body);

  if (payload.name !== undefined) {
    req.user.name = payload.name;
  }
  if (payload.phone !== undefined) {
    req.user.phone = payload.phone;
  }
  if (payload.address !== undefined) {
    req.user.address = payload.address;
  }

  await req.user.save();

  res.json({
    success: true,
    message: "Profile updated",
    data: {
      user: buildProfile(req.user),
    },
  });
});

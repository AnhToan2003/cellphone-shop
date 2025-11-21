import { Router } from "express";
import rateLimit from "express-rate-limit";
import { handleSupportChat } from "../controllers/support.controller.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const requireJson = (req, res, next) => {
  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type phải là application/json.",
    });
  }
  return next();
};

// Health check - Kiểm tra Ollama
router.get("/health", async (req, res) => {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
    
    // Kiểm tra Ollama
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const isRunning = response.ok;
    
    res.json({
      ok: isRunning,
      ollama_url: OLLAMA_URL,
      model: OLLAMA_MODEL,
      status: isRunning ? "connected" : "disconnected",
    });
  } catch (error) {
    res.json({
      ok: false,
      ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
      status: "error",
      error: error.message,
    });
  }
});

// Chat endpoint
router.post("/chat", chatLimiter, requireJson, handleSupportChat);

// Test endpoint
router.post("/chat/test", chatLimiter, async (req, res, next) => {
  try {
    req.body = {
      messages: [{ role: "user", content: "ping" }],
    };
    return handleSupportChat(req, res, next);
  } catch (error) {
    return next(error);
  }
});

export default router;

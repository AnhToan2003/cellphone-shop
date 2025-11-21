import express from "express";
import fetch from "node-fetch";

const SYSTEM_PROMPT = `Bạn là Trợ lý CSKH của Cellphone Shop.
Luôn trả lời bằng tiếng Việt, lịch sự, ngắn gọn.
Khi khách hỏi về sản phẩm, nếu thiếu thông tin hãy hỏi lại ngân sách/nhu cầu; sau đó gợi ý 2–3 mẫu phù hợp (tên, giá, điểm nổi bật, link).
Khi khách cung cấp mã đơn, hãy gọi công cụ checkOrder để kiểm tra tình trạng giao hàng.
Không bịa thông tin. Nếu không chắc, mời khách kết nối nhân viên.
Với thao tác rủi ro (đặt/hủy/thu cọc), luôn xác nhận lại trước khi thực hiện.`;

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const sanitizeBaseUrl = (value, fallback) => {
  const normalized = (value || fallback || "").trim();
  return normalized.replace(/\/+$/, "");
};
const STORE_API_BASE_URL = sanitizeBaseUrl(
  process.env.STORE_API_BASE_URL,
  "http://localhost:5000/api"
);
const STORE_WEB_BASE_URL = sanitizeBaseUrl(
  process.env.STORE_WEB_BASE_URL || process.env.CLIENT_URL,
  "http://localhost:5173"
);

const clampText = (value = "", max = 2000) =>
  value.toString().slice(0, max).trim();

const parseNumberFromString = (value) => {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(/,/g, ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const buildProductUrl = (slugOrId = "") => {
  const identifier = slugOrId || "";
  if (!STORE_WEB_BASE_URL) return identifier;
  return `${STORE_WEB_BASE_URL}/products/${identifier}`;
};

const selectVariant = (product = {}, { color, storage_gb: storageGb } = {}) => {
  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    return null;
  }
  const normalizedColor = color?.toLowerCase().trim();
  const storageTarget =
    storageGb !== undefined && storageGb !== null
      ? String(storageGb).trim()
      : null;

  const matches = (variant = {}) => {
    const colorMatch = normalizedColor
      ? variant.color?.toLowerCase().includes(normalizedColor)
      : true;
    const capacityNumber =
      variant.capacity && parseNumberFromString(variant.capacity);
    const storageMatch = storageTarget
      ? capacityNumber === Number(storageTarget)
      : true;
    return colorMatch && storageMatch;
  };

  return product.variants.find(matches) || product.variants[0];
};

const mapProductToSuggestion = (product = {}, variant = null) => {
  const chosenVariant = variant || selectVariant(product);
  const variantPrice =
    parseNumberFromString(chosenVariant?.price) ??
    parseNumberFromString(product.price) ??
    0;
  const basePrice =
    parseNumberFromString(product.basePrice) ?? variantPrice ?? 0;
  const finalPrice =
    parseNumberFromString(product.finalPrice) ??
    basePrice ??
    variantPrice ??
    0;
  const originalPrice =
    parseNumberFromString(product.oldPrice) ??
    basePrice ??
    variantPrice ??
    finalPrice;

  const discountPercent =
    product.effectiveDiscountPercent ??
    (originalPrice && finalPrice
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((1 - Number(finalPrice) / Number(originalPrice)) * 100)
          )
        )
      : 0);

  const storage =
    parseNumberFromString(chosenVariant?.capacity) ||
    parseNumberFromString(product.specs?.storage) ||
    parseNumberFromString(product.options?.capacities?.[0]);

  const ram =
    parseNumberFromString(product.specs?.ram) ||
    parseNumberFromString(product.ram);

  return {
    sku: product.sku || product.slug || product._id?.toString(),
    name: product.name,
    brand: product.brand,
    price: finalPrice,
    final_price: finalPrice,
    original_price: originalPrice,
    base_price: basePrice,
    discount_percent: discountPercent,
    applied_promotion: product.appliedPromotion || null,
    ram_gb: ram ?? undefined,
    storage_gb: storage ?? undefined,
    url: buildProductUrl(product.slug || product._id?.toString()),
    color: chosenVariant?.color || product.options?.colors?.[0] || undefined,
    capacity: chosenVariant?.capacity || undefined,
  };
};

const fetchStoreProducts = async (args = {}) => {
  if (!STORE_API_BASE_URL) return [];
  try {
    const searchParams = new URLSearchParams();
    if (args.keyword) searchParams.set("search", args.keyword);
    if (args.brand) searchParams.set("brand", args.brand);
    if (args.price_min) searchParams.set("min", args.price_min);
    if (args.price_max) searchParams.set("max", args.price_max);

    const limit = Math.min(Math.max(Number(args.limit) || 3, 1), 10);
    searchParams.set("limit", String(limit));

    const query = searchParams.toString();
    const endpoint = query
      ? `${STORE_API_BASE_URL}/products?${query}`
      : `${STORE_API_BASE_URL}/products`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Store API error: ${response.status}`);
    }
    const payload = await response.json();
    if (!payload?.success || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.slice(0, limit).map((item) =>
      mapProductToSuggestion(item, selectVariant(item, args))
    );
  } catch (error) {
    console.error("store search error:", error.message);
    return [];
  }
};

// Định nghĩa tools theo format của Ollama
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Tìm 2-3 mẫu điện thoại phù hợp theo thương hiệu, ngân sách hoặc cấu hình.",
      parameters: {
        type: "object",
        properties: {
          brand: {
            type: "string",
            description: "Tên thương hiệu (Apple/Samsung/Xiaomi...).",
          },
          price_max: {
            type: "number",
            description: "Ngân sách tối đa (VND).",
          },
          ram_gb: {
            type: "number",
            description: "Dung lượng RAM tối thiểu (GB).",
          },
          storage_gb: {
            type: "number",
            description: "Dung lượng lưu trữ tối thiểu (GB).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkOrder",
      description: "Tra cứu tình trạng giao hàng của một đơn cụ thể.",
      parameters: {
        type: "object",
        required: ["order_id"],
        properties: {
          order_id: {
            type: "string",
            description: "Mã đơn hàng, ví dụ DH123.",
          },
          phone_number: {
            type: "string",
            description: "SĐT khách hàng (nếu cung cấp).",
          },
        },
      },
    },
  },
];

// Call Ollama API
const callOllama = async (messages, tools = null) => {
  try {
    const payload = {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    // Thêm tools nếu có
    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ollama call error:", error);
    throw new Error(`Không thể kết nối Ollama: ${error.message}`);
  }
};

// Parse tool calls từ response của Ollama
const parseToolCalls = (message) => {
  if (!message?.tool_calls || !Array.isArray(message.tool_calls)) {
    return [];
  }

  return message.tool_calls
    .map((call) => ({
      id: call.id || `call_${Date.now()}`,
      name: call.function?.name,
      arguments: call.function?.arguments || "{}",
    }))
    .filter((call) => call.name);
};

// Execute tool
const executeToolCall = async (
  call,
  { productsProvider, orderProvider }
) => {
  try {
    const args =
      typeof call.arguments === "string"
        ? JSON.parse(call.arguments)
        : call.arguments;

    if (call.name === "searchProducts") {
      let result = [];
      if (productsProvider?.search) {
        result =
          (await productsProvider.search({
            keyword: args.keyword,
            brand: args.brand,
            price_min: args.price_min,
            price_max: args.price_max,
            ram_gb: args.ram_gb,
            storage_gb: args.storage_gb,
            limit: args.limit,
          })) || [];
      }

      if (!Array.isArray(result) || result.length === 0) {
        result = await fetchStoreProducts(args);
      }

      return {
        success: true,
        count: result.length,
        products: result,
      };
    }

    if (call.name === "checkOrder") {
      return (
        orderProvider?.lookup?.({
          order_id: args.order_id,
          phone_number: args.phone_number,
        }) || {
          status: "Không tìm thấy",
          message: "Không tìm thấy đơn hàng.",
        }
      );
    }

    return { error: "Tool không được hỗ trợ" };
  } catch (error) {
    console.error("Tool execution error:", error);
    return { error: error.message || "Không thực thi được tool" };
  }
};

const makeChatRouter = ({ productsProvider, orderProvider }) => {
  const router = express.Router();
  router.use(express.json({ limit: "1mb" }));

  // Health check
  router.get("/health", async (req, res) => {
    try {
      // Kiểm tra kết nối Ollama
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      const isOllamaRunning = response.ok;

      res.json({
        ok: isOllamaRunning,
        ollama_url: OLLAMA_URL,
        model: OLLAMA_MODEL,
        status: isOllamaRunning ? "connected" : "disconnected",
      });
    } catch (error) {
      res.json({
        ok: false,
        ollama_url: OLLAMA_URL,
        model: OLLAMA_MODEL,
        status: "error",
        error: error.message,
      });
    }
  });

  // Main chat handler
  const handleChatRequest = async (message) => {
    // Khởi tạo conversation
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: clampText(message) },
    ];

    // Gọi Ollama lần đầu (có tools)
    let response = await callOllama(messages, toolDefinitions);

    // Parse tool calls
    const toolCalls = parseToolCalls(response.message);

    // Nếu có tool calls, thực thi chúng
    if (toolCalls.length > 0) {
      console.log("Tool calls detected:", toolCalls.length);

      // Thêm assistant message với tool calls
      messages.push(response.message);

      // Execute từng tool và thêm results
      for (const call of toolCalls) {
        console.log(`Executing tool: ${call.name}`);
        const result = await executeToolCall(call, {
          productsProvider,
          orderProvider,
        });

        // Thêm tool result vào messages
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: call.id,
        });
      }

      // Gọi lại Ollama với tool results
      response = await callOllama(messages, toolDefinitions);
    }

    const reply = response?.message?.content?.trim();
    if (!reply) {
      throw new Error("Không nhận được phản hồi từ trợ lý.");
    }

    return reply;
  };

  // Chat endpoint
  router.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body ?? {};
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          error: "Vui lòng gửi message dạng chuỗi.",
        });
      }

      const reply = await handleChatRequest(message);
      return res.json({ reply });
    } catch (error) {
      console.error("Chat error:", error);
      const status = error?.message?.includes("kết nối") ? 503 : 500;
      return res.status(status).json({
        error: error?.message || "Máy chủ đang bận, vui lòng thử lại.",
      });
    }
  });

  // Test endpoint
  router.post("/api/chat/test", async (req, res) => {
    try {
      const response = await callOllama([
        { role: "system", content: "Bạn là bot kiểm tra kết nối." },
        { role: "user", content: "Ping" },
      ]);

      return res.json({
        reply: response?.message?.content || "pong",
        model: OLLAMA_MODEL,
      });
    } catch (error) {
      console.error("Test error:", error);
      return res.status(500).json({
        error: error?.message || "Không thể kiểm tra Ollama.",
      });
    }
  });

  return router;
};

export default makeChatRouter;

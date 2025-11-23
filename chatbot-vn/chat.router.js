import express from "express";
import fetch from "node-fetch";

const SYSTEM_PROMPT = `Bạn là Trợ lý CSKH của Cellphone Shop.
Luôn trả lời bằng tiếng Việt, lịch sự, súc tích.
Phải gọi tool searchProducts/checkOrder để lấy dữ liệu thực tế; không tự suy diễn hay bịa giá/khuyến mãi/kho. Nếu tool không trả về dữ liệu, nói rõ “Hiện chưa có dữ liệu để trả lời”.
Nếu khách hỏi về sản phẩm, khi thiếu thông tin hãy hỏi lại ngân sách/nhu cầu; sau đó gợi ý 2-3 mẫu phù hợp (tên, giá, điểm nổi bật, link).
Mỗi gợi ý sản phẩm phải có giá cuối (final_price/price) và % giảm (discount_percent nếu có, nếu không thì ghi "không giảm"); không tự tính hay bịa nếu tool không trả về.
Khi khách cung cấp mã đơn, hãy gọi đúng tool checkOrder để kiểm tra tình trạng giao hàng.
Không bịa thông tin. Nếu không chắc, mời khách kết nối nhân viên.
Với thao tác rủi ro (đặt/hủy/thu cọc), luôn xác nhận lại trước khi thực hiện.
Chỉ gọi tool khi thật sự cần thiết để trả lời chính xác, ưu tiên phản hồi ngắn gọn.`;

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const OLLAMA_OPTIONS = {
  temperature: toNumber(process.env.OLLAMA_TEMPERATURE, 0.2),
  top_p: toNumber(process.env.OLLAMA_TOP_P, 0.85),
  top_k: toNumber(process.env.OLLAMA_TOP_K, 40),
  num_predict: toNumber(process.env.OLLAMA_NUM_PREDICT, 300),
  seed: toNumber(process.env.OLLAMA_SEED, 42),
};
const OLLAMA_TIMEOUT_MS = Math.max(
  1000,
  toNumber(process.env.OLLAMA_TIMEOUT_MS, 15000)
);
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

const normalizeProductPricing = (product = {}) => {
  const finalPrice =
    parseNumberFromString(product.final_price) ??
    parseNumberFromString(product.finalPrice) ??
    parseNumberFromString(product.price) ??
    0;
  const originalPrice =
    parseNumberFromString(product.original_price) ??
    parseNumberFromString(product.originalPrice) ??
    parseNumberFromString(product.oldPrice) ??
    parseNumberFromString(product.base_price) ??
    parseNumberFromString(product.basePrice) ??
    finalPrice;
  const discountPercent =
    Number.isFinite(product.discount_percent) && product.discount_percent >= 0
      ? product.discount_percent
      : Number.isFinite(product.discountPercent) && product.discountPercent >= 0
        ? product.discountPercent
        : Number.isFinite(product.effectiveDiscountPercent) &&
            product.effectiveDiscountPercent >= 0
          ? product.effectiveDiscountPercent
          : originalPrice
            ? Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (1 - Number(finalPrice) / Number(originalPrice)) * 100
                  )
                )
              )
            : 0;

  return {
    ...product,
    price: finalPrice,
    final_price: finalPrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
  };
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

  const finalPrice =
    parseNumberFromString(product.finalPrice) ??
    parseNumberFromString(product.final_price) ??
    variantPrice ??
    0;

  const basePrice =
    parseNumberFromString(product.basePrice) ??
    parseNumberFromString(product.base_price) ??
    variantPrice ??
    finalPrice;

  const originalPrice =
    parseNumberFromString(product.originalPrice) ??
    parseNumberFromString(product.original_price) ??
    parseNumberFromString(product.oldPrice) ??
    basePrice ??
    variantPrice ??
    finalPrice;

  const discountPercent =
    product.effectiveDiscountPercent ??
    product.discountPercent ??
    product.discount_percent ??
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
          keyword: {
            type: "string",
            description: "Từ khóa tìm kiếm chung.",
          },
          brand: {
            type: "string",
            description: "Tên thương hiệu (Apple/Samsung/Xiaomi...).",
          },
          price_min: {
            type: "number",
            description: "Ngân sách tối thiểu (VND).",
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
          limit: {
            type: "number",
            description: "Số lượng gợi ý (mặc định 3).",
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
            description: "Số điện thoại khách hàng (nếu có).",
          },
        },
      },
    },
  },
];

const buildOllamaPayload = (messages, tools = null) => {
  const options = Object.fromEntries(
    Object.entries(OLLAMA_OPTIONS).filter(([, value]) =>
      Number.isFinite(value)
    )
  );

  const payload = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  return payload;
};

const callOllama = async (messages, tools = null) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOllamaPayload(messages, tools)),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Ollama timeout sau ${OLLAMA_TIMEOUT_MS}ms`);
    }
    console.error("Ollama call error:", error);
    throw new Error(`Không thể kết nối Ollama: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

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

      const products = (Array.isArray(result) ? result : []).map(
        normalizeProductPricing
      );

      return {
        success: true,
        count: products.length,
        products,
      };
    }

    if (call.name === "checkOrder") {
      return (
        orderProvider?.lookup?.({
          order_id: args.order_id,
          phone_number: args.phone_number,
        }) || {
          status: "Khong tim thay",
          message: "Khong tim thay don hang.",
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

  router.get("/health", async (req, res) => {
    try {
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

  const handleChatRequest = async (message) => {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: clampText(message) },
    ];

    let response = await callOllama(messages, toolDefinitions);

    const toolCalls = parseToolCalls(response.message);

    if (toolCalls.length > 0) {
      console.log("Tool calls detected:", toolCalls.length);

      messages.push(response.message);

      for (const call of toolCalls) {
        console.log(`Executing tool: ${call.name}`);
        const result = await executeToolCall(call, {
          productsProvider,
          orderProvider,
        });

        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: call.id,
        });
      }

      response = await callOllama(messages, toolDefinitions);
    } else {
      // Không có dữ liệu tool, trả lời an toàn để tránh bịa
      return "Hiện chưa có dữ liệu để trả lời. Vui lòng mô tả rõ hơn hoặc thử lại.";
    }

    const reply = response?.message?.content?.trim();
    if (!reply) {
      throw new Error("Không nhận được phản hồi từ trợ lý.");
    }

    return reply;
  };

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

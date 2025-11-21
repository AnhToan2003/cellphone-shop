import mongoose from "mongoose";
import SupportKnowledgeSnapshot from "../models/SupportKnowledgeSnapshot.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

const SYSTEM_PROMPT = `Bạn là Trợ lí CSKH của Cellphone Shop.

QUAN TRỌNG:
1. Bạn CHỈ được trả lời dựa trên dữ liệu THỰC TẾ từ hệ thống (database / tool).
2. KHÔNG được bịa số lượng, khuyến mãi, thông tin sản phẩm hay trạng thái đơn hàng.
3. Nếu KHÔNG có dữ liệu từ tool → Nói rõ là hiện tại chưa có dữ liệu để trả lời.

Format trả lời BẮT BUỘC khi có sản phẩm (mỗi sản phẩm 1 block):

**[Tên sản phẩm] - [Màu sắc] - [Dung lượng]**
💰 Giá: [Giá gốc] → [Giá khuyến mãi] (-[%])
     (nếu có khuyến mãi)
💰 Giá: [Giá bán]
     (nếu không có khuyến mãi)
📦 Tình trạng: Còn [số lượng] máy
⭐ Đánh giá: [rating]⭐ ([reviews] đánh giá)
🤝 Gợi ý: Anh/chị có thể đặt trực tiếp trên web hoặc để lại SĐT để được tư vấn.

Quy tắc:
1. Khi khách hỏi sản phẩm → GỌI tool **searchProducts** với ĐẦY ĐỦ tiêu chí (tên, màu, dung lượng, giá...).
2. LUÔN hiển thị: tên, màu, dung lượng, giá, tồn kho, rating khi có sản phẩm.
3. Nếu khách hỏi màu/dung lượng cụ thể → Chỉ trả kết quả đúng màu/dung lượng đó (nếu không có thì nói rõ).
4. Nếu KHÔNG tìm thấy → Nói rõ: **"Không tìm thấy sản phẩm đúng với tiêu chí anh/chị đưa ra"**.

Đơn hàng:
- Luôn gọi **checkOrder** khi tra cứu đơn.
- Trả lời rõ: mã đơn, tên khách, SĐT, trạng thái, tổng tiền, ngày tạo.

Phong cách:
- Tiếng Việt, lịch sự.
- Giá format: 15.000.000 VNĐ.
- Nếu không có dữ liệu → giải thích lý do, KHÔNG bịa thêm.`;

const getLatestKnowledgeBlock = async () => {
  try {
    const snapshot = await SupportKnowledgeSnapshot.findOne()
      .sort({ refreshedAt: -1 })
      .lean();
    return snapshot?.content?.trim() || "";
  } catch (error) {
    console.warn("[support] Failed to load knowledge snapshot:", error.message);
    return "";
  }
};

const mergeSystemPrompt = (basePrompt, knowledgeBlock) => {
  if (!knowledgeBlock) {
    return basePrompt;
  }
  return `${basePrompt}\n\n[Du lieu cua hang cap nhat]\n${knowledgeBlock}`;
};


//
// 🧩 Tools definition (function calling schema cho Ollama)
//
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Tìm sản phẩm CHÍNH XÁC trong database. Phải search theo TẤT CẢ tiêu chí khách đưa ra.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description:
              "Từ khóa tìm trong TÊN sản phẩm. VD: 'iPhone 15', 'Samsung Galaxy S24'",
          },
          brand: {
            type: "string",
            description: "Thương hiệu: Apple, Samsung, Xiaomi, OPPO, Vivo...",
          },
          color: {
            type: "string",
            description:
              "Màu sắc CHÍNH XÁC. VD: 'Xanh dương', 'Đen', 'Trắng', 'Tím'. Nếu khách hỏi 'xanh da trời' thì search 'xanh'",
          },
          storage_gb: {
            type: "number",
            description: "Dung lượng CHÍNH XÁC (GB). VD: 128, 256, 512, 1024",
          },
          ram_gb: {
            type: "number",
            description: "RAM (GB). VD: 6, 8, 12, 16",
          },
          price_min: {
            type: "number",
            description: "Giá tối thiểu (VNĐ)",
          },
          price_max: {
            type: "number",
            description: "Giá tối đa (VNĐ)",
          },
          limit: {
            type: "number",
            description: "Số lượng sản phẩm tối đa trả về (mặc định 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkOrder",
      description: "Tra đơn hàng",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Mã đơn" },
          phone_number: { type: "string", description: "SĐT" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getBestSellers",
      description: "Lấy danh sách sản phẩm bán chạy còn hàng",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Số lượng (mặc định 5)" },
        },
      },
    },
  },
];

//
// 🔧 Helper: Lấy mongoose model an toàn
//
const getModel = (modelName) => {
  try {
    return mongoose.model(modelName);
  } catch (_err) {
    console.warn(`Model "${modelName}" not found`);
    return null;
  }
};

//
// 🔧 Format số tiền VNĐ
//
const formatPrice = (price) => {
  if (price === null || price === undefined) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

//
// 🔍 Search sản phẩm – query chính xác, không ghi đè điều kiện
//
const searchProducts = async ({
  keyword,
  brand,
  color,
  storage_gb,
  ram_gb,
  price_min,
  price_max,
  limit = 10,
}) => {
  try {
    const Product = getModel("Product") || getModel("product");
    if (!Product) {
      console.error("❌ Product model not found");
      return [];
    }

    const query = {};
    const orConditions = [];

    // Tìm theo keyword trong name
    if (keyword) {
      query.name = new RegExp(keyword, "i");
    }

    // Brand
    if (brand) {
      query.brand = new RegExp(brand, "i");
    }

    // Chuẩn hóa màu
    let normalizedColor = null;
    if (color) {
      normalizedColor = color
        .toLowerCase()
        .replace(/xanh da trời|xanh dương nhạt/gi, "xanh")
        .replace(/xanh lá|xanh lục/gi, "xanh")
        .trim();

      orConditions.push(
        { color: new RegExp(normalizedColor, "i") },
        { "variants.color": new RegExp(normalizedColor, "i") },
        { colors: new RegExp(normalizedColor, "i") }
      );
    }

    // DUNG LƯỢNG - Tìm chính xác
    if (storage_gb) {
      orConditions.push(
        { storage: storage_gb },
        { "variants.storage": storage_gb },
        { capacity: storage_gb }
      );
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // RAM
    if (ram_gb) {
      query.ram = ram_gb;
    }

    // GIÁ
    if (price_min || price_max) {
      query.price = {};
      if (price_min) query.price.$gte = price_min;
      if (price_max) query.price.$lte = price_max;
    }

    // Chỉ lấy còn hàng
    query.stock = { $gt: 0 };

    console.log("🔍 Product query:", JSON.stringify(query, null, 2));

    const products = await Product.find(query)
      .limit(limit)
      .sort({ rating: -1, reviews: -1 })
      .lean();

    console.log(`✅ Found ${products.length} products`);

    // Format response ĐẦY ĐỦ
    return products.map((p) => {
      // Tìm variant đúng với màu & dung lượng nếu có
      let variant = null;
      if (p.variants && Array.isArray(p.variants)) {
        variant = p.variants.find((v) => {
          const matchColor =
            !normalizedColor ||
            (v.color &&
              v.color.toLowerCase().includes(normalizedColor.toLowerCase()));
          const matchStorage = !storage_gb || v.storage === storage_gb;
          return matchColor && matchStorage;
        });
      }

      const finalColor =
        variant?.color || p.color || p.variants?.[0]?.color || "Đa màu";
      const finalStorage =
        variant?.storage || p.storage || p.capacity || "N/A";
      const finalPrice = variant?.price ?? p.price ?? null;
      const originalPrice = variant?.originalPrice ?? p.originalPrice ?? null;
      const discount =
        originalPrice && finalPrice
          ? Math.round(100 - (finalPrice / originalPrice) * 100)
          : p.discount || null;

      return {
        id: p._id.toString(),
        name: p.name,
        brand: p.brand,
        color: finalColor,
        storage: finalStorage,
        price: finalPrice,
        originalPrice,
        discount,
        priceFormatted: formatPrice(finalPrice),
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        stock: variant?.stock ?? p.stock ?? 0,
        ram: p.ram,
        description: p.description?.substring(0, 100),
      };
    });
  } catch (error) {
    console.error("❌ searchProducts error:", error);
    return [];
  }
};

//
// 📦 Tra cứu đơn hàng
//
const checkOrder = async ({ order_id, phone_number }) => {
  try {
    const Order = getModel("Order") || getModel("order");
    if (!Order) return { found: false, message: "Lỗi hệ thống" };

    const query = {};
    const orConditions = [];

    if (order_id) {
      const orderIdUpper = order_id.toUpperCase();
      orConditions.push(
        { orderNumber: orderIdUpper },
        { orderCode: orderIdUpper },
        { orderId: orderIdUpper }
      );
    }

    if (phone_number) {
      orConditions.push(
        { phone: phone_number },
        { "shippingAddress.phone": phone_number }
      );
    }

    if (orConditions.length === 0) {
      return { found: false, message: "Vui lòng cung cấp mã đơn hoặc SĐT." };
    }

    query.$or = orConditions;

    const order = await Order.findOne(query).sort({ createdAt: -1 }).lean();
    if (!order) return { found: false, message: "Không tìm thấy đơn hàng" };

    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
    };

    return {
      found: true,
      orderNumber: order.orderNumber || order.orderCode || order.orderId,
      customerName: order.customerName || order.shippingAddress?.fullName,
      phone: order.phone || order.shippingAddress?.phone,
      status: statusMap[order.status] || order.status || "Không rõ",
      totalAmount: order.totalAmount,
      totalAmountFormatted: formatPrice(order.totalAmount),
      items: order.items?.length || 0,
      createdAt: order.createdAt,
    };
  } catch (error) {
    console.error("❌ checkOrder error:", error);
    return { found: false, message: "Lỗi tra cứu" };
  }
};

//
// ⭐ Sản phẩm bán chạy
//
const getBestSellers = async (limit = 5) => {
  try {
    const Product = getModel("Product") || getModel("product");
    if (!Product) return [];

    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ reviews: -1, rating: -1 })
      .limit(limit)
      .lean();

    return products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      brand: p.brand,
      price: p.price,
      priceFormatted: formatPrice(p.price),
      rating: p.rating || 0,
      reviews: p.reviews || 0,
      stock: p.stock,
    }));
  } catch (error) {
    console.error("❌ getBestSellers error:", error);
    return [];
  }
};

//
// 🛠️ Thực thi tool
//
const executeToolCall = async (call) => {
  try {
    const args =
      typeof call.arguments === "string"
        ? JSON.parse(call.arguments || "{}")
        : call.arguments || {};

    console.log(`🔧 Tool: ${call.name}`);
    console.log(`📥 Args:`, args);

    switch (call.name) {
      case "searchProducts": {
        const products = await searchProducts(args);
        console.log(`📊 Results: ${products.length} products`);
        return {
          success: true,
          tool: "searchProducts",
          count: products.length,
          products,
          query_used: args,
        };
      }

      case "checkOrder": {
        const order = await checkOrder(args);
        return { success: true, tool: "checkOrder", ...order };
      }

      case "getBestSellers": {
        const bestSellers = await getBestSellers(args.limit || 5);
        return {
          success: true,
          tool: "getBestSellers",
          count: bestSellers.length,
          products: bestSellers,
        };
      }

      default:
        return { success: false, error: "Tool không hỗ trợ", tool: call.name };
    }
  } catch (error) {
    console.error("❌ Tool error:", error);
    return { error: error.message, success: false };
  }
};

//
// 🌐 Gọi Ollama
//
const callOllama = async (messages, tools = null) => {
  const payload = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: { temperature: 0.7, top_p: 0.9, num_ctx: 4096 },
  };
  if (tools?.length > 0) payload.tools = tools;

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  return await response.json();
};

//
// 🔎 Parse tool calls từ response của Ollama
//
const parseToolCalls = (message) => {
  if (!message?.tool_calls || !Array.isArray(message.tool_calls)) return [];
  return message.tool_calls
    .map((call) => ({
      id: call.id || `call_${Date.now()}`,
      name: call.function?.name,
      arguments: call.function?.arguments || "{}",
    }))
    .filter((call) => call.name);
};

//
// 🎨 Build reply dựa trên kết quả sản phẩm – icon đẹp & chuẩn format
//
const buildProductReply = (products) => {
  if (!products || products.length === 0) {
    return "Em không tìm thấy sản phẩm đúng với tiêu chí anh/chị đưa ra trong hệ thống ạ.";
  }

  let reply = "Dưới đây là những sản phẩm phù hợp trong hệ thống Cellphone Shop:\n\n";

  for (const p of products) {
    const hasPromo =
      p.originalPrice &&
      p.price &&
      p.originalPrice > p.price &&
      p.discount !== 0;

    reply +=
      `📱 **${p.name} - ${p.color} - ${p.storage}**\n` +
      (hasPromo
        ? `💰 Giá: ${formatPrice(p.originalPrice)} → ${formatPrice(
            p.price
          )} (-${p.discount}% )\n`
        : `💰 Giá: ${formatPrice(p.price)}\n`) +
      `📦 Tình trạng: Còn ${p.stock ?? 0} máy\n` +
      `⭐ Đánh giá: ${p.rating ?? 0}⭐ (${p.reviews ?? 0} đánh giá)\n` +
      `🛒 Gợi ý: Anh/chị có thể đặt trực tiếp trên web hoặc để lại SĐT để được tư vấn.\n` +
      `---\n`;
  }

  return reply.trim();
};

//
// 📦 Build reply cho tra đơn hàng
//
const buildOrderReply = (orderResult) => {
  if (!orderResult?.found) {
    return orderResult?.message || "Em không tìm thấy đơn hàng trong hệ thống ạ.";
  }

  const createdAt =
    orderResult.createdAt &&
    new Date(orderResult.createdAt).toLocaleString("vi-VN");

  return (
    `📦 Thông tin đơn hàng của anh/chị:\n\n` +
    `🧾 Mã đơn: **${orderResult.orderNumber}**\n` +
    `👤 Khách hàng: ${orderResult.customerName || "Không rõ"}\n` +
    `📞 SĐT: ${orderResult.phone || "Không rõ"}\n` +
    `🚚 Trạng thái: **${orderResult.status}**\n` +
    `💰 Tổng tiền: ${orderResult.totalAmountFormatted || "Không rõ"}\n` +
    (createdAt ? `🕒 Ngày tạo: ${createdAt}\n` : "") +
    `🛒 Số sản phẩm: ${orderResult.items || 0}`
  );
};

//
// 🌟 Build reply cho best sellers
//
const buildBestSellerReply = (products) => {
  if (!products || products.length === 0) {
    return "Hiện tại em chưa lấy được danh sách sản phẩm bán chạy ạ.";
  }

  let reply = "🔥 Top sản phẩm bán chạy tại Cellphone Shop:\n\n";

  products.forEach((p, idx) => {
    reply +=
      `#${idx + 1} 📱 **${p.name}**\n` +
      `💰 Giá: ${formatPrice(p.price)}\n` +
      `📦 Còn: ${p.stock ?? 0} máy\n` +
      `⭐ Đánh giá: ${p.rating ?? 0}⭐ (${p.reviews ?? 0} đánh giá)\n` +
      `---\n`;
  });

  return reply.trim();
};

//
// 🧠 Main handler
//
export const handleSupportChat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng gửi messages dạng array.",
      });
    }

    const knowledgeBlock = await getLatestKnowledgeBlock();
    const hasSystemMessage = messages[0]?.role === "system";
    const baseSystemPrompt = hasSystemMessage ? messages[0].content : SYSTEM_PROMPT;
    const hydratedSystemPrompt = mergeSystemPrompt(baseSystemPrompt, knowledgeBlock);
    const conversationMessages = hasSystemMessage
      ? [{ role: "system", content: hydratedSystemPrompt }, ...messages.slice(1)]
      : [{ role: "system", content: hydratedSystemPrompt }, ...messages];

    const userMsg = messages[messages.length - 1]?.content;
    console.log("\n" + "=".repeat(50));
    console.log("📨 USER:", userMsg);
    console.log("=".repeat(50));

    // Gọi Ollama lần 1 để xem có muốn dùng tool không
    let response = await callOllama(conversationMessages, toolDefinitions);
    const toolCalls = parseToolCalls(response.message);

    const executedTools = [];

    // Nếu có tool calls thì thực thi
    if (toolCalls.length > 0) {
      console.log(`🔧 Executing ${toolCalls.length} tool(s)...`);
      conversationMessages.push(response.message);

      for (const call of toolCalls) {
        const result = await executeToolCall(call);
        executedTools.push({ name: call.name, result });

        console.log(
          `✅ Tool result (${call.name}):`,
          JSON.stringify(result).substring(0, 300)
        );

        // Gửi kết quả tool cho Ollama nếu sau này còn cần suy luận
        conversationMessages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: call.id,
        });
      }

      // ❗ Quan trọng: Với các tool nhạy cảm dữ liệu (sản phẩm, đơn hàng),
      // ta tự build reply từ kết quả tool, KHÔNG giao cho LLM để tránh bịa.
      const searchTool = executedTools.find((t) => t.name === "searchProducts");
      const bestSellerTool = executedTools.find(
        (t) => t.name === "getBestSellers"
      );
      const orderTool = executedTools.find((t) => t.name === "checkOrder");

      let finalReply = null;

      if (searchTool?.result?.success) {
        finalReply = buildProductReply(searchTool.result.products || []);
      } else if (bestSellerTool?.result?.success) {
        finalReply = buildBestSellerReply(bestSellerTool.result.products || []);
      } else if (orderTool?.result) {
        finalReply = buildOrderReply(orderTool.result);
      }

      if (finalReply) {
        console.log("💬 REPLY (from tools):", finalReply);
        console.log("=".repeat(50) + "\n");
        return res.json({
          success: true,
          reply: finalReply,
          model: OLLAMA_MODEL,
          used_tools: true,
        });
      }

      // Nếu tool không phải mấy cái trên thì mới gọi lại Ollama lần 2
      response = await callOllama(conversationMessages, toolDefinitions);
    }

    const reply = response?.message?.content?.trim();
    if (!reply) throw new Error("Không nhận được phản hồi từ Ollama");

    console.log("💬 REPLY (from LLM):", reply);
    console.log("=".repeat(50) + "\n");

    return res.json({
      success: true,
      reply,
      model: OLLAMA_MODEL,
      used_tools: toolCalls.length > 0,
    });
  } catch (error) {
    console.error("❌ Chat error:", error);
    return res.status(
      error.message.includes("Ollama error") ||
        error.message.includes("Không kết nối")
        ? 503
        : 500
    ).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};

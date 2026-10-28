import app from "../server/src/app.js";
import { connectDB } from "../server/src/db.js";
import { ensureReviewIndexes } from "../server/src/services/indexMaintenance.service.js";

let preparation;

const prepareApplication = () => {
  if (!preparation) {
    preparation = connectDB()
      .then(() => ensureReviewIndexes())
      .catch((error) => {
        preparation = null;
        throw error;
      });
  }
  return preparation;
};

export default async function handler(request, response) {
  try {
    // Vercel's non-framework file routes don't forward arbitrary nested paths
    // through this catch-all. vercel.json rewrites them through /api/express and
    // passes the original route in __route so Express can match it normally.
    const incomingUrl = new URL(request.url || "/", "http://vercel.local");
    const expressPath = incomingUrl.searchParams.get("__route");
    if (expressPath !== null) {
      incomingUrl.searchParams.delete("__route");
      const normalizedPath = expressPath.replace(/^\/+/, "");
      if (normalizedPath.includes("..")) {
        return response.status(400).json({ success: false, message: "Invalid API path" });
      }
      request.url = `/api/${normalizedPath}${incomingUrl.search}`;
    }

    await prepareApplication();
    return app(request, response);
  } catch (error) {
    console.error("Serverless API initialization failed:", error.message);
    return response.status(503).json({
      success: false,
      message: "Dịch vụ đang khởi động hoặc cấu hình cơ sở dữ liệu chưa sẵn sàng.",
    });
  }
}

export const config = {
  api: { bodyParser: false },
};

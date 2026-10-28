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

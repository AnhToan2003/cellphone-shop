import { Review } from "../models/Review.js";

const LEGACY_REVIEW_INDEX = "product_1_user_1";
const TARGET_REVIEW_INDEX = "review_by_product_user_order";

const isIndexNotFoundError = (error = {}) => {
  if (!error) return false;
  return (
    error.codeName === "IndexNotFound" ||
    error.code === 27 ||
    /index not found/i.test(error.message || "")
  );
};

export const ensureReviewIndexes = async () => {
  try {
    const collection = Review.collection;
    if (!collection) {
      return;
    }

    try {
      const indexes = await collection.indexes();
      const hasLegacy = indexes.some(
        (index) => index?.name === LEGACY_REVIEW_INDEX
      );
      if (hasLegacy) {
        await collection.dropIndex(LEGACY_REVIEW_INDEX);
      }
    } catch (error) {
      if (!isIndexNotFoundError(error)) {
        throw error;
      }
    }

    await collection.createIndex(
      { product: 1, user: 1, order: 1 },
      { unique: true, name: TARGET_REVIEW_INDEX }
    );
  } catch (error) {
    console.error("Failed to synchronize review indexes:", error);
  }
};

export default ensureReviewIndexes;

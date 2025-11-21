import { Review } from "../models/Review.js";

const LEGACY_REVIEW_INDEX = "product_1_user_1";
const TARGET_REVIEW_INDEX = "review_by_product_user_order";
const REVIEW_INDEX_KEYS = { product: 1, user: 1, order: 1 };

const isIndexNotFoundError = (error = {}) => {
  if (!error) return false;
  return (
    error.codeName === "IndexNotFound" ||
    error.code === 27 ||
    /index not found/i.test(error.message || "")
  );
};

const matchesReviewIndexKeys = (index = {}) => {
  const keyEntries = Object.entries(REVIEW_INDEX_KEYS);
  const incomingKey = index?.key || {};
  if (Object.keys(incomingKey).length !== keyEntries.length) {
    return false;
  }
  return keyEntries.every(([field, direction]) => incomingKey[field] === direction);
};

export const ensureReviewIndexes = async () => {
  try {
    const collection = Review.collection;
    if (!collection) {
      return;
    }

    let indexes = [];
    try {
      indexes = await collection.indexes();
      const hasLegacy = indexes.some(
        (index) => index?.name === LEGACY_REVIEW_INDEX
      );
      if (hasLegacy) {
        await collection.dropIndex(LEGACY_REVIEW_INDEX);
        indexes = indexes.filter((index) => index?.name !== LEGACY_REVIEW_INDEX);
      }
    } catch (error) {
      if (!isIndexNotFoundError(error)) {
        throw error;
      }
    }

    const existingTarget = indexes.find(
      (index) => matchesReviewIndexKeys(index) && index.name === TARGET_REVIEW_INDEX
    );

    if (existingTarget) {
      return;
    }

    const conflicting = indexes.find(
      (index) => matchesReviewIndexKeys(index) && index.name !== TARGET_REVIEW_INDEX
    );

    if (conflicting) {
      await collection.dropIndex(conflicting.name);
    }

    await collection.createIndex(REVIEW_INDEX_KEYS, {
      unique: true,
      name: TARGET_REVIEW_INDEX,
    });
  } catch (error) {
    console.error("Failed to synchronize review indexes:", error);
  }
};

export default ensureReviewIndexes;

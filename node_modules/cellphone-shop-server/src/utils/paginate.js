export const preparePagination = ({ page = 1, limit = 12 }) => {
  const safePage = Number.isNaN(page) ? 1 : Math.max(1, Math.floor(page));
  const safeLimit = Number.isNaN(limit)
    ? 12
    : Math.min(100, Math.max(1, Math.floor(limit)));

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

export const buildPagination = ({ page, limit, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
};

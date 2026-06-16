export const getPagination = ({ page = 1, limit = 10 }) => {
  const currentPage = Math.max(parseInt(page) || 1, 1);
  // SEKARANG: perPage akan setia menggunakan nilai limit yang dikirim (misal 5 atau 9).
  // Jika limit kosong/tidak dikirim, barulah dia pakai 10.
  const perPage = Math.max(parseInt(limit || 10) || 10, 1);

  const skip = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    limit: perPage,
    skip,
  };
};

export const getPaginationMeta = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};

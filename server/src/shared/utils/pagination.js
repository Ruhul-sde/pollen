/**
 * Build a paginated query helper.
 * @param {Object} query - Mongoose query object
 * @param {Object} options - { page, limit, sort }
 * @returns {{ data, page, limit, total, totalPages }}
 */
export async function paginate(model, filter = {}, options = {}) {
  const page = Math.max(parseInt(options.page) || 1, 1);
  const limit = Math.min(parseInt(options.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };
  const populate = options.populate || "";
  const select = options.select || "";

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select)
      .lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

export function getPaginationFromQuery(query) {
  return {
    page: query.page || 1,
    limit: query.limit || 20,
  };
}

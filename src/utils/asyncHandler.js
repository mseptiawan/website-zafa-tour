/**
 * Wrapper untuk menangkap error secara otomatis pada fungsi asynchronous Express
 * @param {Function} fn - Controller async yang ingin dibungkus
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

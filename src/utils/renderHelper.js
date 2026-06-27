/**
 * Mendapatkan tanggal hari ini dengan format YYYY-MM-DD sesuai ISO standard.
 * @returns {string}
 */
export const getToday = () => new Date().toISOString().split("T")[0];

/**
 * Helper global untuk menstandardisasi properti objek data form ke view EJS
 * @param {Object} req - Express Request Object
 * @param {Object} customData - Data spesifik yang ingin dikirim oleh controller
 * @returns {Object} Gabungan objek data siap render
 */
export const buildRenderData = (req, customData = {}) => {
  return {
    old: {},
    errors: {},
    ...customData,
  };
};

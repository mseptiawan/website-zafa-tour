import CompanySetting from "../models/CompanySetting.model.js";

/**
 * Mengambil data konfigurasi perusahaan global (Lean & POJO).
 * Jika belum ada data sama sekali, mengembalikan objek default kosong atau null.
 * @returns {Promise<Object|null>}
 */
export const getSettings = async () => {
  return await CompanySetting.findOne().lean();
};

/**
 * Memperbarui atau membuat baru (upsert) data konfigurasi perusahaan.
 * @param {Object} payload - Data kiriman dari form body
 * @returns {Promise<Object>} Data yang berhasil diperbarui
 */
export const updateSettings = async (payload) => {
  const { name, entryTimeLimit, gracePeriodMinutes, locations } = payload;

  let formattedLocations = [];
  if (locations && Array.isArray(locations)) {
    formattedLocations = locations.map((loc) => ({
      locationName: loc.locationName,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      radiusMeter: Number(loc.radiusMeter || 500),
    }));
  }

  return await CompanySetting.findOneAndUpdate(
    {},
    {
      $set: {
        name,
        entryTimeLimit,
        gracePeriodMinutes: Number(gracePeriodMinutes),
        locations: formattedLocations,
      },
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();
};
